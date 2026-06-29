# Componente locale: Stitch MCP proxy

> Piccolo proxy Node.js locale che rende usabile il server MCP di Google Stitch con pi. Stitch **non è direttamente usabile** (i suoi JSON Schema contengono `$ref` cross-referenziati non risolvibili che fanno fallire la validazione dell'SDK MCP); il proxy rimuove i `$ref` problematici. Percorso: `.pi/stitch-proxy/`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Server MCP upstream | Google Stitch (`https://stitch.googleapis.com/mcp`) |
| File | `.pi/stitch-proxy/stitch-proxy.mjs`, `.pi/stitch-proxy/start-pi.ps1` |
| Pacchetto correlato | `pi-mcp-adapter` ([vedi](../pacchetti-npm/pi-mcp-adapter.md)) |

## Installazione / creazione

Il proxy è già presente nel repo sotto `.pi/stitch-proxy/`. Per ricrearlo in un altro progetto: copia i due file e installa `node` (nessuna dipendenza npm: usa solo `node:http` e `node:https`).

## Configurazione

Il server MCP Stitch si dichiara in [`.mcp.json`](../pacchetti-npm/pi-mcp-adapter.md) (scope progetto), puntando al proxy locale con la chiave via header (env-var):

```jsonc
// .mcp.json  (SEGAPOSTO: nessuna chiave reale)
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

La chiave `STITCH_API_KEY` va impostata come variabile d'ambiente (mai hardcodata). Esempio (PowerShell, scope Utente):

```powershell
[Environment]::SetEnvironmentVariable('STITCH_API_KEY','<STITCH_API_KEY>','User')
```

### Costanti del proxy

| Costante | Valore | Significato |
| --- | --- | --- |
| `STITCH_URL` | `https://stitch.googleapis.com/mcp` | endpoint Stitch upstream |
| `PORT` | `9020` | porta locale del proxy |

## Uso

### Avvio (proxy + pi insieme)

```powershell
powershell -File .\.pi\stitch-proxy\start-pi.ps1
```

Lo script PowerShell:

1. avvia il proxy sulla porta `9020` **solo se non già attivo** (check `Get-NetTCPConnection`);
2. verifica che `STITCH_API_KEY` sia presente (User o processo), avvisando altrimenti;
3. lancia `pi -c` nella cartella del progetto.

### Avvio manuale del proxy

```bash
node .pi/stitch-proxy/stitch-proxy.mjs
# → "Stitch MCP proxy running on http://127.0.0.1:9020"
```

Poi in pi: `/mcp` → il server `stitch` dovrebbe risultare connesso.

### Come funziona il proxy

- intercetta la risposta `tools/list`;
- per ogni tool, esegue `stripRefs` sugli `inputSchema`/`outputSchema`: ricorsivamente sostituisce con `{}` ogni oggetto che contiene `$ref`;
- inoltra tutte le altre richieste/resposte invariate (incluso l'header `X-Goog-Api-Key`).

## Esempi

### Esempio 1 — verificare la connessione

```text
/mcp
# → stitch: connesso (lazy)
```

### Esempio 2 — chiamare un tool di Stitch via gateway `mcp`

```text
mcp({ tool: "list_projects", args: '{}' })
```

### Esempio 3 — ripristinare la connessione diretta (senza proxy)

Se Stitch/l'SDK correggono gli schema, cambia `.mcp.json` puntando direttamente a `https://stitch.googleapis.com/mcp` (rimuovendo il proxy). Fino ad allora, il proxy è **necessario**.

Per la diagnostica completa e i dettagli del workaround vedi [`docs/mcp/stitch-proxy.md`](../mcp/stitch-proxy.md) e [`docs/mcp/mcp-guida.md`](../mcp/mcp-guida.md).
