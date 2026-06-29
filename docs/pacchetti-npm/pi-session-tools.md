# @gotgenes/pi-session-tools — metadati di sessione per workflow multi-sessione

> Estensione pi che fornisce tool per i metadati di sessione (naming, contesto, transcript strutturato) utili nei workflow multi-sessione e nei subagent.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@gotgenes/pi-session-tools` |
| Repository | <https://github.com/gotgenes/pi-packages> (sottocartella `packages/pi-session-tools`) |
| Documentazione | <https://github.com/gotgenes/pi-packages/tree/main/packages/pi-session-tools#readme> |
| Licenza | MIT |

## Installazione

```bash
pi install npm:@gotgenes/pi-session-tools
```

## Configurazione

Nessuna configurazione dedicata: i metadati vivono nelle entry di sessione di pi. Il pacchetto va elencato in `~/.pi/agent/settings.json` → `packages`.

## Uso

Espone 4 tool:

### `set_session_name`

Imposta il nome display della sessione corrente (mostrato nel selettore sessioni). Usa un formato stage-encoded per identificare issue e fase.

```text
set_session_name({ name: "#42 Planning — Extract ExtensionPaths" })
```

| Stage | Formato |
| --- | --- |
| Planning | `#N Planning — <title>` |
| TDD | `#N TDD — <title>` |
| Build | `#N Build — <title>` |
| Retrospective | `#N Retrospective — <title>` |

### `get_session_name`

Restituisce il nome display impostato, se presente.

```text
get_session_name({})
```

### `read_session`

Legge le entry della sessione corrente come transcript strutturato (utile per retro e contesto cross-session).

```text
read_session({ types?: string[], limit?: number })
```

- `types` — filtra per tipo (es. `["message","compaction"]`); ometti per tutti;
- `limit` — solo le ultime N entry dopo il filtro.

Output: turni numerati user/assistant, one-line summary delle chiamate tool con stato, eventi metadata (compaction, model change). I corpi dei tool result, il thinking e le immagini sono omessi. Nella TUI riga compatta di default (`✓ 42 entries — 38 messages, 18 tool calls, 2 compactions`), `Ctrl-O` espande; il modello riceve sempre il transcript completo.

### `read_parent_session`

Legge le entry della sessione **parent** come transcript strutturato, quando si è dentro un subagent. Deriva il file di sessione parent dal layout della directory subagent. Restituisce errore se non si è in un contesto subagent. Parametri e output come `read_session`.

## Esempi

### Esempio 1 — nominare la sessione per la fase di lavoro

```text
set_session_name({ name: "#7 Build — Aggiungi export PDF" })
```

### Esempio 2 — leggere gli ultimi 10 messaggi della sessione

```text
read_session({ types: ["message"], limit: 10 })
```

### Esempio 3 — ispezionare il contesto del parent da un subagent

```text
read_parent_session({ limit: 5 })
```

Output di esempio (formato transcript):

```text
1. user
Come risolvo il bug di login?
---
2. assistant [anthropic/claude-sonnet-4]
  [tool] Read — path: src/auth/login.ts → completed
  [tool] Bash — command: pnpm vitest login → error
Il test fallisce perché...
---
[model change] → anthropic/claude-opus-4
```

Per la valutazione d'uso vedi [`docs/approfondimenti/gotgenes-packages-guida.md`](../approfondimenti/gotgenes-packages-guida.md).
