# pi-web-access — ricerca web, fetch URL, GitHub, PDF, video

> Estensione pi che aggiunge ricerca web, fetch di URL, clonaggio repo GitHub, estrazione PDF, comprensione di video YouTube e analisi di video locali. Supporta OpenAI, Brave, Parallel, Tavily, Exa, Perplexity e Gemini.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-web-access` |
| Repository | <https://github.com/nicobailon/pi-web-access> |
| Documentazione | <https://github.com/nicobailon/pi-web-access#readme> |
| Licenza | MIT |
| Video demo | <https://github.com/nicobailon/pi-web-access/raw/refs/heads/main/pi-web-fetch-demo.mp4> |

## Installazione

```bash
pi install npm:pi-web-access
```

## Configurazione

Le chiavi API dei provider di ricerca vanno in `~/.pi/agent/auth.json` (come credenziali provider). **Segnaposto semantici**, mai chiavi reali:

```jsonc
// ~/.pi/agent/auth.json  (SEGAPOSTO)
{
  "<PROVIDER>": { "type": "api_key", "key": "<PROVIDER_API_KEY>" }
}
```

Provider supportati (uno o più): OpenAI, Brave, Parallel, Tavily, Exa, Perplexity, Gemini. La selezione è auto (OpenAI quando adatto, poi Exa, Brave, Parallel, Tavily, Perplexity, Gemini API, Gemini Web).

## Uso

### `web_search`

Ricerca web con risposta sintetizzata e citazioni delle fonti. Per ricerca approfondita usa `queries` (2–4 angoli diversi) invece di una singola `query`.

```text
web_search({ query: "pi coding agent packages" })
web_search({ queries: ["React vs Vue performance 2026", "React vs Vue developer experience", "React ecosystem size vs Vue"] })
```

Opzioni: `provider`, `numResults` (default 5, max 20), `domainFilter`, `recencyFilter` (day/week/month/year), `includeContent` (fetch full page async), `workflow` (`none`/`summary-review`/`auto-summary`).

### `fetch_content`

Estrae contenuto leggibile da URL come markdown. Supporta: transcript YouTube (con thumbnail), contenuti repo GitHub, file video locali (con frame thumbnail), fallback a Gemini per pagine che bloccano i bot.

```text
fetch_content({ url: "https://example.com" })
fetch_content({ urls: ["https://a.com","https://b.com"] })      // parallelo
fetch_content({ url: "https://youtube.com/watch?v=...", prompt: "qual è il punto principale del video?" })
fetch_content({ url: "video.mp4", prompt: "descrizione dei frame", frames: 6 })
```

### `get_search_content`

Recupera il contenuto full di una precedente `web_search` o `fetch_content` (via `responseId` o selettore query/url).

### Skill `librarian`

pi-web-access porta la skill `librarian` per ricercare librerie open-source con risposte evidence-backed e permalink GitHub (vedi [`docs/skills/da-pacchetti/librarian.md`](../skills/da-pacchetti/librarian.md)).

## Esempi

### Esempio 1 — ricerca singola

```text
web_search({ query: "ast-grep vs grep for code search" })
```

### Esempio 2 — ricerca multi-angolo (coverage più ampia)

```text
web_search({ queries: ["pi-lens features", "pi-lens ast-grep rules", "pi-lens LSP integration"] })
```

### Esempio 3 — fetch di un README GitHub come markdown

```text
fetch_content({ url: "https://github.com/nicobailon/pi-subagents" })
```

### Esempio 4 — analisi mirata di un video YouTube

```text
fetch_content({ url: "https://youtube.com/watch?v=<ID>", prompt: "spiega la parte sull'installazione" })
```

Per l'analisi dettagliata del pacchetto vedi [`docs/approfondimenti/pacchetti-analisi/02-pi-web-access.md`](../approfondimenti/pacchetti-analisi/02-pi-web-access.md).
