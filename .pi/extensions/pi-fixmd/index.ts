/**
 * pi-fixmd — Estensione pi che espone lo script scripts/fix-markdown.cjs
 * come comando slash, così puoi applicare i fix markdown reali da dentro pi.
 *
 * Comandi:
 *   /fixmd                 -> tutti i file .md del progetto (cwd ricorsivo)
 *   /fixmd <file.md>       -> un file specifico
 *   /fixmd <dir>           -> tutti i .md ricorsivi sotto quella directory
 *   /fixmd .               -> equivalente a nessun arg (tutto il progetto)
 *
 * L'estensione è un wrapper sottile: la logica di fix (markdownlint-cli2 --fix
 * + fix custom deterministici MD040/MD060/MD026 + re-lint onesto) vive nello
 * script scripts/fix-markdown.cjs, che è anche usabile direttamente da CLI.
 *
 * Lo script usa la config markdownlint esterna (~/.markdownlint/config.json)
 * passata via --config, quindi NON serve un .markdownlint.json per-progetto.
 *
 * Installazione: nessuna. pi carica automaticamente le estensioni locali in
 * cwd/.pi/extensions/<nome>/index.ts (vedi core/extensions/loader.js).
 * Richiede: riavvio di pi dopo aver creato il file (le estensioni si caricano
 * all'avvio del processo), e markdownlint-cli2 installato (npm i -g).
 */

import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Trova lo script fix-markdown.cjs cercando scripts/fix-markdown.cjs sotto cwd. */
function resolveScript(cwd: string): string | null {
	const candidate = join(cwd, "scripts", "fix-markdown.cjs");
	return existsSync(candidate) ? candidate : null;
}

/** Esegue lo script e restituisce { stdout, stderr, status }. */
function runScript(
	scriptPath: string,
	rawArgs: string,
	cwd: string,
): {
	stdout: string;
	stderr: string;
	status: number | null;
} {
	// Normalizza l'argomento: "." o stringa vuota -> nessun arg (tutto il progetto).
	const trimmed = rawArgs.trim();
	const args = trimmed === "" || trimmed === "." ? [] : trimmed.split(/\s+/);
	const r = spawnSync(process.execPath, [scriptPath, ...args], {
		cwd,
		encoding: "utf8",
		timeout: 180_000,
	});
	return {
		stdout: r.stdout ?? "",
		stderr: r.stderr ?? "",
		status: r.status,
	};
}

/** Rende l'output dello script compatto per una notifica UI (non troppo lungo). */
function summarize(
	stdout: string,
	stderr: string,
	status: number | null,
): string {
	const combined = `${stdout}${stderr}`.trim();
	if (!combined) {
		return status === 0
			? "fix-markdown: completato (nessun output)."
			: `fix-markdown: terminato con stato ${status}.`;
	}
	// Se l'output è breve, lo mostro tutto; altrimenti prendo le righe chiave.
	const lines = combined.split(/\r?\n/);
	if (lines.length <= 24) return combined;
	// Mostra l'inizio (Fase 1/2) + la coda (Fase 3 / residui / verdetto).
	const head = lines.slice(0, 6);
	const tail = lines.slice(-14);
	return [...head, "  ... (output troncato) ...", ...tail].join("\n");
}

export default function piFixmd(pi: ExtensionAPI): void {
	pi.registerCommand("fixmd", {
		description:
			"Applica i fix markdown reali (markdownlint-cli2 --fix + MD040/MD060/MD026). Senza arg = tutti i .md del progetto; con un file o una directory = solo quel target.",
		async handler(args: string, ctx: ExtensionCommandContext): Promise<void> {
			const cwd = ctx.cwd;
			const scriptPath = resolveScript(cwd);
			if (!scriptPath) {
				ctx.ui.notify(
					`fix-md: script non trovato. Mi aspettavo scripts/fix-markdown.cjs sotto ${cwd}.`,
					"error",
				);
				return;
			}

			// Messaggio iniziale (lo script può richiedere qualche secondo).
			const target = args.trim() || "(tutto il progetto)";
			ctx.ui.notify(`fix-md: avvio su ${target}...`, "info");

			const { stdout, stderr, status } = runScript(scriptPath, args, cwd);

			// Classifica l'esito:
			//   status 0 -> 0 residui, tutto fixato
			//   status 1 -> residui onesti (non deterministicamente fixabili)
			//   status 2 -> nessun file / errore arg
			//   altro    -> crash dello script
			const summary = summarize(stdout, stderr, status);
			if (status === 0) {
				ctx.ui.notify(summary, "info");
			} else if (status === 1) {
				ctx.ui.notify(summary, "warning");
			} else {
				ctx.ui.notify(`fix-md: errore (stato ${status}).\n${summary}`, "error");
			}
		},
	});
}
