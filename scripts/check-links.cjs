// Verifica i link markdown relativi puntino a file esistenti.
// Uso: node scripts/check-links.cjs
const fs = require("fs");
const path = require("path");

const root = process.cwd();
// raccogli tutti i .md della root e di docs/
const files = [];
if (fs.existsSync("README.md")) files.push("README.md");
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p);
		else if (e.name.endsWith(".md")) files.push(p);
	}
}
walk("docs");

// regex link markdown: [text](target)  (esclude http(s), mailto, #anchor)
const LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
let broken = 0;
let checked = 0;

for (const f of files) {
	const text = fs.readFileSync(f, "utf8");
	let m;
	while ((m = LINK.exec(text)) !== null) {
		let target = m[2].trim();
		// skip external / anchor-only / mailto
		if (/^(https?:|mailto:|#)/.test(target)) continue;
		// strip anchor
		const hashIdx = target.indexOf("#");
		if (hashIdx >= 0) target = target.slice(0, hashIdx);
		if (target === "") continue;
		// resolve relative to file dir
		const resolved = path.resolve(path.dirname(f), target);
		checked++;
		if (!fs.existsSync(resolved)) {
			broken++;
			console.log(`BROKEN in ${f}: [${m[1]}](${m[2]})  -> ${resolved}`);
		}
	}
}
console.log(
	`\nChecked ${checked} internal links in ${files.length} files. Broken: ${broken}`,
);
