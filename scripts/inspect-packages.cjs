// Estrae metadati ufficiali dai package.json dei pacchetti pi installati.
// Uso: node scripts/inspect-packages.cjs
const fs = require("fs");
const path = require("path");

const root = path.join(
	process.env.USERPROFILE || process.env.HOME,
	".pi/agent/npm/node_modules",
);
const pkgs = [
	"pi-mcp-adapter",
	"pi-lens",
	"pi-web-access",
	"pi-studio",
	"pi-agent-browser-native",
	"pi-vision-tool",
	"pi-codex-goal",
	"pi-subagents",
	"pi-questionnaire",
	"@gotgenes/pi-permission-system",
	"@gotgenes/pi-nocd",
	"@gotgenes/pi-session-tools",
	"@gotgenes/pi-github-tools",
	"@narumitw/pi-plan-mode",
	"@spences10/pi-themes",
];

for (const p of pkgs) {
	const pj = path.join(root, p, "package.json");
	if (!fs.existsSync(pj)) {
		console.log(`\n===== ${p} =====\n[MANCANTE]`);
		continue;
	}
	let j;
	try {
		j = JSON.parse(fs.readFileSync(pj, "utf8"));
	} catch (e) {
		console.log(`\n===== ${p} =====\n[ERRORE LETTURA] ${e.message}`);
		continue;
	}
	const repo =
		typeof j.repository === "string"
			? j.repository
			: (j.repository && j.repository.url) || "";
	console.log(`\n===== ${p} =====`);
	console.log("name:", j.name);
	console.log("version:", j.version);
	console.log("description:", j.description || "");
	console.log("homepage:", j.homepage || "");
	console.log("repository:", repo || "");
	console.log("license:", j.license || "");
	console.log("bin:", JSON.stringify(j.bin || {}));
	console.log("pi-field:", JSON.stringify(j.pi || {}));
	console.log("keywords:", JSON.stringify(j.keywords || []));
	// dipendenze dirette pi-* / @gotgenes / @narumitw / @spences10
	const deps = Object.keys(j.dependencies || {}).filter(
		(k) =>
			k.startsWith("pi-") ||
			k.startsWith("@gotgenes") ||
			k.startsWith("@narumitw") ||
			k.startsWith("@spences10"),
	);
	console.log("pi-deps:", JSON.stringify(deps));
}
