// Mostra il contenuto (message/toolName/path/command) di TUTTE le permission_request.*
// nella finestra del test, per identificare i 4 prompt generati dai subagent.
const fs = require("node:fs");
const path =
	"C:/Users/genna/.pi/agent/extensions/pi-permission-system/logs/pi-permission-system-permission-review.jsonl";

const lines = fs.readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
const windowStart = "2026-06-28T18:40";
const windowEnd = "2026-06-28T18:52";

const req = [];
for (const line of lines) {
	let e;
	try {
		e = JSON.parse(line);
	} catch {
		continue;
	}
	if (!e.timestamp || e.timestamp < windowStart || e.timestamp > windowEnd)
		continue;
	if (!String(e.event || "").startsWith("permission_request")) continue;
	req.push(e);
}

console.log(`=== permission_request.* nella finestra: ${req.length} ===\n`);
for (const e of req) {
	console.log(`[${e.timestamp}] ${e.event}  (agentName=${e.agentName})`);
	console.log(`  tool=${e.toolName}  resolution=${e.resolution}`);
	if (e.message) console.log(`  MSG: ${e.message}`);
	if (e.path) console.log(`  path: ${e.path}`);
	if (e.command) console.log(`  cmd:  ${e.command}`);
	console.log("");
}
