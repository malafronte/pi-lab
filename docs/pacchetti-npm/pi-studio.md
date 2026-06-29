# pi-studio — workspace two-pane, REPL, export PDF/HTML

> Estensione pi che aggiunge un workspace browser two-pane con editing prompt/response, annotazioni, critiche, active quiz, history di prompt/response, live preview e workflow REPL/literate REPL basati su tmux.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-studio` |
| Repository | <https://github.com/omaclaren/pi-studio> |
| Documentazione | <https://github.com/omaclaren/pi-studio#readme> |
| Licenza | MIT |

## Installazione

```bash
pi install npm:pi-studio
```

## Configurazione

Nessun file di config dedicato obbligatorio. Il pacchetto porta anche temi (`pi.themes`). Richiede `tmux` per i workflow REPL. Il pacchetto va in `~/.pi/agent/settings.json` → `packages`.

## Uso

Espone tool per due aree: gestione REPL e export di contenuti.

### REPL (tmux-backed)

| Tool | Effetto |
| --- | --- |
| `studio_repl_status` | ispeziona le sessioni tmux REPL visibili da Studio e la sessione REPL attiva. Opzionale `sessionName` e `target` (shell, python, ipython, julia, r, ghci, clojure). |
| `studio_repl_send` | esegue codice nella sessione REPL attiva o selezionata, con protocollo di submission safe runtime-specifico (gestisce quoting multilinea). Opzionali `sessionName`, `target`, `timeoutMs` (1000–120000). |

> Usa sempre `studio_repl_send` (non comandi tmux grezzi) per inviare codice nella REPL: gestisce il quoting multilinea e la submission runtime-specifica.

### Export PDF/HTML

| Tool | Effetto |
| --- | --- |
| `studio_export_pdf` | esporta Markdown/LaTeX, un file locale o l'ultima risposta del modello in PDF. Opzionali: `markdown`/`path`, `inputFormat`, `outputPath`, `pdfOptions` (margini, font, geometry, linestretch…), `title`, `resourceDir`, `open`. |
| `studio_export_html` | esporta Markdown/LaTeX, un file locale o l'ultima risposta in HTML standalone (preview pipeline). Stessa struttura di `studio_export_pdf`. |

### Workspace two-pane

Il workspace browser two-pane fornisce: editing di prompt/response, annotazioni, critiche, active quiz, history, live preview. Si attiva dall'interfaccia TUI di pi.

## Esempi

### Esempio 1 — ispezionare la REPL attiva

```text
studio_repl_status({})
```

### Esempio 2 — eseguire uno snippet Python nella REPL attiva

```text
studio_repl_send({ code: "import sys; print(sys.version)" })
```

### Esempio 3 — eseguire in una sessione Python specifica con timeout

```text
studio_repl_send({ code: "print('hello')", sessionName: "pi-repl-python", target: "python", timeoutMs: 10000 })
```

### Esempio 4 — esportare markdown in PDF

```text
studio_export_pdf({ markdown: "# Report\n\nContenuto del report.", outputPath: "report.pdf" })
```

### Esempio 5 — esportare un file markdown locale in HTML

```text
studio_export_html({ path: "docs/README.md", outputPath: "docs/index.html", title: "Documentazione" })
```

Per l'analisi dettagliata del pacchetto vedi [`docs/approfondimenti/pacchetti-analisi/04-pi-studio.md`](../approfondimenti/pacchetti-analisi/04-pi-studio.md).
