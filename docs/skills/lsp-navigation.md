# Skill: lsp-navigation — code intelligence e diagnostica LSP

> Skill (derivata da `pi-lens`) che designa `lsp_navigation` come **PRIMARY** per la code intelligence e `lsp_diagnostics` come **PRIMARY** per i check proattivi di tipo/errori. Non usare grep/glob/ast-grep prima per la code intelligence.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `lsp-navigation` |
| Pacchetto padre | `pi-lens` (<https://github.com/apmantza/pi-lens>) |
| File skill | `skills/lsp-navigation/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-lens
```

## Configurazione

Nessuna configurazione: usa i language server già attivi nel workspace.

## Uso

### Diagnostica (usa `lsp_diagnostics` prima di build/test)

| Bisogno | Chiamata |
| --- | --- |
| Un file | `lsp_diagnostics({ path: "src/file.ts" })` |
| Una cartella | `lsp_diagnostics({ path: "src/", severity: "error" })` |
| File toccati esatti | `lsp_diagnostics({ paths: ["src/a.ts","src/b.ts"], concurrency: 8 })` |
| Server lento (Rust, Java) | `lsp_diagnostics({ paths: files, waitMs: 2000 })` |
| Includere warning | `lsp_diagnostics({ paths: files, severity: "all" })` |

Preferisci batch espliciti `paths` dopo edit multi-file (concurrency bounded, niente rumore di directory non correlate).

### Navigazione (code intelligence)

| Domanda | Operazione |
| --- | --- |
| Dove è definito? | `definition` |
| Dove è definito il *tipo*? | `typeDefinition` |
| Dove è dichiarato (vs definito)? | `declaration` |
| Trova tutti gli usi | `references` |
| Che tipo è? | `hover` |
| Firma della chiamata | `signatureHelp` |
| Simboli in questo file | `documentSymbol` |
| Cerca simbolo nel progetto | `workspaceSymbol` (passa sempre `path`) |
| Quick fix disponibili | `codeAction` |
| Rinomina simbolo | `rename` (preview di default; `apply: true` per applicare) |
| Chi implementa questa interfaccia? | `implementation` |
| Chi chiama questa funzione? | `prepareCallHierarchy` → `incomingCalls` |
| Cosa chiama questa funzione? | `prepareCallHierarchy` → `outgoingCalls` |
| Quali comandi offre il server? | `capabilities` |
| Esegui un comando server (es. organize imports) | `executeCommand` (dry-run se non `apply: true`) |

### Note operative

- `definition` restituisce nulla? Il file potrebbe non essere ancora indicizzato: leggilo prima, poi riprova.
- `workspaceSymbol` vuoto? Passa sempre `path`; le query non-scoped sono best-effort.
- `references`: interroga dal sito di *definition* per copertura cross-file completa.

## Esempi

### Esempio 1 — diagnostica errori su una cartella

```text
lsp_diagnostics({ path: "src/", severity: "error" })
```

### Esempio 2 — trovare tutte le chiamanti di una funzione

```text
# passo 1
lsp_navigation({ operation: "prepareCallHierarchy", path: "src/api.ts", line: 42, symbol: "fetchUser" })
# passo 2 (con l'item restituito)
lsp_navigation({ operation: "incomingCalls", callHierarchyItem: <item> })
```

### Esempio 3 — hover sul tipo di un simbolo

```text
lsp_navigation({ operation: "hover", path: "src/index.ts", line: 10, symbol: "config" })
```

### Esempio 4 — workspace symbol con scope

```text
lsp_navigation({ operation: "workspaceSymbol", query: "fetchMetrics", path: "src/" })
```
