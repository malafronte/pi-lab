# Guida: usare server MCP in pi

> Riferimento completo per abilitare e usare server MCP (Model Context Protocol) in pi tramite il pacchetto `pi-mcp-adapter`. Include l'installazione, **tutti i comandi**, **tutte le opzioni di configurazione** dei server (stdio, remoto, OAuth, bearer, lifecycle, directTools…) e il **workaround per Google Stitch**.

**Versioni di riferimento:** pi 0.79.10, `pi-mcp-adapter` 2.10.0, `@modelcontextprotocol/sdk` 1.29.0. Tutti i comandi e le opzioni elencati sono verificati sul codice installato (`~/.pi/agent/npm/node_modules/pi-mcp-adapter`).

## Indice

1. [Perché serve un adattatore](#1-perché-serve-un-adattatore)
2. [Installazione](#2-installazione)
3. [Comandi slash](#3-comandi-slash)
4. [Il tool proxy `mcp({...})`](#4-il-tool-proxy-mcp)
5. [Tipi di server e opzioni](#5-tipi-di-server-e-opzioni)
6. [File di configurazione e precedenza](#6-file-di-configurazione-e-precedenza)
7. [Esempi completi di configurazione](#7-esempi-completi-di-configurazione)
8. [Workaround: Google Stitch (schema non conforme)](#8-workaround-google-stitch-schema-non-conforme)
9. [Disconnettere / lifecycle del server](#9-disconnettere--lifecycle-del-server)
10. [Verifica e risoluzione problemi](#10-verifica-e-risoluzione-problemi)
11. [Stato di verifica](#11-stato-di-verifica)

---

## 1. Perché serve un adattatore

pi **non ha MCP nativo**, per scelta di design esplicita (README sezione *Philosophy*: *«No MCP»*). Quindi non esiste un blocco `mcp` nelle impostazioni di pi: per usare un server MCP si installa un pacchetto che fa da ponte. Qui usiamo `pi-mcp-adapter`, che espone **un singolo tool proxy** `mcp(...)` (~200 token) invece di registrare tutte le definizioni dei tool del server: l'agente scopre i tool on-demand, risparmiando la context window.

## 2. Installazione

```bash
pi install npm:pi-mcp-adapter     # installazione globale (~/.pi/agent/npm/)
```

Riavvia pi (richiesto una tantum). Verifica:

```bash
pi list                            # deve elencare: npm:pi-mcp-adapter
```

Il pacchetto viene registrato in `~/.pi/agent/settings.json` → `"packages": ["npm:pi-mcp-adapter"]`. Per rimuoverlo: `pi remove npm:pi-mcp-adapter`.

## 3. Comandi slash

Registrati dall'adattatore (verificati in `index.ts`):

| Comando | Descrizione |
| --- | --- |
| `/mcp` | Apre il pannello di stato dei server (UI interattiva: elenco server, connessione, gestione). Equivale a `/mcp status`. |
| `/mcp status` | Come sopra. In modalità non-UI mostra lo stato testuale. |
| `/mcp reconnect <server>` | Riconnette un server (utile dopo un timeout/idle o un errore). |
| `/mcp tools` | Mostra i tool di tutti i server. |
| `/mcp setup` | Wizard: importa configurazioni MCP da altri host (Cursor, Claude Code, Codex, Windsurf, VS Code), crea uno scaffolding `.mcp.json`, o ispeziona cosa è stato trovato. Mostra le modifiche esatte prima di scriverle. |
| `/mcp logout <server>` | Rimuove le credenziali salvate di un server (es. per rifare OAuth). |
| `/mcp-auth` | Pannello di autenticazione OAuth (scegli il server). |
| `/mcp-auth <server>` | Avvia direttamente il flusso OAuth per quel server. |

`/mcp setup` è la via più rapida se hai già configurazioni MCP per altri tool.

## 4. Il tool proxy `mcp({...})`

È il tool principale che l'agente (o tu) usate per scoprire e invocare i tool dei server MCP. Parametri verificati in `index.ts` (riga ~250):

| Parametro | Tipo | Cosa fa |
| --- | --- | --- |
| `connect` | `string` | Connette un server (connessione lazy + refresh metadati). |
| `server` | `string` | Filtra su un server specifico; disambigua anche le chiamate ai tool. |
| `search` | `string` | Cerca tool per nome/descrizione (sottostringa). |
| `regex` | `boolean` | Tratta `search` come regex (default: false). |
| `includeSchemas` | `boolean` | Include gli schema dei parametri nei risultati di `search` (default: true). |
| `describe` | `string` | Mostra parametri e descrizione di un tool. |
| `tool` | `string` | Nome del tool da invocare. |
| `args` | `string` | **Argomenti come stringa JSON** (es. `'{\"key\":\"value\"}'`). Non un oggetto. |
| `action` | `string` | Azioni speciali: `ui-messages`, `auth-start`, `auth-complete`. |

### Esempi

```text
# scoprire i tool
mcp({ search: "" })                          # elenca tutti i tool di tutti i server
mcp({ server: "stitch", search: "" })        # elenca i tool di un server
mcp({ search: "design", regex: false })      # ricerca testuale
mcp({ describe: "stitch_create_project" })   # parametri di un tool

# connettere / stato
mcp({ connect: "stitch" })                   # connette un server lazy

# invocare un tool
mcp({ tool: "stitch_list_projects", args: '{}' })
mcp({ tool: "stitch_create_project", args: '{"projectName":"Demo"}' })
mcp({ server: "stitch", tool: "list_projects", args: '{}' })   # nome senza prefisso

# azioni speciali
mcp({ action: "auth-start", server: "linear-server" })        # OAuth (URL nel risultato)
mcp({ action: "auth-complete", server: "linear-server",
      args: '{"redirectUrl":"http://localhost:19876/callback?code=...&state=..."}' })
mcp({ action: "ui-messages" })               # messaggi di sessione UI
```

> **In pratica** non serve digitare `mcp({...})` a mano: basta chiedere all'agente in linguaggio naturale (*«usa Stitch per elencare i progetti»*) e lui usa il proxy. Il formato esplicito è utile per debug o per forzare una chiamata.

## 5. Tipi di server e opzioni

Le opzioni di ogni server sono definite in `ServerEntry` (`types.ts`). Il tipo di transport è **dedotto**: se c'è `command` è **stdio**, se c'è `url` è **remoto (HTTP)**.

### Server stdio (locale, via `command`)

```json
"mio-server": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest"],
  "env": { "API_TOKEN": "${MIO_TOKEN}" },
  "cwd": "/percorso/opzionale",
  "lifecycle": "lazy"
}
```

| Campo | Descrizione |
| --- | --- |
| `command` | Eseguibile del transport stdio (es. `npx`, `node`, un path). |
| `args` | Argomenti del comando. |
| `env` | Variabili d'ambiente; supporta interpolazione `${VAR}` e `$env:VAR`. |
| `cwd` | Directory di lavoro; supporta `${VAR}`, `$env:VAR`, `~`. |

⚠️ **Sicurezza:** un server stdio **esegue codice** con i tuoi permessi. Rivedi sempre il sorgente del package prima di metterlo in `command`.

### Server remoto (HTTP, via `url`)

```json
"mio-server-remoto": {
  "url": "https://api.esempio.com/mcp",
  "headers": { "Authorization": "Bearer ${MIO_TOKEN}" },
  "lifecycle": "lazy"
}
```

| Campo | Descrizione |
| --- | --- |
| `url` | Endpoint HTTP (transport StreamableHTTP con fallback SSE). |
| `headers` | Header HTTP; supporta `${VAR}` e `$env:VAR`. |

### Autenticazione

| Campo | Valori | Descrizione |
| --- | --- | --- |
| `auth` | `"oauth"` / `"bearer"` / `false` | Tipo di auth. Se omesso e c'è `url`, OAuth è auto-rilevato. |
| `bearerToken` | `string` | Token bearer statico (supporta `${VAR}`/`$env:VAR`). |
| `bearerTokenEnv` | `string` | Nome variabile d'ambiente con il token bearer. |
| `oauth` | `OAuthConfig` / `false` | Config OAuth. Se omesso: dynamic client registration. |

Sotto-chiavi di `oauth`: `grantType` (`"authorization_code"` default, o `"client_credentials"` per auth machine non-interattiva), `clientId`, `clientSecret`, `scope`, `redirectUri`, `clientName`, `clientUri`.

### Lifecycle e comportamento

| Campo | Descrizione |
| --- | --- |
| `lifecycle` | `"lazy"` (default: connette al primo uso, si disconnette dopo `idleTimeout`), `"eager"` (connette all'avvio, niente reconnect), `"keep-alive"` (connette all'avvio + reconnect automatico via health-check). |
| `idleTimeout` | Minuti di inattività prima della disconnessione (override del globale; `0` per disabilitare). |
| `directTools` | `true` (registra tutti i tool come tool pi diretti), `["tool_a","tool_b"]` (solo questi), o omesso/`false` (solo proxy). |
| `excludeTools` | `string[]` di nomi tool da nascondere (originale o prefissato). |
| `exposeResources` | Espone le risorse MCP come tool (default: true). |
| `debug` | Mostra lo stderr del server (default: false). |

### Settings globali (chiave `settings`, si applicano a tutti i server)

| Setting | Descrizione |
| --- | --- |
| `toolPrefix` | `"server"` (default), `"short"` (rimuove suffisso `-mcp`), `"none"`. |
| `idleTimeout` | Timeout idle globale in minuti (default 10). |
| `directTools` | Default globale per tutti i server (default false). Per-server vince. |
| `disableProxyTool` | Nasconde il tool proxy `mcp` quando i directTools sono disponibili da cache. |
| `autoAuth` | Esegue OAuth automaticamente su `connect`/chiamate quando serve (default false). |
| `sampling` | Permette ai server MCP di campionare via i modelli di pi (default true con approvazione UI). |
| `samplingAutoApprove` | Salta la conferma del sampling (richiesto in sessioni non-UI; default false). |
| `elicitation` | Permette ai server MCP di chiedere input via dialog pi (default true con UI). |

## 6. File di configurazione e precedenza

L'adattatore legge più file MCP. **Precedenza** (dalla documentazione ufficiale):

1. `~/.config/mcp/mcp.json` — config condivisa **globale** (multipiattaforma/multi-host)
2. `<Pi agent dir>/mcp.json` (`~/.pi/agent/mcp.json`) — override **globale** di pi
3. `.mcp.json` — config condivisa **di progetto** ← usata in questo progetto
4. `.pi/mcp.json` — override **di progetto** solo per pi

In questo progetto si usa `.mcp.json` (standard, condivisibile con altri tool). Per uso globale in tutti i progetti, usa `~/.config/mcp/mcp.json` o `~/.pi/agent/mcp.json`.

Le variabili d'ambiente vengono **interpolate** (`${VAR}` e `$env:VAR`) a runtime nei campi `headers`, `env`, `bearerToken`, `cwd`. Così i segreti non finiscono nei file.

## 7. Esempi completi di configurazione

### Server stdio (Chrome DevTools)

`.mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "lifecycle": "lazy"
    }
  }
}
```

### Server remoto con bearer token da variabile d'ambiente

```json
{
  "mcpServers": {
    "mio-api": {
      "url": "https://api.esempio.com/mcp",
      "bearerTokenEnv": "MIO_API_TOKEN"
    }
  }
}
```

### Server remoto con header custom (es. API key in header)

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "${STITCH_API_KEY}" },
      "lifecycle": "lazy"
    }
  }
}
```

### Direct tools (registra i tool direttamente nella lista di pi)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "directTools": ["search_repositories", "get_file_contents"]
    }
  }
}
```

### Settings globali + server

```json
{
  "settings": { "toolPrefix": "short", "idleTimeout": 15 },
  "mcpServers": { "mio-server": { "command": "node", "args": ["./server.js"] } }
}
```

## 8. Workaround: Google Stitch (schema non conforme)

**Problema (verificato):** il server MCP di Stitch espone 14 tool ma i loro JSON Schema contengono `$ref` cross-referenziati (es. `#/$defs/ScreenInstance`) non risolvibili dalla radice. L'SDK MCP ufficiale (`@modelcontextprotocol/sdk` 1.29.0) valida gli schema con **Ajv** in fase di `connect` e fallisce:

```text
can't resolve reference #/$defs/ScreenInstance from id #
```

Non è un problema di chiave/rete/protocollo (autenticazione e handshake funzionano). È un difetto di conformità degli schema di Stitch.

**Soluzione:** un **piccolo proxy Node.js locale** (`http://127.0.0.1:9020`) che inoltra tutto a Stitch e, solo nelle risposte `tools/list`, **rimuove i `$ref`** problematici. È lo stesso workaround già usato con OpenCode, riutilizzato tale e quale.

### Configurazione di pi (già attiva in questo progetto)

`.mcp.json` punta al proxy (non a Stitch diretto):

```json
{
  "mcpServers": {
    "stitch": {
      "url": "http://127.0.0.1:9020/mcp",
      "headers": { "X-Goog-Api-Key": "${STITCH_API_KEY}" },
      "lifecycle": "lazy"
    }
  }
}
```

### Avvio del proxy + pi

```powershell
# avvia proxy (se non attivo) + pi insieme
powershell -File .\.pi\stitch-proxy\start-pi.ps1
```

Oppure solo il proxy in background, poi pi a parte:

```powershell
Start-Process -WindowStyle Hidden -FilePath node `
  -ArgumentList "$env:USERPROFILE\source\repos\Test\pi-test\.pi\stitch-proxy\stitch-proxy.mjs"
```

**Senza il proxy attivo**, Stitch non si connette: avvia sempre il proxy prima di usare pi con Stitch.

### Procedura completa e dettagli

Tutta la diagnostica, il funzionamento del proxy, come fermarlo/verificarlo e come ripristinare la connessione diretta sono in [`pi-stitch-proxy-guida.md`](pi-stitch-proxy-guida.md). Audit di sicurezza del pacchetto in [`pi-mcp-audit.md`](pi-mcp-audit.md).

## 9. Disconnettere / lifecycle del server

### Non esiste un comando "disconnect"

La parola `disconnect` **non appare mai** nel pacchetto: non c'è né un sottocomando `/mcp disconnect`, né un'azione `mcp({ action: "disconnect" })`. Le uniche azioni utente sulla connessione sono `connect`, `reconnect`, `logout` (vedi §3 e §4).

### Con `lifecycle: lazy` (default, caso Stitch) la disconnessione è automatica

Un server in modalità `lazy` non è connesso in permanenza:

- si **connette** solo al primo uso di un suo tool;
- si **disconnette da solo** dopo il tempo di inattività (`idleTimeout`, **default 10 minuti**); il codice chiama `manager.close(name)` allo scadere del timer;
- la **metadata dei tool resta in cache**, quindi `search`/`describe` continuano a funzionare anche da disconnesso; solo una nuova chiamata a un tool lo riconnette.

Quindi, con la configurazione attuale di Stitch (`lazy` + default), **dopo averlo usato e aver smesso, si chiude da solo entro 10 minuti**. Non serve fare nulla.

### Se vuoi che si chiuda prima

Abbassa `idleTimeout` nel `.mcp.json`:

```json
"stitch": {
  "url": "http://127.0.0.1:9020/mcp",
  "headers": { "X-Goog-Api-Key": "${STITCH_API_KEY}" },
  "lifecycle": "lazy",
  "idleTimeout": 1
}
```

Poi `/reload` per applicare. Non c'è modo di disconnettere *istantaneamente* via comando: le uniche vie immediate sono chiudere pi oppure fermare il proxy.

### Comandi user-facing che coinvolgono la connessione (con caveat)

| Comando | Cosa fa | Va bene per "disconnettere"? |
| --- | --- | --- |
| `/mcp reconnect <server>` | `close` + `connect` immediati | ❌ No: riconnette subito |
| `/mcp logout <server>` | `close` + **rimuove le credenziali OAuth** | ⚠️ Non ideale per Stitch: è pensato per server OAuth. Per Stitch (API key in header, nessuna credenziale OAuth salvata) chiude la connessione, ma il messaggio parla di credenziali OAuth — funziona ma è fuorviante |
| Pannello `/mcp` → `Ctrl+R` | reconnect del server selezionato | ❌ Come reconnect |
| (nessuno) | disconnessione permanente pulita | ❌ Non esiste |

### Disabilitare del tutto un server

Se vuoi che il server sia proprio assente (non solo disconnesso):

1. Rimuovi il suo blocco da `.mcp.json` (JSON standard non ammette commenti: eliminalo o salvalo altrove).
2. `/reload`.

Per riaverlo, rimetti il blocco + `/reload`.

### Se invece lo vuoi sempre attivo (l'opposto)

Imposta `"lifecycle": "keep-alive"` (connette all'avvio + reconnect automatico via health-check). Sconsigliato se lo usi poco, perché tiene aperta la connessione in permanenza.

### Riepilogo pratico

- **Uso occasionale (caso raccomandato):** lascia `lazy` + default. Non fare nulla: il server si chiude da solo dopo 10 min di inattività e si riconnette quando ti serve di nuovo.
- **Chiusura più rapida:** `"idleTimeout": 1` (o 2).
- **Sempre attivo:** `"lifecycle": "keep-alive"` (sconsigliato se usato poco).

## 10. Verifica e risoluzione problemi

| Sintomo | Causa / soluzione |
| --- | --- |
| `/mcp` non esiste | Adattatore non caricato: verifica `pi list` contiene `npm:pi-mcp-adapter`, riavvia pi. |
| Server "not connected" | Con `lifecycle: lazy` è normale finché non lo usi. Prova `mcp({ connect: "nome" })` o `/mcp reconnect nome`. |
| `can't resolve reference ... from id #` | Schema non conforme (vedi §8 Stitch). Serve il proxy. |
| 401 / 403 | Chiave/token mancanti o errati, o variabile d'ambiente non visibile al processo pi. Imposta la variabile e riavvia pi dal terminale giusto. |
| Server non vede la nuova config | La config si legge all'avvio: fai `/reload` o riavvia pi. |
| Comandi duplicati (`/mcp:1` `/mcp:2`) | Adattatore caricato due volte (es. sia globale che via `-e`). Tienilo in un solo posto. |

## 11. Stato di verifica

| Elemento | Stato |
| --- | --- |
| Installazione `pi-mcp-adapter` | ✅ verificato (`pi list`, settings, manifest) |
| Caricamento dell'estensione | ✅ verificato (comandi `/mcp` e tool `mcp` disponibili) |
| Handshake protocollo MCP + chiave Stitch | ✅ verificato (HTTP 200, `initialize`, 14 tool) |
| Connessione diretta a Stitch | ❌ **fallisce** (schema non conforme — vedi §8) |
| Connessione a Stitch **via proxy** | ✅ **verificato end-to-end** dentro pi: `/mcp` vede `stitch` connesso, `list_projects` restituisce i progetti reali |

---

*Versioni: pi 0.79.10 · pi-mcp-adapter 2.10.0 · @modelcontextprotocol/sdk 1.29.0. Comandi e opzioni verificati sul codice installato. Documentazione del pacchetto: https://pi.dev/packages/pi-mcp-adapter*
