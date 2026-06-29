# @spences10/pi-themes — pack di temi per la TUI di pi

> Estensione pi che bundle di temi colorati e rifiniti per il coding agent pi, migliorando contrasto, mood e gerarchia visiva nel terminale. Fa sentire pi come un workspace personale invece di un'app di default.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@spences10/pi-themes` |
| Repository | <https://github.com/spences10/my-pi> (sottocartella `packages/pi-themes`) |
| Documentazione | <https://github.com/spences10/my-pi/tree/main/packages/pi-themes#readme> |
| Licenza | MIT |
| Preview | <https://raw.githubusercontent.com/spences10/my-pi/main/assets/pi-package-preview.png> |

## Installazione

```bash
pi install npm:@spences10/pi-themes
```

## Configurazione

Scegli un tema in `/settings`, oppure persistilo nel JSON delle impostazioni:

```jsonc
// ~/.pi/agent/settings.json
{ "theme": "tokyo-night" }
```

## Uso

Nessun tool o comando slash dedicato: i temi si applicano alla TUI di pi. Una volta scelto il tema (via `/settings` o `settings.json`), la TUI lo usa immediatamente.

### Temi inclusi

| Tema | |
| --- | --- |
| Catppuccin Mocha | Night Owl |
| Dracula | Neon Afterglow |
| Gruvbox Dark | Neon Noir |
| Nord | One Dark |
| Rosé Pine | Solarized Dark |
| Tokyo Night | |

## Esempi

### Esempio 1 — persistere un tema

```jsonc
{ "theme": "dracula" }
```

### Esempio 2 — cambiare tema a runtime

```text
/settings
# naviga fino al selettore tema e scegli "tokyo-night"
```

Per l'analisi dettagliata del pacchetto vedi [`docs/approfondimenti/pacchetti-analisi/07-pi-themes.md`](../approfondimenti/pacchetti-analisi/07-pi-themes.md).
