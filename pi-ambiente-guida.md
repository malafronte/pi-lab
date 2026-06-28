# Guida: Ambiente di esecuzione e interazione TUI di pi

> Note operative verificate sul codice sorgente di **pi 0.79.10** (installazione locale in `…/node_modules/@earendil-works/pi-coding-agent`) e sull'ambiente concreto (Node 24.16.0, Windows, Git Bash). Dove un'affermazione deriva dal sorgente, è indicato il file di riferimento.

## Indice

- [Guida: Ambiente di esecuzione e interazione TUI di pi](#guida-ambiente-di-esecuzione-e-interazione-tui-di-pi)
  - [Indice](#indice)
  - [1. L'agente ha accesso a internet?](#1-lagente-ha-accesso-a-internet)
  - [2. I tool dell'agente dipendono dalla shell da cui avvio pi?](#2-i-tool-dellagente-dipendono-dalla-shell-da-cui-avvio-pi)
  - [3. Esiste un tool «webfetch» in pi?](#3-esiste-un-tool-webfetch-in-pi)
    - [Come si recuperano contenuti web in pi](#come-si-recuperano-contenuti-web-in-pi)
  - [4. Quale curl usa l'agente? Quello di Git Bash o quello di Windows?](#4-quale-curl-usa-lagente-quello-di-git-bash-o-quello-di-windows)
  - [5. Come si scorre il buffer dei messaggi con la tastiera?](#5-come-si-scorre-il-buffer-dei-messaggi-con-la-tastiera)
    - [Perché è così (by design)](#perché-è-così-by-design)
    - [Come scrollare allora: con le scorciatoie del terminale](#come-scrollare-allora-con-le-scorciatoie-del-terminale)
    - [Limiti da conoscere](#limiti-da-conoscere)
  - [Riepilogo rapido (TL;DR)](#riepilogo-rapido-tldr)

---

## 1. L'agente ha accesso a internet?

**Sì.** Anche se l'agente non ha uno strumento *dedicato* di tipo «fetch», può usare la rete attraverso il tool `bash` (con `curl`, `wget`, ecc.).

**Verifica concreta** (eseguita in questa sessione):

```bash
curl -sS --max-time 6 -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" https://pi.dev/docs/latest
# → HTTP 200 in 0.404662s
```

## 2. I tool dell'agente dipendono dalla shell da cui avvio pi?

**No.** Il tool `bash` di pi risolve il proprio shell **in modo indipendente** dalla shell usata per lanciare pi.

Il comportamento è in `getShellConfig()` (`pi-coding-agent/dist/utils/shell.js`). Ordine di risoluzione:

1. Percorso personalizzato da `~/.pi/agent/settings.json` → chiave `shellPath`
2. Su Windows: Git Bash in `%ProgramFiles%\Git\bin\bash.exe`, poi `%ProgramFiles(x86)%\Git\bin\bash.exe`
3. `bash.exe` trovato sul `PATH` (Cygwin, MSYS2, WSL…)
4. Se non trova nulla → errore

Confermato anche da `docs/windows.md`: *«Pi requires a bash shell on Windows»*. Su Unix: prova `/bin/bash`, poi `bash` sul `PATH`, infine `sh` come fallback.

**Conseguenza pratica:** è indifferente aprire pi da PowerShell, cmd o Git Bash: i comandi del tool `bash` girano comunque nel bash risolto da pi. Verifica eseguita in questa sessione:

```bash
echo "BASH_VERSION=$BASH_VERSION"      # → 5.3.9(1)-release
which bash                              # → /usr/bin/bash  (Git Bash)
node -e "console.log(process.platform)" # → win32
echo "$COMSPEC"                         # → C:\Windows\system32\cmd.exe (ignorato)
```

Il processo è `win32`, ma i comandi girano in **Git Bash** (`/usr/bin/bash`).

---

## 3. Esiste un tool «webfetch» in pi?

**No.** I tool built-in di pi sono soltanto:

```text
read · bash · edit · write · grep · find · ls
```

«WebFetch» è un tool di **Claude Code** (il CLI di Anthropic), non di pi. È facile confonderli se si usano entrambi.

Da non confondere nemmeno con:

- **PowerShell**, che non ha un comando `webfetch` nativo: ha `Invoke-WebRequest` (con alias `iwr`, `curl`, `wget`).
- **cmd / Git Bash**, dove `curl` è il comando da usare.

### Come si recuperano contenuti web in pi

Tramite `curl`/`wget` **dentro il tool `bash`** (che, su Windows, è Git Bash). Non serve alcun prefisso (`bash -c …`): il tool `bash` **è già** bash, quindi si scrive direttamente:

```bash
curl -sS https://esempio.com/pagina
```

La sintassi `bash <comando>` serve solo quando ci si trova **in PowerShell/cmd** e si vuole delegare un comando a Git Bash dalla propria shell interattiva — ma l'agente non ne ha mai bisogno, perché i suoi comandi partono già dentro bash.

---

## 4. Quale curl usa l'agente? Quello di Git Bash o quello di Windows?

**Quello di Git Bash** (`/mingw64/bin/curl`), non quello nativo di Windows.

**Verifica** (eseguita in questa sessione):

```bash
type -a curl
# curl is /mingw64/bin/curl
# curl is /c/Users/genna/AppData/Local/Microsoft/WinGet/Links/curl
# curl is /c/Windows/system32/curl

command -v curl              # → /mingw64/bin/curl   ← vince
curl --version | head -1     # → curl 8.19.0 (x86_64-w64-mingw32) libcurl/8.19.0 Schannel ...
file "$(command -v curl)"    # → PE32+ executable … x86-64  (binario reale, non alias)
```

Vince il curl di Git Bash perché nel `PATH` del bash risolto da pi compare per primo. È un eseguibile vero (PE32+, ~325 KB), non un alias né un'applet di shell.

## 5. Come si scorre il buffer dei messaggi con la tastiera?

**Non con le frecce.** Lo scroll con la rotellina del mouse «funziona» perché **non è pi a gestirlo**, ma il terminale. Le frecce invece sono catturate da pi.

### Perché è così (by design)

Verificato nel codice di `pi-tui` (`dist/terminal.js`, `dist/tui.js`):

| Aspetto | Riscontrato | Conseguenza |
|---|---|---|
| Mouse reporting (`?1000` / `?1002` / `?1006`) | **mai abilitato** | la rotellina è gestita dal **terminale**, che scrolla il proprio scrollback nativo |
| Alternate screen (`?1049`) | **mai usato** | pi gira sullo schermo primario; i messaggi che escono dallo schermo finiscono nello **scrollback del terminale** |
| Cancellazione scrollback (`\x1b[3J`) | solo su *full clear* (es. resize), non a ogni frame | lo scrollback si accumula normalmente |

Dunque la conversazione **non** è in un viewport scorribile gestito da pi: la rotellina scorre il buffer del terminale, non un componente di pi.

I keybinding che coinvolgono le frecce sono dell'**editor** (input), non della conversazione. Da `docs/keybindings.md` e `dist/core/keybindings.js`:

| Tasto | Azione pi | Cosa fa davvero |
|---|---|---|
| `↑` / `↓` | `tui.editor.cursorUp` / `cursorDown` | sposta il cursore nell'editor / scorre lo **storico dei prompt** digitati |
| `pageUp` / `pageDown` | `tui.editor.pageUp` / `pageDown` | scroll **interno** della casella di input (utile solo se l'input multi-riga deborda) |

### Come scrollare allora: con le scorciatoie del terminale

Su **Windows Terminal** (il caso tipico con PowerShell / Git Bash):

| Tasto | Azione |
|---|---|
| `Ctrl+Shift+↑` / `Ctrl+Shift+↓` | riga per riga |
| `Ctrl+Shift+PgUp` / `Ctrl+Shift+PgDn` | pagina per pagina |
| `Ctrl+Shift+Home` / `Ctrl+Shift+End` | inizio / fine dello scrollback |

Su **MinTTY** (finestra di Git Bash standalone): `Shift+PgUp` / `Shift+PgDn` e `Shift+↑` / `Shift+↓`.

### Limiti da conoscere

1. **Non si può ribindare** per ottenere lo scroll dei messaggi. In `keybindings.json` **non esiste** un'azione «scroll conversazione» a cui legare le frecce: i messaggi non vivono in un componente scorribile di pi. Rebindando `tui.editor.cursorUp/Down` si perderebbe solo il movimento cursore/storico input, senza ottenere lo scroll della conversazione.

2. Lo scrollback del terminale ha una **capacità finita** (configurata nel terminale stesso). Per consultare lo storico lungo, i metodi previsti da pi sono:
   - `/tree` — naviga l'albero della sessione
   - `/export [file]` — esporta in HTML o JSONL
   - `/resume` o `-r` — riprendi una sessione precedente

3. È coerente con la filosofia dichiarata di pi (*«No plan mode, no popups, …»*): si appoggia agli strumenti nativi (terminale, tmux, file). Lo scroll è delegato al terminale di proposito.

---

## Riepilogo rapido (TL;DR)

| Domanda | Risposta sintetica |
|---|---|
| L'agente ha internet? | **Sì**, via `bash` + `curl`/`wget`. Da verificare caso per caso, non dare per scontato. |
| I tool dipendono dalla shell di avvio? | **No**. pi risolve il proprio bash (`settings` → Git Bash → `bash` su `PATH`). |
| Esiste `webfetch` in pi? | **No**. È di Claude Code. In pi si usa `curl` nel tool `bash`. |
| Quale curl usa l'agente? | Quello di **Git Bash** (`/mingw64/bin/curl`), non il nativo di Windows. |
| Scroll messaggi con le frecce? | **Non si può**. By design: si usa lo scroll del terminale (`Ctrl+Shift+↑/↓` su Windows Terminal). |

---

*Versione pi di riferimento: 0.79.10. Tutte le affermazioni sono verificate sul codice sorgente installato o con comandi eseguiti nella sessione.*
