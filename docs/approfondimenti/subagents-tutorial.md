# pi-subagents + pi-subagents-worktrees — Tutorial completo

> Isolamento e parallelismo dei sub-agent in pi, spiegati da zero.
> Versioni di riferimento: `@gotgenes/pi-subagents` 18.0.1 · `@gotgenes/pi-subagents-worktrees` 0.2.3 · pi 0.79.10.
> Tutti i comportamenti descritti sono tratti dai README ufficiali, dal codice dei package e da un **test end-to-end reale** (verifiche empiriche, non inventate).
>
> ⚠️ **Stack attualmente in uso: nicobailon `pi-subagents`.** Questo tutorial è nato sul setup gotgenes, ma i concetti (worktree git, isolamento, parallelismo) e l'appendice §15 (interazione permessi+worktree) valgono per entrambi gli stack. Per la guida completa del package nicobailon ora attivo (configurazione, 8 builtin, chain, migrazione) vedi [`pi-subagents-nicobailon-guida.md`](./subagents-nicobailon-guida.md). Per il confronto tra i due: [`pi-subagents-confronto.md`](./subagents-confronto.md).

## Indice

1. [Cosa risolve questo tutorial](#1-cosa-risolve-questo-tutorial)
2. [Concetti: cos'è un worktree git (e perché conta)](#2-concetti-cosè-un-worktree-git-e-perché-conta)
3. [Cosa significa isolamento](#3-cosa-significa-isolamento)
4. [Cosa significa parallelismo](#4-cosa-significa-parallelismo)
5. [I due pacchetti e come collaborano](#5-i-due-pacchetti-e-come-collaborano)
6. [Setup passo-passo](#6-setup-passo-passo)
7. [⚠️ La trappola del caching della config (la cosa più importante)](#7--la-trappola-del-caching-della-config-la-cosa-più-importante)
8. [Fase A — parallelismo in pratica](#8-fase-a--parallelismo-in-pratica)
9. [Fase B — isolamento in pratica (il test reale)](#9-fase-b--isolamento-in-pratica-il-test-reale)
10. [Come combinare i due: parallelismo + isolamento insieme](#10-come-combinare-i-due-parallelismo--isolamento-insieme)
11. [Come verificare che tutto funzioni](#11-come-verificare-che-tutto-funzioni)
12. [Troubleshooting e debug](#12-troubleshooting-e-debug)
13. [Pulizia dopo i test](#13-pulizia-dopo-i-test)
14. [Checklist finale](#14-checklist-finale)
15. [Appendice: interazione worktree e permessi](#15-appendice-interazione-worktree-e-permessi)

---

## 1. Cosa risolve questo tutorial

Senza questi due pacchetti, un agente in pi lavora **da solo** e **nella tua stessa cartella**. Questo crea due problemi:

- **Sequenzialità**: l'agente fa una cosa alla volta. Se gli chiedi di esplorare 3 parti del codice, le fa in serie. Lentezza.
- **Condivisione della working tree**: se l'agente (o un sub-agent) "rifattorizza" dei file, li modifica **nella stessa cartella dove stai lavorando tu**. Può toccare file che stavi editando, sporcarti la working tree, creare conflitti a sorpresa, lasciarti in uno stato ibrido difficile da annullare.

I due pacchetti risolvono i due problemi separatamente e possono combinarsi:

| Problema | Pacchetto | Soluzione |
| --- | --- | --- |
| Sequenzialità | `pi-subagents` | Sub-agent **paralleli**, ognuno con task/tool/modello propri |
| Condivisione working tree | `pi-subagents-worktrees` | Sub-agent **isolati** in un worktree git separato |

> **In breve:** `pi-subagents` = *più agenti in contemporanea*. `pi-subagents-worktrees` = *ogni agente lavora in una copia separata del repo, non nella tua*. Si possono usare insieme.

---

## 2. Concetti: cos'è un worktree git (e perché conta)

Per capire `pi-subagents-worktrees` devi prima capire **git worktree**, che è una feature standard di git (non inventata da questi pacchetti).

### Normalmente: una sola working tree

Un repository git ha normalmente **una sola working tree**: la cartella con i file che vedi e modifichi, affiancata da una cartella nascosta `.git/` che contiene tutto lo storico.

```text
mio-progetto/          ← working tree (i tuoi file)
├── .git/               ← lo storico (oggetti, branch, config)
├── src/
│   └── auth.ts
└── package.json
```

Se vuoi lavorare su un branch diverso, fai `git checkout` e i file *cambiano* nella stessa cartella. Non puoi avere due branch "aperti" contemporaneamente nella stessa cartella.

### Con git worktree: più working tree che condividono lo storico

`git worktree add` crea una **seconda cartella** che è una working tree aggiuntiva, ma **condivide la stessa `.git/`** (stesso storico, stessi oggetti, stessi branch). Non è un clone: è un'altra "vista" dello stesso repo.

```text
mio-progetto/              ← working tree 1 (tu, su main)
├── .git/                   ← storico condiviso
└── src/auth.ts

/tmp/wt-xyz/                ← working tree 2 (un subagent, su pi-agent-xyz)
├── .git                    ← puntatore alla stessa .git/ di sopra
└── src/auth.ts             ← copia a HEAD
```

Le due cartelle sono **indipendenti come filesystem** (modificare file in una non tocca l'altra), ma **condividono lo storico git** (i commit fatti in una sono visibili dall'altra, perché è lo stesso repo).

### L'analogia che rende tutto chiaro

Immagina il tuo repo come un **ufficio con un archivio centrale** (la `.git/`).

- **Senza worktree**: c'è una sola scrivania. Tutti lavorano lì. Se un collega (subagent) rimescola i documenti, tu li trovi cambiati.
- **Con worktree**: ogni collega ha la **propria scrivania** con una **fotocopia fresca** dei documenti. Lavora lì. La tua scrivanza resta intatta. Se il collega combina un pasticcio, butti la sua copia. Se fa un buon lavoro, ti porti i suoi fogli nell'archivio (merge del branch).

La fotocopia è *fresca a HEAD*: parte dallo stato attuale del repo, non dal tuo lavoro non-committato.

> **Punto chiave da ricordare:** worktree = "un'altra cartella che condivide lo storico con il tuo repo, ma ha i suoi file indipendenti". Tutto il resto del tutorial segue da qui.
>
> **Dove mette il worktree `pi-subagents-worktrees` (verificato nel test reale):** il codice crea il worktree in `os.tmpdir()` — la cartella temporanea del sistema operativo. Su Windows è tipicamente `C:\Users\<utente>\AppData\Local\Temp`, su macOS/Linux `/tmp` o `/var/folders/...`. Il nome della sottocartella è `pi-agent-<agentId>-<8 caratteri di un UUID>`. Nel nostro test: `C:\Users\genna\AppData\Local\Temp\pi-agent-c712baf7-bdb8-480-5f492c29`. È creato con `git worktree add --detach <path> HEAD`: un worktree **detached**, in cui il figlio lavora con HEAD staccato e il branch `pi-agent-*` nasce solo alla fine (dopo il commit).

---

## 3. Cosa significa isolamento

Quando un subagent è **isolato** (grazie a `pi-subagents-worktrees`), lavora in un worktree suo, separato dal tuo. Concretamente:

1. **Prima** che il figlio parta, pi crea un worktree **detached** a `HEAD` dentro `os.tmpdir()` (la cartella temporanea del SO — nel nostro test `C:\Users\genna\AppData\Local\Temp\pi-agent-c712baf7-bdb8-480-5f492c29`). Il figlio lavora con HEAD staccato: in questa fase **il branch `pi-agent-<id>` non esiste ancora**.
2. Il figlio lavora **lì**: legge, modifica, crea file. La **tua working tree non viene toccata**.
3. **Alla fine** del figlio:
   - Se **non ha fatto modifiche** → il worktree viene rimosso (niente tracce).
   - Se **ha fatto modifiche** → vengono committate su un branch `pi-agent-<id>`, il worktree viene rimosso, e il risultato del figlio ti dice come recuperarle:

     ```text
     Changes saved to branch pi-agent-c712baf7-bdb8-480. Merge with: git merge pi-agent-c712baf7-bdb8-480
     ```

4. **Tu decidi**: mergiare il branch (tieni il lavoro), o ignorarlo/buttarlo (scarti). La tua working tree principale resta pulita in ogni caso.

### Perché vale la pena (caso d'uso tipico)

Immagina di chiedere a un subagent `general-purpose`: *"rifattorizza il modulo di autenticazione"*. Senza isolamento:

- Il figlio riscrive `src/auth.ts`, `src/login.ts`, `src/session.ts`... **nelle tue cartelle**.
- Tu magari avevi modifiche non committate in quelli → sovrascritte o in conflitto.
- La tua working tree è adesso un ibrido mezzo-rifattorizzato che non sai se commitare o scartare.

Con isolamento:

- Il figlio rifattorizza nella **sua** copia. La tua working tree è **intatta**.
- Al fini, hai un branch `pi-agent-<id>` con il refactoring completo come singolo cambiamento coerente.
- Tu fai `git diff main..pi-agent-<id>` per rivederlo, poi `git merge` se ti piace, oppure lo butti. Zero rischio per il tuo lavoro.

### Regola d'oro dell'isolamento

> **La tua working tree è il tuo spazio privato. Un subagent isolato non può sporcarla.** Se vedi che la sporca, l'isolamento NON sta funzionando (vedi [§7](#7--la-trappola-del-caching-della-config-la-cosa-più-importante) e [§12](#12-troubleshooting-e-debug)).

---

## 4. Cosa significa parallelismo

Quando lanci un subagent **in background** (`run_in_background: true`), pi non aspetta che finisca: ti restituisce subito un `agent_id` e continua. Il figlio lavora in parallelo al tuo flusso.

- Possono girare **più agenti in parallelo** contemporaneamente (concurrency di default: **4**, configurabile con `/subagents:settings`).
- Ogni figlio ha i **propri tool, system prompt, modello e thinking level** (definiti dal suo *agent type*).
- Un widget nell'editor mostra l'attività live (turni, tool usati, token, % di context window usata).
- Al completamento ricevi una notifica; poi recuperi il risultato con `get_subagent_result({ agent_id, wait: true })`.
- Puoi persino **reindirizzare** un figlio mentre gira con `steer_subagent({ agent_id, message })`: il messaggio interrompe dopo l'esecuzione del tool corrente.

### Foreground vs background

| Modalità | Quando si usa | Comportamento |
| --- | --- | --- |
| **Foreground** (default) | Serve il risultato *subito* per proseguire | La chiamata blocca finché il figlio non completa |
| **Background** (`run_in_background: true`) | Task indipendenti, esplorazioni lunghe, più cose in parallelo | Ritorna subito l'ID; tu prosegui; recupero dopo |

> **Attenzione:** "parallelo" riguarda il *tempo* (più agenti in contemporanea). "Isolato" riguarda lo *spazio* (in quale cartella lavorano). Sono due dimensioni **indipendenti** — si combinano, ma una non implica l'altra.

---

## 5. I due pacchetti e come collaborano

```text
┌─────────────────────────────────────────────────────────┐
│  pi-subagents  (il CORE)                                 │
│  ─────────────────────────────────                       │
│  • definisce il tool subagent / get_subagent_result /    │
│    steer_subagent                                        │
│  • i tipi predefiniti (general-purpose, Explore, Plan)   │
│  • foreground/background, steering, resume               │
│  • un "punto di estensione": WorkspaceProvider           │
│    (decide in quale cartella gira ogni figlio)           │
└────────────────────┬────────────────────────────────────┘
                     │ registra il proprio provider
                     ▼
┌─────────────────────────────────────────────────────────┐
│  pi-subagents-worktrees  (il COMPANION)                  │
│  ─────────────────────────────────────                   │
│  • registra un WorkspaceProvider che, per i tipi opt-in, │
│    gira il figlio in un worktree git isolato             │
│  • commit su branch pi-agent-<id> a fine lavoro          │
│  • opt-in per tipo di agent (config worktreeAgents)      │
└─────────────────────────────────────────────────────────┘
```

Il core (`pi-subagents`) consulta il provider per sapere la cartella di ogni figlio. Se **nessun provider** copre quel tipo → il figlio gira nella cwd del parent (comportamento di default). Se il provider di worktrees copre quel tipo → il figlio gira nel worktree.

**Conseguenza pratica (importante):** `pi-subagents-worktrees` **deve essere caricato dopo** `pi-subagents`, perché si aggancia alla sua service API al momento del load. Se inverti l'ordine o ometti il core, il companion "non fa nulla" (silenziosamente).

---

## 6. Setup passo-passo

### 6.1 Installa i pacchetti

Da npm (consigliato, puoi pinnare la versione):

```bash
pi install npm:@gotgenes/pi-subagents@18.0.1
pi install npm:@gotgenes/pi-subagents-worktrees@0.2.3
```

### 6.2 Verifica l'ordine in `settings.json`

Apri `~/.pi/agent/settings.json` (globale) o `.pi/settings.json` (progetto). I due pacchetti devono apparire in **questo ordine** — `pi-subagents` **PRIMA** di `pi-subagents-worktrees`:

```json
{
  "packages": [
    "npm:@gotgenes/pi-subagents",
    "npm:@gotgenes/pi-subagents-worktrees"
  ]
}
```

> Se inverti l'ordine, il companion non riesce a registrare il provider (la service API del core non è ancora pubblicata) → nessun isolamento, in silenzio.

### 6.3 Crea il file di config dell'isolamento (opt-in per tipo)

L'isolamento è **opt-in per tipo di agent**: devi dire esplicitamente quali tipi girano in worktree. Crea `.pi/subagents-worktrees.json` **nella root del progetto**:

```json
{ "worktreeAgents": ["general-purpose"] }
```

- Scope globale alternativo: `~/.pi/agent/subagents-worktrees.json`. Quello di progetto **sovrasta** quello globale.
- Solo i tipi elencati vengono isolati. Gli altri (es. `Explore`, `Plan`) girano nella cwd del parent come se il companion non fosse installato.
- Nell'esempio, solo i subagent `general-purpose` saranno isolati.

### 6.4 Riavvia pi COMPLETAMENTE

⚠️ Questo passo è **obbligatorio** e il più sottovalutato. Vedi il [§7](#7--la-trappola-del-caching-della-config-la-cosa-più-importante) subito sotto.

---

## 7. ⚠️ La trappola del caching della config (la cosa più importante)

Questa è la singola causa di *tutti* i "non funziona l'isolamento" che si incontrano. Leggila con attenzione.

### Il fatto

La config `.pi/subagents-worktrees.json` viene letta **una sola volta, all'avvio del processo pi**. La factory dell'estensione la legge in quel momento e la passa al provider, che la cacha in memoria per tutto il ciclo di vita del processo.

### La conseguenza (il trabocchetto)

Se tu **crei o modifichi** `.pi/subagents-worktrees.json` **mentre pi è già in esecuzione**, la modifica **non ha effetto** finché non riavvii pi del tutto. E qui il dettaglio subdolo:

| Azione | Rilegge la config? | Isolamento attivo? |
| --- | --- | --- |
| `/reload` | ❌ No | Config vecchia/cacha |
| Riprendere (resume) una sessione | ❌ No | Config vecchia/cacha |
| Chiudere e riaprire la *stessa* sessione | ❌ No | Config vecchia/cacha |
| **Uccidere il processo e rilanciare `pi`** | ✅ **Sì** | ✅ Config nuova |

`/reload` ricarica le *impostazioni*, ma **non riesegue le factory delle estensioni**: quindi la config cachata resta quella vecchia. Lo stesso vale per il resume. Solo un **processo davvero nuovo** rilegge la config.

### Sintomo tipico di "config cachata vuota"

Hai creato `.pi/subagents-worktrees.json` *dopo* aver avviato pi. Lanci un subagent del tipo opt-in. Cosa succede:

- Il subagent **completa normalmente** (nessun errore).
- Ma `git status` nel parent mostra i file che il figlio avrebbe dovuto creare nel worktree.
- **Non esiste** alcun branch `pi-agent-*`.

Il figlio ha girato nella cwd del parent perché, all'avvio, il provider aveva una config vuota (il file non esisteva ancora) → nessun tipo era coperto → default "gira nel parent".

### Cosa fare

1. **Salva tutto** e chiudi pi del tutto (chiudi il terminale, o uccidi il processo).
2. Rilancia `pi` nella cartella del progetto.
3. Ora la factory leggerà la config esistente → provider attivo → isolamento reale.

> **Verificato empiricamente** in un test reale: lo stesso setup ha fallito in modo identico per 3 tentativi consecutivi finché il processo non è stato davvero nuovo; ha funzionato al primo colpo subito dopo un riavvio completo.

---

## 8. Fase A — parallelismo in pratica

Obiettivo: vedere **più agenti in parallelo** (senza isolamento, per ora). È la parte che riguarda solo `pi-subagents`.

Esempio reale (tratto da un test end-to-end): lanciare **due `Explore` in parallelo**, ognuno con un task di esplorazione diverso.

```text
subagent({
  subagent_type: "Explore",
  prompt: "Elenca tutti i file .md del repo e raggruppali per tema",
  description: "Find markdown files",
  run_in_background: true
})

subagent({
  subagent_type: "Explore",
  prompt: "Elenca e descrivi gli script (.ps1, .mjs, .cjs) nella cartella scripts/",
  description: "Find scripts",
  run_in_background: true
})
```

Cosa succede:

- Entrambe le chiamate ritornano subito con due `agent_id` diversi.
- I due figli lavorano **in contemporanea** (entrambi read-only, perché `Explore` ha solo tool di lettura).
- Il widget mostra l'attività di entrambi.
- Quando completano, recuperi i risultati:

  ```text
  get_subagent_result({ agent_id: "<id1>", wait: true })
  get_subagent_result({ agent_id: "<id2>", wait: true })
  ```

> Nota: in questa fase **non c'è isolamento** perché `Explore` non è in `worktreeAgents` (e del resto `Explore` è read-only, non scrive nulla). Il parallelismo e l'isolamento sono **indipendenti**: qui attiviamo solo il primo.

---

## 9. Fase B — isolamento in pratica (il test reale)

Obiettivo: verificare che un subagent `general-purpose` (che **è** in `worktreeAgents`) lavori **in un worktree separato** e lasci la working tree del parent intatta.

### Precondizioni (verifica prima di lanciare)

```bash
git status --short            # deve essere pulito (o con soli untracked previsti)
cat .pi/subagents-worktrees.json   # deve contenere { "worktreeAgents": ["general-purpose"] }
git branch                    # solo main (o il tuo branch di lavoro)
```

Se la config è stata creata/modificata di recente, **assicurati di aver riavviato pi completamente** (vedi [§7](#7--la-trappola-del-caching-della-config-la-cosa-più-importante)).

### Lancia il subagent

Foreground, task stretto (creare un solo file e fermarsi — niente git, niente commit da parte del figlio):

```text
subagent({
  subagent_type: "general-purpose",
  description: "Worktree isolation test",
  max_turns: 8,
  prompt: "Crea UN solo file scripts/worktree-prove.cjs con questo contenuto esatto, poi fermati (niente git, niente commit, niente altro):\n\n```js\n// Prova di isolamento worktree — creato da un subagent in worktree isolato.\nconsole.log('isolamento worktree verificato');\n```"
})
```

### Risultato atteso

Il subagent completa e il suo risultato include una riga del tipo:

```text
Changes saved to branch pi-agent-c712baf7-bdb8-480. Merge with: git merge pi-agent-c712baf7-bdb8-480
```

Quella riga è la **prova** che il companion ha intercettato il figlio, gli ha dato un worktree, e ha committato le modifiche su un branch. Se non la vedi → niente isolamento.

### Verifiche (vedi [§11](#11-come-verificare-che-tutto-funzioni) per i comandi)

- `git status --short` nel parent: **NON** deve mostrare `scripts/worktree-prove.cjs`.
- `git branch`: deve esistere `pi-agent-c712baf7-bdb8-480`.
- `git show pi-agent-c712baf7-bdb8-480:scripts/worktree-prove.cjs`: stampa il contenuto.

> **Nota di trasparenza sul test reale:** il contenuto committato conteneva i doppi apici (`console.log("...")`) invece dei singoli apici del prompt: un formatter ha normalizzato le quote. Contenuto semanticamente identico, non un fallimento del test.

---

## 10. Come combinare i due: parallelismo + isolamento insieme

Si combinano in modo naturale: **un tipo che è in `worktreeAgents`, lanciato in background, è sia isolato che parallelo.**

Esempio: 3 refactoring indipendenti, ognuno nel suo worktree, in contemporanea.

```json
// .pi/subagents-worktrees.json
{ "worktreeAgents": ["general-purpose", "refactorer"] }
```

```text
subagent({ subagent_type: "refactorer", prompt: "Rifattorizza src/auth/",     description: "Refactor auth",     run_in_background: true })
subagent({ subagent_type: "refactorer", prompt: "Rifattorizza src/billing/",  description: "Refactor billing",  run_in_background: true })
subagent({ subagent_type: "refactorer", prompt: "Rifattorizza src/notifications/", description: "Refactor notif", run_in_background: true })
```

Comportamento atteso dal design:

- Ogni figlio ottiene il **proprio** worktree separato a `HEAD` (tre cartelle temporanee diverse).
- Lavorano in parallelo (entro il limite di concurrency, default 4).
- La tua working tree resta intatta per tutto il tempo.
- A fine lavoro, hai **3 branch** `pi-agent-<id>` distinti, uno per refactoring → li rivedi e mergi uno per uno, indipendentemente.

> **Trasparenza:** il caso "N agenti → N worktree paralleli" è il comportamento atteso dal design del provider (ogni figlio coperto ottiene il proprio worktree). È coerente con l'architettura, ma il test end-to-end documentato in [§9](#9-fase-b--isolamento-in-pratica-il-test-reale) ne ha verificato uno alla volta (1 figlio → 1 worktree). Prima di affidartene per workflow critici, valuta di testarlo con 2-3 figli paralleli nel tuo repo.

---

## 11. Come verificare che tutto funzioni

Dopo che un subagent di tipo opt-in ha completato un task che crea/modifica un file (es. `scripts/prova.cjs`), **controlla sempre nel parent** — non fidarti solo dell'auto-report del figlio:

```bash
# 1) La working tree del parent NON deve contenere il file del figlio
git status --short
#   ✅ OK:  il file NON compare (solo untracked previsti, es. la config)
#   ❌ BAD: compare scripts/prova.cjs → isolamento NON attivo

# 2) Il file NON deve esistere nel parent
ls scripts/prova.cjs
#   ✅ OK:  exit 2 (No such file or directory)
#   ❌ BAD: il file esiste → isolamento NON attivo

# 3) Deve esistere un branch pi-agent-*
git branch
#   ✅ OK:  vedi una riga  pi-agent-<id>
#   ❌ BAD: nessun pi-agent-* → il companion non ha intercettato il figlio

# 4) Il contenuto deve essere sul branch (commit fatto dal companion)
git show pi-agent-<id>:scripts/prova.cjs
#   ✅ OK:  stampa il contenuto del file
```

Se i controlli 1-3 falliscono (file nel parent, nessun branch), vai al [§12](#12-troubleshooting-e-debug).

### Head del parent intatto (controllo extra)

Conferma che il tuo branch di lavoro non sia avanzato per colpa del figlio:

```bash
git rev-parse HEAD     # deve essere lo SHA di PRIMA del subagent
git worktree list      # di solito solo il parent; il worktree del figlio è già stato rimosso a fine lavoro
```

---

## 12. Troubleshooting e debug

### Sintomo: il file creato dal figlio compare nel parent, nessun branch `pi-agent-*`

Causa quasi certa: **config cachata vuota** (vedi [§7](#7--la-trappola-del-caching-della-config-la-cosa-più-importante)). Rimedi:

1. Verifica che `.pi/subagents-worktrees.json` esista e contenga il tipo giusto.
2. **Riavvia pi completamente** (non `/reload`, non resume).
3. Ritenta.

### Sintomo: niente isolamento neanche dopo un riavvio completo

Il problema non è più di caching, ma di **load del provider**. Attiva il debug:

```bash
# variabile d'ambiente documentata in pi-subagents-worktrees/src/debug.ts
PI_SUBAGENTS_WORKTREES_DEBUG=1
```

Stampa su stderr i messaggi dei `catch` (normalmente silenti). Cosa cercare:

- *"subagents service unavailable — worktree provider not registered"* → il companion non è riuscito ad agganciarsi al core.
  - Verifica l'**ordine in `settings.json`**: `pi-subagents` **PRIMA** di `pi-subagents-worktrees`.
  - Verifica che `pi-subagents` sia effettivamente installato.

- `getSubagentsService()` restituisce `undefined` all'init → stesso problema di ordine/installazione.

### Sintomo: il figlio fallisce con un errore git esplicito

È un comportamento **voluto** (fail-closed): se la creazione del worktree fallisce (non è un repo git, configurazione git assente, `git worktree add` in errore), il figlio **fallisce con un errore chiaro** invece di girare silenziosamente non isolato. Leggi il messaggio: di solito indica cosa manca (es. devi essere in un repo git con almeno un commit).

### Tabella riassuntiva

| Sintomo | Causa probabile | Rimedio |
| --- | --- | --- |
| File del figlio nel parent, nessun `pi-agent-*` | Config cachata vuota | Riavvio completo (§7) |
| Niente isolamento neanche dopo riavvio | Provider non registrato | Debug env var + ordine settings |
| Errore git esplicito dal figlio | Creazione worktree fallita | Leggi il messaggio (repo git? commit esistenti?) |
| L'agente non sa di poter isolare | Tipo non in `worktreeAgents` | Aggiungilo alla config + riavvio |

---

## 13. Pulizia dopo i test

Dopo un test, lo stato del repo è:

- **Working tree del parent**: pulita (se l'isolamento ha funzionato). Nessun file da rimuovere.
- **Branch `pi-agent-<id>`**: è il "risultato" del test. Puoi lasciarlo o rimuoverlo.

Per rimuovere un branch di test:

```bash
git branch -D pi-agent-<id>          # cancella il branch (forza, anche non mergiato)
git worktree prune                   # ripulisce eventuali worktree residui (raro)
```

### ⚠️ Residuo di cleanup su Windows (verificato nel test reale)

Su Windows, `git worktree remove --force` può **non cancellare** la directory temporanea del worktree dal disco (file-lock tipico di Windows). Risultato: `git worktree list` è pulito e `git worktree prune` non trova nulla (git ha già dimenticato il worktree), ma la cartella `C:\Users\<utente>\AppData\Local\Temp\pi-agent-<id>-*` resta sul disco (tipicamente con sotto-cartelle vuote, es. `scripts/`). Il codice cattura l'errore in silenzio (`debugLog`). È ininfluente per l'isolamento, ma lascia spazzatura in temp. Per rimuoverla:

```bash
rm -rf "C:/Users/genna/AppData/Local/Temp/pi-agent-"*    # rimuove i residui temporanei su Windows
```

Se invece il test è **fallito** (file apparso nel parent), rimuovi l'artefatto:

```bash
rm scripts/worktree-prove.cjs        # se è comparso nel parent per colpa di un isolamento fallito
```

---

## 14. Checklist finale

Prima di considerare "isolamento + parallelismo" operativi nel tuo progetto, ticka tutto:

### Setup

- [ ] `pi-subagents` e `pi-subagents-worktrees` installati (versioni compatibili).
- [ ] In `settings.json`, `pi-subagents` è **prima** di `pi-subagents-worktrees`.
- [ ] `.pi/subagents-worktrees.json` esiste ed elenca i tipi da isolare.
- [ ] **pi riavviato completamente** dopo aver creato/modificato la config.

### Isolamento (verifiche nel parent, dopo un subagent opt-in)

- [ ] `git status --short`: il file del figlio **non** compare.
- [ ] `ls <file-del-figlio>`: exit 2.
- [ ] `git branch`: esiste un `pi-agent-*`.
- [ ] `git show pi-agent-*:<file>`: stampa il contenuto.
- [ ] `git rev-parse HEAD`: invariato rispetto a prima del figlio.

### Parallelismo

- [ ] Due o più `subagent` con `run_in_background: true` ritornano subito con ID diversi.
- [ ] Il widget mostra attività simultanea.
- [ ] `get_subagent_result({ agent_id, wait: true })` recupera ciascun risultato.

### Se qualcosa non torna

- [ ] `PI_SUBAGENTS_WORKTREES_DEBUG=1` per i log dei catch silenti.
- [ ] Verifica ordine `settings.json` e presenza di `pi-subagents`.

---

## 15. Appendice: interazione worktree e permessi

> Validato empiricamente su **entrambi gli stack** (gotgenes `pi-subagents-worktrees` e nicobailon `pi-subagents`) con `@gotgenes/pi-permission-system` attivo. Questa appendice spiega perché un subagent isolato può innescare prompt di permesso inaspettati, e come risolvere mantenendo le guardrail.

### 15.1 Il meccanismo: perché succede

Ricorda dal [§2](#2-concetti-cosè-un-worktree-git-e-perché-conta) che quando un subagent è isolato, **la sua `cwd` diventa il path del worktree** (es. `C:\Users\...\Temp\pi-worktree-<id>-0`), non il tuo repo. Il permission-system valuta la regola `external_directory` rispetto alla cwd **della sessione che fa la chiamata**, che per un figlio è il worktree.

La catena (tutta letta nel codice installato):

1. Il figlio nasce con `cwd = path worktree` (vedi `create-subagent-session.ts`).
2. Il gate dei permessi costruisce il contesto con `cwd: ctx.cwd` (`permission-gate-handler.ts`).
3. Il gate `external_directory` chiama `isPathOutsideWorkingDirectory(path, tcc.cwd)` (`external-directory.ts`).
4. Se il path è fuori dal worktree → trigger della regola `external_directory` (default `ask`).

**Conseguenza pratica:** ogni file che il figlio tocca **fuori dal worktree** è "external" per lui, anche se è un file *di sua competenza* salvato altrove dal package di subagent. Non è un bug dell'isolamento: è il permission-system che applica coerentemente la tua policy a una cwd diversa.

### 15.2 Il sintomo reale: `progress.md` (nicobailon)

Caso verificato in un test con 2 `worker` nicobailon in parallelo + `worktree: true`. Ogni `worker` (con `defaultProgress`) mantiene un file `progress.md`. pi-subagents **non** lo scrive nel worktree, ma nella cartella sessione:

```text
~/.pi/agent/sessions/<session-hash>/subagent-artifacts/progress/<runId>/progress.md
```

Il worker prova a leggere/modificare il suo `progress.md`. La sua cwd è il worktree (`...\Temp\pi-worktree-...`). Il path di `progress.md` è fuori → `external_directory: ask` → il prompt viene **forwardato al parent** (che ha l'UI). Risultato: 4 prompt da approvare a mano durante il test, **nessuno** dei quali legato al lavoro reale (creare file in `scripts/`, che invece non ha mai generato prompt perché dentro il worktree).

### 15.3 Soluzione A: permettere la cartella sessioni

Permetti esplicitamente i file sotto `~/.pi/agent/sessions/` (dove vivono `progress.md` e gli altri artifact di sessione), mantenendo `ask` come default per i path veramente esterni. Nel config del permission-system (`~/.pi/agent/extensions/pi-permission-system/config.json`):

```json
{
  "permission": {
    "*": "allow",
    "external_directory": {
      "*": "ask",
      "~/.pi/agent/sessions/*": "allow"
    }
  }
}
```

- Il wildcard `*` matcha **anche i separatori** (quindi copre i path profondi tipo `.../subagent-artifacts/progress/<id>/progress.md`).
- `~/` viene espanso alla home (`C:\Users\<utente>` su Windows).
- Mantiene la guardrail: un path esterno qualsiasi altro (es. `~/projects/altro`, `/etc/...`) resta in `ask`.

Alternative (se non vuoi toccare la config):

- **Disabilitare il progress** nel lancio: `{ agent: "worker", task: "...", progress: false }`. Niente `progress.md`, niente prompt (ma perdi il tracciamento).
- **`external_directory: "allow"` globale**: elimina tutti i prompt esterni, ma è la meno sicura (perdi una guardrail di sicurezza). Sconsigliata.

### 15.4 Differenza di reload: permission-system vs worktrees (importante)

I due package di gotgenes che hai attivi ricaricano la loro config in modi **diversi**, e questo cambia cosa devi fare dopo aver editato un file di config:

|   | `pi-permission-system` | `pi-subagents-worktrees` |
| --- | --- | --- |
| **Quando rilegge la config** | a ogni `session_start` + su `/reload` (`resources_discover` reason=reload) | **una sola volta all'avvio del processo** |
| **Dopo aver editato la config** | **nessun riavvio necessario**: il prossimo subagent (session_start) la vede | **riavvio completo di pi obbligatorio** (`/reload` non basta) |
|   | verificato nel codice (`lifecycle.ts` → `refreshConfig`) | verificato empiricamente (vedi [§7](#7--la-trappola-del-caching-della-config-la-cosa-più-importante)) |

Quindi la **soluzione A di sopra** entra in vigore **immediatamente** per i nuovi subagent, senza che tu riavvii pi. (La trappola del riavvio, §7, riguarda invece `worktreeAgents`.)

### 15.5 Il forwarding cross-ecosistema (validato empiricamente)

Il test reale ha confermato che il forwarding dei prompt `ask` dai figli al parent **funziona attraverso i due ecosistemi**: nicobailon `pi-subagents` popola la env var `PI_SUBAGENT_PARENT_SESSION`, che il gotgenes `pi-permission-system` legge per sapere a quale sessione inoltrare. La sequenza temporale (dal log di review, correlata al millisecondo) per un prompt del worker:

```text
18:48:14.180  child:  permission_request.waiting         (worker vuole leggere progress.md)
18:48:14.185  parent: forwarded_permission.request_created  ← forward via PI_SUBAGENT_PARENT_SESSION
18:48:14.214  parent: forwarded_permission.prompted         ← ti appare il dialog
18:48:18.512  parent: forwarded_permission.approved         ← tu approvi (~4s)
18:48:18.578  child:  permission_request.approved            ← il worker procede
```

Questo valida in pratica l'integrazione dichiarata dal README di nicobailon: i due package **non sono mutualmente esclusivi** sul layer permessi. Un prompt `ask` da un figlio headless non lo blocca permanentemente: arriva alla tua UI.

> **Nota:** il forwarding funziona pienamente solo per i **figli direti** della sessione interattiva (root). Un nipote (figlio di un figlio) ha come parent un altro processo headless senza UI, quindi i suoi `ask` non raggiungono l'UI — da cui il suggerimento del README di piazzare le policy `ask` su agent che girano come figli diretti.

---

*Fonti: README e codice di `@gotgenes/pi-subagents` (18.0.1) e `@gotgenes/pi-subagents-worktrees` (0.2.3); documentazione di architettura di pi-subagents; test end-to-end reale nel repo `pi-test` (verifiche empiriche del 2026-06-28). Per la reference tecnica completa dei due pacchetti, vedi `pi-gotgenes-packages-guida.md` sezioni 3.6 e 3.7.*
