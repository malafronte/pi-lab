# pi-lens — feedback sul codice in tempo reale (LSP, ast-grep, tree-sitter)

> Estensione pi che fornisce feedback sul codice in tempo reale: LSP, linter, formatter, type-checking, analisi strutturale (ast-grep, tree-sitter), complessità, fan-out, regole di sicurezza e molto altro. Espone anche un server MCP `pi-lens-mcp`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-lens` |
| Repository | <https://github.com/apmantza/pi-lens> |
| Documentazione | <https://github.com/apmantza/pi-lens#readme> |
| Licenza | MIT |
| Binari | `pi-lens-mcp`, `pi-lens-analyze` |

## Installazione

```bash
pi install npm:pi-lens
```

## Configurazione

Nessun file di config dedicato obbligatorio: lavora sul workspace corrente. Le regole custom (ast-grep YAML, tree-sitter query) vanno nella drop path del progetto (vedi skill `write-ast-grep-rule` e `write-tree-sitter-rule`). Il pacchetto porta con sé 6 skill builtin.

## Uso

pi-lens espone molti tool di code intelligence, raggruppati:

### Diagnostica

| Tool | Effetto |
| --- | --- |
| `lens_diagnostics` | stato diagnostico aggregato (LSP + tree-sitter + ast-grep + biome/ruff/eslint + complessità). Modalità `delta` (turno corrente), `all` (sessione, file editati), `full` (scan project-wide LSP, costoso). |
| `lsp_diagnostics` | diagnostica LSP per file o directory (usalo **prima** dei build). |

### Navigazione (LSP)

| Tool | Effetto |
| --- | --- |
| `lsp_navigation` | definition, typeDefinition, declaration, references, hover, signatureHelp, documentSymbol, findSymbol, workspaceSymbol, codeAction, rename, rename_file, implementation, call hierarchy, executeCommand, workspaceDiagnostics, capabilities. |

### Ricerca/sostituzione AST (ast-grep)

| Tool | Effetto |
| --- | --- |
| `ast_grep_search` | search AST-aware (pattern con metavariable). |
| `ast_grep_replace` | replace AST-aware (dry-run di default, `apply: true` per applicare). |
| `ast_grep_outline` | outline simbolico (struttura, exports, imports). |
| `ast_grep_dump` / `ast_dump` | dump del tree-sitter AST per debug dei pattern. |

### Moduli e simboli

| Tool | Effetto |
| --- | --- |
| `module_report` | overview navigabile di un modulo (symb­ols, who-uses-this, blast radius, recommendedReads). |
| `read_symbol` | sorgente di un singolo simbolo (cheap). |
| `read_enclosing` | sorgente del simbolo/callback che contiene una riga. |

## Esempi

### Esempio 1 — diagnostica prima di un build

```text
lsp_diagnostics({ path: "src/", severity: "error" })
```

### Esempio 2 — verifica errori bloccanti sui file editati

```text
lens_diagnostics({ mode: "all" })
```

### Esempio 3 — ricerca AST di tutte le `console.log(...)`

```text
ast_grep_search({ lang: "typescript", pattern: "console.log($MSG)" })
```

### Esempio 4 — trova tutte le chiamate `fetchMetrics(...)`

```text
ast_grep_search({ lang: "typescript", pattern: "fetchMetrics($ARGS)" })
```

### Esempio 5 — outline di un file

```text
ast_grep_outline({ paths: ["src/index.ts"], view: "expanded" })
```

## Skill builtin

pi-lens porta 4 skill: `ast-grep`, `lsp-navigation`, `write-ast-grep-rule`, `write-tree-sitter-rule` (vedi [`docs/skills/`](../skills/)).

Per l'analisi dettagliata del pacchetto vedi [`docs/approfondimenti/pacchetti-analisi/01-pi-lens.md`](../approfondimenti/pacchetti-analisi/01-pi-lens.md) e [`docs/approfondimenti/raccomandazioni-pacchetti.md`](../approfondimenti/pacchetti-analisi/00-raccomandazioni.md).
