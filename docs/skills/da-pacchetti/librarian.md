# Skill: librarian — ricerca librerie open-source con citazioni

> Skill (derivata da `pi-web-access`) per rispondere a domande su librerie open-source con risposte evidence-backed e **permalink GitHub**. Ogni affermazione è supportata da codice effettivo.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `librarian` |
| Pacchetto padre | `pi-web-access` (<https://github.com/nicobailon/pi-web-access>) |
| File skill | `skills/librarian/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-web-access
```

Il campo `pi.skills` del `package.json` di `pi-web-access` punta a `./skills`, così la skill è auto-disponibile.

## Configurazione

Nessuna configurazione dedicata. Usa le credenziali provider di `pi-web-access` (vedi [`docs/pacchetti-npm/pi-web-access.md`](../../pacchetti-npm/pi-web-access.md)) per `web_search` e `fetch_content`.

## Uso

Classifica la richiesta per scegliere la strategia di ricerca:

| Tipo | Trigger | Approccio principale |
| --- | --- | --- |
| Concettuale | "Come uso X?", "Best practice per Y?" | `web_search` + `fetch_content` (README/docs) |
| Implementazione | "Come implementa X la Y?", "Mostrami il sorgente" | `fetch_content` (clone) + code search |
| Contesto/Storia | "Perché è cambiato?", "Storia di X?" | `git log` + `git blame` + issue/PR search |
| Comprensiva | richieste complesse/ambigue, "deep dive" | tutti i precedenti |

Workflow implementazione (clone → find → permalink):

1. `fetch_content` l'URL del repo GitHub (clona localmente, restituisce il file tree);
2. `bash` per cercare nel clone (`grep -rn`, `find`);
3. `read` per esaminare i file;
4. ottieni lo SHA: `cd /tmp/pi-github-repos/<owner>/<repo> && git rev-parse HEAD`;
5. costruisci il permalink: `https://github.com/<owner>/<repo>/blob/<sha>/path/to/file#L10-L20`.

## Esempi

### Esempio 1 — domanda implementativa

```text
"Come pi-subagents gestisce la fork di contesto?"
```

Workflow: `fetch_content({ url: "https://github.com/nicobailon/pi-subagents" })` → `grep -rn "fork"` nel clone → `read` dei file rilevanti → permalink con SHA.

### Esempio 2 — domanda di storia

```text
"Perché pi-mcp-adapter ha introdotto il lifecycle lazy?"
```

Workflow: clone del repo → `git log --oneline -- src/` → `git blame` sul file interessato → ricerca issue/PR con `web_search`.

### Esempio 3 — batch di chiamate indipendenti (risparmia round-trip)

In un unico turno: `web_search` (discussioni recenti) + `fetch_content` (clone del repo). Pi esegue in sequenza ma risparmia round-trip LLM. `fetch_content({ urls: [...] })` è vero parallelismo (3 concorrenti).
