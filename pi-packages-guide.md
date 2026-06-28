# Guida ai Pacchetti Più Scaricati di pi

## 📊 Top 13 pacchetti per download mensili (da pi.dev/packages)

Dati raccolti da **pi.dev/packages** (basati su statistiche npm). La directory conta **87 pagine** di pacchetti.

---

### 1. pi-lean-ctx — 10.200 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | package |
| **Install** | `pi install npm:pi-lean-ctx` |
| **Repo** | [github.com/yvgude/lean-ctx](https://github.com/yvgude/lean-ctx) |
| **Autore** | yvgude |

**Descrizione:** "Auto-lean context" — nasconde automaticamente i tool entry non-bloccanti dal contesto dell'agente. Permette di mantenere il context window più pulito, rimuovendo le entries dei tool che non sono rilevanti per la conversazione corrente. Utile per sessioni lunghe dove il context tende a riempirsi.

**Perché usarlo:** Sessioni con molte chiamate tool tendono a saturare il context. Questo pacchetto fa pulizia automatica.

---

### 2. @juicesharp/rpiv-args — 10.000 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension, skill, prompt |
| **Install** | `pi install npm:@juicesharp/rpiv-args` |
| **Repo** | [github.com/juicesharp/rpiv-mono](https://github.com/juicesharp/rpiv-mono) |
| **Autore** | juicesharp |

**Descrizione:** Placeholder shell-style `$1` / `$ARGUMENTS` e sostituzione `!`cmd` / ```!` per le skill di pi. Permette di passare argomenti alle skill come se fossero script shell, e di espandere comandi inline.

**Esempio:**
```
/skill:my-skill "argomento1" "argomento2"
```
Dentro la skill, `$1` e `$2` vengono sostituiti con gli argomenti.

**Perché usarlo:** Se usi molto le skill e vuoi parametrizzarle con argomenti dinamici.

---

### 3. pi-studio — 10.000 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension, theme |
| **Install** | `pi install npm:pi-studio` |
| **Repo** | [github.com/omaclaren/pi-studio](https://github.com/omaclaren/pi-studio) |
| **Autore** | omacl |

**Descrizione:** Un workspace browser two-pane per pi con editing prompt/response, annotazioni, critiche, quiz attivi, storico prompt/response, preview live e workflow REPL/literate REPL con tmux.

**Perché usarlo:** Vuoi un'interfaccia più ricca per esplorare e iterare su prompt e risposte, con annotazioni e preview integrate.

---

### 4. @juicesharp/rpiv-i18n — 9.852 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:@juicesharp/rpiv-i18n` |
| **Repo** | [github.com/juicesharp/rpiv-mono](https://github.com/juicesharp/rpiv-mono) |
| **Autore** | juicesharp |

**Descrizione:** Fondazione di localizzazione per le skill rpiv-*: rilevamento locale, comando `/languages`, flag `--locale`, e un registrò cross-package per le lingue.

**Perché usarlo:** Se usi l'ecosistema rpiv e vuoi supporto multi-lingua nelle skill.

---

### 5. @juicesharp/rpiv-pi — 9.276 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension, skill |
| **Install** | `pi install npm:@juicesharp/rpiv-pi` |
| **Repo** | [github.com/juicesharp/rpiv-mono](https://github.com/juicesharp/rpiv-mono) |
| **Autore** | juicesharp |

**Descrizione:** Un workflow di sviluppo skill-based completo per l'agente Pi: 20 skill (discover → research → design → plan → implement → validate → code-review → commit e altre), sub-agenti nominati, e 6 workflow `/wf` built-in.

**Perché usarlo:** Cerchi un flusso di sviluppo strutturato e metodologico integrato in pi.

---

### 6. pi-btw — 9.246 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:pi-btw` |
| **Repo** | [github.com/dbachelder/pi-btw](https://github.com/dbachelder/pi-btw) |
| **Autore** | dbachelder |

**Descrizione:** Conversazioni parallele laterali con il comando `/btw`. Permette di avviare una conversazione separata senza perdere il contesto di quella principale.

**Perché usarlo:** Quando durante una sessione ti serve fare una domanda rapida o un task laterale senza interrompere il flusso principale.

---

### 7. pi-mcp-extension — 8.720 download/mese ⭐

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:pi-mcp-extension` |
| **Repo** | [github.com/irahardianto/pi-mcp-extension](https://github.com/irahardianto/pi-mcp-extension) |
| **Autore** | irahardianto |
| **Dipendenze** | `@modelcontextprotocol/sdk ^1.29.0`, `zod ^3.25.0` |

**Descrizione:** Client MCP (Model Context Protocol) production-ready per pi. Gestisce connessioni server, scopre tool e li rende disponibili all'LLM. Supporta trasporti `stdio`, `streamable-http`, e legacy `sse`.

**⚠️ IMPORTANTE:** pi **NON include MCP nativamente**. È una scelta deliberata (vedi [pi.dev](https://pi.dev) — sezione "What we didn't build"). Per usare qualsiasi server MCP (incluso Stitch) **devi** installare un'estensione di terze parti. `pi-mcp-extension` è la più popolare.

**Feature principali:**
- Multi-trasporto: `stdio` (subprocess), `streamable-http`, `sse` (legacy)
- Auto-discovery: `tools/list` paginato con cursori (MCP 2025-03-26)
- Live tool refresh: `notifications/tools/list_changed`
- Riconnessione smart: schedule a delay fisso (1s→3s→5s→10s→30s) con max retries configurabile
- Tool annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- Health checks opzionali
- Nomi tool stable (max 64 chars)

➡️ **Vedi la [Guida Dettagliata MCP](#guida-dettagliata-mcp-pi-mcp-extension--stitch) più sotto.**

---

### 8. pi-ask-user — 8.529 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:pi-ask-user` |
| **Repo** | [github.com/edlsh/pi-ask-user](https://github.com/edlsh/pi-ask-user) |
| **Autore** | edlsh |

**Descrizione:** Tool interattivo `ask_user` con UI di selezione searchable split-pane, multi-select e input libero. Permette all'agente di fare domande all'utente con una UI ricca invece di semplici dialoghi.

**Perché usarlo:** Vuoi che l'agente possa chiedere chiarimenti in modo strutturato, con opzioni predefinite e ricerca.

---

### 9. @firstpick/pi-package-webui — 8.341 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:@firstpick/pi-package-webui` |
| **Repo** | [github.com/Firstp1ck/npm-packages](https://github.com/Firstp1ck/npm-packages) |
| **Autore** | firstpick |

**Descrizione:** Companion Web UI per pi con un'interfaccia browser locale, comandi `/webui-start` e `/webui-status`.

**Perché usarlo:** Preferisci un'interfaccia browser al terminale, o vuoi affiancare la UI web alla TUI.

---

### 10. gentle-engram — 8.205 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | extension |
| **Install** | `pi install npm:gentle-engram` |
| **Repo** | [github.com/Gentleman-Programming/engram](https://github.com/Gentleman-Programming/engram) |
| **Autore** | alan_buscaglia |

**Descrizione:** Memoria persistente per agenti pi — un "cervello" locale o cloud condiviso tra sessioni, compattazioni e agenti MCP.

**Perché usarlo:** Vuoi che l'agente ricordi informazioni tra una sessione e l'altra, anche dopo compattazioni o fork.

---

### 11. pi-markdown-preview — 7.889 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | package |
| **Install** | `pi install npm:pi-markdown-preview` |
| **Repo** | [github.com/omaclaren/pi-markdown-preview](https://github.com/omaclaren/pi-markdown-preview) |
| **Autore** | omacl |

**Descrizione:** Preview Markdown + LaTeX renderizzato per pi, con output terminale, browser e PDF.

**Perché usarlo:** Lavori con documentazione Markdown o formule LaTeX e vuoi vederne il rendering direttamente da pi.

---

### 12. cc-safety-net — 7.714 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | package |
| **Install** | `pi install npm:cc-safety-net` |
| **Repo** | [github.com/kenryu42/cc-safety-net](https://github.com/kenryu42/cc-safety-net) |
| **Autore** | kenryu |

**Descrizione:** Un hook CLI per coding agent — blocca comandi git e filesystem distruttivi prima dell'esecuzione.

**Perché usarlo:** Vuoi un layer di sicurezza aggiuntivo che impedisca all'agente di eseguire comandi potenzialmente dannosi.

---

### 13. bigpowers — 7.677 download/mese

| Campo | Valore |
|-------|--------|
| **Tipo** | skill |
| **Install** | `pi install npm:bigpowers` |
| **Repo** | [github.com/danielvm-git/bigpowers](https://github.com/danielvm-git/bigpowers) |
| **Autore** | danielvm |

**Descrizione:** 61 agent skill per sviluppo software spec-driven e test-first pensato per sviluppatori solitari.

**Perché usarlo:** Cerchi un set completo di skill per uno sviluppo strutturato con specifiche e test.

---

## Guida Dettagliata MCP: pi-mcp-extension + Stitch

### MCP in pi: la situazione

**pi non include MCP nativamente.** È una scelta di design deliberata — il team di pi elenca "No MCP" nella sezione **"What we didn't build"** del sito [pi.dev](https://pi.dev). La loro filosofia è:

> "Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support."

Per usare server MCP con pi hai **tre opzioni**:

| Opzione | Complessità | Consigliata per |
|---------|-------------|-----------------|
| **1. Usare `pi-mcp-extension`** | Bassa | La maggior parte degli utenti |
| **2. Costruire la tua estensione MCP** | Alta | Esigenze molto specifiche |
| **3. Usare le Skill invece di MCP** | Media | Tool semplici con README |

### Opzione 1: pi-mcp-extension (consigliata)

#### Installazione

```bash
# Installazione permanente
pi install npm:pi-mcp-extension

# Oppure prova senza installare
pi -e npm:pi-mcp-extension
```

#### Configurazione

Crea un file di configurazione in una delle due posizioni:

| Posizione | Scope |
|-----------|-------|
| `~/.pi/agent/mcp.json` | Globale — tutti i progetti |
| `.pi/mcp.json` | Progetto — override per-server del globale |

**Esempio base (Supabase via HTTP):**

```json
{
  "mcpServers": {
    "supabase": {
      "transport": "streamable-http",
      "url": "https://mcp.supabase.com/mcp",
      "lifecycle": "eager"
    }
  }
}
```

**Esempio completo con tutti i tipi di server:**

```json
{
  "settings": {
    "toolPrefix": "mcp",
    "requestTimeoutMs": 30000,
    "maxRetries": 5
  },
  "mcpServers": {

    "supabase": {
      "transport": "streamable-http",
      "url": "https://mcp.supabase.com/mcp",
      "lifecycle": "eager"
    },

    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp"],
      "transport": "stdio",
      "lifecycle": "lazy"
    },

    "legacy-server": {
      "transport": "sse",
      "url": "https://example.com/sse",
      "lifecycle": "lazy"
    },

    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-playwright"],
      "transport": "stdio",
      "lifecycle": "eager"
    }
  }
}
```

#### Configurazione per Stitch

[Stitch](https://stitch.dev) è una piattaforma che espone server MCP. Per connetterlo a pi:

```json
{
  "mcpServers": {
    "stitch": {
      "transport": "streamable-http",
      "url": "https://api.stitch.dev/mcp",
      "lifecycle": "eager"
    }
  }
}
```

> **Nota:** L'URL esatto dipende dall'endpoint MCP specifico di Stitch. Verifica nella documentazione di Stitch l'URL corretto e se richiede autenticazione (es. header `Authorization`). L'estensione attualmente non supporta header personalizzati via config, quindi se Stitch richiede auth potresti dover modificare l'estensione o usare un approccio diverso.

#### Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `/mcp` | Mostra lo stato di tutti i server configurati |
| `/mcp <nome>` | Mostra stato dettagliato e log stderr di un server |
| `/mcp:start <nome>` | Avvia un server (resetta contatore retry) |
| `/mcp:stop <nome>` | Ferma un server e disattiva i suoi tool |

#### Come funziona (flusso)

```
1. Config viene caricato da mcp.json (globale + progetto)
2. Server "eager": connessi automaticamente a session_start
3. Server "lazy": aspettano /mcp:start
4. Tools scoperti via paginated tools/list (cursor-based, fino a 100 pagine)
5. JSON Schema convertito in TypeBox per compatibilità pi
6. Tools registrati come mcp_<server>_<tool> (sanitizzati, max 64 chars)
7. AbortSignal propagato via notifications/cancelled
8. Riconnessione automatica con schedule a delay fisso
```

#### Impostazioni globali

| Campo | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `toolPrefix` | string | `"mcp"` | Prefisso per i tool: `<prefix>_<server>_<tool>` |
| `requestTimeoutMs` | number | `30000` | Timeout per-request in millisecondi |
| `maxRetries` | number | `5` | Max tentativi di riconnessione (0-10) |

#### Impostazioni per-server

| Campo | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `transport` | `"stdio"` \| `"streamable-http"` \| `"sse"` | `"stdio"` | Protocollo di trasporto |
| `command` | string | — | Eseguibile da spawnare (**obbligatorio** per stdio) |
| `args` | string[] | `[]` | Argomenti per il comando |
| `env` | Record<string,string> | — | Variabili d'ambiente extra per il processo figlio |
| `url` | string | — | URL server (**obbligatorio** per streamable-http/sse) |
| `lifecycle` | `"eager"` \| `"lazy"` | `"lazy"` | `eager` = auto-start, `lazy` = manuale via `/mcp:start` |
| `requestTimeoutMs` | number | setting globale | Override timeout per-server |
| `healthCheckIntervalMs` | number | disabilitato | Intervallo ping per health monitoring |

#### MCP Spec Compliance

L'estensione implementa la specifica **MCP 2025-03-26** (con fallback 2024-11-05):

| Feature | Supporto |
|---------|----------|
| Protocollo `2025-03-26` + fallback `2024-11-05` | ✅ |
| Trasporto `stdio` | ✅ |
| Trasporto `streamable-http` | ✅ |
| Trasporto `sse` (legacy) | ✅ |
| `tools/list` paginato con cursori | ✅ |
| `tools/call` con parametri | ✅ |
| `roots/list` (workspace root) | ✅ |
| `notifications/tools/list_changed` (live refresh) | ✅ |
| `notifications/cancelled` (AbortSignal) | ✅ |
| `notifications/message` (structured logging) | ✅ |
| `isError: true` distinction (protocol vs tool errors) | ✅ |
| Tool annotations (readOnlyHint, destructiveHint, ecc.) | ✅ |
| Resources bridge | 🚧 v2 |
| Prompts bridge | 🚧 v2 |
| Sampling | 🚧 v2 |

### Opzione 2: Costruire la tua estensione MCP

Se `pi-mcp-extension` non soddisfa le tue esigenze, puoi costruire un'estensione MCP personalizzata. Ecco la struttura base:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // Avvia un server MCP via stdio
  pi.on("session_start", async (_event, ctx) => {
    // Usa pi.exec per avviare il server MCP
    // Scopri i tool via tools/list
    // Registra ogni tool con pi.registerTool()
  });

  // Cleanup allo shutdown
  pi.on("session_shutdown", async () => {
    // Termina i processi server
  });
}
```

Gli esempi ufficiali di pi includono già pattern per:
- **`ssh.ts`** — delega tool a macchina remota (simile al concetto di delegare a un server MCP)
- **`subagent/`** — spawn di sub-agenti con contesto isolato
- **`dynamic-tools.ts`** — registrazione dinamica di tool a runtime

### Opzione 3: Usare le Skill invece di MCP

Per molti casi d'uso, le **Skill** di pi possono sostituire MCP in modo più semplice:

1. Crea una cartella `~/.pi/agent/skills/<nome-skill>/` o `.agents/skills/<nome-skill>/`
2. Aggiungi un file `SKILL.md` con istruzioni e comandi CLI
3. L'agente eseguirà i comandi documentati nella skill

**Vantaggi delle Skill rispetto a MCP:**
- Zero dipendenze esterne
- Non richiedono un server in esecuzione
- Funzionano con qualsiasi tool CLI esistente
- Più facili da creare e mantenere

**Svantaggi:**
- Non c'è type safety automatica (JSON Schema)
- L'agente deve leggere la documentazione e chiamare i comandi "al volo"
- Meno strutturate per API complesse

---

## Riepilogo: MCP in pi

| Domanda | Risposta |
|---------|----------|
| MCP è built-in in pi? | **No.** Il team lo ha deliberatamente escluso |
| Posso usare server MCP con pi? | **Sì**, ma serve un'estensione di terze parti |
| Qual è l'estensione più usata? | `pi-mcp-extension` (8.720 download/mese) |
| Posso connettere Stitch a pi? | **Sì**, configurando `pi-mcp-extension` con l'endpoint MCP di Stitch |
| Devo per forza usare un pacchetto npm? | **No**, puoi costruire la tua estensione MCP |
| Ci sono alternative a MCP in pi? | **Sì**, le [Skill](https://pi.dev/docs/latest/skills) per tool CLI semplici |
