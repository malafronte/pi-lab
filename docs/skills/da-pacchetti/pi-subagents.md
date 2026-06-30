# Skill: pi-subagents — orchestrare deleghe a sub-agent

> Skill (derivata da `pi-subagents`) per l'orchestratore parent: lanciare sub-agent specializzati, comporre workflow (chain, parallel, async, forked-context) e creare/modificare agent e chain on demand. È pensata **solo per il parent orchestrator**: i child non devono iniettarla o seguirla.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `pi-subagents` |
| Pacchetto padre | `pi-subagents` (<https://github.com/nicobailon/pi-subagents>) |
| File skill | `skills/pi-subagents/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-subagents
```

Il campo `pi.skills` del `package.json` punta a `./skills`.

## Configurazione

Gli agent custom si definiscono in `~/.pi/agent/extensions/pi-subagents/agents/` (globale) o `.pi/extensions/pi-subagents/` (progetto). Le chain usano una `chainDir` condivisa (default temp utente). Vedi [`docs/pacchetti-npm/pi-subagents.md`](../../pacchetti-npm/pi-subagents.md).

## Uso

### Quando usarla

- **Advisory review**: agent `reviewer` fresh-context per review avversaria, o fork a `oracle` quando contano le decisioni ereditate;
- **Implementation handoff**: `oracle` consiglia, poi `worker` implementa solo dopo direzione approvata;
- **Recon e planning**: `scout`/`context-builder`, poi `planner`;
- **Parallel exploration**: task non-conflicting concorrenti;
- **Long-running work**: run async/background ispezionabili poi;
- **Agent authoring**: creare/aggiornare/override agent e chain.

### Tool vs slash command

- il **tool** `subagent(...)` per logica agentica;
- gli **slash** per flusso interattivo umano: `/run`, `/chain`, `/parallel`, `/run-chain` (workflow `.chain.md`/`.chain.json` salvati), `/subagents-doctor`.

### Prompt shortcut (ricette di orchestrazione)

| Shortcut | Forma |
| --- | --- |
| `/parallel-review` | reviewer fresh-context con angoli distinti, poi sintesi |
| `/review-loop` | worker → fresh-reviewer → fix-worker fino a clean o cap |
| `/parallel-research` | `researcher` + `scout` (evidenza esterna + contesto locale) |
| `/parallel-context-build` | passi `context-builder` paralleli per handoff di pianificazione |
| `/parallel-handoff-plan` | ricerca esterna + `context-builder`, poi handoff plan + meta-prompt |
| `/gather-context-and-clarify` | scout/research prima, poi domande di chiarimento con `interview` |
| `/parallel-cleanup` | due reviewer fresh-context (deslop + verbosity) sul diff corrente |

## Esempi

### Esempio 1 — parallel review di un diff

```text
/parallel-review
# lancia reviewer fresh-context con angoli: correttezza/regressioni, test/validazione, semplicità/manutenibilità
```

### Esempio 2 — handoff implementativo (tool)

```text
subagent({ agent: "oracle", task: "Consiglia l'approccio per il refactor del modulo auth" })
# dopo approvazione:
subagent({ agent: "worker", task: "Implementa l'approccio approvato: {previous}" })
```

### Esempio 3 — diagnostica setup

```text
/subagents-doctor
```

Per la guida completa vedi [`docs/approfondimenti/subagents-nicobailon-guida.md`](../../approfondimenti/subagents-nicobailon-guida.md).
