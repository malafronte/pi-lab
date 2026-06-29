# `mcp-onboarding.json` — discovery e onboarding dei server MCP

> File che traccia lo stato di onboarding e il fingerprint di discovery dei server MCP di pi. Percorso: `~/.pi/agent/mcp-onboarding.json`. Non è un file di policy: registra lo stato del wizard di setup e le fonti di discovery.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| File | `~/.pi/agent/mcp-onboarding.json` |
| Pacchetto | `pi-mcp-adapter` (<https://github.com/nicobailon/pi-mcp-adapter>) |

## Installazione / creazione

Il file viene gestito da pi: si aggiorna quando completi il wizard MCP iniziale o quando il discovery dei server cambia. Non va tipicamente editato a mano.

## Configurazione

Struttura (con **segnaposto semantici**):

```jsonc
// ~/.pi/agent/mcp-onboarding.json
{
  "version": 1,
  "sharedConfigHintShown": true,          // hint sulla config condivisa già mostrato
  "setupCompleted": false,                 // wizard di setup completato
  "lastDiscoveryFingerprint": "<FINGERPRINT>"  // fingerprint dell'ultimo discovery
}
```

Il `lastDiscoveryFingerprint` codifica le fonti di discovery MCP (es. `shared-global`, `pi-global`, `shared-project`, `pi-project`) con flag di condivisione e conteggi, più gli `imports` (es. import da `claude-code` di `~/.claude.json`).

### Fonti di discovery MCP

| Fonte | Scope |
| --- | --- |
| `shared-global` | config MCP condivisa globale (es. `~/.config/.../mcp.json`) |
| `pi-global` | config MCP globale di pi (`~/.pi/agent/...`) |
| `shared-project` | config MCP condivisa di progetto (`.mcp.json`) |
| `pi-project` | config MCP di progetto pi (`.pi/...`) |

## Uso

Il file non si usa direttamente: pi lo legge all'avvio per determinare se mostrare il wizard MCP e quali fonti considerare. Per configurare i server effettivi, usa [`.mcp.json`](../pacchetti-npm/pi-mcp-adapter.md) (progetto) o il config globale, e il comando `/mcp` per ispezionare lo stato.

## Esempi

### Esempio 1 — stato post-onboarding

```jsonc
{ "version": 1, "sharedConfigHintShown": true, "setupCompleted": true, "lastDiscoveryFingerprint": "<FINGERPRINT>" }
```

### Esempio 2 — ispezionare lo stato MCP a runtime

```text
/mcp
```

Per il riferimento completo dei server MCP vedi [`docs/mcp/mcp-guida.md`](../mcp/mcp-guida.md).
