# Skill: ast-grep — search/replace di codice AST-aware

> Skill (derivata da `pi-lens`) per search e replace di codice **semantico** con `ast_grep_search` e `ast_grep_replace`. ast-grep capisce la struttura del codice, non solo il testo.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `ast-grep` |
| Pacchetto padre | `pi-lens` (<https://github.com/apmantza/pi-lens>) |
| File skill | `skills/ast-grep/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-lens
```

## Configurazione

Nessuna configurazione. Le regole ast-grep custom vanno in `rules/ast-grep-rules/rules/<id>.yml` (vedi [`write-ast-grep-rule.md`](write-ast-grep-rule.md)).

## Uso

### Quando usarla

- chiamate di funzione, import, metodi di classe (codice strutturato);
- replace sicuri cross-file;
- **usa LSP prima** per definition/references/types, poi scope ast-grep ai file trovati da LSP;
- **usa grep** per pattern di stringhe parziali, commenti, URL, o dopo un retry semplificato di ast-grep che restituisce ancora zero match.

### Regole d'oro

1. **Sii specifico**: `fetchMetrics($ARGS)` non `fetchMetrics`;
2. **Scopa**: specifica sempre `paths` ai file rilevanti;
3. **Retry una volta su zero match**: semplifica il pattern, stessi `paths`, poi fallback a grep;
4. **Dry-run prima**: `apply: false` prima di `apply: true`;
5. **Solo codice valido**: `function $NAME($$$) { $$$ }` non `function $NAME(`;
6. **Evita `selector` se non esperto**: restringe a un AST node kind, non estrae metavariable;
7. **Le metavariable non funzionano dentro le stringhe**: `from "$PATH"` matcha la stringa letterale `"$PATH"`, non un wildcard.

### Metavariable

| Sintassi | Match | Cattura? |
| --- | --- | --- |
| `$X` | singolo nodo | sì |
| `$$$` | zero o più nodi | no (wildcard) |
| `$$$ARGS` | zero o più nodi | sì |

## Esempi

### Esempio 1 — trovare tutte le `console.log(...)`

```text
ast_grep_search({ lang: "typescript", pattern: "console.log($MSG)", paths: ["src/"] })
```

### Esempio 2 — sostituire `var` con `let` (dry-run)

```text
ast_grep_replace({ lang: "javascript", pattern: "var $X", rewrite: "let $X", paths: ["src/"], apply: false })
```

### Esempio 3 — import named

```text
ast_grep_search({ lang: "typescript", pattern: "import { $NAMES } from $PATH" })
```

### Esempio 4 — constraint strutturale (`insideKind`)

```text
ast_grep_search({ lang: "typescript", pattern: "console.log($$$)", insideKind: "function_declaration" })
```
