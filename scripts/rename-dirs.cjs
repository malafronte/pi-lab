// Rinomina i riferimenti alle cartelle docs/packages -> docs/pacchetti-npm
// e docs/extensions -> docs/estensioni-locali in tutti i .md.
// Sostituisce SOLO path locali (mai URL esterni tipo pi.dev/packages).
// Uso: node scripts/rename-dirs.cjs
const fs = require("fs");
const path = require("path");

const files = [];
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p);
		else if (e.name.endsWith(".md")) files.push(p);
	}
}
walk("docs");
files.push("README.md");

// Sostituzioni sicure (path locali, non URL esterni)
const subs = [
	// link markdown relativi da docs/README.md
	[/\]\(packages\//g, "](pacchetti-npm/"],
	[/\]\(extensions\//g, "](estensioni-locali/"],
	// link markdown relativi da sottocartelle (../packages, ../extensions)
	[/\]\(\.\.\/packages\//g, "](../pacchetti-npm/"],
	[/\]\(\.\.\/extensions\//g, "](../estensioni-locali/"],
	// riferimenti testuali path (in testo e in code block dell'albero struttura)
	[/docs\/packages\//g, "docs/pacchetti-npm/"],
	[/docs\/extensions\//g, "docs/estensioni-locali/"],
	// voci dell'albero struttura nel README root
	[/├── packages\//g, "├── pacchetti-npm/"],
	[/├── extensions\//g, "├── estensioni-locali/"],
];

let total = 0;
for (const f of files) {
	let text = fs.readFileSync(f, "utf8");
	let n = 0;
	for (const [re, rep] of subs) {
		text = text.replace(re, () => {
			n++;
			return rep.replace(/\$/g, "$$$$");
		});
	}
	if (n > 0) {
		fs.writeFileSync(f, text, "utf8");
		console.log(`${f}: ${n} sostituzioni`);
		total += n;
	}
}
console.log(`\nTotale: ${total} sostituzioni in ${files.length} file`);
