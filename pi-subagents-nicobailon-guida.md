# pi-subagents (nicobailon) — Guida completa

> Guida d'uso e configurazione del package [`pi-subagents`](https://github.com/nicobailon/pi-subagents) di **Nico Bailon** — il package di sub-agent documentato ufficialmente su [pi.dev](https://pi.dev/packages/pi-subagents).
> È **alternativo** a `@gotgenes/pi-subagents` + `@gotgenes/pi-subagents-worktrees` (vedi [§1](#1-identità-e-relazione-con-gotgenes)).

**Versione di riferimento:** rolling (snapshot pi.dev 2026-06-28) · pi 0.80.x.
Tutte le feature, i comandi e i parametri sono tratti dal README ufficiale pi.dev + dal codice installato; il comportamento chiave (worktree, forwarding permessi) è **validato empiricamente** in un test end-to-end nel repo `pi-test`.

## Indice

1. [Identità e relazione con gotgenes](#1-identità-e-relazione-con-gotgenes)
2. [Installazione (e sostituzione di gotgenes)](#2-installazione-e-sostituzione-di-gotgenes)
3. [Gli 8 agent builtin](#3-gli-8-agent-builtin)
4. [Uso in linguaggio naturale (il modo più semplice)](#4-uso-in-linguaggio-naturale-il-modo-più-semplice)
5. [Slash command e orchestrazione](#5-slash-command-e-orchestrazione)
6. [Il tool `subagent` (uso programmatico)](#6-il-tool-subagent-uso-programmatico)
7. [Worktree isolation integrato](#7-worktree-isolation-integrato)
8. [Agent personalizzati (frontmatter)](#8-agent-personalizzati-frontmatter)
9. [Chain: workflow riutilizzabili](#9-chain-workflow-riutilizzabili)
10. [Configurazione](#10-configurazione)
11. [Intercom (figlio → parent)](#11-intercom-figlio--parent)
12. [Integrazione con i permessi (validato)](#12-integrazione-con-i-permessi-validato)
13. [Diagnostica e osservabilità](#13-diagnostica-e-osservabilità)
14. [Migrazione da gotgenes](#14-migrazione-da-gotgenes)
15. [Trasparenza sulle fonti](#15-trasparenza-sulle-fonti)

---

## 1. Identità e relazione con gotgenes

`pi-subagents` (npm, **senza scope**) è di **Nico Bailon** ([github.com/nicobailon/pi-subagents](https://github.com/nicobailon/pi-subagents), ~27.800 download/settimana). È il package **linkato dal sito ufficiale** [pi.dev/packages/pi-subagents](https://pi.dev/packages/pi-subagents).

È **alternativo** (non complementare) a `@gotgenes/pi-subagents` di Chris Lasher. La differenza filosofica:

|   | **pi-subagents (nicobailon)** | **@gotgenes/pi-subagents** |
| --- | --- | --- |
| Filosofia | **Framework tutto-incluso** | Core minimal componibile |
| Builtin | **8 agent di ruolo** | 3 agent generici |
| Worktree | **Integrato** (`worktree: true`) | Companion separato (`pi-subagents-worktrees`) |
| Orchestrazione | Chain, parallel, fanout dinamico, loop | Steering mid-run (`steer_subagent`) |
| Opinione di workflow | Sì (scout→planner→worker→reviewer) | No (mattoni neutrali) |

> Per il confronto tecnico completo vedi [`pi-subagents-confronto.md`](./pi-subagents-confronto.md). **Non installarli insieme** (conflitto sul tool `subagent` e sui path di discovery).

### Possono convivere con altri package gotgenes

**Sì, sul layer permessi.** `pi-subagents` (nicobailon) si integra esplicitamente con `@gotgenes/pi-permission-system` tramite la env var `PI_SUBAGENT_PARENT_SESSION`. Quindi la combinazione **nicobailon subagents + gotgenes permission-system è supportata e validata empiricamente** (vedi [§12](#12-integrazione-con-i-permessi-validato)).

---

## 2. Installazione (e sostituzione di gotgenes)

### Installazione pulita

```bash
pi install npm:pi-subagents
```

È l'unico passo richiesto. Non serve creare config, agent, o imparare slash command per iniziare (vedi [§4](#4-uso-in-linguaggio-naturale-il-modo-più-semplice)).

### Se provieni da @gotgenes (sostituzione)

Devi **rimuovere entrambi** i package gotgenes dei subagent, ma **tenere** il permission-system:

```bash
pi remove npm:@gotgenes/pi-subagents
pi remove npm:@gotgenes/pi-subagents-worktrees
pi install npm:pi-subagents
```

| Package gotgenes | Cosa farne |
| --- | --- |
| `@gotgenes/pi-subagents` | ❌ **Rimuovere** — conflitto sul tool `subagent` |
| `@gotgenes/pi-subagents-worktrees` | ❌ **Rimuovere** — companion incompatibile (si aggancia alla service API gotgenes) |
| `@gotgenes/pi-permission-system` | ✅ **Tenere** — nicobailon ci si integra nativamente |
| Altri gotgenes (`pi-nocd`, `pi-autoformat`, …) | ✅ **Tenere** — non confliggono |

Poi:

1. **Rimuovi il config morto** gotgenes-worktrees se esiste: `rm .pi/subagents-worktrees.json` (non ha più un lettore).
2. **Riavvia pi completamente** (la lista package in `settings.json` si legge all'avvio del processo — `/reload` non riesgeca le factory delle estensioni).

Vedi [§14](#14-migrazione-da-gotgenes) per la guida di migrazione dettagliata.

---

## 3. Gli 8 agent builtin

Il package include 8 agent di ruolo pronti all'uso. **Ereditano il model default di pi** (non pinnati a un provider), così un'installazione nuova non dipende da un provider che potresti non aver configurato.

| Agent | Quando usarlo |
| --- | --- |
| `scout` | **Ricognizione veloce** del codice: file rilevanti, entry point, data flow, rischi, da dove un altro agente dovrebbe partire |
| `researcher` | **Ricerca web/docs con fonti**: doc ufficiali, spec, benchmark, cambiamenti recenti, brief sintetico. Richiede `pi-web-access` |
| `planner` | **Piano di implementazione** concreto dal contesto esistente. Legge e pianifica, non edita |
| `worker` | **Lavoro di implementazione**, incluse le handoff approvate da oracle. Edit file, valida, scala le decisioni non approvate invece di indovinare |
| `reviewer` | **Code review e piccole fix**. Controlla l'implementazione vs task/piano, test, edge case, semplicità |
| `context-builder` | **Setup più forte prima del planning**: raccoglie contesto e scrive materiale di handoff (`context.md`, `meta-prompt.md`) |
| `oracle` | **Secondo parere prima di agire**. Critica assunzioni, coglie il drift, raccomanda la mossa più sicura senza editare |
| `delegate` | **Delegato generico leggero** quando vuoi un figlio che si comporta vicino al parent |

### Regola pratica (dichiarata dal README)

- `scout` **prima** di capire il codice
- `researcher` **prima** di fidarti di fatti esterni
- `planner` **prima** di un cambiamento grosso
- `worker` per implementare
- `reviewer` per controllare
- `oracle` quando la decisione stessa è rischiosa

### Model thinking e contesto

- `planner`, `worker`, `oracle` usano di default il **contesto forked** (sessione ramificata dal leaf del parent) quando il lancio omette `context`. Passa `context: "fresh"` per un figlio pulito.
- Per cambiare il model di un ruolo senza copiare il file: vedi [§10](#10-configurazione) (`agentOverrides`).

---

## 4. Uso in linguaggio naturale (il modo più semplice)

**Non serve imparare slash command né parametri.** Dopo l'installazione, chiedi a pi la delega in linguaggio naturale:

```text
Use reviewer to review this diff.
```

```text
Ask oracle for a second opinion on my current plan.
```

```text
Use scout to understand this code based on our discussion then ask me clarification questions.
```

```text
Run parallel reviewers: one for correctness, one for tests, and one for unnecessary complexity.
```

Pi decide se chiamare `subagent`, quale agente usare, e se ha senso una chain o un'esecuzione parallela.

### Pattern di orchestrazione raccomandato

Per lavoro di implementazione, il loop consigliato dal README è:

```text
clarify → planner → worker → fresh reviewers → worker
```

I prompt template pronti ([§5](#5-slash-command-e-orchestrazione)) rendono questo pattern ripetibile.

---

## 5. Slash command e orchestrazione

### Comandi diretti

| Comando | Descrizione |
| --- | --- |
| `/run <agent> [task]` | Esegue un agente; ometti il task per agent self-contained |
| `/chain a1 "t1" -> a2 "t2"` | Esegue agent in sequenza |
| `/parallel a1 "t1" -> a2 "t2"` | Esegue agent in parallelo |
| `/run-chain <chainName> -- <task>` | Lancia una chain salvata (`.chain.md`/`.chain.json`) |
| `/subagents-doctor` | Diagnostica setup read-only |
| `/subagents-models [agent]` | Mostra il mapping model runtime (opz. filtrato a un builtin) |

I comandi validano i nomi agent localmente, supportano il **tab completion**, e rimandano il risultato in conversazione.

### Per-step task e config inline

Separa gli step con `->` e dà a ciascuno il suo task:

```text
/chain scout "scan the codebase" -> planner "create an implementation plan"
```

o usa `--` come delimitatore:

```text
/chain scout -- scan code -> planner -- analyze auth
```

Config inline con `[key=value,...]` sul nome agente:

```text
/chain scout[output=context.md] "scan code" -> planner[reads=context.md] "analyze auth"
/run scout[model=anthropic/claude-sonnet-4] summarize this codebase
```

Chiavi supportate: `output`, `outputMode` (`inline`/`file-only`), `reads` (separa con `+`), `model`, `skills` (separa con `+`), `progress`.

### Background e forked

- `--bg` → background (detached). Se il parent non ha altro lavoro utile, **deve terminare il turno** invece di loopare su sleep/status.
- `--fork` → ogni figlio parte da una sessione realmente ramificata creata dal leaf del parent.
- Combinabili in qualsiasi ordine: `/run reviewer "review this diff" --fork --bg`

### Prompt template pronti (shortcut)

| Prompt | Uso |
| --- | --- |
| `/parallel-review` | Reviewer fresh-context con angoli distinti, poi sintesi di cosa fixare |
| `/review-loop` | Cicli worker→reviewer→fix-worker controllati dal parent fino a pulito o capped |
| `/parallel-research` | Combina `researcher` + `scout` per evidenza esterna e contesto locale |
| `/parallel-context-build` | `context-builder` in parallelo per handoff di planning |
| `/parallel-handoff-plan` | Ricerca esterna + `context-builder` → piano di handoff |
| `/gather-context-and-clarify` | Scout/research prima, poi chiede a te le domande di chiarimento |
| `/parallel-cleanup` | Passaggi di cleanup review-only dopo l'implementazione |

Aggiungi `autofix` a `/parallel-review` o `/parallel-cleanup` per applicare solo le fix sintetizzate che valgono la pena.

---

## 6. Il tool `subagent` (uso programmatico)

Questi sono i parametri che l'LLM passa quando chiama il tool `subagent`. La maggior parte degli utenti chiede in linguaggio naturale o usa gli slash command.

### Modalità di esecuzione

```js
// Singolo
{ agent: "worker", task: "refactor auth" }

// Forked
{ agent: "worker", task: "continue this thread", context: "fork" }

// Parallelo
{ tasks: [
  { agent: "scout", task: "audit auth", count: 3 },
  { agent: "reviewer", task: "audit backend" }
], context: "fork" }

// Chain (sequenziale, parallelo statico, fanout dinamico)
{ chain: [
  { agent: "scout", task: "Gather context", as: "context" },
  { parallel: [
    { agent: "worker", task: "Implement A from {outputs.context}", as: "featureA" },
    { agent: "worker", task: "Implement B from {outputs.context}", as: "featureB" }
  ], concurrency: 2, failFast: true },
  { agent: "reviewer", task: "Review {outputs.featureA} and {outputs.featureB}" }
]}

// Chain in background
{ chain: [...], async: true }

// Worktree isolation (vedi §7)
{ tasks: [
  { agent: "worker", task: "Implement auth" },
  { agent: "worker", task: "Implement API" }
], worktree: true }
```

### Azioni di gestione (runtime)

```js
{ action: "list" }                              // scopri agent/chain
{ action: "get", agent: "scout" }
{ action: "create", config: { name: "...", ... } }   // crea agent/chain a runtime
{ action: "update", agent: "scout", config: { ... } }
{ action: "delete", agent: "scout" }
{ action: "status" }                            // run async attivi
{ action: "status", id: "<run-id>" }            // anche nested id
{ action: "interrupt", id: "<run-id>" }
{ action: "resume", id: "<run-id>", message: "follow-up" }
{ action: "resume", id: "<run-id>", index: 1, message: "..." }  // scegli child
{ action: "append-step", id: "<run-id>", chain: [{ agent: "worker", task: "Continue from {previous}" }] }
{ action: "doctor" }
```

### Parametri chiave

| Param | Default | Descrizione |
| --- | --- | --- |
| `context` | per-agent (`fresh`/`fork`) | Override esplicito per **ogni** figlio. `fork` crea sessioni ramificate reali |
| `worktree` | `false` | Crea worktree git isolati per task paralleli (vedi [§7](#7-worktree-isolation-integrato)) |
| `concurrency` | config o `4` | Concorrenza top-level parallela |
| `async` | `false` | Esecuzione in background |
| `clarify` | `true` per chain | Mostra la TUI di preview/edit |
| `cwd` | runtime cwd | Override directory di lavoro |
| `agentScope` | `both` | Scope discovery agent (`user`/`project`/`both`) |
| `share` | `false` | Esporta la sessione in HTML e carica su GitHub Gist (richiede `gh`) |
| `acceptance` | inferred | Override gate di accettazione (`auto`/`none`/`attested`/`checked`/`verified`/`reviewed`) |

---

## 7. Worktree isolation integrato

Questa è la differenza operativa più grande rispetto a gotgenes: l'isolamento worktree è **integrato e prima classe**, non un companion separato.

### Attivazione

Un flag singolo sul lancio parallelo:

```js
{ tasks: [
  { agent: "worker", task: "Implement auth", count: 2 },
  { agent: "worker", task: "Implement API" }
], worktree: true }
```

oppure in una chain, sul gruppo parallelo:

```js
{ chain: [
  { agent: "scout", task: "Gather context" },
  { parallel: [
    { agent: "worker", task: "Implement feature A from {previous}" },
    { agent: "worker", task: "Implement feature B from {previous}" }
  ], worktree: true },
  { agent: "reviewer", task: "Review all changes from {previous}" }
]}
```

### Requisiti (rigidi)

Verificati nel codice `src/runs/shared/worktree.ts`:

- Devi essere in un **repo git**.
- La **working tree deve essere pulita** (`git status --porcelain` vuoto al toplevel, **incluse le modifiche tracciate e i file untracked**). Altrimenti: errore esplicito *"worktree isolation requires a clean git working tree"*.
- I `cwd` per-task devono essere omessi o matchare la cwd condivisa.
- `node_modules/` (se presente) viene **symlinkato** in ogni worktree.

### Come funziona (letto nel codice)

- Path: `os.tmpdir()/pi-worktree-<runId>-<index>` (es. `C:\Users\...\Temp\pi-worktree-abc-0`).
- Branch: `pi-parallel-<runId>-<index>` (branch vero, non detached).
- Creazione: `git worktree add <path> -b <branch> HEAD`.
- Hook opzionale `worktreeSetupHook` (script `.mjs`) gira una volta per worktree e può dichiarare `syntheticPaths` (file da escludere dal diff). Richiede stdout JSON.

### Risultato e cleanup

- Dopo il completamento, per-agent **diff stats** appendute all'output e **patch file** scritti negli artifacts.
- **Cleanup in blocchi `finally`**: i worktree vengono rimossi (`git worktree remove --force`) e i branch cancellati (`git branch -D`). **Non lascia branch persistenti** (diversamente da gotgenes che lascia `pi-agent-*` da mergiare).
- Per recuperare il lavoro: applica la patch file generata.

### Worktree e permessi (importante)

Vedi [§12](#12-integrazione-con-i-permessi-validato): un figlio in worktree ha cwd = path del worktree; i file "side-channel" salvati fuori (es. `progress.md`) possono triggerare `external_directory: ask`. Soluzione A applicata: vedi `pi-subagents-tutorial.md` §15.

---

## 8. Agent personalizzati (frontmatter)

Gli agent sono file Markdown con frontmatter YAML + corpo system prompt. Posizionamento (priorità crescente):

| Scope | Path |
| --- | --- |
| Builtin | `~/.pi/agent/extensions/subagent/agents/` |
| Installed package | `package.json` `pi-subagents.agents` o `pi.subagents.agents` |
| User | `~/.pi/agent/agents/**/*.md` |
| Project | `.pi/agents/**/*.md` (anche legacy `.agents/**/*.md`) |

I builtin caricano a priorità minima: un agent user/project con lo stesso nome li **override**.

### Frontmatter completo (esempio scout)

```yaml
---
name: scout
package: code-analysis          # opzionale: registra come code-analysis.scout
description: Fast codebase recon
tools: read, grep, find, ls, bash, mcp:chrome-devtools
extensions:                     # omesso=normali; vuoto=nessuna; lista=allowlist
subagentOnlyExtensions: ./tools/child-only-search.ts
model: claude-haiku-4-5
fallbackModels: openai/gpt-5-mini, anthropic/claude-sonnet-4
thinking: high
systemPromptMode: replace       # replace (default) o append
inheritProjectContext: false
inheritSkills: false
skills: safe-bash, chrome-devtools
output: context.md
defaultReads: context.md
defaultProgress: true
completionGuard: false
interactive: true
maxSubagentDepth: 1
---
Your system prompt goes here.
```

### Campi chiave

| Campo | Note |
| --- | --- |
| `package` | Identificatore opzionale. `name: scout` + `package: code-analysis` → runtime name `code-analysis.scout` |
| `tools` | Allowlist tool builtin. `mcp:` seleziona direct MCP tools (richiede `pi-mcp-adapter`). Se omesso, il figlio ha i builtin normali |
| `extensions` | Omesso=tutte; vuoto=nessuna; lista=allowlist specifiche. Ha precedenza sui path implicati da `tools` |
| `subagentOnlyExtensions` | Estensioni caricate solo nelle sessioni figlie di questo agent |
| `model` | Bare id preferisce il provider corrente, poi match unici nel registry |
| `fallbackModels` | Backup ordinati per **failure di provider/model** (quota, auth, timeout). Task failure ordinarie NON triggerano fallback |
| `thinking` | Appeso come suffisso `:level` a runtime (se non già presente) |
| `systemPromptMode` | `replace` (default, prompt pulito) o `append` (mantiene il base prompt di pi) |
| `inheritProjectContext` | Mantiene/stripa i blocchi di project instruction (AGENTS.md, CLAUDE.md) |
| `inheritSkills` | Mantiene/stripa il catalogo skill di pi |
| `defaultContext` | Default `fresh`/`fork` per i lanci che omettono `context` |
| `skills` | Aggiunge skill specifiche indipendentemente da `inheritSkills` |
| `maxSubagentDepth` | Stringe la delegazione nested per i figli di questo agent |

### Selezione tool ed estensioni (casi)

- `tools` omesso + `extensions` omesso → builtin normali + estensioni normali.
- `tools: mcp:chrome-devtools` → builtin normali + Chrome DevTools MCP diretto.
- `tools: read, bash, mcp:chrome-devtools` → solo `read`+`bash` builtin + Chrome DevTools MCP.
- `tools: subagent, read` → il figlio ha un `subagent` child-safe per fanout esplicito.

> I direct MCP tools richiedono `pi-mcp-adapter`. Un agent riceve direct MCP tools solo se li elenca con `mcp:` nel frontmatter; il global `directTools: true` in `mcp.json` **non basta** da solo.

---

## 9. Chain: workflow riutilizzabili

Le chain sono workflow salvati separatamente dagli agent. `.chain.md` per chain sequenziali semplici; `.chain.json` quando serve fanout dinamico.

| Scope | Path |
| --- | --- |
| Installed package | `package.json` `pi-subagents.chains` o `pi.subagents.chains` |
| User | `~/.pi/agent/chains/**/*.chain.{md,json}` |
| Project | `.pi/chains/**/*.chain.{md,json}` |

### Esempio `.chain.md`

```markdown
---
name: scout-planner
description: Gather context then plan implementation
---

## scout
phase: Context
label: Map auth flow
as: context
output: context.md

Analyze the codebase for {task}

## planner
phase: Planning
label: Implementation plan
reads: context.md
model: anthropic/claude-sonnet-4-5:high
progress: true

Create an implementation plan based on {outputs.context}
```

Ogni sezione `## agent-name` è uno step. Le righe di config (`phase`, `label`, `as`, `outputSchema`, `output`, `outputMode`, `reads`, `model`, `skills`, `progress`) vanno subito dopo l'header.

### Variabili nei task

| Variabile | Descrizione |
| --- | --- |
| `{task}` | Task originale del primo step |
| `{previous}` | Output dello step precedente (o aggregato di uno step parallelo) |
| `{chain_dir}` | Path alla directory artifact della chain |
| `{outputs.name}` | Valore testuale di uno step precedente o task parallelo completato con `as: "name"` |

### Fanout dinamico (solo `.chain.json` o `subagent({chain:[...]})` diretto)

Espande un array da uno structured output precedente, lancia un child template per item, raccoglie la collezione in `collect.as`:

```json
{
  "name": "dynamic-review",
  "chain": [
    { "agent": "scout", "task": "Return {\"items\":[...]}", "as": "targets", "outputSchema": { "type": "object" } },
    { "expand": { "from": { "output": "targets", "path": "/items" }, "item": "target", "key": "/path", "maxItems": 12 },
      "parallel": { "agent": "reviewer", "task": "Review {target.path}", "outputSchema": { "type": "object" } },
      "collect": { "as": "reviews" }, "concurrency": 4 },
    { "agent": "worker", "task": "Synthesize fixes from {outputs.reviews}" }
  ]
}
```

`expand.maxItems` è obbligatorio; gli array oltre limite falliscono; niente fanout nested né espressioni arbitrarie.

---

## 10. Configurazione

Il package legge config JSON opzionale da `~/.pi/agent/extensions/subagent/config.json`.

### `asyncByDefault`

```json
{ "asyncByDefault": true }
```

Le chiamate top-level usano il background quando la richiesta non setta esplicitamente `async`. I caller possono ancora forzare foreground con `async: false` (a meno che `forceTopLevelAsync` sia attivo).

### `forceTopLevelAsync`

```json
{ "forceTopLevelAsync": true }
```

Forza single/parallel/chain depth-0 in background e bypassa la clarify UI (`clarify: false`). Le chiamate nested mantengono le loro impostazioni ereditate.

### `parallel`

```json
{ "parallel": { "maxTasks": 12, "concurrency": 6 } }
```

`maxTasks` default `8`; `concurrency` default `4`. Il `concurrency` per-call ha precedenza.

### `defaultSessionDir`

```json
{ "defaultSessionDir": "~/.pi/agent/sessions/subagent/" }
```

Precedenza: `params.sessionDir` → `config.defaultSessionDir` → dir derivata dal parent. Sessioni sempre abilitate.

### `maxSubagentDepth`

```json
{ "maxSubagentDepth": 1 }
```

Controlla la delegazione nested quando non c'è un `PI_SUBAGENT_MAX_DEPTH` ereditato. Il `maxSubagentDepth` per-agent può **stringere** il limite per i figli di quell'agent, ma non rilassarlo. Di default: 2 livelli (main → subagent → sub-subagent). Deeper: bloccato con guida a completare direttamente.

Variabili d'ambiente: `PI_SUBAGENT_MAX_DEPTH` (imposta prima di avviare pi); `PI_SUBAGENT_DEPTH` è interna e propagata automaticamente (non impostarla manualmente).

### `intercomBridge`

```json
{ "intercomBridge": { "mode": "always", "instructionFile": "./intercom-bridge.md" } }
```

Controlla se i subagent ricevono istruzioni runtime di coordination intercom e se `intercom`/`contact_supervisor` sono auto-aggiunti alla tool allowlist. `mode`: `always` (default), `fork-only`, `off`. Richiede `pi-intercom` installato. Vedi [§11](#11-intercom-figlio--parent).

### `worktreeSetupHook`

```json
{ "worktreeSetupHook": "./scripts/setup-worktree.mjs", "worktreeSetupHookTimeoutMs": 45000 }
```

Gira una volta per worktree creato. Path assolute, `~/...`, o repo-relative (i bare command names sono rifiutati). stdin: JSON con `repoRoot`, `worktreePath`, `agentCwd`, `branch`, `index`, `runId`, `baseCommit`. stdout: un JSON object, es. `{ "syntheticPaths": [".venv", ".env.local"] }`. `syntheticPaths` deve essere relativo al worktree root; rimosso prima del diff capture. Tracked files mai esclusi. Default timeout 30000ms.

### `agentOverrides` (override builtin senza copia)

Vivi in `settings.json` (`~/.pi/agent/settings.json` o `.pi/settings.json`):

```json
{
  "subagents": {
    "agentOverrides": {
      "reviewer": {
        "model": "anthropic/claude-sonnet-4",
        "thinking": "high",
        "fallbackModels": ["openai/gpt-5-mini"]
      }
    }
  }
}
```

Campi supportati: `model`, `fallbackModels`, `thinking`, `systemPromptMode`, `inheritProjectContext`, `inheritSkills`, `defaultContext`, `disabled`, `skills`, `tools`, `systemPrompt`. Project override batte user override. Il frontmatter esplicito vince comunque.

- `disabled: true` → nasconde il builtin da discovery e `subagent({action:"list"})`.
- `subagents.disableBuiltins: true` → disabilita in blocco tutti i builtin.
- `subagents.disableThinking: true` → pulisce globalmente i default thinking dei builtin (per provider che non supportano suffissi `:low`/`:medium`/`:high`). Un override `thinking` per-agent più specifico può riattivarlo per uno.

---

## 11. Intercom (figlio → parent)

`pi-subagents` funziona **senza** `pi-intercom`. Installa `pi-intercom` solo se vuoi che i figli parlino col parent mentre girano:

```bash
pi install npm:pi-intercom
```

Dopo l'installazione, `pi-subagents` dà automaticamente ai figli un canale privato di coordination verso il parent. Uso tipico (il child può aver bisogno di una decisione invece di indovinare):

```text
Run this implementation in the background. If the worker gets blocked or needs a product decision, have it ask me through intercom.
```

Il child ha un tool dedicato:

- `contact_supervisor` — contatta il parent/supervisor. `reason: "need_decision"` per decisioni bloccanti o chiarimenti; `reason: "progress_update"` per aggiornamenti brevi non-bloccanti quando una scoperta cambia il piano. **Non** chiedere chiarimento quando l'unico conflitto è review-only/no-edit vs progress/artifact-writing: no-edit vince.

Bridge attivo: il parent invia risultati raggruppati via intercom (un messaggio raggruppato per run foreground e uno per file risultato async completato). I notice needs-attention possono apparire nel parent con azioni utili.

> La maggior parte degli utenti non chiama `intercom` direttamente. Per tuning avanzato vedi `intercomBridge` in [§10](#10-configurazione).

---

## 12. Integrazione con i permessi (validato)

`pi-subagents` compone con `@gotgenes/pi-permission-system` come **secondo layer di policy** sopra le restrizioni di visibility dei tool:

| Layer | Cosa controlla | Provider |
| --- | --- | --- |
| **Visibility** | Quali tool sono registrati prima del session start | pi-subagents (`tools:` frontmatter) |
| **Policy** | Decisioni runtime allow/ask/deny su ogni tool call, bash, MCP | pi-permission-system (`permission:` frontmatter / config) |

### Installazione

```bash
pi install npm:@gotgenes/pi-permission-system
```

Nessuna config richiesta: l'integrazione è automatica quando entrambe le estensioni sono installate.

### Come funziona (validato empiricamente)

`pi-subagents` passa l'identità della sessione parent ai processi figlio via la env var **`PI_SUBAGENT_PARENT_SESSION`**. Il permission system dentro un child, quando incontra un permesso `ask`, legge questa variabile, localizza il parent e **forwarda il prompt di conferma all'UI del parent**.

Questo risolve un prompt interattivo **solo quando il parent è la sessione interattiva** (root) — cioè per i figli diretti della sessione root. Un nipote ha come parent un processo headless senza UI, quindi i suoi `ask` non raggiungono l'UI. Conseguenza: **piazzare le policy `ask` su agent che girano come figli diretti della sessione interattiva.**

### Frontmatter `permission:` per-agent

I file agent possono includere un blocco `permission:` insieme al `tools:`:

```yaml
---
name: worker
tools: bash,read,write,edit
permission:
  "*": ask
  read: allow
  bash:
    "*": ask
    "git *": allow
    "npm test": allow
---
```

### Worktree + permessi: il caso `progress.md` (validato empiricamente)

In un test con 2 `worker` paralleli + `worktree: true`, ogni worker (con `defaultProgress`) mantiene un `progress.md` salvato **fuori dal worktree** (`~/.pi/agent/sessions/.../subagent-artifacts/progress/...`). La cwd del worker è il worktree → il path di `progress.md` è "external" → trigger `external_directory: ask` → prompt forwardato al parent. Il **lavoro reale** dentro il worktree (creare file in `scripts/`) non genera mai prompt.

**Soluzione A** (applicata e validata: prompt forwardati 4 → 0): nel config del permission-system, permetti la cartella sessioni mantenendo `ask` come default:

```json
"external_directory": { "*": "ask", "~/.pi/agent/sessions/*": "allow" }
```

Dettagli completi e catena causale in `pi-subagents-tutorial.md` §15.

### Diagnostica

`/subagents-doctor` controlla lo status del permission system. Se gli `ask` dai child non raggiungono l'UI parent, verifica che entrambe le estensioni siano installate (`pi list`).

---

## 13. Diagnostica e osservabilità

- **`/subagents-doctor`** — diagnostica setup read-only (subagent + intercom + permission system).
- **`/subagents-models [agent]`** — mapping model runtime caricato (può differire da settings su disco finché non ricarichi pi).
- **`subagent({ action: "status" })`** — run async attivi; `status` con `id` resolve id esatti, top-level async, e id nested.
- **Widget async** + notifiche di completamento. I run paralleli mostrano progress per-agent. Le chain con gruppi paralleli mantengono la forma raggruppata.
- **Live progress** (foreground): tool corrente, output recente, conteggi token, durata, activity freshness. `Ctrl+O` espande la vista streaming completa per step.

### File di log/artifact

Ogni chain run crea una dir temp user-scoped:

```text
<tmpdir>/pi-subagents-<scope>/chain-runs/{runId}/
```

Può contenere `context.md`, `plan.md`, `progress.md`, `parallel-{stepIndex}/.../output.md`. Directory più vecchie di 24h vengono pulite all'avvio dell'estensione.

Artifact debug sotto `{sessionDir}/subagent-artifacts/` o dir temp user-scoped. Per task:

- `{runId}_{agent}_input.md` / `{runId}_{agent}_output.md`
- `{runId}_{agent}.jsonl` / `{runId}_{agent}_meta.json`
- (worktree) `{sessionDir}/subagent-artifacts/worktree-diffs/task-<n>-<agent>.patch`

I metadata registrano timing, usage, exit code, model finale, model tentati, esiti di fallback.

### Eventi

- Async: `subagent:async-started`, `subagent:async-complete`.
- Intercom delivery: `subagent:control-intercom`, `subagent:result-intercom`.

### Acceptance gates (osservabilità del completamento)

Ogni run risolve una policy di accettazione effective. Livelli: `auto` (default), `none`, `attested`, `checked`, `verified`, `reviewed`. La provenienza è salvata separatamente dalla prosa del child:

- `claimed` — child finito senza dare evidence strutturata
- `attested` — child ha restituito un acceptance report strutturato
- `checked` — check strutturali runtime passati (evidence richiesta, no staged files)
- `verified` — comandi di verifica runtime configurati passati (il successo auto-riportato dal child non conta)
- `reviewed` — presente il risultato di un reviewer indipendente
- `rejected` — attestation/check/verification/review fallita

Per disabilitare i gate: `{ level: "none", reason: "..." }`.

---

## 14. Migrazione da gotgenes

Se passi da `@gotgenes/pi-subagents` (+ `pi-subagents-worktrees`), ecco la mappatura operativa:

### Cosa rimuovere / installare

```bash
pi remove npm:@gotgenes/pi-subagents
pi remove npm:@gotgenes/pi-subagents-worktrees
pi install npm:pi-subagents
# pi-permission-system: TENUTO (integrazione nativa)
```

Poi riavvia pi completamente.

### Mappatura dei concetti

| Concetto gotgenes | Equivalente nicobailon |
| --- | --- |
| Agent `general-purpose` | `delegate` (più simile: leggero, vicino al parent) o `worker` (per implementazione) |
| Agent `Explore` | `scout` (ricognizione) |
| Agent `Plan` | `planner` |
| Custom agent `.pi/agents/<name>.md` | Stesso formato `.md` (frontmatter più ricco, vedi [§8](#8-agent-personalizzati-frontmatter)) |
| Worktree via `.pi/subagents-worktrees.json` (per-tipo) | Worktree via flag `worktree: true` (**per-lancio**) |
| Branch `pi-agent-*` da mergiare | **Patch file** negli artifacts (niente branch persistente) |
| `steer_subagent` (deviare a caldo) | ❌ non c'è — usa `interrupt`/`resume` |
| `get_subagent_result` / `steer_subagent` | `subagent({action:"status"})`, `interrupt`, `resume` |
| `inherit_context: true/false` | `context: "fork"` / `"fresh"`, o `inheritProjectContext` frontmatter |

### Config da pulire

- `.pi/subagents-worktrees.json` → rimuovilo (lettore rimosso).
- La trappola del caching config di gotgenes-worktrees ([riavvio obbligatorio](./pi-subagents-tutorial.md#7--la-trappola-del-caching-della-config-la-cosa-più-importante)) **non si applica più** a nicobailon: il flag `worktree: true` è per-lancio, nessuna config cachata a livello di processo.

### Cambiamenti di UX da aspettarsi

- **Più funzionalità out-of-the-box**: chain, fanout dinamico, loop di review, prompt template pronti.
- **Worktree più semplice**: un flag invece di config+companion+riavvio. Ma **richiede working tree pulita** (gestisci con `git stash -u` se hai WIP).
- **Opinione di workflow più forte**: i 8 builtin suggeriscono un modo di orchestrare (scout→planner→worker→reviewer).

### Cosa perdi passando a nicobailon

- **`steer_subagent`** (deviare un figlio a caldo) — gotgenes lo ha, nicobailon no.
- **Isolamento per-tipo dichiarativo** — gotgenes lo ha via config, nicobailon usa il flag per-lancio.
- L'architettura "provider estensibile" di gotgenes (il companion è solo *un* WorkspaceProvider possibile).

---

## 15. Trasparenza sulle fonti

### Verificato direttamente

- Documentazione ufficiale [pi.dev/packages/pi-subagents](https://pi.dev/packages/pi-subagents) (README integrale estratto il 2026-06-28): tutte le feature, gli 8 builtin, i comandi, i parametri del tool `subagent`, la sezione worktree, le config, l'integrazione permessi con `PI_SUBAGENT_PARENT_SESSION`.
- Codice installato `pi-subagents/src/runs/shared/worktree.ts`: path worktree (`os.tmpdir()/pi-worktree-<runId>-<index>`), branch (`pi-parallel-<runId>-<index>`), check clean tree, symlink node_modules, cleanup con `branch -D`.
- Registry npm: autore Nico Bailon, repo `nicobailon/pi-subagents`, ~27.800 download/settimana.
- **Test end-to-end reale** nel repo `pi-test` (2026-06-28): 2 worker paralleli + `worktree: true`, validazione isolamento + parallelismo + cleanup + forwarding permessi (sequenza `forwarded_permission.*` nel log di review, prompt 4 → 0 dopo soluzione A).

### Limitazioni di questa guida

- Non tutti i parametri/casi d'uso avanzati sono testati a runtime; i più rari sono tratti dal README pi.dev.
- Le versioni del package sono rolling (snapshot pi.dev 2026-06-28); alcune API potrebbero cambiare — per il dettaglio canonico consulta sempre [pi.dev/packages/pi-subagents](https://pi.dev/packages/pi-subagents).

### Correlati

- [`pi-subagents-confronto.md`](./pi-subagents-confronto.md) — confronto tecnico nicobailon vs gotgenes.
- [`pi-subagents-tutorial.md`](./pi-subagents-tutorial.md) — tutorial da zero (concetti worktree git, isolamento, parallelismo) con appendice §15 sull'interazione permessi+worktree.
- [`pi-gotgenes-packages-guida.md`](./pi-gotgenes-packages-guida.md) — reference tecnica del monorepo gotgenes (§3.8 per i permessi).

---

*Documento generato il 2026-06-28. Fonte primaria: [pi.dev/packages/pi-subagents](https://pi.dev/packages/pi-subagents) + test end-to-end reale nel repo `pi-test`.*
