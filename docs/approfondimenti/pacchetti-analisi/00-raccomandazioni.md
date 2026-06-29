# Raccomandazioni: configurazioni e compatibilità

> Sintesi delle analisi dei 7 pacchetti (`pi-lens`, `pi-web-access`, `@juicesharp/rpiv-todo`, `pi-studio`, `pi-powerline-footer`, `pi-mono-status-line`, `@spences10/pi-themes`) con **incompatibilità/redundanze** e **configurazioni raccomandate** per pi 0.79.10.

## Indice

1. [Incompatibilità e conflitti (da evitare)](#1-incompatibilità-e-conflitti-da-evitare)
2. [Redondanze (scegliere uno)](#2-redundanze-scegliere-uno)
3. [Matrice di compatibilità](#3-matrice-di-compatibilità)
4. [Configurazioni raccomandate (profili)](#4-configurazioni-raccomandate-profili)
5. [Considerazioni di sicurezza riassuntive](#5-considerazioni-di-sicurezza-riassuntive)
6. [Decisione rapida](#6-decisione-rapida)

---

## 1. Incompatibilità e conflitti (da evitare)

Verificati nel codice/metadati:

### 1.1 🚫 `pi-powerline-footer` ↔ pi 0.79.10 (incompatibilità di versione)

- **Peer dep**: `@earendil-works/pi-coding-agent >=0.74.0 <0.77.0` (e stesso range per pi-tui, pi-ai)
- **Il tuo pi**: 0.79.10 → **ESCLUSO** dal range `<0.77.0`
- npm installa comunque (con warning peer dep), ma a runtime può rompersi (API cambiate 0.76→0.79)
- **Verdetto**: non installare con pi 0.79.10. Se vuoi uno status bar powerline, aspetta un update dell'autore o cerca un fork compatibile.

### 1.2 ⚠️ `pi-mono-status-line` ↔ `pi-powerline-footer` (conflitto footer)

- Entrambi chiamano `ctx.ui.setFooter()`, che **sostituisce** il footer
- Solo un'estensione può "possedere" il footer: l'ultima caricata vince, o si sovrascrivono a vicenda
- **Verdetto**: scegline **uno solo**. (Comunque `pi-powerline-footer` è già escluso da 1.1, quindi su pi 0.79.10 la scelta cade su `pi-mono-status-line`.)

### 1.3 ⚠️ `@juicesharp/rpiv-todo` ↔ nostra `plan-mode` locale (conflitto comando `/todos`)

- La nostra estensione `.pi/extensions/plan-mode/index.ts` registrava `/todos` (riga 149) — **nota**: l'estensione locale è stata **rimossa**; il plan mode è ora fornito dal pacchetto `@narumitw/pi-plan-mode` (vedi [`docs/pacchetti-npm/pi-plan-mode.md`](../../pacchetti-npm/pi-plan-mode.md))
- `rpiv-todo` registra anch'essa il comando `/todos` (`COMMAND_NAME = "todos"`)
- pi li rinominerebbe in `/todos:1` e `/todos:2` (comportamento documentato di pi)
- **Verdetto**: non installare `rpiv-todo` **finché** tieni la nostra plan-mode. Oppure: se vuoi `rpiv-todo`, disabilita/rimuovi la nostra plan-mode (o uno dei due `/todos` diventa ambiguo).

## 2. Redondanze (scegliere uno)

Non sono conflitti tecnici, ma **sovrapposizioni funzionali** — installare entrambi è inutile o confuso:

### 2.1 Auto-formattazione: `pi-lens` ↔ `pi-autoformat` (gotgenes)

- `pi-lens` formatta su write/edit come parte della sua pipeline (Biome/Ruff/ESLint/stylelint/sqlfluff/RuboCop + secret scan + LSP)
- `pi-autoformat` (del monorepo gotgenes, analizzato in precedenza) fa solo formattazione su write/edit
- **Verdetto**: se installi `pi-lens`, **non** installare `pi-autoformat` (ridondanza + possibili doppi format). `pi-lens` è il soprammobile.

### 2.2 Web search/access: `pi-web-access` ↔ server MCP di search (via `pi-mcp-adapter`)

- `pi-web-access` offre search + fetch + PDF + video
- Un server MCP di search (Firecrawl, Exa MCP) via `pi-mcp-adapter` copre in parte la stessa superficie
- Nota: `pi-web-access` **usa già Exa MCP zero-config** internamente — se hai anche `pi-mcp-adapter` con Exa configurato, hai **doppione**
- **Verdetto**: scegli un approccio per il web. `pi-web-access` è più completo (PDF, video, GitHub clone, fallback chain); MCP search è più componibile con altre integrazioni. **Non entrambi** per la stessa funzione.

### 2.3 Todo/plan tracking: `rpiv-todo` ↔ plan-mode con todo (nostra / 2008muyu)

- Tre modi di tracciare task: `rpiv-todo` (todo overlay persistente), la nostra plan-mode (todo + execution mode), `@2008muyu/pi-plan` (task tracking su disco)
- **Verdetto**: un solo sistema di tracking. Mescolarli confonde il modello.

### 2.4 Temi: `@spences10/pi-themes` ↔ temi inclusi in altri pacchetti

- `pi-studio` porta `pi-studio-dark`/`pi-studio-light`
- Altri pacchetti possono includere temi propri
- **Non è un conflitto**: i temi si **sommano** in `/settings`. Ma se non usi pi-studio, i suoi temi non si attivano. `pi-themes` è complementare, non ridondante.

## 3. Matrice di compatibilità

Su **pi 0.79.10** (con la nostra configurazione attuale: plan-mode locale + pi-mcp-adapter + Stitch proxy):

| Pacchetto | Compatibile 0.79.10 | Conflitto con nostro setup | Superficie sicurezza |
| --- | :-: | --- | :-: |
| **pi-lens** | ✅ | auto-format overlap con pi-autoformat (se installato) | 🟡 alta (auto-install 22 tool) |
| **pi-web-access** | ✅ | overlap con MCP search (pi-mcp-adapter+Exa) | 🟡 media (rete, SSRF ok) |
| **rpiv-todo** | ✅ | ⚠️ comando `/todos` vs nostra plan-mode | 🟢 bassa (nessuna) |
| **pi-studio** | ✅ | nessuno (cambia UX) | 🟡 media (server web + CDN) |
| **pi-powerline-footer** | ❌ peer dep | n/a | n/a |
| **pi-mono-status-line** | ✅ | footer (solo se hai altro footer ext) | 🟢 basic / 🟡 expert (polling API) |
| **@spences10/pi-themes** | ✅ | nessuno (ortogonale) | 🟢 nulla (solo asset) |

Legenda superficie: 🟢 minima · 🟡 media/alta · 🔴 critica (nessuna qui).

## 4. Configurazioni raccomandate (profili)

Quattro profili, dal più leggero al più "takeover". Ogni profilo è **internamente coerente** (nessun conflitto/redundanza). Installa i pacchetti di un profilo, configura come indicato.

### Profilo A — "Estetica e minimo" (più sicuro, leggero)

Per chi vuole solo migliorare l'aspetto e avere info utili in footer, zero superficie.

```bash
pi install npm:@spences10/pi-themes
pi install npm:pi-mono-status-line
```

Config:

```jsonc
// ~/.pi/agent/settings.json
{ "theme": "tokyo-night", "packages": ["npm:@spences10/pi-themes", "npm:pi-mono-status-line"] }

// ~/.pi/agent/status-line.json
{ "mode": "basic" }   // zero polling rete
```

**Perché**: pi-themes è solo asset (sicurezza nulla), pi-mono-status-line basic non fa rete. Costo totale: ~zero superficie. Ideale se non vuoi pensare alla sicurezza.

### Profilo B — "Sviluppo equilibrato" (raccomandato)

Aggiunge produttività senza takeover: feedback codice + footer informativo + tema.

```bash
pi install npm:@spences10/pi-themes
pi install npm:pi-mono-status-line
pi install npm:pi-lens
```

⚠️ **Pre-requisito di coerenza**: se usi questo profilo, **rimuovi** `pi-autoformat` se lo avevi (ridondanza 2.1). Non installare altri status-bar.

Config:

```jsonc
// ~/.pi/agent/settings.json
{ "theme": "catppuccin-mocha", "packages": ["npm:@spences10/pi-themes", "npm:pi-mono-status-line", "npm:pi-lens"] }
// ~/.pi/agent/status-line.json
{ "mode": "expert" }   // se sei su subscription e vuoi le quote; altrimenti "basic"
```

**Accetta**: pi-lens auto-installa 22 tool linter globalmente (superficie). Se ti va bene, è il profilo più produttivo.

### Profilo C — "Sviluppo + web" (ricerca e fetch)

Profilo B + capacità web.

```bash
pi install npm:@spences10/pi-themes
pi install npm:pi-mono-status-line
pi install npm:pi-lens
pi install npm:pi-web-access
```

⚠️ **Coerenza**: non configurare anche un server MCP di search via pi-mcp-adapter (redundanza 2.2). `pi-web-access` copre search+fetch+PDF+video. Mantieni pi-mcp-adapter solo per Stitch (caso d'uso diverso).

Config web access in `~/.pi/web-search.json` (opzionale — Exa zero-config funziona senza):

```json
{ "exaApiKey": "exa-..." }
```

### Profilo D — "Workspace notebook" (takeover UX)

Per chi vuole un postazione browser con preview/REPL/annotation invece del solo TUI.

```bash
pi install npm:@spences10/pi-themes
pi install npm:pi-studio
```

**Accetta**: pi-studio cambia radicalmente la UX (server web locale + CDN + 9MB). Ideale per documentazione, notebook literate, chi viene da Jupyter.
**Combinazione con pi-lens**: possibile (pi-lens feedback + pi-studio workspace) ma pesante; valuta se ti serve entrambi.

## 5. Considerazioni di sicurezza riassuntive

Ordinati dal più sicuro al più "esposto":

| Pacchetto | Superficie | Note |
| --- | --- | --- |
| `@spences10/pi-themes` | 🟢 nulla | solo asset statici |
| `rpiv-todo` | 🟢 nulla | nessun exec/rete/server |
| `pi-mono-status-line` (basic) | 🟢 nulla | solo stats locali |
| `pi-mono-status-line` (expert) | 🟡 rete | polling API provider ogni 5 min (oauth) |
| `pi-powerline-footer` | 🟡 exec | git + bash session — ma **incompatibile con 0.79.10** |
| `pi-web-access` | 🟡 rete+exec | search/fetch su rete, git clone, chrome cookies (opt-in); SSRF protection presente |
| `pi-studio` | 🟡 rete+exec | server web locale + CDN browser + tmux |
| `pi-lens` | 🔴 alta | auto-install globale di 22 tool, MCP server interno, LSP client, codice bundled |

**Raccomandazione generale**: per i pacchetti con superficie 🟡/🔴, prima di fidarti fai un **audit statico del tarball** (come già fatto per `pi-mcp-adapter`), specialmente per `pi-lens` (codice bundled, auto-install) e `pi-studio` (server web). `pi-themes`, `rpiv-todo`, `pi-mono-status-line basic` sono sicuri a priori.

## 6. Decisione rapida

| Vuoi... | Installa |
| --- | --- |
| Solo migliorare l'estetica, zero rischio | **pi-themes** |
| Footer più ricco (git/costo/context) | **pi-mono-status-line** (mode: basic o expert) |
| Feedback codice in tempo reale (IDE-like) | **pi-lens** (+ rimuovi pi-autoformat) |
| Web search/fetch/PDF/video per l'agente | **pi-web-access** (non usare anche MCP search) |
| Todo list persistente per il modello | **rpiv-todo** (⚠️ disabilita la nostra plan-mode prima) |
| Workspace browser con preview/REPL | **pi-studio** |
| Status bar powerline | ❌ **pi-powerline-footer** incompatibile con 0.79.10 |

### Setup consigliato "definitivo" (se dovessi sceglierne uno)

Per un utente che sviluppa seriamente su pi 0.79.10 senza takeover UX eccessivo:

```jsonc
// ~/.pi/agent/settings.json
{
  "theme": "tokyo-night",
  "packages": [
    "npm:@spences10/pi-themes",
    "npm:pi-mono-status-line",
    "npm:pi-lens",
    "npm:pi-web-access"
  ]
}
// ~/.pi/agent/status-line.json
{ "mode": "basic" }
```

Mantieni il tuo setup MCP (pi-mcp-adapter + Stitch proxy) e la tua plan-mode locale. **Non** installare: pi-powerline-footer (incompatibile), pi-autoformat (ridondante con pi-lens), rpiv-todo (conflitto /todos con la tua plan-mode), altri footer ext.

---

## Trasparenza sul metodo

- Tutte le affermazioni (feature, comandi, sicurezza, conflitti) sono **verificate sul codice dei tarball** scaricati dal registry npm + README + metadati.
- **Conflitti confermati nel codice**: `/todos` (grep su `registerCommand`/`COMMAND_NAME`), footer (`ctx.ui.setFooter()`), peer dep `<0.77.0` (metadato npm).
- **Nessun pacchetto installato né testato a runtime** in questa analisi. Comportamento reale (stabilità, UX, effettiva bontà dei linter auto-installati da pi-lens, qualità preview di pi-studio) non verificato empiricamente.
- I profili sono **costruiti per coerenza interna** (niente conflitti/redundanze), ma la scelta finale dipende dal tuo workflow — sono indicazioni, non verità assolute.
- Pi-lens ha codice **bundlato** (`./dist/index.js`): l'analisi di sicurezza su di esso è meno approfondita di quella su pacchetti con sorgente `.ts` leggibile. Prima di installarlo davvero, raccomando un audit mirato.
