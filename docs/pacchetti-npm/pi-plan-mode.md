# @narumitw/pi-plan-mode — plan mode in stile Codex per pi

> Estensione pi che aggiunge una modalità `/plan` in stile Codex: esplorazione in sola lettura, domande di chiarimento e un blocco finale `<proposed_plan>` pronto per l'implementazione, prima di qualsiasi mutazione del codice. Pi core non include un plan mode nativo (per scelta progettuale); questo pacchetto lo fornisce come estensione installabile.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@narumitw/pi-plan-mode` |
| Repository | <https://github.com/narumiruna/pi-extensions> |
| Documentazione | <https://github.com/narumiruna/pi-extensions#readme> |
| Licenza | MIT |

## Installazione

```bash
pi install npm:@narumitw/pi-plan-mode
```

Prova senza installare permanentemente:

```bash
pi -e npm:@narumitw/pi-plan-mode
```

## Configurazione

Nessun file di config dedicato: lo stato del plan mode persiste nella sessione pi (resume ripristina la modalità). Il pacchetto va in `~/.pi/agent/settings.json` → `packages`. Espone un'estensione (`src/plan-mode.ts`).

## Uso

### Comandi e flag

```text
/plan             # entra/esci da Plan mode
/plan <prompt>    # entra in Plan mode e invia <prompt> come primo messaggio
/plan tools       # selettore dei tool attivi in Plan mode (paginato 10 per pagina)
```

```bash
pi --plan         # avvia direttamente la sessione in Plan mode
```

### Comportamento

In Plan mode:

- i tool built-in di sola lettura sono attivi di default (`read`, `bash` limitato, `grep`/`find`/`ls`);
- i tool mutanti built-in (`edit`, `write`) sono **bloccati**;
- i comandi bash mutanti sono bloccati (`rm`, `git commit`, install di dipendenze, redirect, lancio editor);
- le estensioni e i tool custom sono **disabilitati di default** (i tool pi non espongono metadata standardizzato di mutabilità): abilitali da `/plan tools` solo se accetti il rischio per quella sessione;
- un tool `plan_mode_question` (obbligatorio) permette all'agente di fare domande strutturate (1–3, ciascuna con opzioni e path Other) seguendo il pattern `request_user_input` di Codex;
- lo stato è mostrato nello statusline (`plan active` / `plan ready`; `@narumitw/pi-statusline` aggiunge l'icona `📝`);
- al completamento, l'agente produce esattamente un blocco `<proposed_plan>` e pi chiede se implementarlo, restare in plan o uscire e scartare.

### Struttura del `<proposed_plan>`

```xml
<proposed_plan>
# Title

## Summary
...

## Key Changes
...

## Test Plan
...
</proposed_plan>
```

## Esempi

### Esempio 1 — entrare in plan mode e pianificare una feature

```text
/plan
Aggiungi l'export PDF al modulo report. Considera le opzioni pandoc vs weasyprint.
```

### Esempio 2 — entrare e inviare subito il prompt

```text
/plan Refactoring del modulo auth: valuta session vs JWT.
```

### Esempio 3 — abilitare un tool di estensione per la pianificazione

```text
/plan tools
# seleziona biome_lsp_diagnostics dalla lista paginata
```

Per la guida operativa verificata sul codice e le note di sicurezza vedi [`docs/approfondimenti/plan-mode-narumitw.md`](../approfondimenti/plan-mode-narumitw.md). Per il confronto con altre opzioni di plan mode vedi [`docs/approfondimenti/plan-mode-confronto.md`](../approfondimenti/plan-mode-confronto.md).
