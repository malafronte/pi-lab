# @gotgenes/pi-github-tools — tool deterministici per GitHub CI/release/issue

> Estensione pi che fornisce tool deterministici per GitHub CI, release e issue, sostituendo il polling ad-hoc di `gh` CLI con tool strutturati dotati di backoff esponenziale, streaming del progresso e ritorni strutturati di successo/timeout.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@gotgenes/pi-github-tools` |
| Repository | <https://github.com/gotgenes/pi-packages> (sottocartella `packages/pi-github-tools`) |
| Documentazione | <https://github.com/gotgenes/pi-packages/tree/main/packages/pi-github-tools#readme> |
| Licenza | MIT |

## Installazione

```bash
pi install npm:@gotgenes/pi-github-tools
```

Oppure aggiungilo a `~/.pi/agent/settings.json`:

```jsonc
{ "packages": ["npm:@gotgenes/pi-github-tools"] }
```

### Prerequisiti

- [GitHub CLI (`gh`)](https://cli.github.com/) installato e autenticato (`gh auth login`);
- Node.js ≥ 22.

## Configurazione

Nessun file di config dedicato: usa l'autenticazione di `gh` già configurata. Il pacchetto va in `~/.pi/agent/settings.json` → `packages`.

## Uso

Espone 8 tool raggruppati in tre famiglie.

### CI

| Tool | Effetto |
| --- | --- |
| `ci_find` | attende che una run GitHub Actions matching uno SHA appaia (backoff 5s base, 30s cap). Parametri: `workflow` (nome file senza estensione, es. `"ci"` per `ci.yml`), `expected_sha` (40 char), `timeout` (s, default 120). Restituisce `run_id`, `url`, `status`, `sha`, `title`, job list; oppure un timeout strutturato (non errore). |
| `ci_watch` | polla una run per run ID fino al completamento/timeout. Stream righe di progresso job-level (`[2/5] deploy — in_progress (120s)`). Parametri: `workflow`, `run_id`, `timeout` (s, default 300). |
| `ci_list` | elenca le run recenti di un workflow. Parametri: `workflow`, `limit` (default 5). |

### Release

| Tool | Effetto |
| --- | --- |
| `release_pr_find` | trova la PR di release-please dopo un push a `main`. Poll finché la PR non appare o timeout (default 120s). Restituisce PR number, title, head branch, mergeable, URL. |
| `release_pr_merge` | merge di una PR release-please dopo aver verificato sia clean (controlla `MERGEABLE` + `CLEAN`, merge, `git pull --ff-only`). Parametri: `pr_number`, `method` (`"rebase"`/`"squash"`/`"merge"`). |
| `release_watch` | attende che un tag di release appaia su HEAD dopo il merge di una PR release-please. Poll ogni 10s (default 180s). Restituisce tag name, version, SHA. |

### Issue

| Tool | Effetto |
| --- | --- |
| `issue_close` | chiude una GitHub issue con commento opzionale. Valida la `reason` (`completed` o `not_planned`) e wrappa `gh issue close`. Parametri: `issue_number`, `comment?`, `reason?`. |

## Esempi

### Esempio 1 — attendere la run CI di un commit e poi guardarla

```text
ci_find({ workflow: "ci", expected_sha: "<FULL_40CHAR_SHA>" })
# → run_id: 12345678
ci_watch({ workflow: "ci", run_id: 12345678 })
```

### Esempio 2 — elencare le run recenti

```text
ci_list({ workflow: "ci", limit: 5 })
```

### Esempio 3 — merge di una PR release-please pulita

```text
release_pr_find({})
# → pr_number: 42, mergeable: true
release_pr_merge({ pr_number: 42, method: "squash" })
release_watch({})
```

### Esempio 4 — chiudere un issue completato

```text
issue_close({ issue_number: 7, reason: "completed", comment: "Risolto nella release v1.2.0" })
```

Per la valutazione d'uso vedi [`docs/approfondimenti/gotgenes-packages-guida.md`](../approfondimenti/gotgenes-packages-guida.md).
