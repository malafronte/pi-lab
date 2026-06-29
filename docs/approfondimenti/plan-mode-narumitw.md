# pi-plan-mode (@narumitw) — guida operativa e note di sicurezza

> Guida **applicata e verificata sul codice** per l'estensione `@narumitw/pi-plan-mode` v0.9.1. Sostituisce il precedente documento sulla configurazione di `@2008muyu/pi-plan` (rimosso). Tutte le affermazioni sui comportamenti del codice sono lette direttamente in `src/plan-mode.ts` del tarball installato.
>
> Complementare a `pi-plan-mode-confronto.md` (confronto tra le tre opzioni): qui trovi uso pratico, sicurezza e differenze vs 2008muyu per chi viene da quella.

**Data:** 2026-06-26 · **Versione estensione:** `@narumitw/pi-plan-mode` 0.9.1 · **`pi-questionnaire` mantenuto** (utile fuori dal plan mode).

---

## Indice

1. [Riepilogo esecutivo](#1-riepilogo-esecutivo)
2. [Cosa ho verificato nel codice (fatti, non README)](#2-cosa-ho-verificato-nel-codice-fatti-non-readme)
3. [Configurazione: zero file](#3-configurazione-zero-file)
4. [Come si usa](#4-come-si-usa)
5. [Abilitare tool custom con `/plan tools`](#5-abilitare-tool-custom-con-plan-tools)
6. [Raccomandazioni di sicurezza](#6-raccomandazioni-di-sicurezza)
7. [Differenze vs @2008muyu/pi-plan](#7-differenze-vs-2008muyupi-plan)
8. [Perché questionnaire resta installato](#8-perché-questionnaire-resta-installato)
9. [Verifica post-avvio](#9-verifica-post-avvio)
10. [Limiti e trasparenza](#10-limiti-e-trasparenza)

---

## 1. Riepilogo esecutivo

- ✅ `@narumitw/pi-plan-mode` 0.9.1 installata; `@2008muyu/pi-plan` rimossa; file di config di 2008muyu cancellati.
- ✅ **Zero configurazione**: narumitw non legge file `pi-plan.json` né env var. Pronto out-of-the-box.
- ✅ **Sicurezza opt-in (allowlist)**: in plan mode sono attivi **solo** 5 tool built-in read-only (`read`, `bash` limitato, `grep`, `find`, `ls`). `edit`/`write` bloccati. **Tutti i tool non-built-in sono disattivati di default** (estensioni, custom, MCP) — si riabilitano uno a uno, a tuo rischio, con `/plan tools`.
- ✅ **Niente model switching**: narumitw non cambia modello (resta `zai-coding-cn/glm-5.2`). Coerente con coding plan flat.
- ✅ **Domande strutturate native** via tool `plan_mode_question` (non usa questionnaire).

---

## 2. Cosa ho verificato nel codice (fatti, non README)

### 2.1 Allowlist rigorosa sui tool built-in

```ts
// plan-mode.ts:9
const SAFE_BUILTIN_PLAN_TOOLS = new Set(["read", "bash", "grep", "find", "ls"]);
// plan-mode.ts:11
const BLOCKED_BUILTIN_TOOLS = new Set(["edit", "write"]);
// plan-mode.ts:564 (filtro applicato)
.filter((tool) => isBuiltinTool(tool) && SAFE_BUILTIN_PLAN_TOOLS.has(tool.name))
```

→ In plan mode, dei tool built-in passano **solo** quei 5. `edit` e `write` sono bloccati esplicitamente. Tutto il resto dei built-in (se ce ne fossero altri) è escluso perché non nell'allowlist.

### 2.2 Il criterio di sicurezza chiave: `source === "builtin"`

```ts
// plan-mode.ts:696-697
function isBuiltinTool(tool: ToolInfo) {
  return tool.sourceInfo.source === "builtin";
}
// plan-mode.ts:915 (prompt iniettato)
// - Plan Mode manages built-in tool safety only. Non-built-in tools are disabled
//   by default and may be enabled by the user at their own risk.
```

→ **Tutto ciò che non è built-in è OFF di default in plan mode.** Estensioni (`pi-studio`, `pi-subagents`, `pi-github-tools`…), tool custom e tool MCP (`stitch_*`) sono disattivati finché non li abiliti esplicitamente. È l'opposto di 2008muyu (blacklist) ed è il motivo per cui narumitw è intrinsecamente più sicuro: **non devi curare nessuna lista**, un nuovo tool mutante installato resta inoffensivo in plan mode.

### 2.3 Bash filtering con blocklist ampia

```ts
// plan-mode.ts:143  MUTATING_BASH_PATTERNS = [
/\brm\b/i,  /\brmdir\b/i,  /\bmv\b/i,  /\bcp\b/i,  /\bmkdir\b/i,  /\btouch\b/i,
/\bchmod\b/i,  /\bchown\b/i,  /\bchgrp\b/i,  /\bln\b/i,  /\btee\b/i,  /\btruncate\b/i,  /\bdd\b/i,
/(^|[^<])>(?!>)/,  />>/,                              // redirect
/\bnpm\s+(install|uninstall|update|ci|link|publish|version)\b/i,
/\byarn\s+(add|remove|install|publish|upgrade)\b/i,
/\bpnpm\s+(add|remove|install|publish|update)\b/i,
/\bbun\s+(add|remove|install|update|publish)\b/i,
/\bpip\s+(install|uninstall)\b/i,
/\buv\s+(add|remove|sync|lock|pip\s+install)\b/i,
/\bgit\s+(add|commit|push|pull|merge|rebase|reset|checkout|switch|stash|cherry-pick|revert|tag|init|clone)\b/i,
/\bsudo\b/i,  /\bsu\b/i,  /\bkill\b/i,  /\bpkill\b/i,  /\bkillall\b/i,
/\breboot\b/i,  /\bshutdown\b/i,
/\bsystemctl\s+(start|stop|restart|enable|disable)\b/i,
/\bservice\s+\S+\s+(start|stop|restart)\b/i,
// ... (altri)
// plan-mode.ts:966  if (MUTATING_BASH_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
```

→ Il tool `bash` resta disponibile, ma i comandi mutanti sono bloccati da una blocklist **ampia e curata**: file ops (rm/mv/cp/mkdir/touch/chmod/ln/dd), redirect (`>`, `>>`), tutti i package manager (npm/yarn/pnpm/bun/pip/uv), git nelle sue forme mutanti (commit/push/merge/reset/…), privilege escalation (sudo/su), processi (kill), sistema (reboot/shutdown/systemctl). Passano comandi read-only (`ls`, `grep`, `git status`, `git log`, `--version`…).

### 2.4 `plan_mode_question` è nativo, non usa questionnaire

```ts
// plan-mode.ts:7
const PLAN_MODE_QUESTION_TOOL_NAME = "plan_mode_question";
```

→ In plan mode, l'agente fa domande strutturate con il **suo** tool nativo (pattern Codex `request_user_input`: 1–3 domande con opzioni + percorso free-form "Other"). `questionnaire` non è coinvolto.

### 2.5 Il piano è in memoria (non su disco)

```ts
// plan-mode.ts:14
const PROPOSED_PLAN_PATTERN = /<proposed_plan>\s*([\s\S]*?)\s*<\/proposed_plan>/i;
// plan-mode.ts:2-3  (stato persistente in SESSIONE, non su file)
const STATE_ENTRY_TYPE = "plan-mode-state";
const STATUS_KEY = "plan-mode";
```

→ Il piano è un blocco `<proposed_plan>` nel messaggio, rilevato via regex. Lo **stato** della modalità (on/off + piano corrente) persiste nella sessione pi (quindi `resume` lo ripristina), ma **non ci sono file su disco** come in 2008muyu (niente `.plans/`). Uscendo dal plan mode senza implementare, il piano è scartato.

---

## 3. Configurazione: zero file

A differenza di 2008muyu, narumitw **non ha parametri di configurazione**:

- ❌ Nessun file `~/.pi/agent/pi-plan.json`.
- ❌ Nessun file `.pi/pi-plan.json` di progetto.
- ❌ Nessuna env var `PI_PLAN_*` / `PI_EXEC_*`.
- ❌ Nessun model switching (usa il modello corrente).

Tutto il comportamento è hardcoded e ragionevole. L'unica "configurazione" è la scelta runtime dei tool attivi in plan mode via `/plan tools` (§5), che è di sessione.

**Modello in plan mode:** resta quello corrente di pi (`zai-coding-cn/glm-5.2` nel tuo caso). Se vuoi un thinking diverso durante il planning, cambia il thinking level di pi normalmente prima di `/plan`.

---

## 4. Come si usa

| Comando | Azione |
| --- | --- |
| `/plan` | Entra/esci dalla plan mode (toggle). |
| `/plan <prompt>` | Entra in plan mode e invia subito `<prompt>` come primo messaggio. |
| `/plan tools` | Apre il selettore dei tool attivi in plan mode (paginato a 10 per pagina). |
| `/plan exit` | Esce dalla plan mode **scartando** il piano corrente (non lo implementa). |

### Flusso tipico

1. `/plan` → la statusline mostra `plan active`. Tool ridotti ai 5 read-only built-in.
2. L'agente esplora (read-only), ti fa domande strutturate via `plan_mode_question` sugli snodi decisionali rilevanti.
3. Quando ha finito, produce un blocco `<proposed_plan>` → la statusline mostra `plan ready`.
4. Scegli:
   - **Implement** → plan mode off, tool ripristinati tutti, l'agente inizia a eseguire con il piano.
   - **Stay** → resti in plan mode per affinare (digita il feedback nel prompt normale).
   - **Exit/off** → esci e scarti il piano.

### Blocco `<proposed_plan>` (formato atteso)

```xml
<proposed_plan>
# Title

## Summary
...
## Key Changes
...
## Test Plan
...
## Assumptions
...
</proposed_plan>
```

---

## 5. Abilitare tool custom con `/plan tools`

Di default, in plan mode **nessun** tool non-built-in è attivo. Se ti serve (es. leggere dati da un tool MCP read-only durante il planning), abilitalo esplicitamente:

1. `/plan tools` → apre il selettore paginato (10 tool per pagina).
2. Il selettore mostra, per ogni tool, la **sorgente effettiva** (`built-in`, `user extension <path>`, `project extension <path>`) e lo stato (`built-in` / `built-in limited` / `built-in blocked` / `extension off` / `extension on`).
3. Scegli quali abilitare. La scelta è **per sessione** e **a tuo rischio**: narumitw non classifica la mutabilità dei tool di estensione, quindi valuta tu.

> Esempio: in plan mode potresti volere `stitch_list_projects` o `stitch_get_screen` (read-only) per analizzare un progetto Stitch durante il planning. Li abiliti da `/plan tools`. I tool mutanti (`stitch_create_*`, `stitch_edit_screens`…) **non abilitarli** in plan mode: è proprio lo scenario che l'opt-in di default ti protegge.

**Differenza chiave vs 2008muyu:** con 2008muyu i tool mutanti erano attivi di default e dovevi ricordarti di bloccarli. Con narumitw è il contrario: sono off di default e li accendi solo se ti servono. Non c'è nulla da "dimenticare".

---

## 6. Raccomandazioni di sicurezza

### 6.1 Cosa la configurazione attuale garantisce (automaticamente)

In plan mode, senza alcuna azione tua:

- ✅ Solo 5 tool built-in read-only attivi (`read`, `bash` limitato, `grep`, `find`, `ls`).
- ✅ `edit`/`write` bloccati.
- ✅ Tutte le estensioni (`pi-studio`, `pi-subagents`, `pi-github-tools`, …) e i tool MCP (`stitch_*`) disattivati.
- ✅ Bash filtra comandi mutanti (rm, git commit, npm install, redirect, sudo, kill, …).
- ✅ `studio_repl_send`, `subagent`, `issue_close`, `release_pr_merge` e tutti i `stitch_*` mutanti: **inattivi in plan mode senza doverli blacklistare**.

### 6.2 Rischi residui

| Rischio | Descrizione | Mitigazione |
| --- | --- | --- |
| **Opt-in consapevole** | Se abiliti un tool mutante via `/plan tools`, quello resta attivo in plan mode per la sessione. | Abilita solo tool che hai verificato read-only. Non abilitare tool di scrittura/modifica durante il planning. |
| **Piano non persistente** | Uscendo senza implementare, il `<proposed_plan>` è scartato. Niente `.plans/` su disco. | Se vuoi conservare un piano, copialo dal messaggio. Oppure usa "Stay" e implementalo nello stesso turno. |
| **Niente tracking esecuzione** | narumitw è plan-only: non traccia task durante l'implementazione (niente `/todos`, niente `update_task`). | Per il tracking post-piano usa la tua todo list (hai `rpiv-todo` installato) o il tool nativo `todo`. |
| **Bash blocklist (non allowlist)** | Il filtering bash è una **blocklist** (blocca i noti, passa il resto). Un comando mutante non in lista passerebbe. | Raro in pratica: la blocklist è ampia (regex su file ops, git, pkg manager, sudo, systemd…). Per difesa in profondità, resta l'opt-in sui tool (punto precedente) che è allowlist-based. |

### 6.3 Confronto sintetico dei modelli di sicurezza

|   | 2008muyu (prima) | **narumitw (ora)** |
| --- | --- | --- |
| Tool custom in plan mode | **attivi di default** (blacklist) | **disattivati di default** (opt-in) |
| Manutenzione richiesta | alta (curare `planBlockedTools` per progetto) | **nulla** |
| Esposizione a nuove estensioni | alta (un nuovo tool mutante è attivo finché non lo blocchi) | **nulla** (un nuovo tool è off di default) |
| Scope della blacklist | project-scoped, da replicare | n/a (non serve) |
| Bash | configurabile (`allowlist`/`blacklist`) | blocklist ampia fissa |

→ Con narumitw **non devi più pensare alla blacklist**: è il vantaggio principale per la tua sicurezza, soprattutto dato l'ambiente ricco di estensioni mutanti.

---

## 7. Differenze vs @2008muyu/pi-plan

Tabella di transizione per chi viene da 2008muyu (il tuo caso).

| Aspetto | 2008muyu (rimosso) | narumitw (attuale) |
| --- | --- | --- |
| Sicurezza tool custom | blacklist (attivi, da bloccare) | **opt-in** (off di default) ✅ |
| Model switching two-phase | sì (strong→light) | **no** (modello corrente) |
| Domande strutturate | via `questionnaire` | **native** (`plan_mode_question`) |
| Piani su disco (`.plans/`) | sì, persistenti, multipli | **no** (in memoria) |
| Piani multipli + `/plan resume/list/clean` | sì | no |
| Todo tracking esecuzione (`/todos`, `update_task`) | sì | no |
| Piano come | `PLAN.md` + handoff + task list | blocco `<proposed_plan>` in memoria |
| File di config | `pi-plan.json` (globale + progetto) + env var | **nessuno** |
| Bash safety | `bashSafetyMode: allowlist/blacklist` | blocklist ampia fissa |
| Comandi | `/plan`, `/plan resume/list/clean/abandon`, `/plan-settings`, `/todos` | `/plan`, `/plan <prompt>`, `/plan tools`, `/plan exit` |
| Statusline | notifica modello | `plan active` / `plan ready` |

**Cosa perdi (con coding plan flat,avevi poco da perdere):** persistenza su disco, multi-plan, tracking esecuzione, two-phase. Il two-phase con flat non dava vantaggio economico (solo qualità/latenza, modesto). La persistenza piani è l'unica perdita potenzialmente sensibile se facevi planning lungo multi-sessione.

**Cosa guadagni:** sicurezza opt-in senza manutenzione, zero file di config, un solo pacchetto, maturità maggiore (33 release vs 15, community più ampia), niente conflitto con `questionnaire`.

---

## 8. Perché questionnaire resta installato

`pi-questionnaire` registra il tool generico `AskUserQuestion` (description: *"Claude Code-compatible AskUserQuestion extension"*). Non è legato al plan mode:

- **In plan mode:** narumitw usa il suo `plan_mode_question` nativo → questionnaire non serve.
- **Fuori dal plan mode:** questionnaire è il tool che qualunque agente usa per farti domande strutturate a risposta multipla (es. per conferme, scelte, preferenze). È il tool usato anche in questa sessione per le scelte configurative.

Tenerlo non crea conflitto (narumitw non registra `AskUserQuestion`; questionnaire non registra `/plan`). Lo toglieresti solo se non volessi mai più ricevere domande strutturate da nessun agente (sconsigliato).

---

## 9. Verifica post-avvio

Dopo **riavviato pi** (o `:reload`), controlla:

1. **Comando presente.** `/plan` deve essere riconosciuto (niente `/plan:1`/`/plan:2` — segnale di conflitto se ci fossero altre estensioni plan installate).
2. **Statusline.** `/plan` → appare `plan active`.
3. **Tool ridotti.** In plan mode, chiedi all'agente di modificare un file: deve rifiutare (`edit`/`write` bloccati). Chiedi di lanciare un subagente o chiudere una issue: deve non poterlo fare (tool non-built-in off).
4. **Bash read-only.** `git status` deve passare; `npm install <x>` o `git commit` devono essere bloccati.
5. **Domanda strutturata.** Chiedi all'agente di farti una domanda di decisione: deve usare `plan_mode_question` (dialog nativo, non questionnaire).
6. **Piano.** Fatti produrre un `<proposed_plan>`: la statusline passa a `plan ready`. Scegli "Stay"/"Implement"/"Exit".

---

## 10. Limiti e trasparenza

- **Verificato sul codice installato.** I riferimenti `plan-mode.ts:NN` sono letti sul tarball `@narumitw/pi-plan-mode@0.9.1` in `~/.pi/agent/npm/node_modules/`. Lo schema di sicurezza (allowlist builtin + opt-in estensioni + bash blocklist) e i nomi dei tool (`plan_mode_question`) sono verificati, non assunti dal README.
- **Versione più recente del confronto.** `pi-plan-mode-confronto.md` si basava su narumitw 0.8.0; qui è installata la **0.9.1**. Comportamenti descritti confermati, ma potrebbero esserci dettagli minori cambiati tra 0.8.0 e 0.9.1 non coperti dal confronto.
- **Non testato a runtime da me.** Non ho eseguito `/plan` dopo l'installazione: i comportamenti sono letti nel codice. La verifica §9 è a tuo carico.
- **Bash blocklist, non allowlist.** È l'unico punto dove narumitw è leggermente meno difensivo di un allowlist puro: filtra per pattern noti invece di ammettere solo una whitelist. In pratica la blocklist è ampia; la difesa principale resta l'opt-in sui tool (che è allowlist-based).
- **Supply-chain.** `@narumitw/pi-plan-mode` è un pacchetto terzo con pieni permessi. Più maturo di 2008muyu (33 release) ma va comunque trattato come codice non tuo. `npm audit` sul tuo `~/.pi/agent/npm`: **0 vulnerabilità** al momento dell'installazione.
- **Piani non persistenti.** Se facevi planning lungo su più sessioni, nota che narumitw non salva i piani su disco: il `<proposed_plan>` vive nel messaggio. Valuta se ti serve conservarli manualmente.
- **Snapshot 2026-06-26.** Comportamenti verfici sulla 0.9.1; release future potrebbero cambiare il set dei tool allowlistati o i pattern bash.

---

*Documento generato il 2026-06-26 dopo la transizione da `@2008muyu/pi-plan` a `@narumitw/pi-plan-mode`. La transizione ha rimosso: estensione 2008muyu, `~/.pi/agent/pi-plan.json` (globale), `pi-test/.pi/pi-plan.json` (progetto). `pi-questionnaire` mantenuto.*
