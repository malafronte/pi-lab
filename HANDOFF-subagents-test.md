# HANDOFF — Test pi-subagents + pi-subagents-worktrees

> Sessione di origine: `2026-06-28T14-43-27` (pi-test).
> Questo documento permette a una nuova sessione di riprendere il test senza perdere il contesto accumulato. Leggilo per intero prima di continuare.

## Obiettivo del test

Verificare end-to-end due package di `@gotgenes/pi-packages`:

- **`@gotgenes/pi-subagents`** — sub-agent in-process, paralleli.
- **`@gotgenes/pi-subagents-worktrees`** — isolamento in git worktree per i sub-agent.

Repo: `C:\Users\genna\source\repos\Test\pi-test` (git, branch `main`, HEAD `cee698d`).

## Configurazione già in essere (NON ricreare)

1. **`.pi/subagents-worktrees.json`** (progetto, già creato, untracked da git):

   ```json
   { "worktreeAgents": ["general-purpose"] }
   ```

2. **Settings pi globale** ha `pi-subagents` PRIMA di `pi-subagents-worktrees` (righe 17 e 18 di `C:\Users\genna\.pi\agent\settings.json`) — ordine corretto e obbligatorio.
3. Versioni installate: `pi-subagents` 18.0.1, `pi-subagents-worktrees` 0.2.3.
4. Config permessi globale attiva (`C:\Users\genna\.pi\agent\extensions\pi-permission-system\config.json`) — profilo permissivo con guardie su `.env`, `~/.ssh`, `git push: ask`. Non c'entra col test ma è utile saperlo.

## Stato del goal

**Goal attivo ma NON completo.** L'obiettivo completo (per `update_goal`) richiede 4 verifiche:

- ✅ **Verifica 1 (Fase A)** — PASS: 2 subagent `Explore` in parallelo hanno completato con output coerenti (18 file `.md` raggruppati per tema; 3 script `.ps1`/`.mjs`/`.cjs` descritti). Da NON ripetere: lavoro già fatto e valido.
- ✅ **Verifica 2 (Fase B)** — PASS: il subagent `general-purpose` ha completato (ha creato `scripts/worktree-prove.cjs`).
- ❌ **Verifica 3 (Fase B — ISOLAMENTO)** — NON PASSA: la working tree del parent è stata modificata (il file è apparso nel parent come untracked) invece che restare intatta.
- ❌ **Verifica 4 (Fase B — BRANCH)** — NON PASSA: non è stato creato alcun branch `pi-agent-*`.

## Diagnosi della causa (basata sui docs ufficiali + evidenza)

**Sintomo = "nessun WorkspaceProvider registrato"**, confermato dal doc di architettura di pi-subagents (`packages/pi-subagents/docs/architecture/architecture.md`, riga ~539):

> consult [the provider] for the child's cwd; **default to the parent's cwd when none is registered**.

Esattamente il comportamento osservato (figlio scrive nel parent, nessun branch).

**Catena causale** (tutta verificata leggendo il sorgente + i docs):

1. `packages/pi-subagents-worktrees/src/index.ts` legge la config **una sola volta all'avvio del processo** (`loadWorktreesConfig(...)`) e la passa al provider, che la cacha nel costruttore (`workspace-provider.ts`).
2. La sessione pi-test attiva è partita alle **16:43 (locale)** del 2026-06-28.
3. Il file `.pi/subagents-worktrees.json` è stato creato alle **19:02 (locale)** — cioè **dopo** la partenza del processo.
4. → Quando le factory delle estensioni sono girate all'avvio, la config **non esisteva ancora** → `worktreeAgents` vuota → provider si registra ma per ogni figlio restituisce "gira nel parent".
5. `/reload` e la riapertura della sessione **NON re-eseguono le factory delle estensioni** (girano solo a processo nuovo) → la config cachata resta vuota in tutti i tentativi fatti finora (3 Fase B, tutte fallite identiche).

## COSA FARE per riprendere (passo unico)

**Chiusura totale di pi + rilancio da processo nuovo** (NON `/reload`, NON resume):

1. Esci del tutto da pi (chiudi il terminale o uccidi il processo).
2. Rilancia `pi` da capo nella cartella del progetto.
3. La nuova sessione deve **leggere questo file** (`HANDOFF-subagents-test.md`) per recuperare il contesto.
4. Aprire/creare di nuovo il goal (vedi "Testo del goal" sotto) e ritentare **solo la Fase B** + le verifiche 3/4.

Con un processo davvero nuovo, la factory di worktrees leggerà la config ora esistente → provider attivo → isolamento reale → `git status` del parent pulito + branch `pi-agent-*` creato.

## Cosa deve fare la nuova sessione (procedura esatta)

**Precondizioni da verificare** (comandi singoli e semplici, vedi regola in `AGENTS.md`):

- `cd 'C:/Users/genna/source/repos/Test/pi-test' && git status --short` → deve mostrare solo `?? .pi/subagents-worktrees.json`.
- `cat .pi/subagents-worktrees.json` → deve contenere `{ "worktreeAgents": ["general-purpose"] }`.
- `git branch` → solo `main`.

