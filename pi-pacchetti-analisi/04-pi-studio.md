# Analisi: pi-studio

**Pacchetto:** `pi-studio` · **Versione:** 0.9.33 (134 release, molto attivo) · **Autore:** omaclaren · **Licenza:** MIT · **Repo:** `github.com/omaclaren/pi-studio`

> Apre un **workspace browser two-pane** (editor a sinistra + preview/working a destra) per lavorare con prompt, risposte, documenti Markdown/LaTeX, preview HTML interattive, file di codice, e sessioni REPL.

## A cosa serve

Trasforma l'interazione con pi in una **postazione di lavoro in browser**: invece di solo TUI, apre un'interfaccia web locale a due pannelli dove scrivere/modificare prompt e documenti, vedere preview renderizzate (Markdown, LaTeX con math/Mermaid, HTML interattivo sandboxed, CSV/TSV, PDF), annotare risposte, richiedere critique, fare quiz di active-recall, esplorare prompt/response history, e mandare codice a un REPL tmux. È un **cambio di paradigma UX**, non un'aggiunta minore.

## Feature principali

- **Two-pane browser**: Editor (sx) + Response/Working/Editor Preview (dx)
- **Zen mode** per nascondere il chrome secondario
- **Working view live** dell'attività model/tool (filtri All/Thinking/Tools, preview immagini)
- **Critique** strutturata (auto/writing/code focus) + **Suggest completion** (cursor-aware) + **Quiz me** (active-recall loop)
- **Changes view**: git diff per file con preview
- **Files view**: browser della directory di sessione, conversione DOCX/ODT→Markdown (via Pandoc), preview PDF/immagini
- **REPL tmux-backed**: Shell, Python, IPython, Julia, R, GHCi, Clojure — modalità Raw/Literate, `Send to REPL` (`Cmd/Ctrl+Shift+Enter`), export Markdown/PDF/HTML
- **Scratchpad** persistente locale + picker Recent
- **Outline rail** per navigare la struttura del documento
- **Commenti** ancorati a selezioni/righe, docked rail, conversione in annotazioni `[an: ...]` inline
- **Annotation workflow** per marker `[an: ...]`: header, mostra/nascondi, strip prima dell'invio, salva `.annotated.md`
- **Preview** Markdown/LaTeX/code (math+Mermaid) + CSV/TSV tables, theme-synced, copy buttons
- **HTML interattivo** via iframe sandboxed (con zoom); i blocchi `html` fenced restano sorgente
- **Export** PDF (pandoc+LaTeX) o HTML standalone
- Temi `pi-studio-dark`/`pi-studio-light` dedicati

## Comandi e tool

**Comandi slash:**

- `/studio` — apri con ultima risposta (fallback: vuoto)
- `/studio <path>` — apri con file precaricato
- `/studio --last` / `--blank` / `--no-browser` / `--port <port>`
- `/studio-current`, `/studio-editor-only`, `/studio-html <path>`, `/studio-pdf <path>`, `/studio-replace`

**Tool per l'LLM:** `studio_export_pdf`, `studio_export_html`, `studio_repl_send`, `studio_repl_status`

## Installazione

```bash
pi install npm:pi-studio
```

Dipendenze: `@earendil-works/pi-ai`, `@sinclair/typebox`, `ws` (websocket). Temi inclusi in `./themes`.

## ⚠️ Sicurezza

- **Server HTTP locale** + **websocket** (`ws`) per la UI browser — su porta random (o `--port` fissata), loopback
- **CDN jsdelivr** per le librerie di rendering preview nella UI browser: **DOMPurify**, **MathJax**, **Mermaid**, **pdfjs-dist**. (Caricati nel browser, non nel runtime node — ma significa che la UI browser fa richieste a jsdelivr)
- **exec di tmux** per il REPL (legittimo: è lo scopo del REPL)
- Codice `.ts` leggibile, ma **9.2 MB** scompattato (molto grande — include client browser, assets, shared)
- Peer dep `@earendil-works/pi-coding-agent` (`*`)

## Pro

- ✅ Cambia radicalmente la UX in un vero workspace (preview, REPL, annotation, history)
- ✅ REPL multi-linguaggio tmux-backed (la filosofia di pi suggerisce tmux per i REPL — questo lo integra)
- ✅ Export PDF/HTML, critique, quiz, git diff view — feature ricche
- ✅ Molto attivo (134 release)

## Contro

- ❌ **Enorme** (9.2 MB) — il più pesante dei sette
- ❌ **Server web locale + CDN** = superficie di sicurezza non banale (iframe sandboxed, dipendenze browser da CDN)
- ❌ **Cambia molto la UX** — non è "un'aggiunta", è un modo diverso di usare pi (può non piacere/confondere)
- ❌ Per sfruttare REPL/export serve tmux + pandoc + LaTeX installati
- ❌ Tema dedicato (`pi-studio-dark/light`) potrebbe interagire con altri temi (vedi raccomandazioni)

## Compatibilità

- pi 0.79.10: ✅ compatibile (peer `*`)
- È un'estensione "takeover" della UX — valuta se è il workflow che vuoi

## Quando usarlo

**Sì** se: vuoi un workspace browser ricco (preview, REPL multi-lingua, annotation, export) invece del solo TUI — tipicamente per documentazione, notebook literate, o chi viene da Jupyter/Notion.
**No** se: ami il TUI minimale di pi, non ti serve un browser, o la superficie (server web + CDN + 9MB) ti preoccupa.
