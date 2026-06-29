# pi-codex-goal — tracking degli obiettivi in stile Codex

> Estensione pi che aggiunge il comando `/goal` e tre tool richiamabili dal modello (`get_goal`, `create_goal`, `update_goal`). Lo stato del goal è salvato nelle custom entry di sessione di pi, quindi segue history, resume, fork, tree navigation, reload e compattazione senza database esterno.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-codex-goal` |
| Repository | <https://github.com/fitchmultz/pi-codex-goal> |
| Documentazione | <https://github.com/fitchmultz/pi-codex-goal#readme> (più `prompts/` e `docs/`) |
| Licenza | MIT |
| Riferimenti pratiche | <https://developers.openai.com/codex/use-cases/follow-goals> · <https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex> |

## Installazione

```bash
# da npm (raccomandato)
pi install npm:pi-codex-goal

# versione npm pinnata (solo se strettamente necessario)
pi install npm:pi-codex-goal@<version>

# da GitHub
pi install https://github.com/fitchmultz/pi-codex-goal
# release tag pinnata
pi install https://github.com/fitchmultz/pi-codex-goal@v<version>
```

> **Evita installazioni duplicate** (globale + project-local nello stesso scope): registrano entrambe `get_goal`/`create_goal`/`update_goal` causando conflitti di registrazione dei tool. Tieni il pacchetto attivo in un solo scope di config.

## Configurazione

Nessun file di configurazione dedicato: lo stato del goal vive nelle custom entry di sessione. Il funzionamento si basa su:

- `~/.pi/agent/settings.json` — il pacchetto va elencato in `packages`.
- prompt template `/create-goal` incluso nel pacchetto (`prompts/`).

Il pacchetto non richiede segreti propri: usa l'autenticazione del modello già configurata in pi.

## Uso

### Comandi utente

```text
/create-goal <task e requisiti>   # modo raccomandato per iniziare un goal
/goal                             # stato attuale: obiettivo, status, budget, uso token, tempo
/goal <obiettivo>                 # nuovo goal o sostituzione (dopo conferma)
/goal pause                       # mette in pausa (solo se active)
/goal resume                      # riprende (solo se paused)
/goal resume cancel               # annulla un retry programmato
/goal copy                        # copia l'obiettivo negli appunti
/goal clear                       # cancella il goal
```

`/create-goal <task>` è raccomandato: espande il task in un obiettivo rigoroso (outcome, verifica, vincoli, iterazione, audit, blocked-stop) e chiede al modello di chiamare `create_goal` con `replace_existing: true`, così non serve `/goal clear` prima di un nuovo goal. Limite: 8000 caratteri Unicode per l'obiettivo.

### Tool per il modello

| Tool | Comportamento |
| --- | --- |
| `create_goal` | avvia un goal con `objective` e `token_budget` (intero positivo, opzionale). Fallisce se esiste già un goal non-complete, a meno di `replace_existing: true`. |
| `get_goal` | restituisce stato, budget, uso token, tempo attivo. |
| `update_goal` | accetta solo `status: "complete"`. Idempotente su goal già completati. |

In ambienti MCP bridged i tool possono essere esposti con nomi namespaced (`pi__get_goal`, `pi__create_goal`, `pi__update_goal`): chiama il nome effettivamente esposto.

### Comportamento con goal attivo

- traccia il tempo attivo tra turni e completamenti dei tool;
- somma l'uso token (input+output) dei turni assistant completati quando il modello lo riporta;
- pausa alabort del turn (es. Esc);
- recovery da errori provider senza loop di continuazione immediati (compattazione automatica su overflow, backoff bounded su errori transienti);
- prompt su session resume prima di riattivare un goal in pausa;
- goal completati sono **terminali**: pause/resume/continuation non li riaprono (usa `/goal <obiettivo>`, `create_goal` con `replace_existing: true`, o `/goal clear`);
- marca `budgetLimited` al raggiungimento del budget;
- invia hidden steering messages a budget raggiunto o quando l'agente è idle;
- mostra etichette di stato stile Codex nel footer pi (quando UI disponibile).

## Esempi

### Esempio 1 — creare un goal con il prompt template

```text
/create-goal Build the requested feature and verify it end to end
```

### Esempio 2 — smoke test interattivo veloce

```text
/goal Create /tmp/pi-codex-goal-fast.txt containing PI_GOAL_FAST_OK; verify with cat; mark complete; report final status.
```

Output atteso:

```text
Verified file path: /tmp/pi-codex-goal-fast.txt
Verified content: PI_GOAL_FAST_OK
Final goal status: complete
```

### Esempio 3 — smoke test completo (verifica col tool `read`)

```text
/goal Create /tmp/pi-codex-goal-slash-smoke.txt containing PI_GOAL_SLASH_OK, verify the file content from the filesystem, inspect the current goal, and mark the goal complete only after verification. Final reply must include the verified file path, verified content, and final goal status.
```

> **Headless/automazione**: non usare `pi -p '/goal ...'` per smoke del comando slash (print mode non è un path affidabile); piuttosto, fai chiamare al modello direttamente i tool `create_goal`/`get_goal`/`update_goal`.
