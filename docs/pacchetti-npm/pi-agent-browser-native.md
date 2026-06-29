# pi-agent-browser-native — automazione browser come tool nativo

> Estensione pi che espone `agent_browser` come tool nativo, permettendo all'agente di guidare sessioni browser reali (aprire pagine, ispezionare, cliccare, compilare form, screenshot, download, profili persistenti, app autenticate) senza ricorrere a comandi shell fragili.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-agent-browser-native` |
| Repository | <https://github.com/fitchmultz/pi-agent-browser-native> |
| Documentazione | <https://github.com/fitchmultz/pi-agent-browser-native#readme> (più `docs/COMMAND_REFERENCE.md`, `docs/TOOL_CONTRACT.md`, `docs/ARCHITECTURE.md`, `docs/ELECTRON.md`) |
| Licenza | MIT |

## Installazione

Partendo da un pi appena installato:

```bash
# 1) dipendenza upstream obbligatoria (motore browser): installa agent-browser e mettilo su PATH
#    vedi https://agent-browser.dev/ e https://github.com/vercel-labs/agent-browser

# 2) installa il pacchetto pi
pi install npm:pi-agent-browser-native

# 3) health check di installazione/upgrade/debug
pi-agent-browser-doctor
```

Dipendenze esterne opzionali che sbloccano parte della superficie:

| Dipendenza | Richiesta per | Note |
| --- | --- | --- |
| `agent-browser` (upstream) | tutta l'automazione browser | su `PATH` |
| `ffmpeg` | `record stop` (encoding WebM dopo `record start`/`record restart`) | su `PATH` |

> **Prova isolata** senza toccare le estensioni configurate: `pi --no-extensions -e npm:pi-agent-browser-native`.

## Configurazione

Il pacchetto legge config opzionale sotto percorsi pi-scoped:

- globale: `~/.pi/config/pi-agent-browser-native/config.json`
- progetto: `.pi/config/pi-agent-browser-native/config.json`
- override esplicito: `PI_AGENT_BROWSER_CONFIG=/path/to/config.json`

Merge: globale → progetto → override `PI_AGENT_BROWSER_CONFIG`. Esempio per il companion tool `agent_browser_web_search` (Exa o Brave), con **segnaposto semantici**:

```jsonc
// ~/.pi/config/pi-agent-browser-native/config.json
{
  "version": 1,
  "webSearch": {
    "enabled": true,
    "preferredProvider": "exa",            // "exa" (default) oppure "brave"
    "exaApiKey": "$EXA_API_KEY",           // riferimento a variabile d'ambiente
    "braveApiKey": "$BRAVE_API_KEY"
  }
}
```

> Le chiavi possono essere riferimenti a env-var (`$VAR`), comando secret-manager (`!command`) o valore plaintext (l'output resta redatto). **Mai hardcodare segreti reali**: usa variabili d'ambiente o un secret manager.

Si può anche configurare un hint di profilo o un eseguibile Chromium-compatibile:

```jsonc
{
  "version": 1,
  "browser": {
    "profile": "Profile 1",                 // hint per task autenticati
    "executablePath": "/percorso/del/browser/chromium-compatibile"
  }
}
```

## Uso

Il tool nativo `agent_browser` accetta **una sola** modalità di input per chiamata: `args`, `semanticAction`, `job`, `qa`, `sourceLookup`, `networkSourceLookup` o `electron`.

- **`args`**: copertura 1:1 del CLI upstream (NON passare `--json`: lo inietta il wrapper).
- **`semanticAction`**: scorciatoia per `find`/click/fill/select su locator stabili (text, role, label, placeholder, testid, title, alt).
- **`job`**: workflow multi-step vincolati (`open`, `click`, `fill`, `type`, `select`, `wait`, `assertText`, `assertUrl`, `waitForDownload`, `screenshot`, `snapshot`).
- **`qa`**: preset di smoke/QA leggero (con o senza URL).
- **`electron`**: app desktop Electron (`list`/`launch`/`status`/`probe`/`cleanup`).

Ricetta prima-chiamata: `open` → `snapshot -i` → interagisci con i `@eN` ref → `snapshot -i` dopo ogni navigazione. I ref `@eN` **non vanno riusati** attraverso navigazioni (stale-ref): riesegui `snapshot -i`.

## Esempi

### Esempio 1 — aprire e ispezionare una pagina

```json
{ "args": ["open", "https://example.com"] }
{ "args": ["snapshot", "-i"] }
```

### Esempio 2 — click su un ref visibile, poi refresh dei ref

```json
{ "args": ["click", "@e2"] }
{ "args": ["snapshot", "-i"] }
```

### Esempio 3 — locator stabile via `semanticAction` (role/name)

```json
{ "semanticAction": { "action": "click", "locator": "role", "role": "button", "name": "Continue without Signing In" } }
```

### Esempio 4 — job multi-step con asserzioni

```json
{
  "job": {
    "steps": [
      { "action": "open", "url": "https://shop.example/checkout" },
      { "action": "fill", "selector": "#email", "text": "user@example.com" },
      { "action": "click", "selector": "#continue" },
      { "action": "assertUrl", "url": "**/shipping" },
      { "action": "assertText", "text": "Shipping address" },
      { "action": "screenshot", "path": ".dogfood/shipping.png" }
    ]
  }
}
```

### Esempio 5 — `eval` via `stdin` (valore ritornato come espressione)

```json
{ "args": ["eval", "--stdin"], "stdin": "({ title: document.title, url: location.href })" }
```

### Esempio 6 — salvare un profilo auth senza mettere la password in `args`

```json
{ "args": ["auth", "save", "demo", "--password-stdin"], "stdin": "<PASSWORD>" }
```

> **Companion `agent_browser_web_search`**: disponibile quando è configurata una credenziale Exa o Brave. Non è una modalità di `agent_browser` e non lancia browser: usalo per informazioni web live, e usa `agent_browser` quando serve interazione con la pagina, screenshot o contenuti autenticati.

Per il dettaglio completo dei comandi e del contract dei risultati vedi [`docs/COMMAND_REFERENCE.md`](https://github.com/fitchmultz/pi-agent-browser-native/blob/main/docs/COMMAND_REFERENCE.md) e [`docs/TOOL_CONTRACT.md`](https://github.com/fitchmultz/pi-agent-browser-native/blob/main/docs/TOOL_CONTRACT.md) nel repo ufficiale.
