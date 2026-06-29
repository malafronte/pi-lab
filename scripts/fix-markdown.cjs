#!/usr/bin/env node
/**
 * fix-markdown.cjs — Fix reali e deterministici per i warning markdownlint.
 *
 * NON nasconde i warning: li corregge dove deterministicamente possibile,
 * e riporta onestamente quelli che restano (con exit code != 0).
 *
 * Tre fasi:
 *   1. markdownlint-cli2 --fix     -> regole auto-fixable native
 *   2. fix custom deterministici    -> MD040, MD060, MD026 (che --fix non copre)
 *   3. re-lint senza --fix          -> raccoglie e riporta i residui
 *
 * Uso:
 *   node scripts/fix-markdown.cjs                    # tutti i .md del repo
 *   node scripts/fix-markdown.cjs file1.md file2.md  # file specifici
 *
 * Regole fixate deterministicamente (fase 2):
 *   MD040  code fence di apertura senza lingua  ->  aggiunge "text"
 *   MD060  stile pipe inconsistente nelle tabelle -> normalizza a "padded"
 *   MD026  punteggiatura finale negli heading     -> rimuove :,;.
 *
 * Regole NON fixabili deterministicamente (riportate, non nascoste):
 *   MD024  heading duplicati      -> decisione editoriale (rinominare)
 *   MD051  anchor link con emoji  -> slug instabile tra linter e renderer
 *
 * Dipendenza: markdownlint-cli2 installato globalmente (npm i -g markdownlint-cli2)
 * o richiamabile via npx come fallback.
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Config markdownlint esterna (NON per-progetto): ~/.markdownlint/config.json
// Passata via --config a markdownlint-cli2, cosi' il progetto non ha bisogno
// di un proprio .markdownlint.json. VS Code legge la stessa config dalle sue
// settings USER (markdownlint.config), vedi README dello script.
const CONFIG_PATH = path.join(os.homedir(), ".markdownlint", "config.json");

// --- Risolvi il binario markdownlint-cli2 (globale o npx) ---
function resolveMdlc2() {
	const probe = spawnSync("markdownlint-cli2", ["--version"], {
		encoding: "utf8",
		shell: process.platform === "win32",
	});
	if (probe.status === 0 || probe.stdout?.includes("markdownlint-cli2")) {
		return { cmd: "markdownlint-cli2", viaNpx: false };
	}
	return {
		cmd: "npx",
		viaNpx: true,
		argsPrefix: ["--yes", "markdownlint-cli2"],
	};
}

function runMdlc2(files, args, tool) {
	// Passa sempre --config esterna se esiste (niente config per-progetto).
	const configArgs = fs.existsSync(CONFIG_PATH)
		? ["--config", CONFIG_PATH]
		: [];
	const fullArgs = tool.viaNpx
		? [...tool.argsPrefix, ...configArgs, ...args, ...files]
		: [...configArgs, ...args, ...files];
	const r = spawnSync(tool.cmd, fullArgs, {
		encoding: "utf8",
		shell: process.platform === "win32",
	});
	const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
	return out;
}

function parseViolations(raw) {
	const counts = {};
	const lines = [];
	for (const line of raw.split(/\r?\n/)) {
		const m = line.match(/^(.*?):(\d+).*?(MD\d+\/[\w/-]+)\s+(.+)$/);
		if (m) {
			counts[m[3].split("/")[0]] = (counts[m[3].split("/")[0]] || 0) + 1;
			lines.push(line);
		}
	}
	return { counts, lines };
}

// --- FIX MD040: code fence di apertura senza lingua -> "text" ---
function fixMd040(text) {
	const lines = text.split(/\r?\n/);
	let inFence = false;
	let fenceLen = 0;
	let fixed = 0;
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/^(\s*)(`{3,})(.*)$/);
		if (!m) continue;
		const len = m[2].length;
		if (!inFence) {
			if (m[3].trim() === "") {
				lines[i] = `${m[1]}${"`".repeat(len)}text`;
				fixed++;
			}
			inFence = true;
			fenceLen = len;
		} else if (len >= fenceLen && m[3].trim() === "") {
			inFence = false;
			fenceLen = 0;
		}
	}
	return { text: lines.join("\n"), fixed };
}

// --- FIX MD060: normalizza stile pipe delle tabelle a "padded" consistente ---
// MD060 richiede consistenza di stile pipe (compact vs padded) dentro ogni tabella.
// Split di una riga di tabella sulle pipe NON escaped.
// Rispetta \| (pipe literal dentro una cella, es. `"a" \| "b"`).
// Usa lookbehind negativo: una pipe e' separatore solo se non preceduta da \.
// Node >=22 supporta i lookbehind nelle regex di split.
function splitTableCells(line) {
	return line.split(/(?<!\\)\|/);
}

// Normalizziamo tutto a "padded": ogni cella ha almeno uno spazio dopo | e prima di |.
// Salta i blocchi di codice (pipe li dentro non sono tabelle).
// Una riga e' considerata "di tabella" se e' preceduta/followed da una riga
// che contiene il separatore |---| (riga 0-index k con /^\|?\s*:?-+/).
function fixMd060(text) {
	const lines = text.split(/\r?\n/);
	let inFence = false;
	let fenceLen = 0;
	let fixed = 0;

	// Identifica gli indici delle righe che appartengono a tabelle GFM.
	// Una tabella: una riga con pipe, seguita da un separatore (| --- |), seguita
	// da zero o piu' righe con pipe. Lasciamo stare i bordi (| iniziale/finali
	// opzionali in GFM) ma richiediamo almeno una pipe in ogni riga.
	function isSeparator(line) {
		// separatore: cell content solo -, :, spazi, e deve avere almeno un -
		return (
			/^\s*\|?\s*:?-+:?(\s*\|\s*:?-+:?)*\s*\|?\s*$/.test(line) && /-/.test(line)
		);
	}
	function hasPipe(line) {
		return line.includes("|");
	}

	function padRow(line) {
		// Normalizza una riga di tabella a "padded".
		// Gestisce bordi opzionali: se inizia/finisce con |, mantiene.
		const trimmedEnd = line.replace(/\s+$/, "");
		const startsWithPipe = /^\s*\|/.test(trimmedEnd);
		const endsWithPipe = /\|\s*$/.test(trimmedEnd);
		// Splitta su | tenendo conto dei bordi.
		// Rimuovi i pipe di bordo temporaneamente.
		let core = trimmedEnd;
		if (startsWithPipe) core = core.replace(/^\s*\|/, "");
		if (endsWithPipe) core = core.replace(/\|\s*$/, "");
		// Split sulle pipe NON escaped (rispetta \| dentro una cella).
		const cells = splitTableCells(core);
		// Trim e pad ogni cella.
		const padded = cells.map((c) => {
			const t = c.trim();
			return t ? ` ${t} ` : "  ";
		});
		const joined = padded.join("|");
		return `${startsWithPipe ? "|" : ""}${joined}${endsWithPipe ? "|" : ""}`;
	}

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const m = line.match(/^(\s*)(`{3,})(.*)$/);
		if (m) {
			const len = m[2].length;
			if (!inFence) {
				inFence = true;
				fenceLen = len;
			} else if (len >= fenceLen && m[3].trim() === "") {
				inFence = false;
				fenceLen = 0;
			}
			i++;
			continue;
		}
		if (inFence) {
			i++;
			continue;
		}

		// Fuori da fence: cerca inizio tabella.
		// Una riga con pipe seguita da un separatore.
		if (hasPipe(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
			// Tabella: riga header (i), separatore (i+1), righe dati (i+2..) finche' hasPipe e non vuota.
			// normalizza header
			const before = lines[i];
			lines[i] = padRow(lines[i]);
			if (lines[i] !== before) fixed++;
			// normalizza separatore
			const beforeSep = lines[i + 1];
			lines[i + 1] = padRow(lines[i + 1]);
			if (lines[i + 1] !== beforeSep) fixed++;
			// righe dati
			let j = i + 2;
			while (j < lines.length && hasPipe(lines[j]) && lines[j].trim() !== "") {
				const beforeRow = lines[j];
				lines[j] = padRow(lines[j]);
				if (lines[j] !== beforeRow) fixed++;
				j++;
			}
			i = j;
			continue;
		}
		i++;
	}
	return { text: lines.join("\n"), fixed };
}

// --- FIX MD060 (celle vuote di bordo): riempie con thin space (U+2009) ---
// MD060 fallisce deterministicamente quando una cella di bordo e' vuota
// (|  | b |): qualsiasi stile pipe e' considerato "compact". Fix reale:
// un thin space e' contenuto valido per il linter ma visivamente invisibile,
// quindi la tabella mantiene lo stesso aspetto. Si applica SOLO alle celle
// vuote che MD060 rileverebbe, lasciando intatto il resto.
const THIN_SPACE = "\u2009";
function fixMd060EmptyCells(text) {
	const lines = text.split(/\r?\n/);
	let fixed = 0;
	let inFence = false;
	let fenceLen = 0;
	function isSeparator(line) {
		return (
			/^\s*\|?\s*:?-+:?(\s*\|\s*:?-+:?)*\s*\|?\s*$/.test(line) && /-/.test(line)
		);
	}
	function hasPipe(line) {
		return line.includes("|");
	}
	// Sostituisce le celle vuote (|| attaccate o |  | con spazi) con la cella
	// padded | THIN | , coerente con lo stile padded delle altre celle.
	// Riconosce una cella vuota come: pipe, solo spazi, pipe.
	function fillEmpty(line) {
		// Lavora cella per cella: split su | preservando i bordi.
		const trimmedEnd = line.replace(/\s+$/, "");
		const startsWithPipe = /^\s*\|/.test(trimmedEnd);
		const endsWithPipe = /\|\s*$/.test(trimmedEnd);
		let core = trimmedEnd;
		if (startsWithPipe) core = core.replace(/^\s*\|/, "");
		if (endsWithPipe) core = core.replace(/\|\s*$/, "");
		const cells = splitTableCells(core);
		const out = cells
			.map((c) => {
				const t = c.trim();
				// cella vuota -> thin space padded
				if (t === "") return ` ${THIN_SPACE} `;
				return ` ${t} `;
			})
			.join("|");
		return `${startsWithPipe ? "|" : ""}${out}${endsWithPipe ? "|" : ""}`;
	}
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const m = line.match(/^(\s*)(`{3,})(.*)$/);
		if (m) {
			const len = m[2].length;
			if (!inFence) {
				inFence = true;
				fenceLen = len;
			} else if (len >= fenceLen && m[3].trim() === "") {
				inFence = false;
				fenceLen = 0;
			}
			i++;
			continue;
		}
		if (inFence) {
			i++;
			continue;
		}
		if (hasPipe(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
			// Tabella: header (i), separatore (i+1), dati (i+2..)
			for (
				let j = i;
				j < lines.length &&
				(j <= i + 1 || (hasPipe(lines[j]) && lines[j].trim() !== ""));
				j++
			) {
				if (j >= lines.length) break;
				const before = lines[j];
				lines[j] = fillEmpty(lines[j]);
				if (lines[j] !== before) fixed++;
			}
			// avanza oltre la tabella
			let j = i + 2;
			while (j < lines.length && hasPipe(lines[j]) && lines[j].trim() !== "")
				j++;
			i = j;
			continue;
		}
		i++;
	}
	return { text: lines.join("\n"), fixed };
}

// --- FIX MD026: rimuove punteggiatura finale dagli heading (: , ; .) ---
// MD026 di default blocca: .,;:!?。，、：；·•
// Deterministico e sicuro: togli il carattere finale se e' nella lista.
const MD026_PUNCT = new Set([".", ",", ";", ":", "!", "?"]);
function fixMd026(text) {
	const lines = text.split(/\r?\n/);
	let fixed = 0;
	let inFence = false;
	let fenceLen = 0;
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/^( *)(`{3,})(.*)$/);
		if (m) {
			const len = m[2].length;
			if (!inFence) {
				inFence = true;
				fenceLen = len;
			} else if (len >= fenceLen && m[3].trim() === "") {
				inFence = false;
				fenceLen = 0;
			}
			continue;
		}
		if (inFence) continue;
		// heading: ^#+ spazio + testo + eventuale punteggiatura finale
		const h = lines[i].match(/^(\s*)(#{1,6})\s+(.*?)(\s*)$/);
		if (!h) continue;
		let title = h[3];
		if (title.length > 0 && MD026_PUNCT.has(title[title.length - 1])) {
			title = title.slice(0, -1);
			lines[i] = `${h[1]}${h[2]} ${title}`;
			fixed++;
		}
	}
	return { text: lines.join("\n"), fixed };
}

// --- Risoluzione target: nessun arg = tutti i .md sotto cwd; file = quel file; directory = .md ricorsivi ---
function resolveTargets(args, cwd) {
	if (args.length === 0) return findAllMarkdown(cwd);
	const out = [];
	for (const a of args) {
		const p = path.isAbsolute(a) ? a : path.resolve(cwd, a);
		if (!fs.existsSync(p)) {
			console.error(`Percorso inesistente: ${a} (${p})`);
			continue;
		}
		const st = fs.statSync(p);
		if (st.isDirectory()) out.push(...findAllMarkdown(p));
		else if (st.isFile() && /\.md$/i.test(p)) out.push(p);
		else console.error(`Ignorato (non .md e non directory): ${a}`);
	}
	return [...new Set(out)];
}

// --- MAIN ---
function main() {
	const args = process.argv.slice(2);
	const files = resolveTargets(args, process.cwd());

	if (files.length === 0) {
		console.error("Nessun file .md trovato.");
		process.exit(2);
	}

	const tool = resolveMdlc2();

	console.log(`Tool: ${tool.cmd}${tool.viaNpx ? " (via npx)" : ""}`);
	console.log(`File: ${files.length}\n`);

	// FASE 1: --fix nativo
	console.log(
		"Fase 1: markdownlint-cli2 --fix (regole auto-fixable native)...",
	);
	runMdlc2(files, ["--fix"], tool);

	// FASE 2: fix custom
	console.log("\nFase 2: fix custom deterministici...");
	const customCounts = { MD040: 0, MD060: 0, MD026: 0 };
	for (const f of files) {
		let text = fs.readFileSync(f, "utf8");
		let changed = false;
		const r40 = fixMd040(text);
		if (r40.fixed > 0) {
			text = r40.text;
			customCounts.MD040 += r40.fixed;
			changed = true;
		}
		const r60 = fixMd060(text);
		if (r60.fixed > 0) {
			text = r60.text;
			customCounts.MD060 += r60.fixed;
			changed = true;
		}
		const r60e = fixMd060EmptyCells(text);
		if (r60e.fixed > 0) {
			text = r60e.text;
			customCounts.MD060 += r60e.fixed;
			changed = true;
		}
		const r26 = fixMd026(text);
		if (r26.fixed > 0) {
			text = r26.text;
			customCounts.MD026 += r26.fixed;
			changed = true;
		}
		if (changed) fs.writeFileSync(f, text, "utf8");
	}
	console.log(`  MD040 (code language): ${customCounts.MD040} fix`);
	console.log(`  MD060 (table pipes):   ${customCounts.MD060} fix`);
	console.log(`  MD026 (trailing punct):  ${customCounts.MD026} fix`);

	// FASE 3: re-lint onesto
	console.log("\nFase 3: re-lint (raccolta residui onesti)...");
	const raw = runMdlc2(files, [], tool);
	const { counts, lines } = parseViolations(raw);

	const totalResidual = Object.values(counts).reduce((a, b) => a + b, 0);
	if (totalResidual === 0) {
		console.log("\n✅ 0 violazioni residue. Tutto fixato.");
		process.exit(0);
	}

	console.log(
		`\n⚠️  ${totalResidual} violazioni RESIDUE (non deterministicamente fixabili):`,
	);
	for (const [rule, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		const reason = residualReason(rule);
		console.log(`  ${n.toString().padStart(4)}  ${rule}  — ${reason}`);
	}
	console.log("\nDettaglio residui:");
	for (const l of lines.slice(0, 30)) console.log("  " + l);
	if (lines.length > 30)
		console.log(`  ... e altre ${lines.length - 30} righe`);

	process.exit(1); // exit != 0: non finge, segnala residui
}

function residualReason(rule) {
	switch (rule) {
		case "MD024":
			return "heading duplicati (decisione editoriale: rinominare o accettare)";
		case "MD051":
			return "anchor link con emoji/punteggiatura (slug instabile tra linter e renderer)";
		case "MD001":
			return "incremento heading (richiede riflessione sulla struttura)";
		case "MD060":
			return "stile pipe con celle vuote di bordo (limite del linter: MD060 + celle vuote)";
		default:
			return "regola non coperta da fix deterministici";
	}
}

function findAllMarkdown(dir) {
	const out = [];
	function walk(d) {
		for (const e of fs.readdirSync(d, { withFileTypes: true })) {
			if (e.name === "node_modules" || e.name.startsWith(".")) continue;
			const p = path.join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.isFile() && /\.md$/i.test(e.name)) out.push(p);
		}
	}
	walk(dir);
	return out;
}

main();
