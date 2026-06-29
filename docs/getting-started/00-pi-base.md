# pi base — partenza da un'installazione pulita

> Punto di partenza della documentazione: cos'è pi appena installato, dove vivono i file di configurazione e come si attivano le estensioni/pacchetti. Tutte le pagine successive descrivono le parti **aggiunte** a questa base.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Progetto | pi (coding agent) |
| Repository | <https://github.com/earendil-works/pi-coding-agent> (monorepo `@earendil-works/pi-mono`) |
| Sito | <https://pi.dev> |
| Documentazione | docs ufficiali nel pacchetto `@earendil-works/pi-coding-agent/docs` |

## Installazione di pi

pi si installa come applicazione Node.js. Dopo l'installazione, l'agente è immediatamente usabile con i tool built-in (`read`, `write`, `edit`, `bash`) e i comandi slash di base, **senza** estensioni aggiuntive.

> Pi core **non** include un plan mode nativo (per scelta progettuale): è progettato per aggiungerlo tramite estensione (vedi [`docs/pacchetti-npm/pi-plan-mode.md`](../pacchetti-npm/pi-plan-mode.md)).

## File di configurazione (directory utente)

Tutta la configurazione utente vive in `~/.pi/agent/` (su Windows: `%USERPROFILE%\.pi\agent\`):

| File/Dir | Contenuto | Pagina |
| --- | --- | --- |
| `settings.json` | packages, theme, provider/modello default, thinking | [`config/settings.md`](../config/settings.md) |
| `models.json` | provider e modelli custom (inclusi vision) | [`config/models.md`](../config/models.md) |
| `auth.json` | credenziali dei provider (API key) | — (segnaposto, mai esposte) |
| `vision-tool.json` | config del tool `describe_image` | [`config/vision-tool.md`](../config/vision-tool.md) |
| `mcp-onboarding.json` | stato onboarding/discovery MCP | [`config/mcp-onboarding.md`](../config/mcp-onboarding.md) |
| `extensions/` | estensioni globali (es. `pi-permission-system/`) | [`extensions/`](../estensioni-locali/) |
| `npm/` | `node_modules` delle dipendenze dei pacchetti (`package.json` + `package-lock.json`) | [`config/settings.md`](../config/settings.md) |
| `sessions/`, `run-history.jsonl`, `trust.json`, `mcp-oauth/` | stato runtime | — |

## File di configurazione (directory progetto)

A livello progetto, pi legge:

| File | Contenuto | Pagina |
| --- | --- | --- |
| `.mcp.json` | server MCP di progetto (condivisibile col team) | [`packages/pi-mcp-adapter.md`](../pacchetti-npm/pi-mcp-adapter.md) |
| `.pi/extensions/<nome>/index.ts` | estensioni project-local (scoperte automaticamente) | [`extensions/pi-fixmd.md`](../estensioni-locali/pi-fixmd.md) |
| `.pi/config/<pkg>/config.json` | config package-scoped (es. `pi-agent-browser-native`) | [`packages/pi-agent-browser-native.md`](../pacchetti-npm/pi-agent-browser-native.md) |
| `AGENTS.md` | istruzioni di progetto per l'agente | — |

## Come si attiva un'estensione/pacchetto

1. **Pacchetto npm**: aggiungilo a `~/.pi/agent/settings.json` → `packages` (es. `"npm:pi-lens"`) e installa le dipendenze in `~/.pi/agent/npm` (`npm install <pkg>`) oppure usa `pi install npm:<pkg>`.
2. **Estensione globale**: copiala/creala in `~/.pi/agent/extensions/<nome>/` (pi la carica all'avvio).
3. **Estensione project-local**: creala in `<cwd>/.pi/extensions/<nome>/index.ts` (scoperta automaticamente).
4. **Fiducia del progetto**: al primo avvio con risorse in `.pi`, pi chiede di fidarsi del progetto (Pi 0.79+).

## Uso di base

```bash
pi              # avvia la TUI nella cartella corrente
pi -c           # riprende l'ultima sessione
pi --model <id> # avvia con un modello specifico
pi --plan       # avvia in plan mode (richiede estensione plan-mode)
```

## Esempi

### Esempio 1 — stato base (nessun pacchetto)

```jsonc
// ~/.pi/agent/settings.json
{ "packages": [], "theme": "dark", "defaultProvider": "<DEFAULT>", "defaultModel": "<MODEL>" }
```

### Esempio 2 — primo pacchetto aggiunto

```bash
pi install npm:pi-lens
# → aggiunge "npm:pi-lens" a settings.json packages e installa in ~/.pi/agent/npm
```

Da qui, ogni pagina in [`docs/pacchetti-npm/`](../pacchetti-npm/) descrive un componente aggiunto a questa base.
