# Plan mode in pi: confronto a tre e guida alla combinazione 2008muyu + questionnaire

> Confronto tra tre approcci al plan mode per pi: la nostra implementazione locale, `@narumitw/pi-plan-mode` e la combinazione `@2008muyu/pi-plan` + `questionnaire`. Per la combinazione, guida dettagliata all'**uso sicuro** con esempi di configurazione.

**Versioni di riferimento (snapshot 2026-06-24):** nostra = snapshot dell'esempio ufficiale pi · `@narumitw/pi-plan-mode` 0.8.0 · `@2008muyu/pi-plan` 1.4.2 · `pi-questionnaire` 2.0.1. Tutte le affermazioni sono verificate sul codice dei tarball. Nessun pacchetto è stato installato o eseguito in questa valutazione.

## Indice

1. [Le tre opzioni a confronto](#1-le-tre-opzioni-a-confronto)
2. [Quale scegliere (decisione rapida)](#2-quale-scegliere-decisione-rapida)
3. [La combinazione 2008muyu + questionnaire: panoramica](#3-la-combinazione-2008muyu--questionnaire-panoramica)
4. [Uso sicuro di 2008muyu + questionnaire (guida dettagliata)](#4-uso-sicuro-di-2008muyu--questionnaire-guida-dettagliata)
5. [Workflow d'uso tipico (esempi)](#5-workflow-duso-tipico-esempi)
6. [Trasparenza e limiti](#6-trasparenza-e-limiti)

---

## 1. Le tre opzioni a confronto

### Filosofia

| Opzione | Filosofia |
|---|---|
| **Nostra (locale)** | Todo-tracker minimale: piano numerato → execution mode con marker `[DONE:n]`. Codice tuo, basato sull'esempio ufficiale di pi. |
| **`@narumitw/pi-plan-mode`** | Plan mode "alla Codex" maturo: piano come documento `<proposed_plan>`, focus su **sicurezza** dei tool custom, domande strutturate native. |
| **`@2008muyu/pi-plan` + `questionnaire`** | **Two-phase workflow**: pianifica con un modello *strong*, esegui con uno *light*. Piani **persistenti su disco**, multipli, gestibili. Domande strutturate via `questionnaire` (estensione separata). |

### Feature (verificato nel codice)

| Caratteristica | Nostra | narumitw | 2008muyu + questionnaire |
|---|:-:|:-:|:-:|
| `/plan` toggle | ✅ | ✅ | ✅ |
| `/plan <prompt>` inline | ❌ | ✅ | ✅ |
| `/plan resume / list / clean / abandon` | ❌ | ❌ | ✅ |
| Flag `--plan` | ✅ | ✅ | ✅ |
| `Ctrl+Alt+P` | ✅ | ❌ | ✅ |
| **Model switching automatico** (modello plan ≠ exec) | ❌ | ❌ | ✅ **(unico)** |
| Thinking level separato per fase | ❌ | ❌ | ✅ |
| **Piani persistenti su disco** (sopravvivono ai riavvii) | ❌ | ❌ | ✅ |
| Piani multipli gestibili | ❌ | ❌ | ✅ |
| Todo tracking con execution mode | ✅ `[DONE:n]` | ❌ | ✅ (stati ricchi: pending/done/skipped/blocked/deferred) |
| Piano come documento strutturato | lista numerata | `<proposed_plan>` XML | `.plans/<name>/PLAN.md` + handoff |
| **Domande strutturate all'utente** | ❌ | ✅ `plan_mode_question` | ✅ via `questionnaire` |
| Tool custom disabilitati di default (sicurezza) | ❌ | ✅ | ❌ (blacklist configurabile) |
| `/plan-settings` interattivo | ❌ | ❌ | ✅ |
| Env vars di configurazione | ❌ | ❌ | ✅ `PI_PLAN_*` / `PI_EXEC_*` |
| Bash filtering | allowlist | allowlist + blacklist ampia | configurabile: blacklist/allowlist |
| Dipendenze | nessuna | nessuna | nessuna (+ questionnaire: vedi §4) |
| Manutenzione | statica | attiva (33 release, 4246 dl/mese) | giovane (15 release, nata 2026-06-04) |

### Punti di forza unici

- **Nostra**: todo tracking minimale e trasparente; codice tuo, zero dipendenze esterne; massima compatibilità futura (esempio ufficiale pi).
- **narumitw**: domande strutturate **native** (`plan_mode_question`); **sicurezza massima** sui tool custom (disattivati di default, opt-in esplicito); il più maturo/community.
- **2008muyu + questionnaire**: **model switching two-phase** (ottimizza costo/qualità); **piani persistenti** e multipli; task tracking con stati ricchi; configurabile.

### Punti deboli

- **Nostra**: niente domande strutturate; non gestisce tool custom (rischio mutazione in plan mode); allowlist stretta; statica.
- **narumitw**: niente todo tracking (propone un piano, non lo esegue passo-passo); niente scorciatoia; piano = documento, non checklist.
- **2008muyu + questionnaire**: la più complessa (1487 righe + 448 di questionnaire); **giovane** (meno battle-tested); **due pacchetti da auditare**; la sicurezza dipende da una **blacklist che devi curare tu** (vedi §4); il model switching richiede API key per due modelli.

## 2. Quale scegliere (decisione rapida)

| Se ti importa di più... | Scegli |
|---|---|
| Ottimizzare **costo/qualità** (pianifica col top model, esegui col leggero) | **2008muyu + questionnaire** |
| **Piani persistenti** tra riavvii, multipli, gestiti come progetti | **2008muyu + questionnaire** |
| **Sicurezza massima** in plan mode + domande strutturate native, un solo pacchetto | **narumitw** |
| **Semplicità**, tutto incluso, niente da combinare/auditare due volte | **narumitw** |
| **Todo tracking minimale**, codice tuo, zero dipendenze | **Nostra** |
| Maturità/community/aggiornamenti | **narumitw** |

⚠️ **Non possono convivere**: tutti registrano il comando `/plan` (e il flag `--plan`). pi li rinominerebbe in `/plan:1` `/plan:2`. Sceglierne **uno solo**.

## 3. La combinazione 2008muyu + questionnaire: panoramica

### Perché si combinano bene (verificato nel codice)

1. **2008muyu si aspetta questionnaire.** Il system prompt di plan mode di 2008muyu dice testualmente: *«Use questionnaire when explicit choices are needed»* (`pi-plan.ts:244`).
2. **2008muyu scopre i tool a runtime, non li hardcoda.** Chiama `pi.getAllTools()` e li filtra (`resolvePlanToolsForCtx`, `pi-plan.ts:306`). Quindi il tool `questionnaire` di un'altra estensione viene visto e **rimane disponibile** in plan mode.
3. **Nessun conflitto di nomi.** 2008muyu registra `submit_plan`/`update_task`/`add_task`/`revise_plan`/`plan_status`/`reconcile_plans`; questionnaire registra `questionnaire`. Il comando `/plan` è solo di 2008muyu (questionnaire non ha slash command).

### Da dove prendiamo questionnaire

Tre forme possibili (tutte valide):

| Forma | Provenienza | Note |
|---|---|---|
| **`pi-questionnaire` (npm)** | `pi install npm:pi-questionnaire` (v2.0.1) | Pacchetto terzo pubblicato su npm. Comodo da installare, va **auditato**. |
| **Esempio bundled di pi** | `…/pi-coding-agent/examples/extensions/questionnaire.ts` (448 righe) | Va copiato in `~/.pi/agent/extensions/`. Codice leggibile, lo controlli tu. |
| **Altro tool di domanda** | qualunque estensione che registri un tool `questionnaire` | 2008muyu cerca per nome, non per sorgente. |

### Il punto di sicurezza (da capire bene)

**narumitw** disabilita tutti i tool non-built-in in plan mode di default (perché pi non sa se un'estensione è mutante). **2008muyu fa l'opposto**: tiene attivi tutti i tool tranne quelli in una tua **blacklist** (`planBlockedTools`). 

→ Significa che se hai estensioni **mutanti** installate (es. un'estensione custom che scrive file, o `pi-mcp-adapter` con tool MCP che possono scrivere), in plan mode di 2008muyu **rimarrebbero attive** a meno che tu non le blacklisti esplicitamente. Questo è il costo della flessibilità. La sezione §4 spiega come gestirlo in modo sicuro.

## 4. Uso sicuro di 2008muyu + questionnaire (guida dettagliata)

La strategia è: **installare i due pacchetti + bloccare esplicitamente ogni tool mutante in plan mode + configurare i modelli e la bash safety**. Così ottieni il massimo delle feature senza esporti al rischio di mutazioni non volute durante il planning.

### Passo 1 — Installazione

```bash
# 2008muyu (plan mode two-phase)
pi install npm:@2008muyu/pi-plan

# questionnaire (scegli UNA delle due forme)
pi install npm:pi-questionnaire          # forma A: pacchetto npm
# OPPURE forma B: copia l'esempio bundled di pi
cp ".../pi-coding-agent/examples/extensions/questionnaire.ts" ~/.pi/agent/extensions/
```

Poi **riavvia pi** (richiesto una tantum) o `/reload`.

> **Prerequisito del model switching:** ti servono API key per **due** modelli distinti: uno *strong* (per pianificare) e uno *light* (per eseguire). Senza entrambi, lo switch fallisce con *«No API key for …»* e 2008muyu torna al modello corrente.

### Passo 2 — Inventariare i tool mutanti da bloccare

Prima di configurare, scopri **quali tool mutanti** hai tra i piedi. Con pi avviato:

```
mcp({ search: "" })                     # se hai pi-mcp-adapter: tool MCP potenzialmente mutanti
```
oppure guarda la lista tool nell'header di avvio di pi / con `pi getAllTools` da un'estensione.

Tipici tool mutanti da **bloccare in plan mode**:
- built-in: `edit`, `write` (2008muyu li blocca già di default, ma esplicitarli non guasta)
- estensioni: qualunque tool che crea/modifica/cancella file o risorse (es. `firecrawl_*` se installato, tool MCP di scrittura, `godot_create_node` — che è proprio l'esempio del README di 2008muyu)
- tool MCP: quelli dei server remoti che mutano stato (es. i tool Stitch `create_project`/`generate_screen_from_text`/`edit_screens`)

### Passo 3 — Configurazione sicura

2008muyu legge la config da due posti (project override global):

| Scope | Path |
|---|---|
| Globale | `~/.pi/agent/pi-plan.json` |
| Progetto | `<cwd>/.pi/pi-plan.json` |

**Config globale consigliata** (`~/.pi/agent/pi-plan.json`):

```jsonc
{
  "planProvider": "anthropic",
  "planModel": "claude-opus-4-6",
  "planThinking": "medium",
  "execProvider": "openai",
  "execModel": "gpt-5.5",
  "execThinking": "low",
  "bashSafetyMode": "allowlist"
}
```

**Config di progetto** (`<cwd>/.pi/pi-plan.json`) — qui metti i tool mutanti specifici del progetto da bloccare:

```jsonc
{
  "planBlockedTools": [
    "edit",
    "write",
    "firecrawl_scrape",
    "firecrawl_search",
    "stitch_create_project",
    "stitch_generate_screen_from_text",
    "stitch_edit_screens",
    "stitch_generate_variants"
  ]
}
```

> I nomi dei tool MCP sono prefissati dal server (es. `stitch_*`, `firecrawl_*`). Verifica i nomi reali con `mcp({ search: "" })` prima di metterli in lista. I nomi built-in di pi sono: `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`.

### Passo 4 — Scegliere la `bashSafetyMode`

| Valore | Comportamento | Quando usarlo |
|---|---|---|
| `"allowlist"` (consigliato) | In plan mode bash accetta **solo** comandi in una safe-list (ls, grep, git status, --version, …). Tutto il resto è bloccato. | Default più sicuro. Coerente con "read-only". |
| `"blacklist"` | Blocca solo comandi in una unsafe-list (rm, git commit, npm install, …). Il resto passa. | Più permissivo; rischioso perché un comando non in lista può fare danni. |

Per plan mode, **usa `"allowlist"`**. La blacklist lascia troppi margini (es. `node script.js`, `python -c "..."`, comandi sconosciuti).

### Passo 5 — Verifica

1. Avvia pi, `/plan` (o `/plan <prompt>`). L'indicatore sotto l'editor deve mostrare `· read-only tools · strong model · /plan to exit`.
2. Verifica che il modello sia passato a quello di plan: l'LLM ti conferma o vedi `Plan mode ON — anthropic/claude-opus-4-6:medium` nella notifica.
3. Verifica che questionnaire sia attivo: chiedi all'agente di farti una domanda di decisione. Dovrebbe invocare il tool `questionnaire` (dialog strutturato), non bloccarsi.
4. Verifica che i tool bloccati lo siano davvero: chiedi all'agente di creare un file. Deve rifiutare/non poterlo fare (i tool non sono in lista → `pi.setActiveTools` li ha esclusi).

## 5. Workflow d'uso tipico (esempi)

### Esempio A — pianificare una feature complessa

1. **Entri in plan mode con il prompt:**
   ```
   /plan add authentication middleware with JWT support
   ```
   → pi passa al modello forte, restringe i tool a read-only + questionnaire, l'agente esplora il codebase. Mantiene un `.plans/add-auth-middleware/context.md` "living" mentre converge.

2. **L'agente ti fa domande strutturate** (via questionnaire) sulle decisioni rilevanti:
   - *Refresh token strategy?* [rotating / sliding / none / Other]
   - *Token storage?* [httpOnly cookie / localStorage / Other]
   - *Session invalidation on password change?* [yes / no / Other]

3. **L'agente chiama `submit_plan`** → crea `.plans/add-auth-middleware/PLAN.md` con handoff + task list. Ti si apre un menu:
   - **Execute the plan** → passa al modello leggero, ripristina i tool, inizia l'esecuzione task-by-task (con stati done/skipped/blocked).
   - **Stay in plan mode** → affina.
   - **Refine the plan** → modifica interattivamente.

4. **Durante l'esecuzione** l'agente chiama `update_task` per spuntare i task. `/todos` mostra lo stato (○/✓/⊘/✗/⏸).

### Esempio B — riprendere un piano interrotto

```
/plan resume
```
List i piani in-progress da disco. Scegli quello da continuare → riprende l'esecuzione (modello leggero) o riapre il planning (modello forte).

### Esempio C — gestire un task bloccato

Se in execution un task è `blocked`, si apre un menu: **skip / retry con spiegazione / replan / termina**. Scegli replan se serve ripianificare.

### Esempio D — config via environment variables (CI / shell script)

Invece del file JSON, puoi usare le env var (utile per script/CI):

```bash
export PI_PLAN_PROVIDER=anthropic
export PI_PLAN_MODEL=claude-opus-4-6
export PI_PLAN_THINKING=medium
export PI_EXEC_PROVIDER=openai
export PI_EXEC_MODEL=gpt-5.5
export PI_EXEC_THINKING=low
pi
```

## 6. Trasparenza e limiti

- **Affermazioni verificate sul codice**: 2008muyu cita `questionnaire` nel system prompt (`pi-plan.ts:244`) e usa `pi.getAllTools()` runtime (`pi-plan.ts:306`); model switching via `pi.setModel` (`pi-plan.ts:400`); blacklist via `planBlockedTools` (`pi-plan.ts:63`); `bashSafetyMode` (`pi-plan.ts:58,84`); persistenza `.plans/` (`pi-plan.ts:131`). narumitw ha `plan_mode_question` built-in (`plan-mode.ts:197`) e disabilita i non-built-in di default (`sourceInfo.source === "builtin"`, `plan-mode.ts:697`). questionnaire pubblicato su npm (`pi-questionnaire` v2.0.1) e bundled in pi (`examples/extensions/questionnaire.ts`, 448 righe).
- **NON installato né testato a runtime**. L'assunto che 2008muyu + questionnaire "si combinino senza attrito" è basato sull'analisi statica (nessun conflitto di nomi, API compatibili, prompt che lo cita), ma il comportamento reale (es. questionnaire funziona nel contesto UI di plan-mode di 2008muyu? la blacklist blocca davvero tutti i tool mutanti?) **non è verificato empiricamente**.
- **Supply-chain**: 2008muyu + questionnaire = **due pacchetti terzi** da auditare (pieni permessi di sistema), non uno. Entrambi giovani: 2008muyu ha 3 settimane di vita (nata 2026-06-04, 15 release), questionnaire v2.0.1 va controllato a parte. Prima di installare, raccomando un **audit statico dei tarball** (come fatto per `pi-mcp-adapter`).
- **Bias dichiarato**: ho costruito io la nostra implementazione locale (copia dell'esempio ufficiale pi), quindi potrei sottostimarla; mi baso su fatti di codice per il confronto.
- I nomi dei tool MCP (es. `stitch_*`) negli esempi sono indicativi: verificali con `mcp({ search: "" })` nel tuo ambiente prima di metterli in `planBlockedTools`.
- **Sicurezza residua**: anche con `planBlockedTools` curata e `bashSafetyMode: "allowlist"`, la sicurezza di 2008muyu dipende dalla tua blacklist. Se installi una nuova estensione mutante e ti dimentichi di aggiornare `planBlockedTools`, quella resta attiva in plan mode. narumitw non ha questo problema (opt-in esplicito). È un trade-off da accettare coscientemente.

---

*Versioni di riferimento: nostra = snapshot esempio ufficiale pi · `@narumitw/pi-plan-mode` 0.8.0 · `@2008muyu/pi-plan` 1.4.2 · `pi-questionnaire` 2.0.1. Snapshot npm 2026-06-24. Nessun pacchetto installato/eseguito in questa valutazione.*
