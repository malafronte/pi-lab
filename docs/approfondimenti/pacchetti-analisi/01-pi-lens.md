# Analisi: pi-lens

**Pacchetto:** `pi-lens` · **Versione:** 3.8.53 (114 release, molto attivo) · **Autore:** Apostolos Mantzaris (apmantza) · **Licenza:** MIT · **Repo:** `github.com/apmantza/pi-lens`

> Real-time code feedback per pi: LSP, linter, formattatori, type-checking, analisi strutturale, duplicati, dead code, secret scanning.

## A cosa serve

Aggiunge un **ciclo di feedback sul codice in tempo reale** all'agente. Ad ogni `write`/`edit` lancia una pipeline language-aware che rileva problemi **inline e actionable** prima che l'agente vada avanti. L'obiettivo: l'agente "vede" gli errori (di lint, di tipo, di sicurezza, duplicati) come li vedrebbe un IDE, e li corregge subito invece di lasciarli al commit/CI.

## La pipeline (su ogni write/edit)

1. **Secrets scan** — *bloccante*: abortisce la write se rileva credenziali
2. **Auto-format** — differito a `agent_end` di default (o immediato con `--immediate-format`)
3. **Auto-fix** — autofix sicuri da 6 tool (Biome `check --write`, Ruff `check --fix`, ESLint `--fix`, stylelint `--fix`, sqlfluff `fix`, RuboCop `-a`)
4. **Edit autopatch** — corregge silenziosamente mismatch di `oldText` (indentazione tab/spazio, trailing whitespace) quando c'è un match univoco
5. **LSP file sync** — apre/aggiorna il file nei language server attivi
6. **Dispatch lint** — gruppi paralleli: LSP diagnostics, regole strutturali tree-sitter, regole ast-grep sicurezza/correttezza, fact rules, linter specifici, Semgrep sperimentale, similarity detection
7. **Cascade diagnostics** — grafo d'impatto: quali altri file sono stati toccati e come si sono propagate le diagnostiche

## Comandi e tool

**Comandi slash:** `/lens-toggle`, `/lens-health`, `/lens-booboo` (dettaglio warning), `/lens-tools`, `/lens-context-toggle`, `/lens-widget-toggle`, `/lens-allow-edit`, `/lens-semgrep`, `/lens-tdi`

**Tool per l'LLM** (registrati su richiesta): `ast_grep_search`, `ast_grep_replace`, `biome`, `black`, `clangd`, `gitleaks`, `jscpd`, `knip`, `actionlint`, `dart`, `fantomas`, `csharpier`, `cljfmt`, `ast_dump`, ecc. (decine di linter/LSP esposti come tool)

## Installazione

```bash
pi install npm:pi-lens
```

Config progetto: `.pi-lens/lsp.json` (es. `warmFiles` per pre-riscaldare clangd).

## ⚠️ Sicurezza (punto critico)

- **Auto-installa 22 tool globalmente** al primo utilizzo: LSP server (typescript-language-server, pyright, bash/yaml/json-language-server), linter (ruff, biome, oxlint, mypy, rubocop, shellcheck, sqlfluff, stylelint, markdownlint, actionlint, yamllint), tool di analisi (madge, jscpd, knip, ast-grep) e altri via **GitHub release** (rust-analyzer, golangci-lint, shfmt). Questo significa `npm install -g` e download binari → **superficie di sicurezza alta**. Va capito e accettato.
- L'installer scarica da `api.github.com` e `api.nuget.org`.
- Include un **MCP server interno** (`dist/mcp/server.js`) e un **client LSP** (comunica con language server via JSON-RPC).
- Peer dep: `@earendil-works/pi-coding-agent` (qualsiasi versione).
- **Entry point `./dist/index.js`**: codice **compilato/bundlato** (non sorgente TS leggibile direttamente) → più difficile da auditare riga per riga rispetto alle estensioni in `.ts`.

## Pro

- ✅ Feedback codice in tempo reale come un IDE: cattura errori che l'LLM altrimenti lascerebbe al commit
- ✅ Secret scanning bloccante (protezione contro commit di credenziali)
- ✅ Autofix di 6 linter + edit autopatch (riduce attrito)
- ✅ Analisi strutturale profonda (ast-grep, tree-sitter, Semgrep)
- ✅ Rilevamento duplicati (jscpd), dead code (knip), circular deps (madge)
- ✅ Estremamente attivo (114 release)

## Contro

- ❌ **Pesante**: 3 MB scompattato, dipendenze grosse (`ast-grep/napi`, `typescript`, `vscode-jsonrpc`, `js-yaml`, `minimatch`)
- ❌ **Auto-install globale di 22 tool** = superficie di sicurezza e di "sporcamento" del sistema (npm -g, binari da GitHub)
- ❌ Codice compilato/bundlato (audit più difficile)
- ❌ Possibile **conflitto/ridondanza con `pi-autoformat`** (entrambi formattano su write/edit) — vedi documento raccomandazioni
- ❌ Startup overhead (~2.5s su progetti medio-grandi, mitigato da caching)

## Compatibilità

- pi 0.79.10: ✅ compatibile (peer dep `*`)
- Dipende da 22 tool esterni per sfruttare tutto (ma si degrada graceful senza)

## Quando usarlo

**Sì** se: vuoi che l'agente "veda" errori di codice in tempo reale e lavori in un loop di qualità tipo IDE, soprattutto su codebase con linter/typing rigorosi.
**No** se: è un progetto piccolo, non vuoi 22 tool installati globalmente, o la superficie di sicurezza dell'auto-install ti preoccupa.
