# Confronto: `pi-subagents` (nicobailon) vs `@gotgenes/pi-subagents` + `pi-subagents-worktrees`

> Confronto tecnico tra due package diversi che risolvono lo stesso problema (delegare lavoro a sub-agent in pi) con filosofie e architetture diverse.
> Tutte le affermazioni sono verificate da: documentazione ufficiale pi.dev (estratta il 2026-06-28), registry npm, `package.json` dei package installati, e codice dei package letto direttamente.

## Indice

1. [TL;DR — sintesi in 30 secondi](#1-tldr--sintesi-in-30-secondi)
2. [Identità dei due package (autori, provenienza)](#2-identità-dei-due-package-autori-provenienza)
3. [La differenza filosofica fondamentale](#3-la-differenza-filosofica-fondamentale)
4. [Tabella di confronto completo](#4-tabella-di-confronto-completo)
5. [La differenza decisiva: isolamento worktree](#5-la-differenza-decisiva-isolamento-worktree)
6. [Confronto dei tipi di agente (builtin)](#6-confronto-dei-tipi-di-agente-builtin)
7. [Tool, comandi e orchestrazione](#7-tool-comandi-e-orchestrazione)
8. [Il fatto sorprendente: i due ecosistemi interagiscono](#8-il-fatto-sorprendente-i-due-ecosistemi-interagiscono)
9. [Cosa significa per l'interazione permessi + worktree (rilettura)](#9-cosa-significa-per-linterazione-permessi--worktree-rilettura)
10. [Quale scegliere?](#10-quale-scegliere)
11. [Possono convivere nello stesso progetto?](#11-possono-convivere-nello-stesso-progetto)
12. [Trasparenza sulle fonti](#12-trasparenza-sulle-fonti)

---

## 1. TL;DR — sintesi in 30 secondi

Esistono **due package separati**, di autori diversi, con lo stesso nome-base `pi-subagents`:

|   | **`pi-subagents`** (nicobailon) | **`@gotgenes/pi-subagents`** |
| --- | --- | --- |
| **Installa con** | `pi install npm:pi-subagents` | `pi install npm:@gotgenes/pi-subagents` |
| **Autore** | Nico Bailon | Chris Lasher |
| **Provenienza** | originario / mainline | fork di `@tintinweb/pi-subagents` |
| **Worktree** | **integrato** (`worktree: true`) | serve companion separato (`@gotgenes/pi-subagents-worktrees`) |
| **Filosofia** | framework completo (8 agent di ruolo, chain, fanout, intercom) | core minimal in-process (3 agent generici) su cui costruire |
| **Download/settimana** | ~27.800 | (minori) |

> **Punto chiave da ricordare:** non sono due versioni dello stesso package. Sono due progetti diversi che competono sullo stesso spazio. **Non installarli insieme** (conflitto sul tool `subagent` e sui path di discovery).

---

## 2. Identità dei due package (autori, provenienza)

### `pi-subagents` (senza scope) — il "mainline"

- **Autore:** Nico Bailon ([github.com/nicobailon](https://github.com/nicobailon)).
- **Repo:** [github.com/nicobailon/pi-subagents](https://github.com/nicobailon/pi-subagents).
- **npm:** `pi-subagents` (~27.800 download/settimana, ~97 file, 1.4MB scompattato). È il package **documentato ufficialmente su [pi.dev/packages/pi-subagents](https://pi.dev/packages/pi-subagents)**.
- **Ecosistema:** vive nel "fiorente" ecosistema nicobailon, che include `pi-web-access`, `pi-mcp-adapter`, `pi-prompt-template-model`, `pi-intercom` — tutti referenziati come companion dal README.

### `@gotgenes/pi-subagents` (con scope) — il "core minimal"

- **Autore:** Chris Lasher ([github.com/gotgenes](https://github.com/gotgenes)).
- **Repo:** monorepo [gotgenes/pi-packages](https://github.com/gotgenes/pi-packages), sotto-package `packages/pi-subagents`.
- **npm:** `@gotgenes/pi-subagents` v18.0.1.
- **Provenienza dichiarata (dal `package.json` installato):** *"A focused, in-process sub-agent core for pi — autonomous agents plus a typed API and lifecycle events other extensions build on. **Friendly fork of @tintinweb/pi-subagents**."*
- **Ecosistema:** il monorepo gotgenes include 8 package che si integrano tra loro (`pi-subagents` + `pi-subagents-worktrees` + `pi-permission-system` + `pi-nocd` + `pi-autoformat` + `pi-colgrep` + `pi-github-tools` + `pi-session-tools`).

> **Trasparenza:** "originario/mainline" per nicobailon si basa sul fatto che è il package **linkato da pi.dev** (il sito ufficiale di pi) e ha download ordini di grandezza superiori. Non implica che sia "migliore": significa solo che è il punto di riferimento documentato dalla community/pi.dev.

---

## 3. La differenza filosofica fondamentale

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  pi-subagents (nicobailon) = "FRAMEWORK TUTTO-INCLUSO"                    │
│  ─────────────────────────────────────────────────────────               │
│  • 8 agent di ruolo pronti all'uso (scout, worker, reviewer, oracle...)   │
│  • orchestrazione integrata: chain, parallel, fanout dinamico, loop       │
│  • worktree isolation INTEGRATO come parametro (worktree: true)           │
│  • intercom (i figli parlano col parent), acceptance gates, skills        │
│  • filosofia: "installa e chiedi in linguaggio naturale"                  │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  @gotgenes/pi-subagents = "CORE MINIMAL + COMPANION"                      │
│  ─────────────────────────────────────────────────────────────           │
│  • 3 agent generici (general-purpose, Explore, Plan)                      │
│  • in-process, API tipizzata, lifecycle events (per costruire sopra)      │
│  • worktree isolation è un COMPANION separato (pi-subagents-worktrees)    │
│  • steering mid-run (steer_subagent), custom agents via .md               │
│  • filosofia: "piccoli mattoni componibili che collaborate"              │
└──────────────────────────────────────────────────────────────────────────┘
```

In sintesi: **nicobailon punta alla massima funzionalità out-of-the-box; gotgenes punta alla composabilità e minimalismo.** Nicobailon ti dà un'opinione forte su *come* orchestrare (ruoli, chain, loop); gotgenes ti dà i mattoni e lascia decidere a te.

---

## 4. Tabella di confronto completo

| Aspetto | `pi-subagents` (nicobailon) | `@gotgenes/pi-subagents` (gotgenes) |
| --- | --- | --- |
| **Installazione** | `npm:pi-subagents` | `npm:@gotgenes/pi-subagents` |
| **Versione di riferimento** | (rolling, pi.dev 2026-06-28) | 18.0.1 |
| **Builtin agents** | 8 di ruolo: `scout`, `researcher`, `planner`, `worker`, `reviewer`, `context-builder`, `oracle`, `delegate` | 3 generici: `general-purpose`, `Explore`, `Plan` |
| **Modello dei builtin** | ereditano il default di pi (non pinnati) | `Explore`=haiku, altri inherit |
| **Worktree isolation** | ✅ **integrato**: `worktree: true` come parametro | ❌ nel core; ✅ via companion `pi-subagents-worktrees` |
| **Configurazione worktree** | per-lancio (parametro) + `worktreeSetupHook` | per-tipo-di-agente (file `.pi/subagents-worktrees.json`) |
| **Chain / sequenze** | ✅ `.chain.md`, `.chain.json`, fanout dinamico | ❌ non nel core |
| **Parallel nativo** | ✅ `/parallel`, `tasks: [...]`, fanout | ✅ background paralleli (concurrency default 4) |
| **Fanout dinamico (N figli da array)** | ✅ (`expand` + structured output) | ❌ |
| **Intercom (figlio→parent)** | ✅ via `pi-intercom` (`contact_supervisor`) | ❌ |
| **Steering mid-run** | ❌ (non documentato) | ✅ `steer_subagent` |
| **Acceptance gates** | ✅ (auto/attested/checked/verified/reviewed) | ❌ |
| **Skills per agente** | ✅ (con discovery project-first) | parziale (via system prompt) |
| **Session sharing (Gist)** | ✅ (`share: true`) | ❌ |
| **Custom agents** | file `.md` con frontmatter ricco | file `.md` con frontmatter (più semplice) |
| **Override builtin senza copia** | ✅ `agentOverrides` in settings | override via `.pi/agents/<name>.md` |
| **Context forked vs fresh** | ✅ (`context: fork`/`fresh`, sessione ramificata reale) | `inherit_context` (booleano) |
| **Recursion guard** | ✅ (`maxSubagentDepth`, default 2 livelli) | ✅ (rimuove tool `subagent` dai figli) |
| **Diagnostica** | `/subagents-doctor`, `/subagents-models` | `/subagents:settings`, `/subagents:sessions` |
| **Companion worktree** | — (interno) | `@gotgenes/pi-subagents-worktrees` 0.2.3 |
| **Integrazione permessi** | opzionale con `@gotgenes/pi-permission-system` | opzionale con `@gotgenes/pi-permission-system` |

---

## 5. La differenza decisiva: isolamento worktree

Questo è il punto più rilevante per chi (come noi) sta testando l'isolamento. **I due package lo implementano in modo completamente diverso.**

### Nicobailon: worktree come PARAMETRO di lancio

L'isolamento è **prima classe e integrato**. Si attiva per-lancio, tipicamente sui gruppi di task paralleli:

```js
{ tasks: [
  { agent: "worker", task: "Implement auth" },
  { agent: "worker", task: "Implement API" }
], worktree: true }    // ← flag singolo
```

Caratteristiche (dal README ufficiale):

- È un **parametro**, non un file di config: decidi lancio per lancio.
- Ha un **hook di setup** personalizzabile: `worktreeSetupHook` (script `.mjs`) che gira una volta per worktree e può dichiarare `syntheticPaths` (file da escludere dal diff).
- **Requisiti rigidi**: devi essere in un repo git, la **working tree deve essere pulita**, `node_modules/` viene **symlinkato** in ogni worktree, i `cwd` per-task devono matchare.
- Dopo il completamento: **diff stats per agente** appendute all'output + **patch file** scritti negli artifacts.
- Cleanup in blocchi `finally` (più robusto).

### Gotgenes: worktree via COMPANION separato, opt-in per tipo

L'isolamento **non è nel core**. Richiede un secondo package (`@gotgenes/pi-subagents-worktrees`) che registra un `WorkspaceProvider`. È **opt-in per tipo di agente** tramite un file di config:

```json
// .pi/subagents-worktrees.json
{ "worktreeAgents": ["general-purpose"] }
```

Caratteristiche (verificate leggendo il codice installato, vedi `pi-subagents-tutorial.md`):

- È **per-tipo**, non per-lancio: ogni figlio di quel tipo viene isolato, sempre.
- **Non** richiede working tree pulita niente setup hook: crea un worktree detached a `HEAD` in `os.tmpdir()` (es. `C:\Users\...\Temp\pi-agent-<id>-<uuid>`).
- Commit automatico su branch `pi-agent-<id>` a fine lavoro; il worktree viene rimosso.
- ⚠️ **Trappola del caching** (verificata empiricamente): la config si legge una sola volta all'avvio del processo; `/reload` e resume non bastano, serve riavvio completo. Vedi `pi-subagents-tutorial.md` §7.
- ⚠️ **Residuo Windows**: su Windows la directory temp non sempre viene cancellata dal disco.

### Tabella sintesi worktree

|   | nicobailon (integrato) | gotgenes (companion) |
| --- | --- | --- |
| **Granularità** | per-lancio (flag) | per-tipo-di-agente (config) |
| **Setup hook** | ✅ `worktreeSetupHook` | ❌ |
| **node_modules symlink** | ✅ automatico | ❌ |
| **Working tree pulita richiesta** | ✅ sì | ❌ no |
| **Diff/patch artifacts** | ✅ per-agente | ❌ (solo commit su branch) |
| **Posizione worktree** | (non specificato nel README) | `os.tmpdir()` |
| **Caching config** | n/a (è un flag) | ⚠️ trappola del riavvio |
| **Complessità setup** | bassa (un flag) | media (2 package + ordine + config + riavvio) |

> **Giudizio pratico:** per usare l'isolamento worktree, **nicobailon è drasticamente più semplice** (un flag, niente companion, niente riavvii). Gotgenes offre invece un'architettura "provider" più estensibile (il companion è solo *un* WorkspaceProvider possibile) e l'opzione opt-in per-tipo, ma a costo di molta più configurazione e delle trappole documentate.

---

## 6. Confronto dei tipi di agente (builtin)

### Nicobailon — 8 agent di ruolo (opinione forte sull'orchestrazione)

```text
scout           → ricognizione veloce del codice (file, entry point, rischi)
researcher      → ricerca web/docs con fonti (richiede pi-web-access)
planner         → piano di implementazione (legge, non edita)
worker          → implementa, edita file, valida, scala le decisioni non approvate
reviewer        → code review e fix piccole
context-builder → setup forte prima di planning (scrive context.md, meta-prompt.md)
oracle          → secondo parere prima di agire (critica, non edita)
delegate        → delegato generico leggero (comporta come il parent)
```

C'è una **regola pratica** dichiarata dal README: `scout` prima di capire il codice, `researcher` prima di fidarti di fatti esterni, `planner` prima di un cambiamento grosso, `worker` per implementare, `reviewer` per controllare, `oracle` quando la decisione è rischiosa. È un'opinione di workflow integrata nel package.

### Gotgenes — 3 agent generici (mattoni neutri)

```text
general-purpose → "Parent twin": eredita il system prompt completo del parent, tutti i tool
Explore         → esplorazione read-only veloce (haiku)
Plan            → architetto per planning implementativo read-only
```

Nessuna opinione di workflow: ti dà un'esploratore, un pianificatore e un agente generico. I ruoli specializzati li **definisci tu** con file `.pi/agents/<name>.md`.

> **Differenza culturale:** nicobailon ti dice *come* strutturare il lavoro (ruoli + loop `clarify → planner → worker → fresh reviewers → worker`); gotgenes ti dà il minimo indispensabile e ti aspetta che l'orchestrazione arrivi dal tuo prompt o da un tuo agente custom.

---

## 7. Tool, comandi e orchestrazione

### Nicobailon — superficie ricca

### Slash command

- `/run <agent>`, `/chain a -> b`, `/parallel a -> b`, `/run-chain <chain>`
- `/subagents-doctor`, `/subagents-models`
- **Prompt template pronti:** `/parallel-review`, `/review-loop`, `/parallel-research`, `/parallel-context-build`, `/parallel-handoff-plan`, `/gather-context-and-clarify`, `/parallel-cleanup`

**Tool `subagent`** con molte azioni: `list`, `get`, `create`, `update`, `delete`, `status`, `interrupt`, `resume`, `append-step`, `doctor` + modalità `agent`/`tasks`/`chain`.

**Orchestrazione:** chain sequenziali, parallele, fanout dinamico da structured output, loop di review, context forked (sessione ramificata reale dal leaf del parent).

### Gotgenes — superficie minimale

**Slash command:** `/subagents:settings`, `/subagents:sessions`.

**Tool:** solo `subagent`, `get_subagent_result`, `steer_subagent`.

**Punto di forza unico:** **`steer_subagent`** — reindirizzare un figlio *mentre gira* senza riavviarlo. Nicobailon non ha un equivalente documentato (ha `interrupt`/`resume`, che è diverso: ferma e riprende, non devia a caldo).

> Se la **steering a caldo** ti serve, gotgenes ha una caratteristica che nicobailon non offre. Se ti serve **orchestrazione complessa** (chain, fanout, loop), nicobailon la offre out-of-the-box mentre con gotgenes la devi costruire.

---

## 8. Il fatto sorprendente: i due ecosistemi interagiscono

Qui un dettaglio non ovvio e importante. Il README di **nicobailon** `pi-subagents` (su pi.dev) dedica una sezione esplicita all'integrazione con **`@gotgenes/pi-permission-system`**:

> *"pi-subagents passes the parent session identity to child processes via the `PI_SUBAGENT_PARENT_SESSION` environment variable, which the permission system uses to forward `ask` prompts from headless subagent processes back to the parent session's UI."*

**Questo è lo stesso meccanismo che abbiamo letto nel codice gotgenes.** In `@gotgenes/pi-permission-system/src/forwarded-permissions/permission-forwarder.ts` si legge `SUBAGENT_PARENT_SESSION_ENV_CANDIDATES`, e il forwarder cerca `PI_SUBAGENT_PARENT_SESSION` per sapere a quale sessione parent inoltrare i prompt `ask`.

### Cosa significa concretamente

```text
                    imposta PI_SUBAGENT_PARENT_SESSION
   nicobailon  ────────────────────────────────────────►  figlio (headless)
   pi-subagents     quando fa spawnare un figlio                  │
                                                                  │ legge la env var
   @gotgenes                       ◄──────────────────────────────┤
   pi-permission-system              forward del prompt ask        │
   (dentro il figlio)                                             ▼
                                                          chiede conferma → parent UI
```

- **Il layer permessi è portabile.** `@gotgenes/pi-permission-system` funziona con **qualsiasi** package di subagent che rispetti la convenzione `PI_SUBAGENT_PARENT_SESSION` — non solo con `@gotgenes/pi-subagents`.
- Quindi puoi in teoria usare **nicobailon `pi-subagents` (per la sua orchestrazione ricca) + gotgenes `pi-permission-system` (per la governance allow/ask/deny)**. Non sono mutualmente esclusivi sul layer permessi.

> ⚠️ **Trasparenza (aggiornamento):** questo è quello che **dichiara** il README di nicobailon ed è **coerente col codice** gotgenes. **Ed è stato validato empiricamente** in un test con 2 worker nicobailon in worktree: la sequenza `forwarded_permission.request_created → prompted → approved → response_received` è apparsa nel log di review correlata al millisecondo con il `permission_request` del figlio (vedi `pi-subagents-tutorial.md` §15.5). Il forwarding cross-ecosistema funziona davvero.

---

## 9. Cosa significa per l'interazione permessi + worktree (rilettura)

Nel documento precedente abbiamo analizzato in dettaglio (leggendo il codice) come interagiscono permessi e worktree nel setup **gotgenes**. Rileggiamolo alla luce del confronto:

|   | **Setup gotgenes** (cosa abbiamo testato) | **Setup nicobailon** (dal README) |
| --- | --- | --- |
| **Worktree** | companion `pi-subagents-worktrees`, cwd del figlio = path in `os.tmpdir()` | integrato, `worktree: true` |
| **Permesso "external_directory"** | valutato rispetto alla cwd del figlio (il worktree) → i path del repo originale diventano "external" | (non documentato; dipende da quale permission layer usi) |
| **Forwarding prompt ask** | via `PI_SUBAGENT_PARENT_SESSION` (gotgenes) | via `PI_SUBAGENT_PARENT_SESSION` (stessa env var!) |
| **Trabocchetto path assoluti** | sì: regole `path` con path assoluti al repo originale non matchano nel worktree | (non testato) |

**Conclusione importante:** il meccanismo di forwarding dei permessi (`PI_SUBAGENT_PARENT_SESSION`) è **condiviso tra i due ecosistemi** e ora **validato empiricamente** su entrambi. Le differenze operative nell'interazione worktree+permessi dipendono dal **come** ciascun package posiziona il worktree e dai file "side-channel" che tiene fuori dal worktree. Per gotgenes (che salva poco fuori dal worktree) l'interazione è pulita; per nicobailon l'abbiamo verificata e c'è un caso reale: il file `progress.md` del `worker` (tenuto in `~/.pi/agent/sessions/...`) risulta "external" rispetto al worktree e triggera `ask` — risolvibile con la "soluzione A" (allow su `~/.pi/agent/sessions/*`). Dettagli e catena causale in `pi-subagents-tutorial.md` §15.

---

## 10. Quale scegliere

### Scegli nicobailon `pi-subagents` se

- Vuoi **massima funzionalità out-of-the-box**: 8 agent di ruolo, chain, fanout dinamico, loop di review.
- Vuoi **worktree isolation semplice** (un flag `worktree: true`, niente companion, niente riavvii).
- Ti piace un'**opinione di workflow** integrata (scout→planner→worker→reviewer).
- Vuoi prompt template pronti (`/parallel-review`, `/review-loop`, …).
- Ti serve **intercom** (figli che chiedono decisioni al parent a metà lavoro) o **acceptance gates**.

### Scegli gotgenes `@gotgenes/pi-subagents` (+ companion) se

- Vuoi un **core minimal in-process** su cui costruire la tua orchestrazione.
- Ti serve la **steering a caldo** (`steer_subagent`, deviare un figlio mentre gira).
- Ti piace la **composabilità** (il monorepo gotgenes ha 8 package che si incastrano: permessi, autoformat, github-tools, …).
- Vuoi isolamento **per-tipo-di-agente** (config dichiarativa) invece che per-lancio.
- Sei disposto a gestire la **trappola del riavvio** della config worktree.

### In comune (entrambi)

- Custom agents via file `.md` con frontmatter.
- Integrazione con `@gotgenes/pi-permission-system` (stessa env var).
- Background runs, diagnostica.

> **Non c'è un "vincitore" oggettivo.** Dipende da se preferisci "batteria inclusa con opinione" (nicobailon) o "mattoni componibili neutrali" (gotgenes).

---

## 11. Possono convivere nello stesso progetto

**No, non dovresti installarli entrambi.** Motivazioni:

1. **Conflitto sul tool `subagent`.** Entrambi registrano un tool chiamato `subagent` (con firme e azioni diverse: gotgenes ha `get_subagent_result`/`steer_subagent`, nicobailon ha `action: "list"|"status"|...`). L'ultimo caricato vincerebbe o ci sarebbero ambiguità.
2. **Path di discovery sovrapposti.** Entrambi leggono `~/.pi/agent/agents/` e `.pi/agents/` per i custom agent, e potrebbero entrambi voler registrare builtin con gli stessi nomi (es. se definisci un tuo `reviewer`).
3. **Ordine di load imprevedibile** → comportamenti silenti (lo stesso tipo di problema già visto con gotgenes worktrees che dipende dall'ordine).

**Regola pratica:** scegli **uno** dei due come package di subagent. Puoi però **mescolare i companion** degli altri ecosistemi dove ha senso:

- nicobailon `pi-subagents` + gotgenes `pi-permission-system` → ✅ (contratto env var condiviso, dichiarato dal README **e validato empiricamente**, vedi §8).
- gotgenes `pi-subagents` + gotgenes `pi-subagents-worktrees` + gotgenes `pi-permission-system` → ✅ (è quello che abbiamo testato).
- nicobailon `pi-subagents` + gotgenes `pi-subagents-worktrees` → ❌ (il companion gotgenes si aggancia alla service API di `@gotgenes/pi-subagents`, non a quella di nicobailon).

---

## 12. Trasparenza sulle fonti

### Verificato direttamente

- `package.json` di `@gotgenes/pi-subagents` v18.0.1 installato in `~/.pi/agent/npm/node_modules/` → autore Chris Lasher, "friendly fork of @tintinweb/pi-subagents".
- Codice di `@gotgenes/pi-subagents-worktrees/src/worktree.ts` e `@gotgenes/pi-permission-system/src/forwarded-permissions/permission-forwarder.ts` → letti a mano per le affermazioni su path worktree e forwarding permessi.
- Registry npm per `pi-subagents` → autore Nico Bailon, ~27.800 download/settimana, repo `nicobailon/pi-subagents`.
- Documentazione pi.dev (`https://pi.dev/packages/pi-subagents?name=subagents`) estratta integralmente il 2026-06-28 → tutte le feature di nicobailon (8 builtin, chain, worktree integrato, intercom, acceptance gates, env var `PI_SUBAGENT_PARENT_SESSION`).

### Non testato a runtime (caveat)

**Aggiornamento (post-test):** `pi-subagents` (nicobailon) **è stato installato e testato end-to-end** (2 worker paralleli + `worktree: true`). Le feature di orchestrazione documentate sopra sono confermate a runtime. Il posizionamento del worktree è stato verificato dal codice (`src/runs/shared/worktree.ts`): path `os.tmpdir()/pi-worktree-<runId>-<index>`, branch `pi-parallel-<runId>-<index>`, symlink di `node_modules`, cleanup con `branch -D`.

- La combinazione ibrida nicobailon-subagents + gotgenes-permission-system è ora **validata empiricamente**: il forwarding dei prompt `ask` via `PI_SUBAGENT_PARENT_SESSION` funziona (sequenza completa nel log di review). Vedi §8.
- L'interazione worktree+permessi è stata verificata su **entrambi** gli stack, con il caso reale `progress.md` su nicobailon e la soluzione A. Dettagli in `pi-subagents-tutorial.md` §15.

**Numeri di download:** i ~27.800/settimana di nicobailon vs i minori di gotgenes indicano adozione, non qualità. Sono un proxy per "punto di riferimento della community", non un giudizio tecnico.

---

*Documento generato il 2026-06-28. Correlati: `pi-subagents-nicobailon-guida.md` (guida completa del package nicobailon ora attivo), `pi-gotgenes-packages-guida.md` (reference tecnica gotgenes, §3.6/3.7), `pi-subagents-tutorial.md` (tutorial da zero con appendice permessi+worktree).*
