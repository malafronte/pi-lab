// Mostra le ultime decisioni del permission-system review log, con comando associato.
// Focus sulle entry recenti per capire quali comandi hanno scatenato 'ask'.
// Uso: node scripts/show-perm-log.cjs [N]
const fs = require("fs");
const path = require("path");
const os = require("os");

const logPath = path.join(
	os.homedir(),
	".pi/agent/extensions/pi-permission-system/logs/pi-permission-system-permission-review.jsonl",
);
const N = parseInt(process.argv[2] || "40", 10);

if (!fs.existsSync(logPath)) {
	console.log("Review log non trovato:", logPath);
	process.exit(0);
}

const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean);
const entries = [];
for (const line of lines) {
	try {
		entries.push(JSON.parse(line));
	} catch {
		/* skip */
	}
}
// ultime N
const tail = entries.slice(-N);
for (const e of tail) {
	const ts = (e.timestamp || "").slice(11, 19); // HH:MM:SS
	const ev = (e.event || "").replace(/^permission_/, "");
	const res = e.resolution || e.decision || e.outcome || "";
	// comando: vari campi possibili
	const cmd =
		e.command ||
		e.bashCommand ||
		(e.message && e.message.command) ||
		(e.toolName === "bash"
			? e.message && (e.message.input || e.message.args)
			: "") ||
		"";
	const tool = e.toolName || (e.message && e.message.toolName) || "";
	const short = String(cmd).slice(0, 110).replace(/\s+/g, " ");
	console.log(
		`[${ts}] ${ev.padEnd(10)} ${String(res).padEnd(7)} ${String(tool).padEnd(6)} ${short}`,
	);
}
console.log(
	`\n(totali ${entries.length} entry; mostrate ultime ${tail.length})`,
);
