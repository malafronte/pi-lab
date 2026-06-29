# pi-subagents (nicobailon) — delegare lavoro a sub-agent

> Estensione pi (di Nico Bailon) per delegare task a sub-agent con chain, esecuzione parallela, TUI di chiarimento, fork di contesto e coordinamento via intercom. È il package di sub-agent documentato ufficialmente su pi.dev.

> **Nota:** è **alternativo** a `@gotgenes/pi-subagents` + `@gotgenes/pi-subagents-worktrees`. In questa configurazione è installato `pi-subagents` (nicobailon). Per il confronto vedi [`docs/approfondimenti/subagents-confronto.md`](../approfondimenti/subagents-confronto.md).

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-subagents` |
| Repository | <https://github.com/nicobailon/pi-subagents> |
| Documentazione | <https://github.com/nicobailon/pi-subagents#readme> · <https://pi.dev/packages/pi-subagents> |
| Licenza | MIT |
| Binario | `pi-subagents` (installer `install.mjs`) |

## Installazione

```bash
pi install npm:pi-subagents
```

Il bin `pi-subagents` gestisce l'installazione (symlink delle skill/estensioni). Il pacchetto porta skill (`skills/`), prompt template (`prompts/`) e l'estensione (`src/extension/`).

## Configurazione

Gli agent custom si definiscono (opzionale) in file di config: `~/.pi/agent/extensions/pi-subagents/agents/` o a livello progetto in `.pi/extensions/pi-subagents/`. Definizione di un agent custom (schema con `name`, `systemPrompt`, `systemPromptMode`, `inheritProjectContext`, `inheritSkills`, `defaultContext`, ecc.).

Nessun segreto richiesto: gli agent usano i modelli già configurati in pi. Le chain usano una `chainDir` (directory artefatti condivisa, default temp utente).

## Uso

Il tool `subagent` supporta diverse modalità (usa **una sola** modalità di esecuzione per chiamata):

| Modalità | Descrizione |
| --- | --- |
| SINGLE | `{ agent, task? }` — un task; `task` opzionale per agent self-contained |
| CHAIN | `{ chain: [{agent, task?}, ...] }` — pipeline sequenziale; ogni risultato diventa `{previous}` |
| PARALLEL | `{ tasks: [{agent, task, count?}], concurrency?, worktree? }` — fan-out concorrente |
| (controllo) | `{ action: "list" \| "get" \| "models" \| "create" \| "update" \| "delete" \| "status" \| "interrupt" \| "resume" \| "append-step" \| "doctor" }` |

### Variabili template delle chain

- `{task}` — il task originale;
- `{previous}` — la risposta del passo precedente (vuoto per il primo);
- `{chain_dir}` — directory condivisa per file della chain.

### Modalità async

`async: true` esegue in background; `action: "status"`/`"interrupt"`/`"resume"` gestiscono i run. `worktree: true` isola ogni task PARALLEL in un git worktree (richiede stato git pulito).

## Esempi

### Esempio 1 — SINGLE: delegare un'analisi

```text
subagent({ agent: "code-analysis", task: "Analizza il modulo auth per vulnerabilità" })
```

### Esempio 2 — CHAIN: analisi → pianificazione

```text
subagent({
  chain: [
    { agent: "agent-a", task: "Analizza {task}" },
    { agent: "agent-b", task: "Pianifica basandoti su {previous}" }
  ]
})
```

### Esempio 3 — PARALLEL: fan-out di 3 worker

```text
subagent({ tasks: [{ agent: "worker", task: "processa batch", count: 3 }], concurrency: 4 })
```

### Esempio 4 — elencare gli agent configurati

```text
subagent({ action: "list" })
```

Per la guida completa e i casi d'uso vedi [`docs/approfondimenti/subagents-nicobailon-guida.md`](../approfondimenti/subagents-nicobailon-guida.md) e il tutorial [`docs/approfondimenti/subagents-tutorial.md`](../approfondimenti/subagents-tutorial.md).
