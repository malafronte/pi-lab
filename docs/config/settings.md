# `settings.json` — impostazioni globali di pi

> File di configurazione principale di pi: elenca i `packages` installati, il `theme`, il provider/modello di default e il livello di thinking. Percorso: `~/.pi/agent/settings.json`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| File | `~/.pi/agent/settings.json` |
| Documentazione | docs ufficiali pi (`docs/` nel pacchetto `@earendil-works/pi-coding-agent`) |

## Installazione / creazione

Il file viene creato da pi al primo avvio. Lo si modifica a mano o via comandi pi (es. `/settings`). Non va creato ex-novo se già esiste.

## Configurazione

Esempio (con **segnaposto semantici**; i valori reali di questa installazione non sono esposti):

```jsonc
// ~/.pi/agent/settings.json
{
  "lastChangelogVersion": "<VERSIONE_PI>",
  "theme": "dark",                       // tema TUI (vedi @spences10/pi-themes per pack)
  "defaultProvider": "<DEFAULT_PROVIDER>", // provider di default per il modello
  "defaultModel": "<DEFAULT_MODEL>",       // modello di default
  "defaultThinkingLevel": "xhigh",         // off|minimal|low|medium|high|xhigh
  "hideThinkingBlock": false,
  "packages": [
    "npm:pi-mcp-adapter",
    "npm:pi-lens",
    "npm:pi-web-access",
    "npm:pi-studio",
    "npm:pi-agent-browser-native",
    "npm:pi-vision-tool",
    "npm:pi-codex-goal",
    "npm:pi-subagents",
    "npm:pi-questionnaire",
    "npm:@gotgenes/pi-permission-system",
    "npm:@gotgenes/pi-nocd",
    "npm:@gotgenes/pi-session-tools",
    "npm:@gotgenes/pi-github-tools",
    "npm:@narumitw/pi-plan-mode",
    "npm:@spences10/pi-themes"
  ]
}
```

### Campi chiave

| Campo | Significato |
| --- | --- |
| `packages` | elenco dei pacchetti npm attivi (scope `npm:`). Ogni voce installa/abilita un'estensione/skill. |
| `theme` | nome tema TUI. |
| `defaultProvider` / `defaultModel` | provider e modello usati se non diversamente specificato a runtime (`pi --model <id>`). |
| `defaultThinkingLevel` | livello di reasoning di default per i modelli che lo supportano. |
| `hideThinkingBlock` | nasconde il blocco thinking nella TUI. |
| `lastChangelogVersion` | traccia l'ultima versione di changelog mostrata. |

## Uso

- aggiungi un pacchetto: inseriscilo in `packages` e installa le dipendenze in `~/.pi/agent/npm` (`npm install <pkg>`) oppure usa `pi install npm:<pkg>`;
- cambia tema: imposta `theme` (o usa `/settings`);
- cambia modello default: imposta `defaultProvider`/`defaultModel` (modelli custom vanno definiti in [`models.json`](models.md)).

## Esempi

### Esempio 1 — aggiungere un pacchetto

```jsonc
{ "packages": ["npm:pi-lens", "npm:pi-web-access"] }
```

### Esempio 2 — tema scuro

```jsonc
{ "theme": "dark" }
```

Vedi anche [`models.md`](models.md), [`vision-tool.md`](vision-tool.md), [`permission-system.md`](permission-system.md).
