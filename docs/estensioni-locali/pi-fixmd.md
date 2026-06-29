# Estensione (progetto): pi-fixmd — comando `/fixmd`

> Estensione **project-local** che espone lo script `scripts/fix-markdown.cjs` come comando slash `/fixmd`, così puoi applicare i fix markdown reali da dentro pi. Scope: `.pi/extensions/pi-fixmd/` (scoperta automaticamente da pi).

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Estensione | `pi-fixmd` (locale, non su npm) |
| Entry point | `.pi/extensions/pi-fixmd/index.ts` |
| Script sottostante | [`scripts/fix-markdown.cjs`](../components-locali/scripts.md) |
| `package.json` | `.pi/extensions/pi-fixmd/package.json` (peerDep `@earendil-works/pi-coding-agent` ≥ 0.75.0) |

## Installazione

Nessuna installazione esplicita: pi carica automaticamente le estensioni locali in `<cwd>/.pi/extensions/<nome>/index.ts`. Richiede:

- riavvio di pi dopo aver creato il file (le estensioni si caricano all'avvio del processo);
- `markdownlint-cli2` installato (`npm i -g markdownlint-cli2`) o richiamabile via `npx`.

## Configurazione

Lo script usa la config markdownlint **esterna** (`~/.markdownlint/config.json`) passata via `--config`, quindi **non serve** un `.markdownlint.json` per-progetto. VS Code legge la stessa config dalle sue settings USER (`markdownlint.config`).

## Uso

```text
/fixmd                  # tutti i file .md del progetto (cwd ricorsivo)
/fixmd <file.md>        # un file specifico
/fixmd <dir>            # tutti i .md ricorsivi sotto quella directory
/fixmd .                # equivalente a nessun arg (tutto il progetto)
```

L'estensione è un wrapper sottile: la logica di fix vive in `scripts/fix-markdown.cjs` (usabile anche direttamente da CLI).

### Codici di uscita dello script

| Exit code | Significato |
| --- | --- |
| 0 | 0 residui, tutto fixato |
| 1 | residui onesti (non deterministicamente fixabili) |
| 2 | nessun file / errore arg |
| altro | crash dello script |

## Esempi

### Esempio 1 — fixare tutti i markdown del progetto

```text
/fixmd
```

### Esempio 2 — fixare una sola directory

```text
/fixmd docs/pacchetti-npm
```

### Esempio 3 — uso diretto da CLI

```bash
node scripts/fix-markdown.cjs docs/README.md
node scripts/fix-markdown.cjs docs/pacchetti-npm docs/skills
```

### Regole fixate deterministicamente (fase 2 dello script)

| Regola | Fix |
| --- | --- |
| MD040 | code fence di apertura senza lingua → aggiunge `text` |
| MD060 | stile pipe inconsistente nelle tabelle → normalizza a "padded" |
| MD026 | punteggiatura finale negli heading → rimuove `:;.` |

Regole **non** fixabili deterministicamente (riportate, non nascoste): MD024 (heading duplicati), MD051 (anchor link con emoji).

Vedi [`docs/components-locali/scripts.md`](../components-locali/scripts.md) per il dettaglio degli script.
