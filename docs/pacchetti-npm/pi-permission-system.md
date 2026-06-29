# @gotgenes/pi-permission-system — gates di permesso centralizzati

> Estensione pi che fornisce gate di permesso centralizzati e deterministici su tool, bash, MCP, skill, path e directory esterne. Nasconde i tool non permessi prima dell'avvio, impone allow/ask/deny al momento della chiamata, controlla i comandi bash con pattern wildcard, protegge file sensibili e fallisce "chiuso" (un bash non parseabile diventa `ask`, non passa in silenzio).

> **Fork notice (ufficiale):** fork completo di `MasuRii/pi-permission-system`, pubblicato come `@gotgenes/pi-permission-system`. Diverge sostanzialmente da upstream in formato config, architettura interna e modello di permesso.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@gotgenes/pi-permission-system` |
| Repository | <https://github.com/gotgenes/pi-packages> (sottocartella `packages/pi-permission-system`) |
| Documentazione | <https://github.com/gotgenes/pi-packages/tree/main/packages/pi-permission-system#readme> |
| Licenza | MIT |
| Schema config | <https://raw.githubusercontent.com/gotgenes/pi-permission-system/main/schemas/permissions.schema.json> |

## Installazione

Questo componente è installato in **due modi complementari** nella configurazione di questo repo:

### 1. Pacchetto npm (canale di consegna)

```bash
pi install npm:@gotgenes/pi-permission-system
```

Elencalo in `~/.pi/agent/settings.json` → `packages`:

```jsonc
{ "packages": ["npm:@gotgenes/pi-permission-system"] }
```

Questo installa il codice dell'estensione (il `pi.extensions` punta a `./src/index.ts`) in `~/.pi/agent/npm/node_modules/@gotgenes/pi-permission-system`.

### 2. Estensione globale con config locale (installazione custom)

Oltre al pacchetto npm, in questa configurazione l'estensione è registrata anche come **estensione globale** in `~/.pi/agent/extensions/pi-permission-system/`, con un file di policy `config.json` personalizzato e una directory `logs/` per il review log. Per replicare questa installazione:

```bash
# crea la directory dell'estensione globale
mkdir -p ~/.pi/agent/extensions/pi-permission-system
# crea ~/.pi/agent/extensions/pi-permission-system/config.json (vedi Configurazione)
```

> **Nota sui due canali:** il pacchetto npm fornisce il codice; la directory dell'estensione globale fornisce la **policy personalizzata** (`config.json`) che sovrascrive i default. Senza `config.json`, l'estensione usa la policy di default del pacchetto.

## Configurazione

Il file di policy è `~/.pi/agent/extensions/pi-permission-system/config.json`. La policy attuale di questo repo è permissiva di base con deny su file sensibili (`.env`, `~/.ssh/*`) e `ask` su `git push`. Riferimento completo dei campi in [`docs/config/permission-system.md`](../config/permission-system.md).

```jsonc
// ~/.pi/agent/extensions/pi-permission-system/config.json  (SEGAPOSTO: nessun path reale)
{
  "$schema": "https://raw.githubusercontent.com/gotgenes/pi-permission-system/main/schemas/permissions.schema.json",
  "permissionReviewLog": true,                 // logga le decisioni del gate
  "permission": {
    "*": "allow",
    "path": {                                  // gate cross-tool su percorsi (resiste ai symlink)
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "~/.ssh/*": "deny",
      "*.example": "allow",
      "*.sample": "allow"
    },
    "bash": {
      "*": "allow",
      "git push": "ask",                        // pattern esatto
      "git push *": "ask"                       // pattern wildcard
    },
    "external_directory": {                     // gate di confine CWD
      "*": "ask",
      "~/.pi/agent/sessions/*": "allow",
      "~/.markdownlint/*": "allow",
      "~/AppData/Local/Temp/pi-worktree-*": "allow"
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
| `path` | cross-cutting su **tutti** gli accessi ai file (tool pi, bash, MCP, estensioni); matcha path referenziato e forma canonical (symlink-resolved), così un deny non si elude via alias symlink |
| `bash` | comandi bash con pattern wildcard (`git push *: ask`) |
| `external_directory` | raggiungere fuori dalla CWD; accetta pattern map per consentire cache esterne specifiche |
| (per-tool) | `read`/`write`/`edit`/`find`/`grep`/`ls` con pattern su `input.path` |
| (MCP/skill) | granularità server/tool/skill-name |

## Uso

L'estensione si carica automaticamente all'avvio di pi e impone la policy come gate trasparente (nessun comando slash). Comportamenti chiave:

- i tool non permessi vengono **nascosti** prima dell'avvio (nessun turno sprecato a sondare tool bloccati);
- al prompt `ask` puoi approvare una volta o approvare un pattern per il resto della sessione;
- `permissionReviewLog: true` registra le decisioni in `~/.pi/agent/extensions/pi-permission-system/logs/pi-permission-system-permission-review.jsonl`;
- fallisce "chiuso": un bash non parseabile o un `bash -c`/`eval` opaco diventa `ask`, non passa in silenzio;
- integra nativamente con `@gotgenes/pi-subagents`: i child session in-process registrano la policy automaticamente, con forwarding dello stato `ask` al parent UI.

## Esempi

### Esempio 1 — proteggere `.env` da ogni tool

```jsonc
{ "path": { "*.env": "deny", "*.env.*": "deny", "*.env.example": "allow" } }
```

### Esempio 2 — chiedere conferma per `git push` ma permettere il resto di git

```jsonc
{ "bash": { "*": "allow", "git push": "ask", "git push *": "ask" } }
```

### Esempio 3 — consentire una cache esterna senza aprire tutto

```jsonc
{ "external_directory": { "*": "ask", "~/.cargo/registry/*": "allow" } }
```

### Esempio 4 — ispezionare le decisioni del gate

Il review log è in `~/.pi/agent/extensions/pi-permission-system/logs/`. Vedi lo script [`parse-perm-log.cjs`](../components-locali/scripts.md) per estrarre le `permission_request.*` in una finestra temporale:

```bash
node scripts/parse-perm-log.cjs
```

### Esempio 5 — approvare un pattern per la sessione

Quando il gate `ask` si attiva, scegli "approve pattern" per silenziare prompt ricorrenti per la sessione corrente.

Per il dettaglio completo (per-tool path patterns, session approvals, MCP/skill granularity) vedi il README ufficiale e [`docs/session-approvals.md`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-permission-system/docs). Per la valutazione d'uso nel contesto di questo repo vedi [`docs/approfondimenti/gotgenes-packages-guida.md`](../approfondimenti/gotgenes-packages-guida.md).
