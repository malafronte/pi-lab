# pi-test

Progetto di test per pi (coding agent) con documentazione di riferimento e un'estensione di **plan mode**.

## Contenuto

| Percorso | Descrizione |
|----------|-------------|
| `.pi/extensions/plan-mode/` | Estensione **plan mode** (sola lettura + tracking del piano). Scoperta automaticamente da pi. |
| `.mcp.json` | Configurazione del server MCP **Google Stitch** via **proxy locale** (workaround per i `$ref` non risolvibili). Richiede `STITCH_API_KEY` + proxy attivo. |
| `.pi/stitch-proxy/` | Proxy Node.js (e `start-pi.ps1`) che ripulisce gli schema MCP di Stitch rendendoli usabili da pi. Condiviso con OpenCode. |
| `pi-mcp-guida.md` | **Riferimento completo MCP in pi**: installazione, **tutti i comandi** (slash + tool proxy `mcp`), **tutte le opzioni** dei server (stdio/remoto/OAuth/bearer/lifecycle/directTools…), file di config, esempi, **workaround Stitch**, risoluzione problemi. |
| `pi-stitch-proxy-guida.md` | Dettagli del **proxy locale** per Stitch (schema non conforme): diagnostica, funzionamento del proxy, avvio, uso, ripristino connessione diretta. |
| `pi-mcp-audit.md` | **Audit di sicurezza statico** di `pi-mcp-adapter` v2.10.0: superfici esaminate, punti di forza, debolezze, flusso della API key, limiti dell'audit, raccomandazioni. |
| `pi-extensions-guide.md` | Guida in italiano alle estensioni di pi. |
| `pi-packages-guide.md` | Guida in italiano ai pi packages. |
| `pi-ambiente-guida.md` | Ambiente di esecuzione dell'agente e interazione TUI: accesso a internet, risoluzione dello shell, quale `curl` viene usato, scroll del buffer. |
| `pi-plan-mode-confronto.md` | **Confronto a tre** estensioni di plan mode: nostra implementazione locale, `@narumitw/pi-plan-mode`, `@2008muyu/pi-plan` + `questionnaire`. Con guida dettagliata all'**uso sicuro** della combinazione 2008muyu + questionnaire (installazione, blacklist dei tool mutanti, bashSafetyMode, workflow con esempi). |
| `pi-gotgenes-packages-guida.md` | Valutazione e guida d'uso degli **8 pacchetti** del monorepo `gotgenes/pi-packages` (subagents, permission-system, nocd, session-tools, autoformat, github-tools, colgrep, subagents-worktrees): considerazioni, come installarli, scheda per ciascuno con scopo/comandi/esempi. Include il **confronto pi-permission-system ↔ OpenCode** (cosa è identico, differenze, porting). |
| `pi-pacchetti-analisi/` | **Analisi di 7 pacchetti** (`pi-lens`, `pi-web-access`, `@juicesharp/rpiv-todo`, `pi-studio`, `pi-powerline-footer`, `pi-mono-status-line`, `@spences10/pi-themes`): un markdown per ciascuno + un documento di **raccomandazioni** con incompatibilità/redundanze e profili di configurazione consigliati. |

## Plan Mode

pi non include un plan mode nativo (per scelta progettuale), ma è progettato per aggiungerlo tramite un'**estensione**. Questo progetto fornisce un'estensione project-local che riproduce l'implementazione di riferimento ufficiale di pi.

Dettagli d'uso: [`.pi/extensions/plan-mode/README.md`](.pi/extensions/plan-mode/README.md).

### Avvio rapido

```bash
# Dalla root del progetto (l'estensione in .pi/extensions viene scoperta automaticamente)
pi              # poi /plan per attivare, oppure Ctrl+Alt+P
pi --plan       # avvia direttamente in plan mode
```

Al primo avvio pi chiede di **fidarsi del progetto** perché sono presenti risorse in `.pi`.

### Comandi

| Comando / tasto | Azione |
|-----------------|--------|
| `/plan` | Attiva/disattiva plan mode |
| `/todos` | Mostra il progresso del piano |
| `Ctrl+Alt+P` | Attiva/disattiva plan mode |

### Flusso

1. Attiva plan mode (`/plan`) → i tool di scrittura vengono disattivati e bash è ristretta a una allowlist in sola lettura.
2. Chiedi all'agente di analizzare e produrre un piano numerato sotto `Plan:`.
3. Scegli **"Execute the plan"** per eseguirlo; l'agente marca i passi con `[DONE:n]` e il widget mostra l'avanzamento.

## Installare il plan mode a livello globale

Per abilitarlo in **tutti** i progetti riutilizzando questi stessi file (è autosufficiente e portabile, verificato sul codice), vedi la sezione [Installazione a livello globale](.pi/extensions/plan-mode/README.md#installazione-a-livello-globale) nel README dell'estensione.

In sintesi:

```bash
mkdir -p ~/.pi/agent/extensions
cp -r .pi/extensions/plan-mode ~/.pi/agent/extensions/
```

Attenzione a **non** tenerla in entrambi i posti (globale + project-local), altrimenti i comandi vengono duplicati (`/plan:1`, `/plan:2`, …).

## MCP / Google Stitch

Stitch **non è direttamente usabile** con pi: i suoi JSON Schema contengono `$ref` cross-referenziati non risolvibili che fanno fallire la validazione dell'SDK MCP (`can't resolve reference #/$defs/ScreenInstance from id #`). Soluzione: un **proxy locale** (già usato con OpenCode) che rimuove i `$ref` problematici. Verificato end-to-end (connect + listTools + `list_projects` OK).

- **Procedura e diagnostica complete:** [`pi-stitch-proxy-guida.md`](pi-stitch-proxy-guida.md) (e [`pi-mcp-guida.md`](pi-mcp-guida.md) per la configurazione di base).

**Avvio rapido** (dopo aver impostato `STITCH_API_KEY`):

```powershell
# avvia proxy + pi insieme
powershell -File .\.pi\stitch-proxy\start-pi.ps1
```

Poi `/mcp` in pi: il server `stitch` dovrebbe risultare connesso. Senza il proxy attivo, Stitch non si connette (workaround necessario finché Stitch/l'SDK non correggono gli schema).