**Fase B (la sola da ritentare)** — lanciare questo subagent (foreground, max_turns basso):

- `subagent_type`: `general-purpose`
- `description`: "Worktree isolation test (post-restart)"
- `max_turns`: 8
- `prompt`: crea UN solo file `scripts/worktree-prove.cjs` con questo contenuto esatto, poi fermati (niente git, niente commit, niente altro):

  ```js
  // Prova di isolamento worktree — creato da un subagent in worktree isolato.
  console.log('isolamento worktree verificato');
  ```

**Verifiche 3/4 (dopo il completamento del subagent), comandi separati:**

- `git status --short` → deve mostrare **solo** `?? .pi/subagents-worktrees.json` (NON `scripts/worktree-prove.cjs`). Se compare `worktree-prove.cjs` = isolamento fallito di nuovo.
- `ls scripts/worktree-prove.cjs` → deve dare exit 2 (file inesistente nel parent).
- `git branch` → deve esistere un branch `pi-agent-*`.
- `git show pi-agent-*:scripts/worktree-prove.cjs` → deve stampare il contenuto (conferma commit sul branch).

**Pulizia dopo il test (qualunque esito):**

- Rimuovi `scripts/worktree-prove.cjs` dal parent se è apparso (artefatto di test fallito).
- Il branch `pi-agent-*` è il "risultato" del test; puoi lasciarlo o cancellarlo con `git branch -D`/`git worktree prune`.

## Testo del goal (per ricrearlo identico in `create_goal`, `replace_existing: true`)

Objective:

```text
Test end-to-end di pi-subagents + pi-subagents-worktrees nel repo pi-test.

Setup: .pi/subagents-worktrees.json con { "worktreeAgents": ["general-purpose"] } (GIÀ creato).

Fase A — parallelismo (pi-subagents): GIA COMPLETATA in sessione precedente (2 Explore paralleli: 18 file .md + 3 script). NON ripetere.

Fase B — isolamento (pi-subagents-worktrees): lanciare 1 subagent general-purpose con task stretto: creare scripts/worktree-prove.cjs con commento italiano + console.log('isolamento worktree verificato'). Nient'altro.

Verifiche obbligatorie per il completamento:
1. Fase A completata (ereditata dalla sessione precedente). [GIA PASS]
2. Fase B: general-purpose completa.
3. Fase B - ISOLAMENTO: working tree parent INTATTA -> git status pulito tranne config; scripts/worktree-prove.cjs NON esiste nel parent.
4. Fase B - BRANCH: esiste branch pi-agent-* con commit che aggiunge scripts/worktree-prove.cjs.

Goal completo solo dopo verifiche 2/3/4 tutte PASS. Un fallimento riportato esplicitamente è comunque un risultato valido di test.
```

## Documentazione consultata (per non ripetere la ricerca)

Repo dei package clonato in: `C:\tmp\pi-github-repos\gotgenes\pi-packages`

Fonti autorevoli lette:

- `packages/pi-subagents-worktrees/README.md` — setup, ordine settings, behavior.
- `packages/pi-subagents-worktrees/src/index.ts` + `src/config.ts` + `src/workspace-provider.ts` — meccanismo di load/cache della config.
- `packages/pi-subagents/src/lifecycle/workspace-bracket.ts` + `src/lifecycle/subagent.ts` (riga ~220) — dove il core consulta il provider.
- `packages/pi-subagents/docs/architecture/architecture.md` (riga ~539) — **la citazione decisiva**: "default to the parent's cwd when none is registered".
- `.pi/skills/package-pi-subagents/SKILL.md` — orientamento generale del package.

Documentazione locale dell'utente (già esistente nel repo, in italiano):

- `pi-gotgenes-packages-guida.md` — sezioni 3.6 (pi-subagents) e 3.7 (pi-subagents-worktrees) con comandi/tool/esempi.

## Se anche il riavvio completo fallisse

Attivare il debug (env var documentata in `packages/pi-subagents-worktrees/src/debug.ts`):

```text
PI_SUBAGENTS_WORKTREES_DEBUG=1
```

mostra su stderr le "silent failures" dei catch block (es. "subagents service unavailable — worktree provider not registered" se l'ordine di load è sbagliato o il service non è pubblicato).

In quel caso il problema NON è di caching della config ma di load del provider stesso: verificare con il debug log se `getSubagentsService()` restituisce undefined all'init di worktrees (sarebbe un bug reale da segnalare a gotgenes/pi-packages).

## Note di trasparenza

- Fase A è stata eseguita una sola volta ed è valida; NON ripeterla (risparmio di token e tempo).
- Le 3 Fase B finora tentate sono tutte fallite identiche per la stessa causa (caching config + nessun riavvio reale).
- Il presente handoff è l'unico modo per attraversare il boundary di sessione; pi NON porta automaticamente il contesto di diagnosi nella nuova sessione.
