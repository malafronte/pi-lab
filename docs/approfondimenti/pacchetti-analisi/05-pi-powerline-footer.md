# Analisi: pi-powerline-footer

**Pacchetto:** `pi-powerline-footer` · **Versione:** 0.6.1 (52 release) · **Autore:** Nico Bailon (nicobailon) · **Licenza:** MIT · **Repo:** `github.com/nicobailon/pi-powerline-footer`

> Status bar in stile Powerline + welcome overlay + "working vibes" (messaggi AI) + sticky bash mode + editor stash. Ispirato a Powerlevel10k e oh-my-pi.

## A cosa serve

Sostituisce/arricchisce il **footer** di pi con una status bar powerline: branch git, context usage colorato, thinking level indicator, subscription detection, segmenti personalizzabili. Aggiunge anche feature UX: editor stash (salvi il testo per lanciare un quick prompt), sticky bash mode (shell persistente), e "vibes" (messaggi di loading tematici generati da AI).

## Feature

- **Powerline status bar** stile Powerlevel10k nel bordo superiore dell'editor
- **Editor stash** (`Alt+S`): salva testo editor + clear, lancia prompt, auto-restore a fine
- **Working Vibes**: `/vibe <tema>` (star trek, pirate, zen, noir, cowboy…) → "Working..." diventa "Running diagnostics…"
- **Welcome overlay**: splash screen all'avvio (logo, modello, tips, conteggio AGENTS.md/extensions, sessioni recenti)
- **Fixed editor cluster**: il contenuto scrolla sopra una linea di stato fissa (editor/status/powerline/transcript). Toggle con `/powerline fixed-editor on|off|toggle`
- **Thinking level indicator** live con colori per livello (high/xhigh = rainbow "ultrathink")
- **Git integration**: branch, staged (+), unstalled (*), untracked (?) — cache 1s, invalida su write/edit
- **Context awareness**: warning colorati a 70% (giallo) e 90% (rosso); refresh live durante streaming
- **Token intelligence**: format smart (1.2k, 45M), subscription detection "(sub)" vs costo $
- **Sticky bash mode** (`Ctrl+Shift+B` o `/bash-mode`): shell persistente per la sessione, segmento `shell_mode`, transcript embedded, `cd`/export persistono tra comandi
- **Shell ghost suggestions**: predizione inline da history shell per-project, path/git continuations
- Nerd Font auto-detection (iTerm/WezTerm/Kitty/Ghostty/Alacritty) con fallback ASCII

## Comandi e tool

**Comandi slash:** `/powerline`, `/powerline <preset>`, `/powerline fixed-editor on|off|toggle`, `/powerline mouse-scroll on|off|toggle`, `/bash-mode`, `/stash-history`, `/vibe <tema>`, `/bash-reset`

Nessun tool per l'LLM.

## Installazione

```bash
pi install npm:pi-powerline-footer
```

Config in `~/.pi/agent/settings.json` o `.pi/settings.json`. Zero dipendenze runtime.

## 🚫 INCOMPATIBILITÀ CON pi 0.79.10 (critico)

I **peerDependencies** richiedono:

```text
@earendil-works/pi-coding-agent: >=0.74.0 <0.77.0
@earendil-works/pi-tui:         >=0.74.0 <0.77.0
@earendil-works/pi-ai:          >=0.74.0 <0.77.0
```

Tu hai **pi 0.79.10** → **ESCLUSO** dal range `<0.77.0`. Significa che:

- `pi install` probabilmente lo installa ma con **warning di peer dep non soddisfatta** (npm non blocca di default)
- A runtime può **non funzionare** o avere bug (API di pi-tui/ai/coding-agent sono cambiate tra 0.76 e 0.79)
- L'autore non lo ha testato/aggiornato per pi ≥ 0.77

**Praticamente: non usabile con il tuo pi 0.79.10 senza rischi.** Prima di installarlo, verifica se c'è una versione più recente o un fork compatibile, oppure aspetta un update dell'autore.

## ⚠️ Sicurezza (se fosse compatibile)

- **exec**: git (git-status.ts), bash mode gestisce una shell session persistente (bash-mode/*.ts)
- Nessun server locale, nessuna URL esterna (solo github doc)
- Codice `.ts` leggibile
- Save dello stash history su disco (`~/.pi/agent/powerline-footer/stash-history.json`)

## Pro

- ✅ Status bar powerline ricca e bella (se ti piace quello stile)
- ✅ Editor stash e sticky bash mode sono feature UX utili
- ✅ "Vibes" divertente
- ✅ Zero dipendenze runtime

## Contro

- ❌ **INCOMPATIBILE con pi 0.79.10** (peer dep `<0.77.0`) — il blocco principale
- ❌ **Conflitto diretto** con `pi-mono-status-line` e qualsiasi altra estensione che chiami `ctx.ui.setFooter()` (entrambi sostituiscono il footer → uno vince)
- ❌ Bash mode gestisce shell session (superficie exec)
- ❌ Cambia molto la UX (fixed editor cluster, welcome overlay)

## Compatibilità

- pi 0.79.10: ❌ **NON compatibile** (peer dep `<0.77.0`)
- Conflitto footer con `pi-mono-status-line` (vedi raccomandazioni)

## Quando usarlo

**Oggi con pi 0.79.10: NO** — incompatibile per peer dep. Se in futuro l'autore rilascia una versione per pi ≥ 0.79, e ti piace lo stile powerline + editor stash + bash mode, valuta. Altrimenti usa `pi-mono-status-line` (compatibile).
