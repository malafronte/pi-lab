# Monorepo `gotgenes/pi-packages`: valutazione e guida ai pacchetti

> Valutazione e guida d'uso dei **8 pacchetti** del monorepo [`gotgenes/pi-packages`](https://github.com/gotgenes/pi-packages) (pubblicati su npm sotto `@gotgenes/`), come estensioni per pi.

**Versioni di riferimento:** pi 0.79.10 · pacchetti alle versioni elencate in ogni sezione (snapshot 2026-06-24). Tutti i comandi, i tool e gli esempi sono tratti dai README ufficiali e dal codice dei tarball scaricati (non inventati).

## Indice

1. [Considerazioni generali sul monorepo](#1-considerazioni-generali-sul-monorepo)
2. [Come installare (tutti o una selezione)](#2-come-installare-tutti-o-una-selezione)
3. [Schede dei pacchetti](#3-schede-dei-pacchetti)
   - [3.1 pi-nocd](#31-pi-nocd--anti-cd-prefix)
   - [3.2 pi-session-tools](#32-pi-session-tools--naming-e-contesto-sessione)
   - [3.3 pi-colgrep](#33-pi-colgrep--ricerca-semantica-di-codice)
   - [3.4 pi-autoformat](#34-pi-autoformat--formattazione-automatica)
   - [3.5 pi-github-tools](#35-pi-github-tools--ci-release-e-issue-su-github)
   - [3.6 pi-subagents](#36-pi-subagents--sub-agent-in-process)
   - [3.7 pi-subagents-worktrees](#37-pi-subagents-worktrees--isolamento-in-worktree-git)
   - [3.8 pi-permission-system](#38-pi-permission-system--permessi-allowaskdeny)
4. [Raccomandazioni: cosa installare e come combinarli](#4-raccomandazioni-cosa-installare-e-come-combinarli)
5. [Trasparenza sul metodo](#5-trasparenza-sul-metodo)

---

## 1. Considerazioni generali sul monorepo

- **Stesso autore, stesso processo.** Tutti e 8 i pacchetti sono di `gotgenes` (Chris Lasher), rilasciati con **CI GitHub Actions + OIDC trusted publisher** (pubblicazione npm dal CI, credenziali isolate). Coerenza di design elevata.
- **Pensati per collaborare.** Le integrazioni sono strutturate (non ad-hoc): `pi-subagents-worktrees` importa la typed service API di `pi-subagents`; `pi-permission-system` riconosce il tag `<active_agent>` iniettato dai subagent e ne legge le policy per-agent. Nessun conflitto di nomi tra comandi/tool.
- **Due filosofie di pacchetto.** Alcuni sono **verticali/utilitari** stabili (`nocd`, `session-tools`, `autoformat`, `github-tools`, `colgrep`); due sono un **ecosistema in fermento** (`pi-subagents` con 18 major in 6 settimane, `pi-permission-system` con 130 release) → possibili breaking change frequenti.
- **Compatibili con il tuo pi.** Tutti i peer-dep sono soddisfatti da pi 0.79.10.
- **Sicurezza.** Profilo buono: niente telemetria/URL esterne sospette nei sorgetti (verificato: le uniche URL sono doc/link di suggerimento), parser WASM statici, auth delegata a `gh`. Valgono comunque le avvertenze supply-chain: girano con **pieni permessi di sistema**.
- **"Installare tutti" è possibile ma spesso overkill.** Tre pacchetti richiedono prerequisiti esterni (colgrep, gh, formattatori) e senza di essi sono dead weight; due sono in forte evoluzione. Meglio una **selezione mirata** (vedi §4).

## 2. Come installare (tutti o una selezione)

**Tutti** (da git, prende HEAD del repo — non pinna la versione):

```bash
pi install git:github.com/gotgenes/pi-packages
pi remove  git:github.com/gotgenes/pi-packages    # per rimuovere
```

⚠️ `pi install git:` non pinna la versione: `pi update --extensions` porterà tutti a HEAD futuro. I pacchetti in fermento richiederebbero ri-audit dopo ogni update.

**Uno o una selezione** (da npm, raccomandato — puoi pinnare la versione):

```bash
pi install npm:@gotgenes/<nome-pacchetto>
pi install npm:@gotgenes/pi-subagents@18.0.1      # versione pinnata
```

**Via settings** (`~/.pi/agent/settings.json` globale, o `.pi/settings.json` progetto):

```json
{
  "packages": [
    "npm:@gotgenes/pi-subagents",
    "npm:@gotgenes/pi-subagents-worktrees"
  ]
}
```

> **Importante per `pi-subagents-worktrees`:** deve essere elencato **dopo** `pi-subagents`. Pi carica i pacchetti nell'ordine di `settings.json` e il primo registra la service API a cui il secondo si aggancia. Se inverti l'ordine o ometti `pi-subagents`, il worktrees "non fa nulla".

Dopo l'installazione: **riavvia pi** (richiesto una tantum). Per applicare modifiche a `settings.json` senza riavviare: `/reload`.

## 3. Schede dei pacchetti

---

### 3.1 pi-nocd — anti-`cd`-prefix

**Versione:** 1.0.0 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** nessuno · **Superficie:** minima (2 file TS)

#### A cosa serve

Pi dice all'agente qual è la directory di lavoro (`Current working directory: <path>` nel system prompt), ma **non proibisce** l'abitudine di prefissare i comandi con `cd <path> &&` o `cd $(pwd) &&`. Questa estensione appende al system prompt un'istruzione esplicita che vieta il `cd`-prefix verso la cwd corrente. Completamente passiva: nessun tool, nessun comando, solo un hook su `before_agent_start`. L'append è idempotente (se esiste già un blocco `# Working Directory`, non fa nulla).

#### Comandi introdotti

Nessuno. Nessun tool, nessuno slash command. Lavora solo sul system prompt.

#### Esempio — cosa inietta

Per una sessione con cwd `/Users/you/project`, appende al system prompt:

```markdown
# Working Directory

Shell commands already execute in `/Users/you/project`.
Never prefix a command with `cd` into the current working directory — neither `cd /Users/you/project &&` nor `cd $(pwd) &&`.
Just run the command directly.
```

#### Esempio — effetto pratico

- **Prima** (senza pi-nocd): l'agente genera comandi come `cd /Users/you/project && npm test`.
- **Dopo** (con pi-nocd): genera direttamente `npm test`. Elimina il rumore e i problemi quando il `cd` non riesce.

---

### 3.2 pi-session-tools — naming e contesto sessione

**Versione:** 1.1.0 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** nessuno · **Superficie:** bassa (4 file TS)

#### A cosa serve

Espone tool per gestire i **metadati della sessione** corrente: darle un nome leggibile (mostrato nel selettore sessioni) e leggerne il contenuto come transcript strutturato. Pensato per workflow multi-sessione (es. una sessione per fase di lavoro: Planning → TDD → Build → Retrospective).

#### Tool introdotti

| Tool | Descrizione |
|---|---|
| `set_session_name` | Imposta il nome visualizzato della sessione corrente |
| `get_session_name` | Restituisce il nome della sessione, se impostato |
| `read_session` | Legge gli entry della sessione corrente come transcript |

#### Esempio 1 — nominare la sessione

```
set_session_name({ name: "#42 Planning — Extract ExtensionPaths" })
```

Formato stage-encoded suggerito: `#N Planning — <title>`, `#N TDD — <title>`, `#N Build — <title>`, `#N Retrospective — <title>`. Il nome appare nel selettore (`/resume`, `-r`).

#### Esempio 2 — leggere il transcript (utile per retro/cross-session)

```
read_session({ types: ["message", "compaction"], limit: 20 })
```

Restituisce un transcript leggibile (turni numerati user/assistant, riassunti one-line delle tool call con stato, eventi di compaction). I body dei tool result, i thinking e le immagini sono omessi. Nella TUI vedi un riepilogo compatto (es. `✓ 42 entries — 38 messages, 18 tool calls, 2 compactions`), espandi con `Ctrl-O`. L'LLM riceve sempre il transcript completo.

Esempio di output:

```
1. user
How do I fix the login bug?
---
2. assistant [anthropic/claude-sonnet-4-20250514]
Let me check the auth flow.
  [tool] Read — path: src/auth/login.ts → completed
  [tool] Bash — command: pnpm vitest login → error
The test is failing because...
---
[compaction] Context compacted (48000 tokens before)
```

---

### 3.3 pi-colgrep — ricerca semantica di codice

**Versione:** 1.5.1 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** ⚠️ **binario `colgrep`** (da [`lightonai/next-plaid`](https://github.com/lightonai/next-plaid#colgrep)) su PATH · **Superficie:** media

#### A cosa serve

Integra [ColGrep](https://github.com/lightonai/next-plaid#colgrep) come tool dell'agente: ricerca di codice **semantica** locale (embedding multi-vettoriali ColBERT + parsing tree-sitter), che combina filtro regex con ranking semantico. Supporta 25 linguaggi e gira **interamente in locale**. Complementa (non sostituisce) il `grep` built-in: è utile per "trova dove si gestisce l'autenticazione" più che per match esatti.

#### Prerequisiti (importante)

Senza il binario `colgrep` installato, il tool si disabilita con un messaggio *"colgrep is not installed. Install from: …"* e la ricerca semantica non è disponibile. Niente rompe, ma è peso morto senza il prerequisito.

#### Indicizzazione automatica

- A `session_start` costruisce l'indice in background (`colgrep init`) — non blocca l'avvio.
- Dopo ogni `write`/`edit` riuscito, schedula una re-indicizzazione debounced (solo se un indice esiste già per la directory: una directory che non cerchi mai non viene indicizzata proattivamente).
- `/colgrep-reindex` costruisce/aggiorna l'indice a richiesta.

#### Comandi/tool introdotti

| Tool/Cmd | Descrizione |
|---|---|
| `colgrep` (tool) | Ricerca semantica di codice |
| `/colgrep-reindex` | Costruisce/aggiorna l'indice su richiesta |

#### Configurazione (opzionale)

File JSON, project override global:

| Scope | Path |
|---|---|
| Globale | `<agentDir>/extensions/pi-colgrep/config.json` |
| Progetto | `<cwd>/.pi/extensions/pi-colgrep/config.json` |

| Chiave | Tipo | Default | Descrizione |
|---|---|---|---|
| `indexOnStartup` | boolean | `true` | Costruisci l'indice in background all'avvio. `false` = indicizzazione lazy al primo search o via `/colgrep-reindex` |

#### Esempio 1 — disabilitare l'indicizzazione all'avvio (directory grande/non-code)

`.pi/extensions/pi-colgrep/config.json`:

```json
{ "indexOnStartup": false }
```

#### Esempio 2 — uso tipico (l'agente chiama il tool)

In linguaggio naturale: *"trova dove viene validata la sessione dell'utente"*. L'agente usa il tool `colgrep`, che restituisce i punti del codice semanticamente rilevanti (con ranking), anche se la parola "session" non compare letteralmente.

---

### 3.4 pi-autoformat — formattazione automatica

**Versione:** 5.1.6 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** ⚠️ i formattatori che vuoi usare (biome, prettier, …) · **Superficie:** media

#### A cosa serve

Formatta automaticamente i file **toccati dall'agente** dopo ogni turno, prima della successiva chiamata LLM. Risolve il fastidio: l'agente fa modifiche corrette → al commit i pre-commit hook/CI riformattano → file mutati a sorpresa → commit fallisce. Così la formattazione avviene *prima*, e l'agente può reagire (es. emendare un commit) perché riceve uno steering message se la formattazione ha cambiato qualcosa o è fallita.

**Opt-in:** nessun formatter gira finché non dichiari `chains` nel config.

#### Come funziona

Raccoglie i file toccati durante il turno e a `turn_end` (prima del prossimo LLM call) esegue i formatter configurati **solo su quei file**. Un flush di sicurezza gira anche a `agent_end`.

#### Configurazione

Due livelli (project override global):

1. Globale: `~/.pi/agent/extensions/pi-autoformat/config.json`
2. Progetto: `.pi/extensions/pi-autoformat/config.json`

Campi chiave:

- **`formatters`** — definizioni di formatter con nome, ciascuno con `command` (array).
- **`chains`** — mappa estensioni file → lista ordinata di nomi formatter.
- **`formatScope`** — confine dei file formattabili: `"repoRoot"` (default, git root con fallback a cwd), `"cwd"`, o array di root espliciti.
- **`commandTimeoutMs`** — timeout per formatter (default 10000).
- **`shellMutationDetection`** — opt-in per rilevare file mutati da bash (`sed -i`, `mv`, `cp`). Default off.
- **`hideSummariesInTui`** — `true` per nascondere il footer di stato.

#### Comandi introdotti

Nessuno slash command. Lavora via hook (`turn_end`, `agent_end`). Nella TUI mostra un footer di stato (es. `✓ autoformat: 3 files (biome, prettier)`).

#### Esempio 1 — config minima con Biome per TypeScript

`.pi/extensions/pi-autoformat/config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/gotgenes/pi-autoformat/main/schemas/pi-autoformat.schema.json",
  "formatters": {
    "biome": { "command": ["biome", "check", "--write", "--files-ignore-unknown=true"] }
  },
  "chains": {
    ".ts": ["biome"],
    ".tsx": ["biome"],
    ".json": ["biome"]
  }
}
```

#### Esempio 2 — cosa succede in pratica

1. L'agente modifica `src/auth.ts` durante il turno.
2. A fine turno, `pi-autoformat` esegue `biome check --write src/auth.ts`.
3. Se Biome riformatta il file → l'agente riceve uno steering message all'inizio del turno successivo, così sa che il file è cambiato (utile se stava per committare).
4. Il successivo `git commit` vede il file già formattato → niente failure dei pre-commit hook.

---

### 3.5 pi-github-tools — CI, release e issue su GitHub

**Versione:** 4.1.5 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** ⚠️ **GitHub CLI (`gh`)** installata e autenticata (`gh auth login`) · **Superficie:** media

#### A cosa serve

Sostituisce il polling ad-hoc della `gh` CLI con tool **deterministici**: backoff esponenziale, streaming del progresso, ritorni strutturati success/timeout. L'autenticazione è delegata a `gh` (il pacchetto non gestisce token direttamente). Ideale per automatizzare il flusso CI + release + issue.

#### Tool introdotti

**CI:** `ci_find`, `ci_watch`, `ci_list` · **Release:** `release_pr_find`, `release_pr_merge`, `release_watch` · **Issue:** `issue_close`

#### Esempio 1 — aspettare che appaia una run CI per uno SHA

```
ci_find({ workflow: "ci", expected_sha: "abc123...40char", timeout: 120 })
```

Usa backoff esponenziale (5s base, 30s cap) finché la run appare o scade il timeout. Restituisce `run_id`, `url`, `status`, `sha`, `title` e la lista job. Se la run non appare, restituisce un messaggio di timeout strutturato (non un errore).

#### Esempio 2 — flusso CI + release completo

Il tipico workflow (passo-passo, l'agente usa i tool in sequenza):

```text
1. Push su un branch e crea una PR.
2. ci_find con lo SHA pushato → individua la run CI.
3. ci_watch sull'ID → aspetta che la run CI completi (streaming progress tipo [2/5] deploy — in_progress).
4. Merge della PR.
5. release_pr_find → individua la PR di release-please.
6. release_pr_merge → mergia la PR (controlla MERGEABLE+CLEAN, poi git pull --ff-only).
7. release_watch → aspetta che appaia il tag di release su HEAD.
8. issue_close → chiude l'issue spedita (con commento opzionale).
```

Esempio concreto di chiamata singola — chiudere un'issue con commento:

```
issue_close({ issue_number: 42, comment: "Fixed in v1.2.0", reason: "completed" })
```

#### Configurazione (opzionale)

| Scope | Path |
|---|---|
| Globale | `~/.pi/agent/extensions/pi-github-tools/config.json` |
| Progetto | `<cwd>/.pi/extensions/pi-github-tools/config.json` |

| Chiave | Default | Descrizione |
|---|---|---|
| `defaultMergeMethod` | `"merge"` | Strategia di merge per `release_pr_merge`: `"rebase"`, `"squash"`, `"merge"` |

---

### 3.6 pi-subagents — sub-agent in-process

**Versione:** 18.0.1 · **Dipendenze runtime:** `@sinclair/typebox` · **Prerequisiti esterni:** nessuno · **Superficie:** medio-alta (fork di `tintinweb/pi-subagents`, 57 file in 7 domini)

#### A cosa serve

Porta i **sub-agent autonomi in stile Claude Code** a pi, **in-process** (creano sessioni nello stesso runtime di pi via `createAgentSession`, non spawnano subprocess). Ogni sub-agent ha i propri tool, system prompt, modello e thinking level. Foreground o background, steering mid-run, resume di sessioni completate, custom agent types.

> **Nota:** è il **core** dell'ecosistema gotgenes. Per worktree isolation e permission model si appoggia ai companion `pi-subagents-worktrees` e `pi-permission-system`. (Per una comparazione con l'upstream `@tintinweb/pi-subagents`, vedi il README del fork.)

#### Agent types predefiniti

| Tipo | Tool | Modello | Descrizione |
|---|---|---|---|
| `general-purpose` | tutti 7 | inherit | "Parent twin": eredita il system prompt completo del parent |
| `Explore` | read, bash, grep, find, ls | haiku (fallback inherit) | Esplorazione veloce read-only |
| `Plan` | read, bash, grep, find, ls | inherit | Architetto per planning implementativo read-only |

I default possono essere **sovrascritti** (creando `.pi/agents/<nome>.md`) o **disabilitati** per progetto (`enabled: false` nel frontmatter).

#### Custom agents

Definiti in file `.md` (il filename = nome tipo). Posizione (priorità decrescente): `.pi/agents/<name>.md` (progetto), poi `~/.pi/agent/agents/<name>.md` (globale). Frontmatter YAML.

Esempio — `.pi/agents/auditor.md`:

```markdown
---
description: Security Code Reviewer
tools: read, grep, find, bash
model: anthropic/claude-opus-4-6
thinking: high
max_turns: 30
---

You are a security auditor.
Review code for vulnerabilities including:
- Injection flaws (SQL, command, XSS)
- Authentication and authorization issues
Report findings with file paths, line numbers, severity, and remediation advice.
```

Campi frontmatter (tutti opzionali): `description`, `display_name`, `tools` (lista separata da virgole o `none`), `model` (`provider/id` o fuzzy come `"haiku"`), `thinking` (off/minimal/low/medium/high/xhigh), `max_turns`, `prompt_mode` (`append`/`replace`), `inherit_context`, `run_in_background`, `enabled`. Il frontmatter è **autorevole**: blocca i valori; i parametri del tool `subagent` riempiono solo i campi non specificati.

#### Tool introdotti

| Tool | Descrizione |
|---|---|
| `subagent` | Lancia un sub-agent |
| `get_subagent_result` | Stato/risultato di un agent background |
| `steer_subagent` | Invia un messaggio di steering a un agent in esecuzione |

#### Comandi introdotti

| Comando | Descrizione |
|---|---|
| `/subagents:settings` | Configura (concurrency, turn limit, grace turns) — persiste tra riavvii |
| `/subagents:sessions` | Visualizza il transcript di una sessione subagent (read-only) |

#### Esempio 1 — esplorazione in background

```
subagent({
  subagent_type: "Explore",
  prompt: "Find all files that handle authentication",
  description: "Find auth files",
  run_in_background: true
})
```

Ritorna subito un ID; il widget sopra l'editor mostra l'attività live (turni, tool uses, token, % context window). Notifica al completamento. Puoi poi `get_subagent_result({ agent_id: "...", wait: true })`.

#### Esempio 2 — custom agent in foreground + steering

Lancia l'auditor personalizzato (definito sopra):

```
subagent({ subagent_type: "auditor", prompt: "Review the auth module", description: "Security audit" })
```

Mentre gira, puoi reindirizzarlo senza riavviarlo:

```
steer_subagent({ agent_id: "...", message: "Focus also on rate limiting and JWT validation" })
```

Il messaggio interrompe dopo l'esecuzione del tool corrente. Concurrency di default: 4 agent background in parallelo (configurabile via `/subagents:settings`).

---

### 3.7 pi-subagents-worktrees — isolamento in worktree git

> 📖 **Tutorial passo-passo da zero** — cos'è un worktree git, cosa sono isolamento e parallelismo, come combinarli, trappole e troubleshooting: vedi [`pi-subagents-tutorial.md`](./pi-subagents-tutorial.md).

**Versione:** 0.2.3 · **Dipendenze runtime:** nessuna · **Prerequisiti esterni:** **richiede `pi-subagents`** (installato e caricato prima) · **Superficie:** media

#### A cosa serve

Registra un `WorkspaceProvider` nel core di `pi-subagents`: gli agent types opt-in girano in un **worktree git temporaneo** (copia isolata del repo). Le modifiche che fanno vengono committate su un branch al termine. È una *strategia di workspace*, non behavior di base — per questo il plumbing git vive qui fuori dal core minimal.

#### Prerequisiti e ordine di caricamento (importante)

Va installato **dopo** `pi-subagents`:

```json
{
  "packages": [
    "npm:@gotgenes/pi-subagents",
    "npm:@gotgenes/pi-subagents-worktrees"
  ]
}
```

Pi carica i pacchetti nell'ordine di `settings.json`: il worktrees registra il provider al load, quindi il core deve essere già caricato. Se `pi-subagents` non è caricato per primo (o non è installato), questa estensione **non fa nulla**.

#### Comandi/tool introdotti

Nessuno. Espone solo un `WorkspaceProvider` (si attiva in base alla config). Nessuno slash command.

#### Configurazione (opt-in per agent type)

Isolamento **opt-in per tipo di agent**. File JSON:

| Scope | Path |
|---|---|
| Globale | `~/.pi/agent/subagents-worktrees.json` |
| Progetto | `<cwd>/.pi/subagents-worktrees.json` (override) |

```json
{ "worktreeAgents": ["general-purpose", "refactorer"] }
```

Un agent type non in `worktreeAgents` gira nella cwd del parent (come se l'estensione non fosse installata).

#### Comportamento

- Un figlio il cui tipo è in lista ottiene un worktree detached fresco a `HEAD` prima di partire.
- Se alla fine non ci sono modifiche → il worktree viene rimosso.
- Se ci sono modifiche → vengono committate su un branch `pi-agent-<id>`, e il risultato del figlio guadagna una nota: `Changes saved to branch <branch>. Merge with: git merge <branch>`.
- Se la creazione del worktree fallisce (non è un repo git, niente commit, `git worktree add` fallisce) → il figlio **fallisce** con un errore esplicativo invece di girare silenziosamente non isolato.

#### Esempio — cosa succede in pratica

1. Configuri `worktreeAgents: ["refactorer"]`.
2. L'agente parent lancia `subagent({ subagent_type: "refactorer", prompt: "Refactor the auth module" })`.
3. Il figlio `refactorer` parte in un worktree isolato a `HEAD`: modifica file lì, **senza toccare** la tua working tree.
4. Alla fine, le modifiche sono committate su `pi-agent-<id>`. Ricevi: `Changes saved to branch pi-agent-abc123. Merge with: git merge pi-agent-abc123`.
5. Tu decidi se mergiare o scartare il branch, mantenendo il lavoro principale pulito.

#### ⚠️ Trappola critica: la config si legge una sola volta all'avvio del processo

La config (`<cwd>/.pi/subagents-worktrees.json` o quella globale) viene caricata **una tantum quando pi parte**: la factory dell'estensione la legge all'avvio e la passa al provider, che la cacha in memoria per tutto il ciclo di vita del processo. Conseguenze concrete (verificate empiricamente):

- Cambiare `worktreeAgents` (aggiungere/rimuovere un tipo) richiede un **riavvio COMPLETO** di pi: esci dal terminale o uccidi il processo e rilancia `pi`. **NON basta `/reload`** e **NON basta riprendere (resume) la sessione**: `/reload` ricarica le impostazioni ma *non* riesegue le factory delle estensioni, quindi la config cachata resta quella vecchia.
- Se crei il file di config **dopo** aver già avviato pi, gli agent types elencati NON vengono isolati finché non riavvii del tutto: i figli girano nella cwd del parent. È il default del core quando nessun provider copre quel tipo (citazione decisiva, `pi-subagents/docs/architecture/architecture.md` ~riga 539: *«default to the parent's cwd when none is registered»*).
- **Sintomo tipico di config cachata vuota**: il subagent completa, ma `git status` nel parent mostra i file che il figlio avrebbe dovuto creare nel worktree, e non esiste alcun branch `pi-agent-*`.

#### Come verificare che l'isolamento sia attivo

Dopo che un subagent di tipo opt-in ha completato un task che crea un file (es. `scripts/prova.cjs`), controlla nel **parent**:

```bash
git status --short                    # NON deve mostrare il file creato dal figlio
ls scripts/prova.cjs                  # deve dare exit 2 (file inesistente nel parent)
git branch                            # deve esistere un branch pi-agent-*
git show pi-agent-*:scripts/prova.cjs # stampa il contenuto (commit sul branch)
```

Se vedi il file in `git status` e non c'è nessun `pi-agent-*`, l'isolamento **non è attivo** (probabilmente config cachata vuota: vedi la trappola sopra).

#### Debug

Se l'isolamento non parte **neanche dopo un riavvio completo**, il problema non è più di caching ma di load del provider. Attiva il debug con la env var documentata nel codice (`pi-subagents-worktrees/src/debug.ts`):

```bash
PI_SUBAGENTS_WORKTREES_DEBUG=1
```

Stampa su stderr i messaggi dei catch block (normalmente silenti), ad esempio se `getSubagentsService()` restituisce `undefined` all'init di worktrees — segno che `pi-subagents` non è caricato per primo o il service non è pubblicato. In quel caso verifica l'**ordine in `settings.json`** (`pi-subagents` PRIMA di `pi-subagents-worktrees`).

---

### 3.8 pi-permission-system — permessi allow/ask/deny

**Versione:** 16.0.1 · **Dipendenze runtime:** `tree-sitter-bash`, `web-tree-sitter` · **Prerequisiti esterni:** nessuno · **Superficie:** medio-alta (fork di `MasuRii/pi-permission-system`, 92 file, parser bash via WASM statico)

#### A cosa serve

Enforcement **centralizzato e deterministico** dei permessi su tool, bash, MCP, skill e operazioni speciali. Tre stati: **allow** (silenzioso), **ask** (dialog di conferma), **deny** (blocca con errore). Parsa i comandi bash con tree-sitter (WASM statico, non scaricato a runtime) per applicare wildcard. Si integra nativamente con `pi-subagents` (policy per-agent + forwarding `ask` dall'UI parent). **Fail-closed**: errore interno del gate blocca; comando bash non parseabile va in `ask` invece di passare.

#### Cosa controlla

- **Nasconde tool disallowed** prima che l'agente parta (niente turni spesi a sondare tool bloccati).
- **Bash con wildcard**: `git *: ask`, `rm -rf *: deny`.
- **MCP e skill** a granularità server/tool/skill-name.
- **Path sensibili** cross-tool: regole `path` (es. `.env`, `~/.ssh/*`) si applicano a tool pi, bash, MCP ed estensioni insieme.
- **Path esterni al cwd**: prompt prima di uscire dalla directory di lavoro.
- **Subagent**: le sessioni figlio in-process si registrano automaticamente → enforcement per-agent + forwarding `ask` all'UI parent.

#### Configurazione

File `~/.pi/agent/extensions/pi-permission-system/config.json` (globale) o `.pi/extensions/pi-permission-system/config.json` (progetto).

#### Comandi introdotti

| Comando | Descrizione |
|---|---|
| `/permission-system` | UI di configurazione (policy, auto-approve, forwarding subagent) |

#### Esempio 1 — policy base (allow di default, deny su .env, ask su git/rm/sudo, esterni in ask)

`~/.pi/agent/extensions/pi-permission-system/config.json`:

```jsonc
{
  "permission": {
    "*": "allow",
    "path": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow"
    },
    "bash": {
      "*": "ask",
      "rm -rf *": "deny",
      "sudo *": "ask"
    },
    "external_directory": "ask"
  }
}
```

#### Esempio 2 — cosa succede in pratica

- L'agente prova a leggere `.env` → **bloccato** con errore (rule `path: *.env: deny`), qualsiasi tool usi (read, bash `cat`, MCP).
- L'agente prova `git commit -m "..."` → si apre un dialog di conferma (rule `bash: *: ask`). Approvando una volta o per pattern, vale per la sessione.
- L'agente prova `rm -rf node_modules` → **bloccato** subito (rule `bash: rm -rf *: deny`).
- L'agente prova a leggere `/etc/passwd` (fuori dal cwd) → dialog di conferma (rule `external_directory: ask`).
- Un subagent `Explore` prova un comando bash in `ask` → il prompt viene forwardato all'UI del parent, così confermi tu anche se il figlio non ha UI.

#### Confronto con il permission model di OpenCode

Se conosci il sistema di permessi di OpenCode, **ti senti subito a casa**: pi-permission-system è **ispirato direttamente** al modello di OpenCode (l'autore lo dichiara esplicitamente: *«the permission model design that inspired the flat config format and evaluation semantics»*). Stessa struttura mentale, stessi tre stati, stessa sintassi. Fonte del confronto: [`docs/opencode-compatibility.md`](https://github.com/gotgenes/pi-packages/blob/main/packages/pi-permission-system/docs/opencode-compatibility.md) del pacchetto, incrociata con la [documentazione ufficiale OpenCode](https://opencode.ai/docs/permissions/).

**Cosa è IDENTICO** (passa 1:1):

| Concetto | Descrizione |
|---|---|
| 3 azioni | `allow` / `ask` / `deny` — identiche |
| Oggetto `permission` flat | chiave top-level del config |
| `"*"` fallback universale | default quando nessuna regola matcha |
| Sintassi granulare (object) | `surface: string` o `{ pattern: action }` |
| Last-match-wins | vince l'ultimo pattern che matcha |
| Wildcard `*` / `?` | `*` = zero+ caratteri (anche separatori), `?` = 1 carattere |
| Espansione home | `~/` e `$HOME/` |
| `external_directory` | gate per path fuori dalla cwd |
| `bash` / `skill` / `task` surfaces | pattern su comandi shell / skill / subagent |
| Approvals session-scoped | `once` / `always` / `reject` dall'ask dialog |
| Per-agent overrides | override permessi per agente |
| Tool hiding | tool denied rimossi prima dell'avvio |
| Bash path extraction | tree-sitter AST per rilevare path esterni |
| Bash arity table | suggerimenti smart (es. `git checkout *` non `git *`) |

**Dove DIVERGONO** (differenze da conoscere):

| Area | OpenCode | pi-permission-system |
|---|---|---|
| **Default** | `"*": "allow"` (permissivo) | `"*": "ask"` (least privilege) |
| **Protezione `.env`** | regole `read` built-in | nessuna built-in (usi la surface `path` cross-tool) |
| **`path` cross-tool** | ❌ non esiste | ✅ surface `path` che nega/ask su **tutti** i tool e bash insieme (un deny qui non è scavalcabile da un allow per-tool) |
| Surface OpenCode-only | `lsp`, `question`, `webfetch`, `websearch`, `todowrite`, `doom_loop` | n/a (pi non ha questi tool) |
| Mutazione file | tutto sotto `edit` | separati `write` (create/overwrite) e `edit` (replacement mirato) |
| Ricerca/listing | `glob`, `grep`, `list` | `find`, `grep`, `ls` (nomi tool di pi) |
| **`mcp` surface** | ❌ non è una surface documentata | ✅ first-class, granularità server/tool |
| Shorthand `"permission": "allow"` | ✅ supportato | ❌ devi usare un oggetto (`{ "*": "allow" }`) |
| Per-agent config | `agent` key nel config JSON o YAML frontmatter | solo YAML frontmatter in file `.md` |
| Path file config | `~/.config/opencode/opencode.json` | `~/.pi/agent/extensions/pi-permission-system/config.json` |
| Subagent prompt forwarding | non documentato | ✅ le policy `ask` funzionano anche in contesti subagent non-UI |
| **Audit log** | ❌ nessun equivalente | ✅ scrive le decisioni in un JSONL di review |
| Deny con motivo | ❌ | ✅ `{ "action": "deny", "reason": "..." }` |

> **In sintesi:** il modello è quasi identico. Le differenze sono per lo più a **vantaggio di pi-permission-system** (default più sicuro, surface `path` cross-tool, surface `mcp`, audit log, deny con motivo). L'unica cosa in più di OpenCode è lo shorthand `"permission": "allow"` e alcune surface dei suoi tool specifici (`webfetch`, `lsp`, …) che su pi non hanno senso.

##### Esempio di porting (config OpenCode → pi-permission-system)

**Prima (OpenCode):**

```json
{
  "permission": {
    "*": "allow",
    "bash": { "*": "ask", "git *": "allow", "npm *": "allow", "rm *": "deny" },
    "edit": { "*": "ask", "src/*.ts": "allow" },
    "external_directory": { "~/projects/*": "allow" }
  }
}
```

**Dopo (pi-permission-system):**

```jsonc
{
  "permission": {
    "*": "allow",
    "bash": { "*": "ask", "git *": "allow", "npm *": "allow", "rm *": "deny" },
    "write": "ask",
    "edit": "ask",
    "external_directory": { "*": "ask", "~/projects/*": "allow" }
  }
}
```

Passaggi chiave del porting:

1. `"permission": "allow"` (stringa) → `"permission": { "*": "allow" }` (oggetto).
2. Splitta `edit` in `write` + `edit` (se vuoi policy diverse tra crea/modifica; altrimenti uguali).
3. Rinomina le surface di ricerca: `glob` → `find`, `list` → `ls`.
4. Per replicare il default permissivo di OpenCode, imposta `"*": "allow"` (il default di pi-permission-system è `ask`).

#### ⚠️ Subagent in worktree: i file di sessione resultano "external"

Se usi i subagent **isolati in worktree** (gotgenes `pi-subagents-worktrees` o nicobailon `pi-subagents` con `worktree: true`), ricorda che la `cwd` del figlio è il **path del worktree** (in `os.tmpdir()`), non il tuo repo. Il permission-system valuta `external_directory` rispetto a quella cwd. Consequence reale (verificata empiricamente): i file "side-channel" che il package di subagent scrive **fuori** dal worktree — in particolare il `progress.md` di pi-subagents, salvato in `~/.pi/agent/sessions/.../subagent-artifacts/progress/...` — risultano "external" per il figlio e triggerano `ask` → prompt forwardato al parent. Il **lavoro reale** dentro il worktree invece non genera mai prompt.

**Soluzione:** permetti la cartella sessioni, mantenendo `ask` come default:

```json
"external_directory": {
  "*": "ask",
  "~/.pi/agent/sessions/*": "allow"
}
```

Il wildcard `*` matcha anche i separatori (copre i path profondi). Spiegazione completa, catena causale, differenza di reload e forwarding cross-ecosistema (validato): vedi [`pi-subagents-tutorial.md`](./pi-subagents-tutorial.md) §15.

## 4. Raccomandazioni: cosa installare e come combinarli

### Bundle "massa critica" (se ti interessano i subagent di gotgenes)

```bash
pi install npm:@gotgenes/pi-subagents
pi install npm:@gotgenes/pi-subagents-worktrees   # se vuoi isolamento git
pi install npm:@gotgenes/pi-permission-system      # governance allow/ask/deny (si sposa con subagents)
pi install npm:@gotgenes/pi-nocd                   # quasi gratis, utile
```

E in `settings.json`, ordine corretto:

```json
{
  "packages": [
    "npm:@gotgenes/pi-subagents",
    "npm:@gotgenes/pi-subagents-worktrees",
    "npm:@gotgenes/pi-permission-system",
    "npm:@gotgenes/pi-nocd"
  ]
}
```

### Per necessità verticali

| Se vuoi... | Installa | Prerequisito |
|---|---|---|
| Sub-agent paralleli | `pi-subagents` (+ `pi-subagents-worktrees`) | nessuno |
| Governance permessi | `pi-permission-system` | nessuno |
| Anti-fastidi a basso costo | `pi-nocd` + `pi-session-tools` | nessuno |
| Auto-formattazione | `pi-autoformat` | i tuoi formattatori |
| Workflow GitHub CI/release | `pi-github-tools` | `gh` CLI autenticata |
| Ricerca semantica | `pi-colgrep` | binario `colgrep` |

### Cosa valutare prima di installare

- **Fermento di versione:** `pi-subagents` e `pi-permission-system` rilasciano molto spesso (major frequenti) → se li installi, valuta di pinnare la versione e ri-auditarli dopo ogni update.
- **Prerequisiti:** `colgrep`, `github-tools`, `autoformat` sono inutili (peso morto) senza i loro tool esterni.
- **Sovraccarico:** più pacchetti = più tool nel system prompt e più comandi `/`. Installa solo ciò che usi.

## 5. Trasparenza sul metodo

- Tutti i comandi, i tool, i parametri e gli esempi sono **tratti dai README ufficiali** e dal codice dei tarball scaricati dal registry npm (non inventati).
- Le versioni citate sono quelle al 2026-06-24 (snapshot).
- **NON testato a runtime**: nessun pacchetto è stato installato o eseguito in questa valutazione. Comportamento reale (stabilità, UX, performance) non verificato. Stesso caveat dell'audit MCP.
- Tutti i pacchetti girano con **pieni permessi di sistema** (supply-chain). Segnali di sicurezza buoni (OIDC trusted publisher, CI, niente telemetria/URL esterne sospette), ma per i due pacchetti più complessi (`permission-system`, `subagents`) vale un **audit statico dettagliato** pre-installazione, come fatto per `pi-mcp-adapter`.
- Compatibilità verificata con pi 0.79.10 (peer-dep tutti soddisfatti).

---

*Versioni di riferimento: pi 0.79.10 · monorepo `gotgenes/pi-packages` (snapshot npm 2026-06-24). Repo: <https://github.com/gotgenes/pi-packages>*
