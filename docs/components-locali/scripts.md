# Componente locale: `scripts/`

> Script Node.js (`.cjs`) di utilità del repo: fix markdown deterministici, conteggio file per estensione, parsing del log di review dei permessi. Percorso: `scripts/`.

## Riferimento

| File | Scopo |
| --- | --- |
| `scripts/fix-markdown.cjs` | fix markdown reali e deterministici (usato dal comando [`/fixmd`](../estensioni-locali/pi-fixmd.md)) |
| `scripts/count-by-ext.cjs` | conta ricorsivamente i file per estensione |
| `scripts/parse-perm-log.cjs` | estrae le `permission_request.*` dal review log di pi-permission-system in una finestra temporale |
| `scripts/inspect-packages.cjs` | estrae metadati dai `package.json` dei pacchetti pi installati (utility di documentazione) |

Nessuna dipendenza npm per `count-by-ext.cjs` e `parse-perm-log.cjs` (usano solo `node:fs`/`node:path`). `fix-markdown.cjs` richiede `markdownlint-cli2` (globale o via `npx`).

## Configurazione

Nessuna. `fix-markdown.cjs` legge la config markdownlint esterna (`~/.markdownlint/config.json`) via `--config`, così il progetto non ha bisogno di un `.markdownlint.json` per-progetto.

## Uso

### `fix-markdown.cjs` — fix markdown

Tre fasi: (1) `markdownlint-cli2 --fix` per le regole auto-fixable native; (2) fix custom deterministici MD040/MD060/MD026; (3) re-lint senza `--fix` per raccogliere e riportare i residui onestamente.

```bash
node scripts/fix-markdown.cjs                       # tutti i .md del repo
node scripts/fix-markdown.cjs file1.md file2.md     # file specifici
node scripts/fix-markdown.cjs docs/pacchetti-npm docs/skills  # directory
```

Exit code: `0` = 0 residui; `1` = residui onesti (non deterministicamente fixabili); `2` = nessun file/errore arg.

### `count-by-ext.cjs` — conteggio per estensione

```bash
node scripts/count-by-ext.cjs [directory]
# default: process.cwd(); salta i symlink; estensioni in minuscolo;
# i file senza estensione finiscono in "(no extension)";
# output ordinato per conteggio decrescente, a parità alfabetico.
```

Exit code: `0` = ok; `1` = la directory argomento non esiste.

### `parse-perm-log.cjs` — parsing del review log

Estrae da `<PERMISSION_LOG_PATH>` le `permission_request.*` in una finestra temporale (definita nello script) per identificare i prompt generati dai subagent. Mostra `timestamp`, `event`, `agentName`, `toolName`, `resolution`, `message`, `path`, `command`.

```bash
node scripts/parse-perm-log.cjs
```

> **Path del log (segnaposto):** il percorso del review log è `~/.pi/agent/extensions/pi-permission-system/logs/pi-permission-system-permission-review.jsonl`. Lo script contiene un path illustrativo come esempio: adattalo al tuo ambiente o parametrizzalo.

## Esempi

### Esempio 1 — fixare tutta la documentazione

```bash
node scripts/fix-markdown.cjs docs
```

### Esempio 2 — conteggio file del repo

```bash
node scripts/count-by-ext.cjs
# .md   48
# .cjs   4
# ...
```

### Esempio 3 — ispezionare i prompt di permesso di una sessione

```bash
node scripts/parse-perm-log.cjs
# === permission_request.* nella finestra: 4 ===
# [2026-...T18:41:...] permission_request  (agentName=child-1)
#   tool=subagent  resolution=allow
# ...
```

### Esempio 4 — estrarre i metadati dei pacchetti (utility docs)

```bash
node scripts/inspect-packages.cjs
# ===== pi-lens =====
# name: pi-lens
# repository: git+https://github.com/apmantza/pi-lens.git
# ...
```
