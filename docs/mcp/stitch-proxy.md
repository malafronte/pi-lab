# Stitch MCP in pi via proxy locale

> Il server MCP di Google Stitch (`stitch.googleapis.com/mcp`) **non è direttamente usabile** con pi (e con altri client MCP che validano gli schema in modo stretto) a causa di un difetto di conformità dei suoi JSON Schema. La soluzione, già adoperata con OpenCode, è un **piccolo proxy Node.js locale** che rimuove i `$ref` problematici. Questa guida spiega come usarlo con pi.

## Indice

1. [Il problema (perché serve il proxy)](#1-il-problema-perché-serve-il-proxy)
2. [Come funziona il proxy](#2-come-funziona-il-proxy)
3. [Verifica end-to-end (già eseguita)](#3-verifica-end-to-end-già-eseguita)
4. [Configurazione di pi (`.mcp.json`)](#4-configurazione-di-pi-mcpjson)
5. [Avviare il proxy](#5-avviare-il-proxy)
6. [Usare Stitch in pi](#6-usare-stitch-in-pi)
7. [Riattivare la connessione diretta (senza proxy)](#7-riattivare-la-connessione-diretta-senza-proxy)
8. [Quando smettere di usare il proxy](#8-quando-smettere-di-usare-il-proxy)
9. [File](#9-file)

---

## 1. Il problema (perché serve il proxy)

Il server MCP di Stitch espone 14 tool, ma nei loro JSON Schema usa `$ref` **cross-referenziati** tra `inputSchema` e `outputSchema` che puntano a `$defs/ScreenInstance` non risolvibili dalla radice dello schema. L'SDK MCP ufficiale (`@modelcontextprotocol/sdk`, usato da `pi-mcp-adapter`) valida gli schema con **Ajv** in fase di `connect` e fallisce con:

```text
can't resolve reference #/$defs/ScreenInstance from id #
```

Diagnosi verificata in questa sessione (non ipotetica): riproducendo lo stesso percorso dell'SDK si ottiene l'errore identico; la chiave, la rete e il protocollo MCP sono invece tutti OK.

**Nota:** chiave/autenticazione/rete/protocollo **funzionano**. Il blocco è solo nella validazione dello schema lato client.

## 2. Come funziona il proxy

Un piccolo server HTTP Node.js in ascolto su `http://127.0.0.1:9020` che:

1. riceve le richieste MCP da pi;
2. inoltra tutto a `https://stitch.googleapis.com/mcp` aggiungendo l'header `X-Goog-Api-Key`;
3. **intercetta solo le risposte `tools/list`** ed elimina i `$ref` (li sostituisce con `{}` = "qualsiasi oggetto");
4. lascia inalterate tutte le altre chiamate (es. `tools/call` verso `create_project`, `generate_screen_from_text`).

Così Ajv non trova `$ref` non risolvibili e la connessione va a buon fine. Il comportamento dei tool resta identico: i `$ref` rimossi riguardano solo i parametri di "decorazione" degli schemi, non la logica delle chiamate.

Il codice è in `.pi/stitch-proxy/stitch-proxy.mjs` (copia del proxy usato con OpenCode, riutilizzato tale e quale).

## 3. Verifica end-to-end (verificato funzionante)

Il workaround è stato verificato in due fasi.

**Fase 1 — riproduzione del percorso SDK di pi attraverso il proxy:**

| Passo | Risultato |
| --- | --- |
| `client.connect(transport)` verso il proxy | ✅ OK (l'errore precedente è **scomparso**) |
| `client.listTools()` | ✅ 14 tool caricati |
| `client.callTool({ name: "list_projects" })` | ✅ ha restituito i progetti reali dell'utente |

**Fase 2 — dentro la TUI di pi (verificato):** dopo aver avviato il proxy e fatto rileggere la configurazione (`.mcp.json` punta al proxy), la `connect` del gateway MCP è riuscita senza l'errore degli `$ref`, i 14 tool di Stitch sono stati caricati e `stitch_list_projects` ha restituito i 4 progetti reali dell'utente.

Quindi la catena **agente → gateway `mcp` → adattatore → proxy → Stitch → risposta** è confermata operativa end-to-end, anche dentro pi.

## 4. Configurazione di pi (`.mcp.json`)

Il file `.mcp.json` del progetto è già stato modificato per puntare al proxy locale:

```json
{
  "mcpServers": {
    "stitch": {
      "url": "http://127.0.0.1:9020/mcp",
      "headers": {
        "X-Goog-Api-Key": "${STITCH_API_KEY}"
      },
      "lifecycle": "lazy"
    }
  }
}
```

Differenze rispetto alla configurazione diretta (senza proxy):

- `url` → `http://127.0.0.1:9020/mcp` (il proxy) invece di `https://stitch.googleapis.com/mcp`
- l'header `X-Goog-Api-Key` resta **interpola`${STITCH_API_KEY}`**: il proxy lo legge dalla richiesta in arrivo e lo inoltra a Stitch. La chiave non va scritta in chiaro da nessuna parte.

> **Per usare Stitch in altri progetti** senza il proxy diretto: copia questo stesso blocco `.mcp.json` e assicurati che il proxy sia attivo. Oppure mettilo a livello globale in `~/.pi/agent/mcp.json` o `~/.config/mcp/mcp.json`.

## 5. Avviare il proxy

Il proxy **deve essere in esecuzione** prima di avviare pi (o prima di fare `/reload`), altrimenti la `connect` a Stitch fallirà con "connection refused".

### PowerShell — script di avvio (consigliato)

Usa lo script `start-pi.ps1` (nella cartella `.pi/stitch-proxy/`) che avvia il proxy se non è già attivo e poi lancia pi:

```powershell
powershell -File .\.pi\stitch-proxy\start-pi.ps1
```

Oppure avvia solo il proxy in background e lancia pi a parte:

```powershell
Start-Process -WindowStyle Hidden -FilePath node `
  -ArgumentList ".\.pi\stitch-proxy\stitch-proxy.mjs"
```

### Avvio manuale (qualsiasi shell)

```bash
node ~/.pi/.../stitch-proxy/stitch-proxy.mjs     # lascia in primo piano, o metti in background
```

Log di conferma: `Stitch MCP proxy running on http://127.0.0.1:9020`.

### Verifica che il proxy sia attivo

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 9020     # TcpTestSucceeded = True
```

### Fermare il proxy

```powershell
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*stitch-proxy*" } | Stop-Process -Force
```

> **Importante:** se avvii pi senza il proxy attivo, il server `stitch` risulterà "not connected". Avvia prima il proxy, poi `/reload` in pi.

## 6. Usare Stitch in pi

Una volta avviato il proxy e fatto `/reload` (o riavviato pi), confermato funzionante:

1. `/mcp` → il server `stitch` risulta connesso.
2. Read-only: chiedi all'agente *«Usa Stitch per elencare i miei progetti»* oppure usa il proxy tool:

   ```text
   mcp({ search: "" })                          # elenca i 14 tool
   mcp({ tool: "stitch_list_projects", args: '{}' })
   ```

   (i tool Stitch vengono prefissati `stitch_*` dal `toolPrefix` di default)
3. Task creativi: *«con Stitch crea un progetto "Demo" e genera una schermata di login…»* → userà `stitch_create_project`, `stitch_generate_screen_from_text`, ecc.

## 7. Riattivare la connessione diretta (senza proxy)

Se in futuro Stitch o l'SDK risolvono il problema degli schema (vedi §8), ripristina la configurazione diretta modificando `.mcp.json`:

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

Poi smetti di avviare il proxy e fai `/reload`.

## 8. Quando smettere di usare il proxy

Il proxy è un **workaround temporaneo**. Non sarà più necessario quando:

- l'**SDK MCP** (`@modelcontextprotocol/sdk`) smetterà di fallire la validazione sui `$ref` non risolvibili (accettando lo schema così com'è), **oppure**
- **Stitch** correggerà i propri schema eliminando i `$ref` cross-referenziati tra `inputSchema` e `outputSchema`.

Quando accadrà, riattiva la connessione diretta (§7).

## 9. File

| File | Descrizione |
| --- | --- |
| `.pi/stitch-proxy/stitch-proxy.mjs` | Il proxy Node.js (copia del proxy OpenCode, riutilizzato tale e quale). |
| `.pi/stitch-proxy/start-pi.ps1` | Script PowerShell che avvia proxy + pi (equivalente di `start-opencode.ps1`). |
| `.mcp.json` | Configurazione MCP del progetto, punta al proxy locale. |
| `~/.config/opencode/stitch-proxy/` | Proxy originale (condiviso con OpenCode). |

---

*Stato: workaround **verificato end-to-end** dentro pi (connect + listTools + `list_projects` con i progetti reali, tutto tramite il gateway `mcp`). Il proxy è necessario finché Stitch/l'SDK non correggono gli schema.*
