# `config.json` di pi-permission-system — regole di permesso

> File di configurazione di `@gotgenes/pi-permission-system` (estensione globale): definisce le regole di permesso per tool, bash, path, MCP, skill e directory esterne. Percorso: `~/.pi/agent/extensions/pi-permission-system/config.json`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| File | `~/.pi/agent/extensions/pi-permission-system/config.json` |
| Schema | <https://raw.githubusercontent.com/gotgenes/pi-permission-system/main/schemas/permissions.schema.json> |
| Pacchetto | `@gotgenes/pi-permission-system` |

## Installazione / creazione

Il file si crea a mano nella directory dell'estensione globale dopo aver installato il pacchetto:

```bash
pi install npm:@gotgenes/pi-permission-system
mkdir -p ~/.pi/agent/extensions/pi-permission-system
# crea config.json (vedi sotto)
```

## Configurazione

Esempio (con **segnaposto semantici**, policy permissiva di base + deny su sensibili):

```jsonc
// ~/.pi/agent/extensions/pi-permission-system/config.json  (SEGAPOSTO)
{
  "$schema": "https://raw.githubusercontent.com/gotgenes/pi-permission-system/main/schemas/permissions.schema.json",
  "permissionReviewLog": true,
  "permission": {
    "*": "allow",                       // default per tutti i tool
    "path": {                           // gate cross-tool sui percorsi (resiste ai symlink)
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "~/.ssh/*": "deny",
      "*.example": "allow",
      "*.sample": "allow"
    },
    "bash": {
      "*": "allow",
      "git push": "ask",                // pattern esatto
      "git push *": "ask",              // pattern wildcard
      "rm -rf *": "deny"
    },
    "external_directory": {             // gate di confine CWD
      "*": "ask",
      "~/.cargo/registry/*": "allow"    // consenti cache esterne specifiche
    }
  }
}
```

### Stati

| Stato | Comportamento |
| --- | --- |
| `allow` | azione permessa silenziosamente |
| `deny` | blocca con errore |
| `ask` | prompt di conferma via UI (approvabile once o come pattern per la sessione) |

### Superfici

| Superficie | Ambito |
| --- | --- |
| `*` | tutti i tool |
| `path` | cross-cutting su tutti gli accessi ai file (tool, bash, MCP, estensioni); matcha path referenziato e forma canonical symlink-resolved |
| `bash` | comandi bash con pattern wildcard |
| `external_directory` | raggiungere fuori dalla CWD |
| (per-tool) | `read`/`write`/`edit`/`find`/`grep`/`ls` con pattern su `input.path` |
| (MCP/skill) | granularità server/tool/skill-name |

## Uso

L'estensione si carica all'avvio di pi e impone la policy come gate trasparente (nessun comando slash). `permissionReviewLog: true` registra le decisioni nel log di review.

## Esempi

### Esempio 1 — proteggere `.env` da ogni tool

```jsonc
{ "permission": { "path": { "*.env": "deny", "*.env.*": "deny", "*.env.example": "allow" } } }
```

### Esempio 2 — `ask` su `git push`

```jsonc
{ "permission": { "bash": { "*": "allow", "git push": "ask", "git push *": "ask" } } }
```

Vedi [`docs/pacchetti-npm/pi-permission-system.md`](../pacchetti-npm/pi-permission-system.md) (pagina unificata: pacchetto npm + installazione globale + config).
