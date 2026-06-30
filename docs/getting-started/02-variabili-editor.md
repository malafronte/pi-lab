# Guida: Impostare le variabili d'ambiente `$VISUAL` e `$EDITOR`

> Note operative verificate su **Windows 11** con **Git Bash** (bash 5.x), **Node 24.16.0** e **VS Code** come editor. I comandi sono stati eseguiti concretamente in sessione: dove un'affermazione è verificata, è indicato l'output reale.
>
> **Caso d'uso in pi:** questo documento copre anche l'impostazione che fa sì che il tasto **`Ctrl+G`** di pi apra **VS Code** (vedi [§0](#0-in-pi-ctrlg-apre-leditor-esterno-caso-duso-diretto)).

## Indice

- [Guida: Impostare le variabili d'ambiente `$VISUAL` e `$EDITOR`](#guida-impostare-le-variabili-dambiente-visual-e-editor)
  - [Indice](#indice)
  - [0. In pi: Ctrl+G apre l'editor esterno (caso d'uso diretto)](#0-in-pi-ctrlg-apre-leditor-esterno-caso-duso-diretto)
  - [1. A cosa servono queste variabili?](#1-a-cosa-servono-queste-variabili)
  - [2. Quale scegliere tra `VISUAL` ed `EDITOR`?](#2-quale-scegliere-tra-visual-ed-editor)
  - [3. Verificare lo stato attuale](#3-verificare-lo-stato-attuale)
  - [4. Scegliere l'editor](#4-scegliere-leditor)
    - [Il flag `--wait` (fondamentale per gli editor grafici)](#il-flag---wait-fondamentale-per-gli-editor-grafici)
  - [5. Impostare le variabili su Git Bash (consigliato)](#5-impostare-le-variabili-su-git-bash-consigliato)
  - [6. Impostare le variabili a livello utente Windows (`setx`)](#6-impostare-le-variabili-a-livello-utente-windows-setx)
  - [7. Impostare le variabili su PowerShell](#7-impostare-le-variabili-su-powershell)
  - [8. Impostare le variabili su cmd (Command Prompt)](#8-impostare-le-variabili-su-cmd-command-prompt)
  - [9. Verificare che tutto funzioni](#9-verificare-che-tutto-funzioni)
  - [10. Risoluzione dei problemi](#10-risoluzione-dei-problemi)
  - [Riepilogo rapido (TL;DR)](#riepilogo-rapido-tldr)

---

## 0. In pi: Ctrl+G apre l'editor esterno (caso d'uso diretto)

In pi (coding agent), il keybinding **`Ctrl+G`** apre il messaggio corrente nell'**editor esterno**. Quale editor viene lanciato è determinato proprio da queste variabili: pi cerca prima `$VISUAL`, poi `$EDITOR`.

| Keybinding pi | Tasto | Azione |
| --- | --- | --- |
| `app.editor.external` | `Ctrl+G` | Apre nell'editor esterno (`$VISUAL` o `$EDITOR`) |

> Riferimento ufficiale: [`docs/keybindings.md`](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/keybindings.md) di pi (azione `app.editor.external`).

**Quindi, per fare in modo che `Ctrl+G` apra VS Code** devi impostare (vedi sezioni 5–8 per i dettagli per shell):

```bash
export VISUAL="code --wait"
export EDITOR="code --wait"
```

Il flag `--wait` è **obbligatorio** per VS Code (e ogni editor grafico): senza di esso, l'editor si aprierebbe ma pi non resterebbe in attesa della tua modifica. Vedi [§ Il flag `--wait`](#il-flag---wait-fondamentale-per-gli-editor-grafici).

Dopo aver impostato le variabili, in una sessione pi premi `Ctrl+G` e si apre VS Code sul messaggio corrente; chiudi la scheda in VS Code per tornare a pi con il contenuto modificato.

---

## 1. A cosa servono queste variabili

Molti strumenti da riga di comando devono aprire un editor di testo per farti scrivere o modificare del contenuto. Esempi comuni:

| Strumento | Quando apre l'editor |
| ----------- | ---------------------- |
| `git commit` (senza `-m`) | Per scrivere il messaggio di commit |
| `git tag`, `git rebase -i` | Per editare i messaggi o la lista di commit |
| `gh` (GitHub CLI) | Per issue, PR, release notes |
| `crontab -e` | Per modificare i job pianificati |
| `sudoedit`, `visudo` | Per modificare file di sistema in sicurezza |
| molti altri tool CLI | Editor come fallback per input lunghi |

Quando uno di questi tool ha bisogno di un editor, **cerca le variabili d'ambiente** `$VISUAL` e `$EDITOR` per sapere quale lanciare. Se nessuna delle due è impostata, ottieni un warning del tipo:

```text
Warning: No editor configured. Set $VISUAL or $EDITOR environment variable.
```

## 2. Quale scegliere tra `VISUAL` ed `EDITOR`

Storicamente c'è una distinzione:

- **`EDITOR`** → editor **testuale** (funziona su terminali non full-screen, es. `ed`, o semplici editor in linea).
- **`VISUAL`** → editor a **schermo intero** o **grafico** (es. `vim`, `nano`, `code`, `notepad`).

Oggi quasi tutti i tool moderni (git in primis) leggono **prima `VISUAL`**, e usano `EDITOR` solo come fallback se `VISUAL` non è impostato. La pratica raccomandata è **impostarle entrambe** allo stesso valore, così:

- Non ci sono ambiguità tra tool diversi.
- Se un tool guarda solo `EDITOR` (vecchia scuola), funziona comunque.
- Se un tool guarda solo `VISUAL`, funziona comunque.

## 3. Verificare lo stato attuale

Prima di impostare, controlla cosa c'è già. Su **Git Bash**:

```bash
echo "VISUAL=$VISUAL"
echo "EDITOR=$EDITOR"
```

Output tipico se non sono ancora impostate:

```text
VISUAL=
EDITOR=
```

Per vedere tutti gli editor disponibili sul sistema:

```bash
where code    2>/dev/null   # VS Code
where notepad 2>/dev/null   # Blocco note di Windows
where vim     2>/dev/null   # Vim
where nano    2>/dev/null   # Nano
where nvim    2>/dev/null   # Neovim
```

> **Nota su Git Bash:** il redirect `2>nul` (sintassi cmd) **non funziona** in bash. Usa sempre `2>/dev/null` per sopprimere gli errori. Il comando `where` invece funziona perché Git Bash lo mappa correttamente.

## 4. Scegliere l'editor

Valori più comuni su Windows:

| Editor | Valore consigliato | Note |
| -------- | -------------------- | ------ |
| **VS Code** | `code --wait` | Editor grafico moderno. **Richiede `--wait`.** |
| **Nano** | `nano` | Editor da terminale semplice, si apre dentro il terminale |
| **Vim / Neovim** | `vim` / `nvim` | Editor da terminale potente, richiede di conoscere i comandi |
| **Blocco note** | `notepad` | Si apre in finestra, blocca finché non chiudi |
| **Notepad++** | `"notepad++"` o percorso completo | Su Windows, se è sul PATH |

### Il flag `--wait` (fondamentale per gli editor grafici)

Per gli editor **grafici** come VS Code, il comando `code` lancia l'editor e **ritorna subito** il controllo al terminale. Ma uno strumento come `git commit` ha bisogno di sapere **quando hai finito** di scrivere.

- ❌ `EDITOR="code"` → git apre VS Code e **subito dopo** crea un commit con il messaggio vuoto (disastro).
- ✅ `EDITOR="code --wait"` → git apre VS Code e **resta in attesa** finché non chiudi la scheda dell'editor. Solo allora legge il messaggio e procede.

Regola: per **editor grafici** (VS Code, Sublime, Notepad++, ecc.) aggiungi sempre `--wait`. Per editor **da terminale** (nano, vim) non serve: bloccano già il terminale per natura.

## 5. Impostare le variabili su Git Bash (consigliato)

Git Bash carica i file di profilo in questo ordine:

1. `.bash_profile` (o `.bash_login`, o `.profile`) → shell di **login** (es. quando apri un nuovo terminale Git Bash).
2. `.bashrc` → shell **interattiva non di login**.

La convenzione standard è: mettere la configurazione vera e propria in `.bashrc`, e far sì che `.bash_profile` lo carichi. Così è valido in entrambi i casi.

**Step 1 — Crea/modifica `~/.bashrc`:**

```bash
# Apri il file (o crealo se non esiste)
nano ~/.bashrc
```

Aggiungi queste righe:

```bash
# Editor predefinito (usato da git, gh, e altri strumenti CLI)
export VISUAL="code --wait"
export EDITOR="code --wait"
```

> Sostituisci `"code --wait"` con il tuo editor preferito (vedi tabella sopra).

**Step 2 — Crea/modifica `~/.bash_profile`** affinché carichi `.bashrc`:

```bash
nano ~/.bash_profile
```

Contenuto:

```bash
# Carica .bashrc per le shell di login
if [ -f "$HOME/.bashrc" ]; then
    . "$HOME/.bashrc"
fi
```

**Step 3 — Applica subito** (senza riavviare il terminale):

```bash
source ~/.bashrc
echo "$VISUAL"   # → code --wait
```

> **Percorso della home su Git Bash:** `~` corrisponde a `/c/Users/<tuo-utente>`. Verifica con `echo "$HOME"`. I file `.bashrc` e `.bash_profile` devono stare **lì**, non nella cartella del progetto.

## 6. Impostare le variabili a livello utente Windows (`setx`)

Impostarle solo in `.bashrc` **non basta** se usi anche PowerShell, cmd, o applicazioni native Windows (es. il terminale integrato di VS Code, o tool lanciati da Esplora risorse). Per renderle visibili a **tutti i programmi** dell'utente corrente, scrivile nel registro di Windows con `setx`:

```bash
setx VISUAL "code --wait"
setx EDITOR "code --wait"
```

Output atteso:

```text
SUCCESS: Specified value was saved.
```

Verifica che siano state registrate:

```bash
reg query "HKCU\Environment" //v VISUAL
reg query "HKCU\Environment" //v EDITOR
```

Output:

```text
HKEY_CURRENT_USER\Environment
    VISUAL    REG_SZ    code --wait
```

> **⚠️ Importante:** `setx` scrive nel registro, ma le variabili diventano effettive **solo nei processi avviati dopo** il comando. I terminali già aperti **non** vedranno il nuovo valore finché non li chiudi e riapri.

### Differenza chiave tra `export` e `setx`

|   | `export` (in `.bashrc`) | `setx` |
| --- | --- | --- |
| **Ambito** | Solo la shell bash corrente e i suoi processi figli | Tutti i nuovi processi dell'utente Windows |
| **Persistenza** | Sì, a ogni nuova shell bash | Sì, finché non le cancelli dal registro |
| **Valgono per** | Git Bash | PowerShell, cmd, app native, **e anche Git Bash** |
| **Effetto immediato** | Sì (dopo `source`) | No, serve riaprire il terminale |

**Conclusione:** se usi solo Git Bash, basta `.bashrc`. Se usi anche PowerShell/cmd/app native, fai **entrambe** le cose (consigliato).

### Rimuovere le variabili dal registro (se serve)

```bash
reg delete "HKCU\Environment" //v VISUAL //f
reg delete "HKCU\Environment" //v EDITOR //f
```

## 7. Impostare le variabili su PowerShell

**Temporaneamente** (solo per la sessione corrente):

```powershell
$env:VISUAL = "code --wait"
$env:EDITOR = "code --wait"
```

**Permanentemente** per il tuo utente (equivale a `setx` ma da PowerShell):

```powershell
[Environment]::SetEnvironmentVariable("VISUAL", "code --wait", "User")
[Environment]::SetEnvironmentVariable("EDITOR", "code --wait", "User")
```

Anche qui: chiudi e riapri PowerShell per vedere il nuovo valore.

## 8. Impostare le variabili su cmd (Command Prompt)

**Temporaneamente** (solo sessione corrente):

```cmd
set VISUAL=code --wait
set EDITOR=code --wait
```

> Nota: su cmd si usa `set` (senza `x`) per la sessione, `setx` per persistenza.

**Permanentemente**, usa la GUI di Windows:

1. Premi `Win + R`, digita `sysdm.cpl`, Invio.
2. Scheda **Opzioni avanzate** → **Variabili d'ambiente**.
3. Sezione **Variabili utente** → **Nuova…**
4. Nome: `VISUAL`, Valore: `code --wait`. Ripeti per `EDITOR`.
5. OK su tutto. Riapri il terminale.

Oppure, da cmd, usa `setx` come visto al punto 6.

## 9. Verificare che tutto funzioni

**Test 1 — controlla i valori** in ogni shell che usi:

```bash
# Git Bash
echo "VISUAL=$VISUAL  EDITOR=$EDITOR"
```

```powershell
# PowerShell
echo "VISUAL=$env:VISUAL  EDITOR=$env:EDITOR"
```

```cmd
:: cmd
echo VISUAL=%VISUAL%  EDITOR=%EDITOR%
```

**Test 2 — prova con git** (il caso d'uso più comune):

```bash
# In un repo git, lancia un commit senza messaggio:
git commit
```

Se tutto è corretto:

- Si apre **VS Code** con un file temporaneo `COMMIT_EDITMSG`.
- Scrivi il messaggio, **salvi** (`Ctrl+S`) e **chiudi la scheda** (`Ctrl+W`) o la finestra.
- Git procede con il commit usando quel messaggio.

Se vedi ancora il warning *«No editor configured»*, vedi la sezione seguente.

## 10. Risoluzione dei problemi

**Il warning compare ancora dopo aver impostato le variabili.**
→ Probabilmente il terminale è stato aperto **prima** del `setx`/`.bashrc`. Chiudilo e riaprilo, oppure ricarica con `source ~/.bashrc`.

**Git apre VS Code ma crea subito un commit vuoto.**
→ Manca `--wait`. Il valore corretto è `"code --wait"`, non solo `"code"`.

**`code` non viene trovato ("command not found").**
→ VS Code non è sul PATH. Su Windows, apri VS Code → `Ctrl+Shift+P` → *«Shell Command: Install 'code' command in PATH»*. Su Git Bash, usa il percorso completo:

```bash
export VISUAL="\"/c/Users/<utente>/AppData/Local/Programs/Microsoft VS Code/bin/code\" --wait"
```

**Ho cambiato editor ma il vecchio viene ancora usato.**
→ Le variabili potrebbero essere impostate a più livelli in conflitto. Controlla in ordine: `.bashrc`, `.bash_profile`, registro (`reg query "HKCU\Environment"`), e variabili di sistema (`HKLM\…\Environment`). L'ultima che vince dipende da quale shell le legge.

**Voglio un editor diverso solo per git.**
→ Git ha una sua configurazione che **sovrascrive** le variabili d'ambiente:

```bash
git config --global core.editor "code --wait"
```

Verifica con `git config --global --get core.editor`.

**Le virgolette attorno al valore.**
→ Su bash, `export EDITOR="code --wait"` va bene: le virgolette proteggono lo spazio. Senza virgolette, bash spezzerebbe `--wait` in un secondo argomento dell'export (errore). Su `setx` le virgolette sono raccomandate per la stessa ragione.

---

## Riepilogo rapido (TL;DR)

**1. Su Git Bash** — crea `~/.bashrc`:

```bash
export VISUAL="code --wait"
export EDITOR="code --wait"
```

E `~/.bash_profile` (se non esiste):

```bash
if [ -f "$HOME/.bashrc" ]; then
    . "$HOME/.bashrc"
fi
```

Applica: `source ~/.bashrc`

**2. A livello utente Windows** (per PowerShell, cmd, app native):

```bash
setx VISUAL "code --wait"
setx EDITOR "code --wait"
```

Poi **riapri** i terminali.

**3. Verifica:**

```bash
echo "$VISUAL"     # → code --wait
git commit         # apre VS Code in modalità --wait
```

> Ricorda: per **editor grafici** (VS Code, Sublime, Notepad++) aggiungi sempre `--wait`. Per **editor da terminale** (nano, vim) non serve.
