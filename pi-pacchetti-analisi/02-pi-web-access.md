# Analisi: pi-web-access

**Pacchetto:** `pi-web-access` · **Versione:** 0.12.0 (18 release) · **Autore:** Nico Bailon (nicobailon — stesso di `pi-mcp-adapter`) · **Licenza:** MIT · **Repo:** `github.com/nicobailon/pi-web-access`

> Web search, fetch di URL, estrazione PDF, cloning di repo GitHub, e comprensione video (YouTube/locale). Multi-provider con fallback chain intelligente.

## A cosa serve

Dà all'agente capacità di **accesso al web** strutturato: cercare, scaricare pagine, estrarre testo da PDF, clonare repo GitHub per esplorarne i file reali, e analizzare video YouTube o locali (transcript + descrizione visiva + frame). Risolve il problema "l'agente non può googlare / leggere un link / guardare un video".

## Provider supportati (con fallback chain)

In modalità `auto` (default), ogni capability ha una catena di fallback — qualcosa funziona sempre:

- **Search**: OpenAI/Codex → Exa → Brave → Parallel → Tavily → Perplexity → Gemini API → Gemini Web (cookie)
- **YouTube**: Gemini Web (cookie) → Gemini API → Perplexity
- **Pagine bloccate**: retry via Jina Reader → Parallel → Gemini extraction
- **Exa funziona zero-config** (via MCP), OpenAI riutilizza l'auth Codex se hai fatto `/login`

## Comandi e tool

**Comandi slash:** `/search`, `/websearch`, `/curator` (UI di gestione ricerca), `/google-account` (account browser cookie)

**Tool per l'LLM:**
- `web_search({ query })` — ricerca web
- `fetch_content({ url })` — scarica/estrai contenuto di una URL
- `get_search_content({ ... })` — combinazione search+fetch

## Installazione e config

```bash
pi install npm:pi-web-access
```
Config API key in `~/.pi/web-search.json` (opzionale — Exa zero-config funziona senza):
```json
{ "openaiApiKey": "sk-...", "braveApiKey": "BSA_...", "exaApiKey": "exa-...", "perplexityApiKey": "pplx-...", "geminiApiKey": "AIza..." }
```
Dipendenze opzionali per frame video: `brew install ffmpeg yt-dlp` (senza, i transcript/descrizioni via Gemini funzionano comunque).

## ⚠️ Sicurezza

- **Buone pratiche**: ha un modulo `ssrf-protection.ts` con blocklist dei range privati (`0.0.0.0`, loopback `127.0.0.1`/`0x7f...`/`0177...`, `10.0.0.0/8`) → previene SSRF su infra interna.
- **Browser cookies**: modalità opzionale legge i cookie del browser (chrome-cookies.ts) per autenticare fetch/Gemini Web. Richiede opt-in esplicito.
- **Cloning GitHub**: esegue `git clone` su URL GitHub (legittimo, ma = esecuzione di comandi git).
- **Server locale** `curator-server.ts` (UI di gestione) su loopback.
- **Dipendenze**: `@mozilla/readability`, `turndown`, `unpdf`, `linkedom`, `p-limit` (librerie note di parsing/HTML→markdown).
- **Codice sorgente `.ts` leggibile** (entry `./index.ts`) → auditabile.
- Richiede Pi v0.37.3+.

## Pro

- ✅ Accesso web completo per l'agente (search + fetch + PDF + video + GitHub)
- ✅ Fallback chain robusta (qualcosa funziona sempre, anche zero-config con Exa)
- ✅ SSRF protection (segno di cura)
- ✅ Cloning GitHub invece di scraping HTML → l'agente vede i file reali
- ✅ Video understanding (YouTube + locali) unico nel suo genere

## Contro

- ❌ **Pesante**: 6.8 MB scompattato, tante dipendenze parsing
- ❌ Per sfruttarlo tutto servono **più API key a pagamento** (o fallback a Exa zero-config)
- ❌ **Ridondanza** con server MCP di search (Firecrawl, Exa MCP via pi-mcp-adapter): se hai già Stitch/pi-mcp-adapter, valuta overlap
- ❌ Modalità browser-cookie legge cookie Chrome (superficie sensibile, anche se opt-in)
- ❌ Terzo (nicobailon) — pieni permessi, va auditato (come pi-mcp-adapter)

## Compatibilità

- pi 0.79.10: ✅ compatibile (peer `*`, richiede Pi ≥ 0.37.3)
- **Overlap potenziale** con `pi-mcp-adapter` + server MCP di search (es. Exa, Firecrawl): vedi documento raccomandazioni.

## Quando usarlo

**Sì** se: vuoi che l'agente cerchi sul web, legga link/PDF, analizzi video, o esplori repo GitHub per davvero.
**No** se: già copri il web access via MCP (Firecrawl/Exa) e non ti serve video/PDF, o non vuoi un pacchetto da 7MB.
