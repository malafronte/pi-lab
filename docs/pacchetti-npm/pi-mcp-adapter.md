# pi-mcp-adapter — usare server MCP in pi

> Estensione pi che aggiunge il supporto a MCP (Model Context Protocol): installa, connette e usa server MCP (stdio, remoto, OAuth, bearer, lifecycle) tramite un tool proxy `mcp` e comandi slash (`/mcp`).

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-mcp-adapter` |
| Repository | <https://github.com/nicobailon/pi-mcp-adapter> |
| Documentazione | <https://github.com/nicobailon/pi-mcp-adapter#readme> |
| Licenza | MIT |
| Video demo | <https://github.com/nicobailon/pi-mcp-adapter/raw/refs/heads/main/pi-mcp.mp4> |

## Installazione

```bash
pi install npm:pi-mcp-adapter
```

Il pacchetto espone il bin `pi-mcp-adapter` (CLI di gestione server).

## Configurazione

I server MCP si configurano nel file `.mcp.json` (scope progetto, condivisibile col team) o nel config globale `~/.pi/agent/mcp-onboarding.json` per il discovery. Esempio (server remoto con chiave API via header, **segnaposto**):

```jsonc
// .mcp.json  (SEGAPOSTO: nessuna chiave reale)
{
  "mcpServers": {
    "<SERVER_NAME>": {
      "url": "http://127.0.0.1:<PORT>/mcp",
      "headers": {
        "X-Api-Key": "$<API_KEY_ENV_VAR>"
      },
      "lifecycle": "lazy"
    }
  }
}
```

Modalità supportate:

| Modalità | Esempio | Note |
| --- | --- | --- |
| stdio (locale) | `command` + `args` + `env` | processo figlio |
| remoto (streamable HTTP) | `url` + `headers` | con o senza bearer/OAuth |
| OAuth | `url` + flow OAuth gestito | pi apre il browser |
| bearer | `headers: { Authorization: "Bearer $TOKEN" }` | token via env |
| `lifecycle` | `lazy` / `eager` | `lazy` connette al primo uso; `eager` all'avvio |
| `directTools` | `true` | espone i tool del server come tool pi diretti (non via proxy `mcp`) |

## Uso

### Comandi slash

```text
/mcp            # stato dei server MCP (connessi, errori, tool)
```

### Tool proxy `mcp`

Il gateway `mcp` gestisce connessione, metadata e chiamate ai tool dei server:

```text
mcp({ action: "server" })              # elenca i server
mcp({ connect: "<SERVER_NAME>" })       # connette/refresh metadata
mcp({ describe: "<tool_name>" })        # dettagli e parametri di un tool
mcp({ tool: "<tool_name>", args: '{}' })  # chiama un tool (args è JSON string)
mcp({ search: "query" })               # cerca tool per nome/descrizione
```

Le azioni sono prioritarie: `action` > `tool` (call) > `connect` > `describe` > `search` > `server` (list) > nothing (status).

## Esempi

### Esempio 1 — server stdio locale

```jsonc
// .mcp.json
{ "mcpServers": { "filesystem": { "command": "npx", "args": ["-y","@modelcontextprotocol/server-filesystem","<PATH>"] } } }
```

### Esempio 2 — chiamare un tool via gateway `mcp`

```text
mcp({ tool: "list_projects", args: '{}' })
```

### Esempio 3 — workaround per Google Stitch (schema non conforme)

Stitch non è direttamente usabile (i suoi JSON Schema contengono `$ref` cross-referenziati non risolvibili). Soluzione: un **proxy locale** che rimuove i `$ref` problematici. Dettagli in [`docs/mcp/stitch-proxy.md`](../mcp/stitch-proxy.md).

## Audit di sicurezza

Per l'audit statico di sicurezza del pacchetto (superfici esaminate, punti di forza, debolezze, flusso della API key, limiti) vedi [`docs/mcp/mcp-audit.md`](../mcp/mcp-audit.md).

Per il riferimento completo (tutti i comandi, tutte le opzioni dei server, esempi, risoluzione problemi) vedi [`docs/mcp/mcp-guida.md`](../mcp/mcp-guida.md).
