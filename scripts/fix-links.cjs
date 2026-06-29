// Corregge i link markdown interni ai file spostati che puntano ai vecchi nomi.
// Sostituisce il basename vecchio -> nuovo (solo nei pattern di link).
// Uso: node scripts/fix-links.cjs
const fs = require("fs");

// file -> mappa vecchio-basename -> nuovo-basename
const jobs = {
	"docs/approfondimenti/gotgenes-packages-guida.md": {
		"pi-subagents-tutorial": "subagents-tutorial",
	},
	"docs/approfondimenti/subagents-nicobailon-guida.md": {
		"pi-subagents-confronto": "subagents-confronto",
		"pi-subagents-tutorial": "subagents-tutorial",
		"pi-gotgenes-packages-guida": "gotgenes-packages-guida",
	},
	"docs/approfondimenti/subagents-tutorial.md": {
		"pi-subagents-nicobailon-guida": "subagents-nicobailon-guida",
		"pi-subagents-confronto": "subagents-confronto",
	},
	"docs/mcp/mcp-audit.md": {
		"pi-stitch-proxy-guida": "stitch-proxy",
		"pi-mcp-guida": "mcp-guida",
	},
	"docs/mcp/mcp-guida.md": {
		"pi-stitch-proxy-guida": "stitch-proxy",
		"pi-mcp-audit": "mcp-audit",
	},
};

for (const [file, map] of Object.entries(jobs)) {
	let text = fs.readFileSync(file, "utf8");
	let changed = 0;
	for (const [oldBn, newBn] of Object.entries(map)) {
		// sostituisci SOLO dentro i link markdown: ](...oldBn.md  oppure ](./oldBn.md
		// cattura eventuale anchor #... che va preservato
		const re = new RegExp(
			"(\\]\\((?:\\./)?)" +
				oldBn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
				"(\\.md)",
			"g",
		);
		text = text.replace(re, (m, p1, p2) => {
			changed++;
			return p1 + newBn + p2;
		});
	}
	fs.writeFileSync(file, text, "utf8");
	console.log(`${file}: ${changed} link corretti`);
}
