# pi-questionnaire — `AskUserQuestion` (TUI interattiva con sincronizzazione browser)

> Estensione pi compatibile con Claude Code che registra il tool `AskUserQuestion`: 1–4 domande per chiamata, 5 tipi di domanda, note per domanda, checkmark persistenti, anteprime ricche, flow di conferma digitata per azioni distruttive e side-effect per impostazione.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-questionnaire` |
| Repository | <https://github.com/clankercode/pi-questionnaire> |
| Documentazione | <https://github.com/clankercode/pi-questionnaire#readme> (più `docs/USAGE.md`, `docs/ARCHITECTURE.md`) |
| Licenza | CC0-1.0 OR Unlicense |

## Installazione

```bash
# dal repo
pi install .

# manual install (alternative)
pnpm install
# poi aggiungi a ~/.pi/agent/settings.json → extensions:
#   /absolute/path/to/pi-questionnaire/src/index.ts
```

Riavvia pi (o `/reload`) per caricare l'estensione. In questa configurazione il pacchetto è gestito come npm package (vedi `~/.pi/agent/settings.json` → `packages`).

## Configurazione

Configurazione via file JSON (globale + progetto, il progetto sovrascrive il globale):

- globale: `<agentDir>/ask-user-question.json` (≈ `~/.pi/agent/ask-user-question.json`)
- progetto: `<cwd>/.pi/ask-user-question.json`

13 campi raggruppati:

| Gruppo | Campo | Default | Effetto |
| --- | --- | --- | --- |
| Browser | `browserEnabled` | `true` | avvia il server HTTP insieme alla TUI |
| | `browserAutoOpen` | `false` | auto-apre il browser quando ≥ `browserMinQuestions` |
| | `browserMinQuestions` | `2` | soglia di auto-open (1–4) |
| | `copyUrlToClipboard` | `true` | copia l'URL negli appunti quando generato |
| Audio/UX | `bellOnQuestion` | `true` | BEL audible al mount |
| | `notificationOnQuestion` | `false` | notifica desktop al mount |
| | `notificationDelaySeconds` | `30` | ritardo notifica (0–300) |
| | `ttsOnQuestion` | `false` | pronuncia l'header via `attn` |
| | `onQuestionCommand` | `""` | comando shell al mount (riceve payload via env) |
| Heartbeat | `heartbeatWhileActive` | `false` | keepalive mentre la TUI è a schermo |
| | `heartbeatIntervalMinutes` | `4.5` | intervallo idle in minuti (0.5–60) |
| Input | `debounceMs` | `300` | debounce (ms) su number/free_text |
| Safety | `dangerCheckEnabled` | `true` | applica il flow di conferma digitata per `is_dangerous` |

Esempio con segnaposto:

```jsonc
// ~/.pi/agent/ask-user-question.json
{
  "browserEnabled": true,
  "bellOnQuestion": true,
  "dangerCheckEnabled": true
}
```

## Uso

Il modello chiama il tool `AskUserQuestion`. Ogni domanda richiede `header`, `question`, `type`. Le domande a scelta richiedono `options` (tranne `confirm_enum` che auto-genera `[{Affirm},{Decline}]`).

| Tipo | UI | Valore restituito |
| --- | --- | --- |
| `select_one` | lista, ↑↓ + Enter | `{mode:"option",value}` o `{mode:"other",text}` |
| `select_many` | checkbox + `[Select]` | `[{mode:"option",value} \| {mode:"other",text},…]` |
| `confirm_enum` | lista Affirm/Decline/Other | `{mode:"option",value:"affirm"\|"decline"}` o `other` |
| `number` | editor + nudge ↑/↓ | `number` (onora `min`/`max`) |
| `free_text` | editor multilinea | `string` |

Restituisce una mappa canonica indicizzata a stringa: `{ "0": {...}, "1": [...] }`. Un'opzione sintetica **Other** è sempre auto-aggiunta alle domande a scelta (max 7 opzioni utente + Other = 8). `Tab`/`n` apre l'editor note (indipendenti dall'answer).

### Mappatura tasti essenziale

`↑↓` naviga · `Enter` seleziona/commit · `Space` toggle (select_many) · `Tab`/`n` note · `1`–`9` selezione indice · `Meta+1..4` salta domanda · `[`/`]` domanda prev/next · `e` espande preview · `o` apre browser · `?` help · `Esc` annulla.

## Esempi

### Esempio 1 — select_one con descrizioni

```json
{
  "questions": [{
    "header": "Env",
    "question": "Which environment should we deploy to?",
    "type": "select_one",
    "options": [
      { "label": "staging",    "description": "Validate safely" },
      { "label": "production", "description": "Ship it" },
      { "label": "canary",     "description": "1% of traffic" }
    ]
  }]
}
```

### Esempio 2 — conferma distruttiva (flow digitato)

```json
{
  "questions": [{
    "header": "Wipe DB",
    "question": "Drop the prod database?",
    "type": "confirm_enum",
    "is_dangerous": true
  }]
}
```

Con `is_dangerous: true` (e `dangerCheckEnabled` attivo) la TUI mostra `⚠️ DESTRUCTIVE` e costringe a digitare una stringa di conferma prima di accettare. `Esc` annulla l'intero questionario (nessun commit parziale).

### Esempio 3 — batch di più domande

```json
{
  "questions": [
    { "header": "Scope",   "question": "Which scope?",     "type": "select_one", "options": [{"label":"app"},{"label":"lib"}] },
    { "header": "Verbose", "question": "Verbose logging?", "type": "confirm_enum" }
  ]
}
```
