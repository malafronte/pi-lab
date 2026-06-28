# Analisi: pi-mono-status-line

**Pacchetto:** `pi-mono-status-line` · **Versione:** 1.7.3 (12 release) · **Autore:** emanuelcasco · **Licenza:** non dichiarata · **Repo:** `github.com/emanuelcasco/pi-mono-extensions`

> Footer configurabile con due modalità: **basic** (default, token stats) ed **expert** (context gauge, git status avanzato, costo sessione, indicatori di utilizzo subscription).

## A cosa serve

Sostituisce il footer di pi con una versione più ricca. Due modalità:

### Basic (default)
Layout a due righe stile footer nativo, con token stats:
```
~/my-project (main)
↑582k ↓44k R7.0M W470k $6.918 24.0%/1.0M         claude-opus-4-6 • high
```

### Expert
Footer ricco con context gauge visuale, git status avanzato, costo sessione, **indicatori subscription**:
```
gpt-5.4 (high) - ◔ 14% (38k/272k $0.33)
🗀 ~/my-project  ⎇ main * ↑2
Codex > 5h ◑ 46% 2h38m > Week ○ 12%
```
- **Git status**: branch, dirty (`*`), ahead/behind (`↑2 ↓1`)
- **Context gauge**: icona pie (`○ ◔ ◑ ◕ ●`) con soglie di colore (green→yellow→red)
- **Session cost**: totale `$` corrente
- **Subscription usage**: rate-limit progress per Claude Max, Codex, Copilot, Gemini (auto-rilevato dal provider attivo, refresh ogni 5 min)
- **Status-first layout**: modello/status/context sulla prima riga, cwd/git sulla seconda

## Comandi e tool

**Nessun comando slash, nessun tool per l'LLM.** Lavora solo via `ctx.ui.setFooter()`.

## Installazione e configurazione

```bash
pi install npm:pi-mono-status-line
```
La modalità è risolta in ordine (primo hit vince):
1. `PI_STATUS_LINE_MODE` env var
2. `~/.pi/agent/status-line.json` → `{ "mode": "basic" | "expert" }`
3. default: `basic`

Esempi:
```bash
# persistente per tutte le sessioni
echo '{ "mode": "expert" }' > ~/.pi/agent/status-line.json
# override one-off per una sessione
PI_STATUS_LINE_MODE=expert pi
```

## ⚠️ Sicurezza (nota importante sulla modalità expert)

- **Modalità basic**: nessuna superficie rete — calcola stats locali dai messaggi (token/cost/context). Sicura.
- **Modalità expert** — per gli indicatori subscription, **contatta le API dei provider** ogni 5 min:
  - `api.anthropic.com/api/oauth/usage` (Claude Max)
  - `api.github.com/copilot_internal/user` (Copilot)
  - `chatgpt.com/backend-api/wham/usage` (Codex/ChatGPT)
  - `cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota` (Gemini Code Assist)

  Usa le tue credenziali OAuth di pi per autenticarsi. **Non è phone-home malevolo** (serve per mostrare le tue quote), ma è **superficie di rete outbound** da sapere. Se ti preoccupa, usa la modalità `basic`.
- **exec**: solo `git` in expert (per lo status). Nessun server locale.
- Codice `.ts` leggibile, piccolo (42KB).

## Pro

- ✅ Footer ricco, due modalità (basic sicura / expert informativa)
- ✅ Context gauge visuale + costo sessione in tempo reale
- ✅ Subscription usage (se sei su Claude Max/Codex/Copilot/Gemini) — info utile
- ✅ Leggero (42KB), zero dipendenze runtime
- ✅ Compatibile con pi 0.79.10

## Contro

- ❌ **Conflitto diretto** con qualsiasi altra estensione che fa `setFooter()` (pi-powerline-footer, oh-my-pi, ecc.) — solo una può "possedere" il footer
- ❌ Modalità **expert** contatta API provider ogni 5 min (superficie rete outbound) — opt-in implicito scegliendo expert
- ❌ Licenza non dichiarata nel package.json (è MIT nel repo ma non nel manifest npm)
- ❌ Pochi release (12), meno maturo di alternative

## Compatibilità

- pi 0.79.10: ✅ compatibile (peer `*`)
- ⚠️ Conflitto footer con `pi-powerline-footer` (che però è già incompatibile per peer dep) e altri status-bar

## Quando usarlo

**Sì** se: vuoi un footer più ricco del default (git branch avanzato, context gauge, costo) e la modalità basic ti basta (zero rete).
**Expert** se: sei su subscription (Claude Max/Codex/Copilot/Gemini) e vuoi vedere il consumo quota — accettando il polling ogni 5 min delle API provider.
**No** se: già hai un'altra estensione footer (pi-powerline-footer, oh-my-pi) o il polling expert ti preoccupa.
