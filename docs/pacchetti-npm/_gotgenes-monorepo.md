# Monorepo gotgenes/pi-packages — panoramica

> Il monorepo [`gotgenes/pi-packages`](https://github.com/gotgenes/pi-packages) pubblica su npm (sotto scope `@gotgenes/`) una famiglia di estensioni pi. In questa configurazione sono installati i pacchetti elencati sotto.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Repository | <https://github.com/gotgenes/pi-packages> |
| Scope npm | `@gotgenes/` |
| Licenza | MIT |

## Pacchetti installati in questa configurazione

| Pacchetto | Scopo | Pagina dedicata |
| --- | --- | --- |
| `@gotgenes/pi-permission-system` | gate di permesso centralizzati (tool, bash, MCP, skill, path) | [`pi-permission-system.md`](pi-permission-system.md) |
| `@gotgenes/pi-nocd` | vieta il `cd`-prefisso della CWD nel system prompt | [`pi-nocd.md`](pi-nocd.md) |
| `@gotgenes/pi-session-tools` | tool per metadati di sessione (naming, transcript) | [`pi-session-tools.md`](pi-session-tools.md) |
| `@gotgenes/pi-github-tools` | tool deterministici GitHub CI/release/issue | [`pi-github-tools.md`](pi-github-tools.md) |

## Installazione (intero set)

```bash
pi install npm:@gotgenes/pi-permission-system npm:@gotgenes/pi-nocd npm:@gotgenes/pi-session-tools npm:@gotgenes/pi-github-tools
```

Oppure elencali tutti in `~/.pi/agent/settings.json` → `packages`:

```jsonc
{
  "packages": [
    "npm:@gotgenes/pi-permission-system",
    "npm:@gotgenes/pi-nocd",
    "npm:@gotgenes/pi-session-tools",
    "npm:@gotgenes/pi-github-tools"
  ]
}
```

## Note di compatibilità

- `@gotgenes/pi-permission-system` ha integrazione nativa con `@gotgenes/pi-subagents`: i child session in-process registrano la policy automaticamente.
- I pacchetti condividono CI e convenzioni del monorepo (badge Pi-Package, TypeScript, pnpm ≥ 11).
- **Attenzione alla duplicazione**: `@gotgenes/pi-subagents` è **alternativo** al pacchetto `pi-subagents` (nicobailon) documentato in [`pi-subagents.md`](pi-subagents.md). In questa configurazione è installato `pi-subagents` (nicobailon), non la variante gotgenes. Per il confronto vedi [`docs/approfondimenti/subagents-confronto.md`](../approfondimenti/subagents-confronto.md).

Per la valutazione completa di tutti i pacchetti del monorepo (inclusi pacchetti non installati in questa configurazione) e per il confronto pi-permission-system ↔ OpenCode, vedi [`docs/approfondimenti/gotgenes-packages-guida.md`](../approfondimenti/gotgenes-packages-guida.md).
