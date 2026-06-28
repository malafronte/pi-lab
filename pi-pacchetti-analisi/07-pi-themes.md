# Analisi: @spences10/pi-themes

**Pacchetto:** `@spences10/pi-themes` · **Versione:** 0.0.8 (7 release) · **Autore:** Scott Spence (spences10) · **Licenza:** MIT · **Repo:** `github.com/spences10/my-pi`

> Pacchetto di **temi** per pi: 11 temi di colore curati per migliorare contrasto, mood e gerarchia visiva nella TUI.

## A cosa serve

È un **theme pack** (non un'estensione con codice): fornisce 11 schemi di colore pronti per la TUI di pi. Si limita a cambiare l'aspetto — colori di testo, sfondo, accenti, syntax highlighting — senza aggiungere funzionalità. Pi carica i temi dalla cartella `themes/` del pacchetto via il manifest `pi.themes`.

## Temi inclusi (11)

- Catppuccin Mocha
- Dracula
- Gruvbox Dark
- Night Owl
- Neon Afterglow
- Neon Noir
- Nord
- One Dark
- Rosé Pine
- Solarized Dark
- Tokyo Night

## Comandi e tool

Nessuno. I temi non registrano comandi né tool — si selezionano dall'UI di pi.

## Installazione e attivazione

```bash
pi install npm:@spences10/pi-themes
```
Poi scegli il tema in uno di questi modi:
- **Interattivo**: `/settings` → seleziona tema
- **Persistente** in `~/.pi/agent/settings.json`:
  ```json
  { "theme": "tokyo-night" }
  ```
  (o `~/.config/pi/...` / `.pi/settings.json` project-local)

## ✅ Sicurezza (perfetta)

- **Solo file tema statici** (JSON nella cartella `themes/`), **nessun codice eseguibile**
- **Zero dipendenze**, zero peer dep
- Nessun exec, nessuna rete, nessun file system oltre alla lettura dei temi
- Piccolissimo (25KB)
- Il più sicuro in assoluto dei sette pacchetti analizzati

## Pro

- ✅ Temi popolari e ben fatti (Catppuccin, Dracula, Gruvbox, Nord, Tokyo Night…)
- ✅ **Sicurezza massima** — solo asset statici, zero superficie
- ✅ Si attiva facilmente (`/settings` o settings.json)
- ✅ Zero impatto su funzionalità o performance

## Contro

- ❌ Solo 11 temi (potresti volerne di più o uno specifico non incluso)
- ❌ Pochi release (7), ma per un theme pack statico è normale
- ❌ Estetica soggettiva — potresti preferire il tema nativo o un altro pack

## Compatibilità

- pi 0.79.10: ✅ compatibile (nessun peer dep)
- Nessun conflitto con estensioni (i temi sono ortogonali al codice)
- ⚠️ **Overlap con i temi inclusi in altri pacchetti**: `pi-studio` porta `pi-studio-dark`/`pi-studio-light`; se installi entrambi, hai più temi disponibili in `/settings` (non confliggono, si sommano). Vedi raccomandazioni.

## Quando usarlo

**Sì** se: vuoi cambiare l'aspetto di pi con temi curati e popolari, zero rischio, zero impatto su funzionalità.
**No** se: ti va bene il tema di default o ne hai già uno che preferisci.

È il pacchetto più "sicuro e innocuo" del set: un buon primo passo se vuoi personalizzare l'estetica senza pensieri.
