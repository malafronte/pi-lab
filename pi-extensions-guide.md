# Guida Completa alle Estensioni di pi

## Indice

1. [Cosa sono le estensioni](#cosa-sono-le-estensioni)
2. [Quick Start](#quick-start)
3. [Posizione delle estensioni](#posizione-delle-estensioni)
4. [Import disponibili](#import-disponibili)
5. [Scrivere un'estensione](#scrivere-unestensione)
6. [Riferimento Eventi](#riferimento-eventi)
7. [ExtensionAPI - Metodi](#extensionapi---metodi)
8. [Custom Tools](#custom-tools)
9. [Custom UI](#custom-ui)
10. [Gestione errori e modalità](#gestione-errori-e-modalità)
11. [Catalogo esempi](#catalogo-esempi)
12. [Best Practice](#best-practice)

---

## Cosa sono le estensioni

Le estensioni sono moduli **TypeScript** che estendono il comportamento di pi. Possono:

- **Sottoscriversi a eventi** del ciclo di vita (session_start, tool_call, agent_start, ...)
- **Registrare tool personalizzati** chiamabili dall'LLM via `pi.registerTool()`
- **Registrare comandi** come `/mycommand` via `pi.registerCommand()`
- **Intercettare e bloccare** chiamate a tool (`tool_call`, `tool_result`)
- **Personalizzare l'UI** con componenti TUI, widget, footer, editor
- **Persistere stato** tra una sessione e l'altra via `pi.appendEntry()`
- **Registrare provider** di modelli personalizzati

> **Sicurezza:** Le estensioni girano con i tuoi permessi di sistema. Installa solo da fonti fidate.

---

## Quick Start

Crea `~/.pi/agent/extensions/my-extension.ts`:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // Reagire agli eventi
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded!", "info");
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // Registrare un tool personalizzato
  pi.registerTool({
    name: "greet",
    label: "Greet",
    description: "Greet someone by name",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // Registrare un comando
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}
```

Test con:

```bash
pi -e ./my-extension.ts
```

---

## Posizione delle estensioni

Le estensioni sono scoperte automaticamente da posizioni fidate. Quelle in `.pi/extensions` vengono caricate solo dopo che il progetto è stato considerato trusted.

| Posizione | Scope |
|-----------|-------|
| `~/.pi/agent/extensions/*.ts` | Globale (tutti i progetti) |
| `~/.pi/agent/extensions/*/index.ts` | Globale (sottodirectory) |
| `.pi/extensions/*.ts` | Locale al progetto |
| `.pi/extensions/*/index.ts` | Locale al progetto (sottodirectory) |

Percorsi aggiuntivi via `settings.json`:

```json
{
  "packages": [
    "npm:@foo/bar@1.0.0",
    "git:github.com/user/repo@v1"
  ],
  "extensions": [
    "/path/to/local/extension.ts",
    "/path/to/local/extension/dir"
  ]
}
```

---

## Import disponibili

| Pacchetto | Scopo |
|-----------|-------|
| `@earendil-works/pi-coding-agent` | Tipi delle estensioni (`ExtensionAPI`, `ExtensionContext`, eventi) |
| `typebox` | Definizione schema per parametri dei tool |
| `@earendil-works/pi-ai` | Utility AI (`StringEnum` per enum compatibili con Google) |
| `@earendil-works/pi-tui` | Componenti TUI per rendering personalizzato |

Dipendenze npm funzionano: aggiungi `package.json` nella directory dell'estensione, `npm install`, e gli import da `node_modules/` vengono risolti automaticamente. Anche i moduli built-in di Node.js (`node:fs`, `node:path`, ecc.) sono disponibili.

---

## Scrivere un'estensione

Un'estensione esporta una **factory function** di default che riceve `ExtensionAPI`. Può essere sincrona o asincrona:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("event_name", async (event, ctx) => {
    // ctx.ui per interazione utente
    const ok = await ctx.ui.confirm("Titolo", "Sei sicuro?");
    ctx.ui.notify("Fatto!", "info");
    ctx.ui.setStatus("my-ext", "Processing...");       // Status nel footer
    ctx.ui.setWidget("my-ext", ["Riga 1", "Riga 2"]);  // Widget sopra l'editor
  });

  pi.registerTool({ ... });
  pi.registerCommand("name", { ... });
  pi.registerShortcut("ctrl+x", { ... });
  pi.registerFlag("my-flag", { ... });
}
```

### Factory asincrona

Per lavoro di inizializzazione una tantum (fetch di configurazioni remote, discovery di modelli):

```typescript
export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = await response.json();

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096,
    })),
  });
}
```

### Risorse long-lived e shutdown

Le factory possono girare in esecuzioni che non avviano mai una sessione. **Non avviare processi, socket, file watcher o timer dalla factory.** Rimanda l'avvio a `session_start` e registra un handler `session_shutdown` per chiudere le risorse.

### Stili di estensione

**File singolo** - per estensioni semplici:
```
~/.pi/agent/extensions/
└── my-extension.ts
```

**Directory con index.ts** - per estensioni multi-file:
```
~/.pi/agent/extensions/
└── my-extension/
    ├── index.ts        # Entry point
    ├── tools.ts
    └── utils.ts
```

**Pacchetto con dipendenze** - per estensioni con pacchetti npm:
```
~/.pi/agent/extensions/
└── my-extension/
    ├── package.json
    ├── package-lock.json
    ├── node_modules/
    └── src/
        └── index.ts
```

---

## Riferimento Eventi

### Panoramica del ciclo di vita

```
pi si avvia
  │
  ├─► project_trust (solo estensioni user/global e CLI, prima del caricamento risorse)
  ├─► session_start { reason: "startup" }
  └─► resources_discover { reason: "startup" }
      │
      ▼
l'utente invia un prompt ───────────────────────────────────┐
  │                                                          │
  ├─► (controllo comandi estensione, bypass se trovato)      │
  ├─► input (può intercettare, trasformare, gestire)         │
  ├─► before_agent_start (può iniettare messaggi, modificare system prompt)
  ├─► agent_start                                            │
  ├─► message_start / message_update / message_end           │
  │                                                          │
  │   ┌─── turno (si ripete mentre LLM chiama tool) ──┐      │
  │   │                                                │      │
  │   ├─► turn_start                                   │      │
  │   ├─► context (può modificare messaggi)             │      │
  │   ├─► before_provider_request (ispeziona payload)  │      │
  │   ├─► after_provider_response (status + headers)   │      │
  │   │                                                │      │
  │   │   LLM risponde, può chiamare tool:              │      │
  │   │     ├─► tool_execution_start                   │      │
  │   │     ├─► tool_call (può bloccare)               │      │
  │   │     ├─► tool_execution_update                  │      │
  │   │     ├─► tool_result (può modificare)           │      │
  │   │     └─► tool_execution_end                     │      │
  │   │                                                │      │
  │   └─► turn_end                                     │      │
  │                                                          │
  └─► agent_end                                              │

exit (Ctrl+C, Ctrl+D, SIGHUP, SIGTERM)
  └─► session_shutdown
```

### Eventi di avvio

#### `project_trust`
Attivato prima che pi decida se fidarsi di un progetto con config dinamiche (`.pi` o `.agents/skills`).

```typescript
pi.on("project_trust", async (event, ctx) => {
  if (await ctx.ui.confirm("Trust project?", event.cwd)) {
    return { trusted: "yes", remember: true };
  }
  return { trusted: "undecided" };
});
```

#### `resources_discover`
Dopo `session_start`, per contribuire percorsi di skill, prompt e temi.

```typescript
pi.on("resources_discover", async (event, _ctx) => {
  return {
    skillPaths: ["/path/to/skills"],
    promptPaths: ["/path/to/prompts"],
    themePaths: ["/path/to/themes"],
  };
});
```

### Eventi di sessione

#### `session_start`
Attivato quando una sessione viene avviata, caricata o ricaricata.

```typescript
pi.on("session_start", async (event, ctx) => {
  // event.reason - "startup" | "reload" | "new" | "resume" | "fork"
  ctx.ui.notify(`Sessione: ${ctx.sessionManager.getSessionFile() ?? "ephemeral"}`, "info");
});
```

#### `session_before_switch`
Prima di avviare una nuova sessione (`/new`) o cambiare sessione (`/resume`).

```typescript
pi.on("session_before_switch", async (event, ctx) => {
  if (event.reason === "new") {
    const ok = await ctx.ui.confirm("Clear?", "Delete all messages?");
    if (!ok) return { cancel: true };
  }
});
```

#### `session_before_fork`
Attivato durante `/fork` o `/clone`.

```typescript
pi.on("session_before_fork", async (event, ctx) => {
  return { cancel: true }; // Annulla fork
});
```

#### `session_before_compact` / `session_compact`
Attivati durante la compattazione.

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  // event.reason - "manual" (/compact), "threshold", o "overflow"
  // Annullare: return { cancel: true };
  // Custom summary:
  return {
    compaction: {
      summary: "...",
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
    }
  };
});
```

#### `session_shutdown`
Prima che il runtime della sessione venga smantellato. Per cleanup.

```typescript
pi.on("session_shutdown", async (event, ctx) => {
  // event.reason - "quit" | "reload" | "new" | "resume" | "fork"
});
```

### Eventi dell'agente

#### `before_agent_start`
Dopo l'invio del prompt, prima del loop dell'agente. Può iniettare messaggi e modificare il system prompt.

```typescript
pi.on("before_agent_start", async (event, ctx) => {
  return {
    message: {
      customType: "my-extension",
      content: "Contesto aggiuntivo per l'LLM",
      display: true,
    },
    systemPrompt: event.systemPrompt + "\n\nIstruzioni extra...",
  };
});
```

#### `agent_start` / `agent_end`
Attivati una volta per ogni prompt utente.

```typescript
pi.on("agent_start", async (_event, ctx) => {});
pi.on("agent_end", async (event, ctx) => {
  // event.messages - messaggi di questo prompt
});
```

#### `turn_start` / `turn_end`
Per ogni turno (una risposta LLM + chiamate tool).

```typescript
pi.on("turn_start", async (event, ctx) => {
  // event.turnIndex, event.timestamp
});
```

#### `message_start` / `message_update` / `message_end`
Ciclo di vita dei messaggi. `message_end` può restituire `{ message }` per sostituire il messaggio finalizzato.

#### `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
Ciclo di vita dell'esecuzione dei tool.

#### `context`
Prima di ogni chiamata LLM. Può modificare i messaggi in modo non distruttivo.

```typescript
pi.on("context", async (event, ctx) => {
  const filtered = event.messages.filter(m => !shouldPrune(m));
  return { messages: filtered };
});
```

#### `before_provider_request`
Dopo la costruzione del payload, prima dell'invio della richiesta. Utile per debugging.

```typescript
pi.on("before_provider_request", (event, ctx) => {
  console.log(JSON.stringify(event.payload, null, 2));
});
```

#### `after_provider_response`
Dopo la ricezione della risposta HTTP, prima del consumo dello stream.

```typescript
pi.on("after_provider_response", (event, ctx) => {
  if (event.status === 429) {
    console.log("rate limited", event.headers["retry-after"]);
  }
});
```

### Eventi del modello

#### `model_select`
Quando il modello cambia via `/model`, `Ctrl+P` o restore sessione.

```typescript
pi.on("model_select", async (event, ctx) => {
  ctx.ui.notify(`Modello: ${event.model.provider}/${event.model.id}`, "info");
});
```

#### `thinking_level_select`
Quando cambia il livello di thinking. Solo notifica.

```typescript
pi.on("thinking_level_select", async (event, ctx) => {
  ctx.ui.setStatus("thinking", `thinking: ${event.level}`);
});
```

### Eventi dei tool

#### `tool_call`
Prima che il tool venga eseguito. **Può bloccare.** `event.input` è mutabile.

```typescript
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

pi.on("tool_call", async (event, ctx) => {
  if (isToolCallEventType("bash", event)) {
    if (event.input.command.includes("rm -rf")) {
      return { block: true, reason: "Comando pericoloso" };
    }
  }
});
```

#### `tool_result`
Dopo l'esecuzione del tool. **Può modificare il risultato.**

```typescript
pi.on("tool_result", async (event, ctx) => {
  return { content: [...], details: {...}, isError: false };
});
```

### Eventi bash utente

#### `user_bash`
Quando l'utente esegue comandi `!` o `!!`. Può intercettare.

```typescript
pi.on("user_bash", (event, ctx) => {
  // event.command - il comando bash
  // event.excludeFromContext - true se prefisso !!
  return { result: { output: "...", exitCode: 0, cancelled: false, truncated: false } };
});
```

### Eventi di input

#### `input`
Quando l'input utente viene ricevuto, prima dell'espansione di skill e template.

```typescript
pi.on("input", async (event, ctx) => {
  // event.text - input raw (prima dell'espansione)
  // event.images - immagini allegate
  // event.source - "interactive" | "rpc" | "extension"
  // event.streamingBehavior - "steer" | "followUp" | undefined

  if (event.text.startsWith("?quick "))
    return { action: "transform", text: `Rispondi brevemente: ${event.text.slice(7)}` };

  if (event.text === "ping") {
    ctx.ui.notify("pong", "info");
    return { action: "handled" };
  }

  return { action: "continue" };
});
```

---

## ExtensionAPI - Metodi

### `pi.on(event, handler)`
Sottoscrivi agli eventi del ciclo di vita.

### `pi.registerTool(definition)`
Registra un tool personalizzato chiamabile dall'LLM. Vedi [Custom Tools](#custom-tools).

### `pi.registerCommand(name, options)`
Registra un comando `/name`.

```typescript
pi.registerCommand("stats", {
  description: "Mostra statistiche sessione",
  handler: async (args, ctx) => {
    const count = ctx.sessionManager.getEntries().length;
    ctx.ui.notify(`${count} entries`, "info");
  }
});

// Con autocompletamento argomenti
pi.registerCommand("deploy", {
  description: "Deploy to an environment",
  getArgumentCompletions: (prefix: string) => {
    const envs = ["dev", "staging", "prod"];
    const items = envs.map(e => ({ value: e, label: e }));
    return items.filter(i => i.value.startsWith(prefix)) || null;
  },
  handler: async (args, ctx) => {
    ctx.ui.notify(`Deploying: ${args}`, "info");
  },
});
```

### `pi.registerShortcut(shortcut, options)`
Registra una scorciatoia da tastiera.

```typescript
pi.registerShortcut("ctrl+shift+p", {
  description: "Toggle plan mode",
  handler: async (ctx) => {
    ctx.ui.notify("Toggled!");
  },
});
```

### `pi.registerFlag(name, options)`
Registra un flag CLI.

```typescript
pi.registerFlag("plan", {
  description: "Start in plan mode",
  type: "boolean",
  default: false,
});

if (pi.getFlag("plan")) { /* ... */ }
```

### `pi.sendMessage(message, options?)`
Inietta un messaggio personalizzato nella sessione.

```typescript
pi.sendMessage({
  customType: "my-extension",
  content: "Messaggio",
  display: true,
  details: { ... },
}, {
  triggerTurn: true,
  deliverAs: "steer",  // "steer" | "followUp" | "nextTurn"
});
```

### `pi.sendUserMessage(content, options?)`
Invia un messaggio utente all'agente (appare come se digitato dall'utente). Attiva sempre un turno.

```typescript
pi.sendUserMessage("What is 2+2?");
pi.sendUserMessage("Focus on error handling", { deliverAs: "steer" });
```

### `pi.appendEntry(customType, data?)`
Persiste stato dell'estensione.

```typescript
pi.appendEntry("my-state", { count: 42 });
```

### `pi.setSessionName(name)` / `pi.getSessionName()`
Imposta/ottieni il nome visualizzato della sessione.

### `pi.setLabel(entryId, label)`
Imposta/rimuovi un'etichetta su un entry per la navigazione `/tree`.

### `pi.registerProvider(name, config)`
Registra o sovrascrivi un provider di modelli.

```typescript
pi.registerProvider("my-proxy", {
  name: "My Proxy",
  baseUrl: "https://proxy.example.com",
  apiKey: "$PROXY_API_KEY",
  api: "anthropic-messages",
  models: [{ id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet (proxy)", ... }]
});
```

### `pi.unregisterProvider(name)`
Rimuove un provider precedentemente registrato.

### `pi.getActiveTools()` / `pi.getAllTools()` / `pi.setActiveTools(names)`
Gestisci i tool attivi.

```typescript
const active = pi.getActiveTools();        // string[]
const all = pi.getAllTools();              // metadata completi
pi.setActiveTools(["read", "bash"]);       // Imposta solo lettura
```

### `pi.setModel(model)` / `pi.getThinkingLevel()` / `pi.setThinkingLevel(level)`
Controllo modello e livello di thinking.

### `pi.events`
Event bus condiviso per comunicazione tra estensioni:

```typescript
pi.events.on("my:event", (data) => { ... });
pi.events.emit("my:event", { ... });
```

### `pi.exec(command, args, options?)`
Esegue un comando shell.

```typescript
const result = await pi.exec("git", ["status"], { signal, timeout: 5000 });
```

---

## Custom Tools

### Definizione base

```typescript
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";

pi.registerTool({
  name: "my_tool",
  label: "My Tool",
  description: "Cosa fa questo tool (mostrato all'LLM)",
  promptSnippet: "Breve descrizione per la sezione Available tools",
  promptGuidelines: [
    "Usa my_tool quando l'utente chiede di gestire todo."
  ],
  parameters: Type.Object({
    action: StringEnum(["list", "add"] as const),
    text: Type.Optional(Type.String()),
  }),
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    if (signal?.aborted) {
      return { content: [{ type: "text", text: "Cancelled" }] };
    }

    onUpdate?.({ content: [{ type: "text", text: "Working..." }] });

    return {
      content: [{ type: "text", text: "Done" }],
      details: { data: "..." },
      terminate: true,  // Opzionale: termina dopo questo batch di tool
    };
  },
});
```

> **Importante:** Usa `StringEnum` da `@earendil-works/pi-ai` per gli enum. `Type.Union`/`Type.Literal` non funziona con l'API di Google.

> **Segnalare errori:** Lancia un'eccezione da `execute()` per marcare `isError: true`. Restituire un valore non imposta mai il flag di errore.

### `prepareArguments(args)`
Compatibilità con vecchie shape di argomenti. Opzionale. Eseguito prima della validazione.

```typescript
prepareArguments(args) {
  if (!args || typeof args !== "object") return args;
  const input = args as { action?: string; oldAction?: string };
  if (typeof input.oldAction === "string" && input.action === undefined) {
    return { ...input, action: input.oldAction };
  }
  return args;
}
```

### Sovrascrivere tool built-in

Registra un tool con lo stesso nome (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`). Il renderer built-in viene ereditato slot per slot.

```bash
pi -e ./tool-override.ts           # Sovrascrive il tool read
pi --no-builtin-tools -e ./ext.ts  # Nessun built-in, solo estensioni
```

### Esecuzione remota

I tool built-in supportano operazioni pluggable per SSH, container, ecc:

```typescript
import { createReadTool } from "@earendil-works/pi-coding-agent";

const remoteRead = createReadTool(cwd, {
  operations: {
    readFile: (path) => sshExec(remote, `cat ${path}`),
    access: (path) => sshExec(remote, `test -r ${path}`).then(() => {}),
  }
});
```

### Troncamento output

I tool **DEVONO** troncare l'output. Limite built-in: **50KB** (~10k token) e **2000 righe**.

```typescript
import { truncateHead, truncateTail, DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from "@earendil-works/pi-coding-agent";

const truncation = truncateHead(output, { maxLines: DEFAULT_MAX_LINES, maxBytes: DEFAULT_MAX_BYTES });
// o truncateTail per log/command output
```

### File mutation queue

Se il tuo tool modifica file, usa `withFileMutationQueue()` per evitare race condition con `edit` e `write`:

```typescript
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";

async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
  const absolutePath = resolve(ctx.cwd, params.path);
  return withFileMutationQueue(absolutePath, async () => {
    // read-modify-write qui
  });
}
```

### Rendering personalizzato

```typescript
pi.registerTool({
  name: "my_tool",
  // ...
  renderCall(args, theme, context) {
    return new Text(theme.fg("toolTitle", theme.bold("my_tool ")), 0, 0);
  },
  renderResult(result, { expanded, isPartial }, theme, context) {
    if (isPartial) return new Text(theme.fg("warning", "Processing..."), 0, 0);
    let text = theme.fg("success", "✓ Done");
    if (expanded) text += "\n" + theme.fg("dim", JSON.stringify(result.details));
    return new Text(text, 0, 0);
  },
});
```

---

## Custom UI

### Dialoghi

```typescript
const choice = await ctx.ui.select("Scegli:", ["A", "B", "C"]);
const ok = await ctx.ui.confirm("Elimina?", "Questa azione è irreversibile");
const name = await ctx.ui.input("Nome:", "placeholder");
const text = await ctx.ui.editor("Modifica:", "testo precompilato");
ctx.ui.notify("Fatto!", "info");  // "info" | "warning" | "error"

// Con timeout
const confirmed = await ctx.ui.confirm("Conferma", "Auto-cancel in 5s", { timeout: 5000 });

// Con AbortSignal
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const result = await ctx.ui.confirm("Titolo", "Messaggio", { signal: controller.signal });
```

### Widget, Status, Footer

```typescript
// Status nel footer
ctx.ui.setStatus("my-ext", "Processing...");
ctx.ui.setStatus("my-ext", undefined);  // Clear

// Working loader (durante streaming)
ctx.ui.setWorkingMessage("Thinking deeply...");
ctx.ui.setWorkingMessage();  // Ripristina default

// Working indicator
ctx.ui.setWorkingIndicator({ frames: [ctx.ui.theme.fg("accent", "●")] });

// Widget
ctx.ui.setWidget("my-widget", ["Riga 1", "Riga 2"]);
ctx.ui.setWidget("my-widget", ["Riga 1"], { placement: "belowEditor" });
ctx.ui.setWidget("my-widget", undefined);  // Clear

// Footer personalizzato
ctx.ui.setFooter((tui, theme) => ({
  render(width) { return [theme.fg("dim", "Custom footer")]; },
  invalidate() {},
}));
ctx.ui.setFooter(undefined);  // Ripristina default

// Titolo terminale
ctx.ui.setTitle("pi - my-project");

// Testo editor
ctx.ui.setEditorText("Prefill text");
const current = ctx.ui.getEditorText();
```

### Autocomplete personalizzato

```typescript
ctx.ui.addAutocompleteProvider((current) => ({
  triggerCharacters: ["#"],
  async getSuggestions(lines, line, col, options) {
    const beforeCursor = (lines[line] ?? "").slice(0, col);
    const match = beforeCursor.match(/(?:^|[ \t])#([^\s#]*)$/);
    if (!match) return current.getSuggestions(lines, line, col, options);

    return {
      prefix: `#${match[1] ?? ""}`,
      items: [{ value: "#2983", label: "#2983", description: "Descrizione" }],
    };
  },
  applyCompletion(lines, line, col, item, prefix) {
    return current.applyCompletion(lines, line, col, item, prefix);
  },
}));
```

### Componenti personalizzati (`ctx.ui.custom`)

```typescript
import { Text } from "@earendil-works/pi-tui";

const result = await ctx.ui.custom<boolean>((tui, theme, keybindings, done) => {
  const text = new Text("Premi Enter per confermare, Esc per annullare", 1, 1);
  text.onKey = (key) => {
    if (key === "return") done(true);
    if (key === "escape") done(false);
    return true;
  };
  return text;
});
```

**Overlay mode:**

```typescript
const result = await ctx.ui.custom<string | null>(
  (tui, theme, keybindings, done) => new MyOverlayComponent({ onClose: done }),
  { overlay: true, overlayOptions: { anchor: "top-right", width: "50%", margin: 2 } }
);
```

### Editor personalizzato

```typescript
import { CustomEditor } from "@earendil-works/pi-coding-agent";

class VimEditor extends CustomEditor {
  private mode: "normal" | "insert" = "insert";

  handleInput(data: string): void {
    if (matchesKey(data, "escape") && this.mode === "insert") {
      this.mode = "normal";
      return;
    }
    super.handleInput(data);
  }
}

ctx.ui.setEditorComponent((_tui, theme, keybindings) => new VimEditor(theme, keybindings));
ctx.ui.setEditorComponent(undefined);  // Ripristina default
```

### Message rendering

```typescript
pi.registerMessageRenderer("my-extension", (message, options, theme) => {
  let text = theme.fg("accent", `[${message.customType}] `) + message.content;
  if (options.expanded && message.details) {
    text += "\n" + theme.fg("dim", JSON.stringify(message.details, null, 2));
  }
  return new Text(text, 0, 0);
});

pi.sendMessage({ customType: "my-extension", content: "Status update", display: true });
```

### Colori del tema

```typescript
theme.fg("toolTitle", text)   // Nomi tool
theme.fg("accent", text)      // Highlight
theme.fg("success", text)     // Successo (verde)
theme.fg("error", text)       // Errori (rosso)
theme.fg("warning", text)     // Warning (giallo)
theme.fg("muted", text)       // Testo secondario
theme.fg("dim", text)         // Testo terziario
theme.bold(text)              // Grassetto
theme.italic(text)            // Corsivo
```

---

## Gestione errori e modalità

### Gestione errori

- Gli errori delle estensioni vengono loggati, l'agente continua
- Errori in `tool_call` bloccano il tool (fail-safe)
- Errori in `execute` devono essere segnalati lanciando un'eccezione

### Modalità

| Modalità | `ctx.mode` | `ctx.hasUI` | Note |
|----------|------------|-------------|------|
| Interattiva | `"tui"` | `true` | TUI completo |
| RPC | `"rpc"` | `true` | Dialoghi via protocollo JSON |
| JSON | `"json"` | `false` | Event stream su stdout |
| Print (`-p`) | `"print"` | `false` | Estensioni eseguite, no UI |

Usa `ctx.mode === "tui"` per feature TUI-only. Usa `ctx.hasUI` per metodi dialogo/notifica che funzionano sia in TUI che RPC.

---

## Catalogo esempi

Tutti in `examples/extensions/` della directory di installazione di pi.

### 🔒 Sicurezza & Lifecycle
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `permission-gate.ts` | Conferma prima di comandi bash pericolosi | `tool_call`, `ui.confirm` |
| `protected-paths.ts` | Blocca scritture su `.env`, `.git/`, `node_modules/` | `tool_call` |
| `confirm-destructive.ts` | Conferma azioni distruttive sulla sessione | `session_before_switch`, `session_before_fork` |
| `dirty-repo-guard.ts` | Impedisce cambi sessione con git sporco | `session_before_*`, `exec` |
| `project-trust.ts` | Dimostra evento `project_trust` | `project_trust` |

### 🛠️ Custom Tools
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `hello.ts` | Tool minimale | `registerTool` |
| `todo.ts` | Todo list persistente con rendering | `registerTool`, `appendEntry`, `renderResult` |
| `question.ts` | Tool con interazione utente | `registerTool`, `ui.select` |
| `questionnaire.ts` | Wizard multi-step | `registerTool`, `ui.custom` |
| `tool-override.ts` | Sovrascrive `read` con logging | `registerTool` (stesso nome) |
| `dynamic-tools.ts` | Registrazione dinamica tool | `registerTool`, `session_start` |
| `structured-output.ts` | Tool con output strutturato e `terminate: true` | `registerTool` |
| `truncated-tool.ts` | Troncamento output con `truncateHead` | `registerTool` |
| `ssh.ts` | Delega tool a macchina remota via SSH | `registerFlag`, tool operations |
| `subagent/` | Sub-agenti con contesto isolato | `registerTool`, `exec` |

### 🎮 Comandi & UI
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `preset.ts` | Preset nominati (modello, tool, thinking) | `registerCommand`, `setModel`, `setActiveTools` |
| `plan-mode/` | Modalità plan (sola lettura, step tracking) | Tutti i tipi di evento |
| `tools.ts` | UI per abilitare/disabilitare tool | `registerCommand`, `setActiveTools` |
| `handoff.ts` | Trasferimento contesto a nuova sessione | `registerCommand`, `ui.editor` |
| `qna.ts` | Estrae domande nell'editor | `registerCommand`, `setEditorText` |
| `snake.ts` | Gioco Snake nel terminale | `registerCommand`, `ui.custom` |
| `tic-tac-toe.ts` | Tris contro l'agente | `registerTool` sequenziale |
| `space-invaders.ts` | Space Invaders | `registerCommand`, `ui.custom` |
| `doom-overlay/` | DOOM in overlay a 35 FPS | `ui.custom` overlay |
| `summarize.ts` | Riassunto conversazione con UI transiente | `registerCommand`, `ui.custom` |
| `status-line.ts` | Progresso turni nel footer | `setStatus`, eventi sessione |
| `custom-footer.ts` | Footer con git branch e token stats | `setFooter` |
| `custom-header.ts` | Header personalizzato | `setHeader` |
| `modal-editor.ts` | Editor vim-style modale | `setEditorComponent`, `CustomEditor` |
| `rainbow-editor.ts` | Effetto rainbow animato | `setEditorComponent` |
| `notify.ts` | Notifiche desktop via OSC 777 | `ui.notify`, `agent_end` |
| `titlebar-spinner.ts` | Spinner braille nel titolo del terminale | `setTitle` |
| `widget-placement.ts` | Widget sopra/sotto l'editor | `setWidget` |
| `github-issue-autocomplete.ts` | Autocomplete `#1234` per issue GitHub | `addAutocompleteProvider` |
| `timed-confirm.ts` | Dialoghi con timeout/AbortSignal | `ui.confirm` con timeout |
| `input-transform.ts` | Trasforma input utente | `input` |
| `input-transform-streaming.ts` | Transform input con streaming behavior | `input`, `streamingBehavior` |

### 🔄 Git
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `git-checkpoint.ts` | Stash git a ogni turno | `turn_start`, `session_before_fork`, `exec` |
| `auto-commit-on-exit.ts` | Auto-commit all'uscita | `session_shutdown`, `exec` |
| `git-merge-and-resolve.ts` | Fetch, merge e risoluzione conflitti | `agent_end`, `exec`, `sendUserMessage` |

### 📝 System Prompt & Compaction
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `pirate.ts` | Modifica system prompt per turno | `registerCommand`, `before_agent_start` |
| `claude-rules.ts` | Scansiona `.claude/rules/` nel system prompt | `before_agent_start` |
| `custom-compaction.ts` | Compaction personalizzato | `session_before_compact` |
| `trigger-compact.ts` | Trigger compaction manuale | `compact()` |
| `prompt-customizer.ts` | Guida tool context-aware | `before_agent_start`, `systemPromptOptions` |

### 🔌 Provider personalizzati
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `custom-provider-anthropic/` | Provider Anthropic con OAuth | `registerProvider` |
| `custom-provider-gitlab-duo/` | GitLab Duo con OAuth | `registerProvider` |

### 🖥️ Sistema & Sandbox
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `mac-system-theme.ts` | Sincronizza tema con macOS | `setTheme`, `exec` |
| `interactive-shell.ts` | Shell persistente per comandi interattivi | `user_bash` |
| `sandbox/` | Sandbox a livello OS | Tool operations |
| `gondolin/` | Routing tool in Gondolin micro-VM | Tool operations, `user_bash` |
| `bash-spawn-hook.ts` | Hook per aggiustare comando, cwd, env | `createBashTool`, `spawnHook` |
| `file-trigger.ts` | File watcher che inietta contenuti | `sendMessage` |

### 📦 Varie
| Estensione | Descrizione | API chiave |
|------------|-------------|------------|
| `message-renderer.ts` | Rendering messaggi custom | `registerMessageRenderer`, `sendMessage` |
| `event-bus.ts` | Comunicazione inter-estensione | `pi.events` |
| `session-name.ts` | Nomi sessione per il selettore | `setSessionName` |
| `bookmark.ts` | Etichette per navigazione `/tree` | `setLabel` |
| `with-deps/` | Estensione con package.json e dipendenze | Struttura pacchetto |
| `send-user-message.ts` | Invio messaggi utente da estensioni | `sendUserMessage` |
| `shutdown-command.ts` | Comando `/quit` | `shutdown()` |
| `reload-runtime.ts` | Comando `/reload-runtime` e tool | `ctx.reload()`, `sendUserMessage` |
| `inline-bash.ts` | Espansione `!{command}` nei prompt | `tool_call` |
| `model-status.ts` | Mostra cambi modello nella status bar | `model_select` |
| `working-indicator.ts` | Indicatore di lavoro personalizzato | `setWorkingIndicator` |
| `hidden-thinking-label.ts` | Etichetta thinking collassata personalizzata | `setHiddenThinkingLabel` |
| `overlay-test.ts` | Test overlay compositing | `ui.custom` overlay |
| `overlay-qa-tests.ts` | Test QA completi overlay | `ui.custom`, tutte le opzioni overlay |
| `provider-payload.ts` | Ispeziona payload provider | `before_provider_request`, `after_provider_response` |

---

## Best Practice

### 1. Usa `StringEnum` per i parametri enum
```typescript
// ✅ Corretto
action: StringEnum(["list", "add"] as const)

// ❌ Sbagliato - non funziona con Google
action: Type.Union([Type.Literal("list"), Type.Literal("add")])
```

### 2. Persisti lo stato nei `details` dei risultati
```typescript
return {
  content: [{ type: "text", text: "Done" }],
  details: { todos: [...todos], nextId },  // Persistito nella sessione
};

// Ricostruisci in session_start
pi.on("session_start", async (_event, ctx) => {
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "message" && entry.message.toolName === "my_tool") {
      const details = entry.message.details;
      // Ricostruisci stato da details
    }
  }
});
```

### 3. Avvia risorse long-lived in `session_start`, non nella factory
```typescript
// ❌ Non fare questo nella factory
const server = startServer();

// ✅ Fai questo
pi.on("session_start", async () => { server = startServer(); });
pi.on("session_shutdown", async () => { server?.close(); });
```

### 4. Usa `withFileMutationQueue` se il tool modifica file
Per evitare race condition con `edit` e `write` in esecuzione parallela.

### 5. Tronca sempre l'output dei tool
Limite: 50KB / 2000 righe. Usa `truncateHead` o `truncateTail`.

### 6. Nelle `promptGuidelines`, nomina sempre il tool
```typescript
// ✅ Corretto
promptGuidelines: ["Usa my_tool quando l'utente chiede di gestire todo."]

// ❌ Sbagliato - l'LLM non sa a cosa "this" si riferisca
promptGuidelines: ["Usa questo tool quando..."]
```

### 7. Usa `ctx.mode === "tui"` per feature TUI-only
```typescript
if (ctx.mode === "tui") {
  await ctx.ui.custom(...);
}
```

### 8. Non riusare oggetti catturati dopo session replacement
```typescript
// ❌ Unsafe
const oldSm = ctx.sessionManager;
await ctx.newSession({
  withSession: async (_ctx) => {
    oldSm.getSessionFile();  // Stale!
  },
});

// ✅ Safe
const kickoff = "Continue";
await ctx.newSession({
  withSession: async (ctx) => {
    await ctx.sendUserMessage(kickoff);
  },
});
```

### 9. Usa `CONFIG_DIR_NAME` invece di hardcodare `.pi`
```typescript
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
const projectConfigPath = join(ctx.cwd, CONFIG_DIR_NAME, "my-extension.json");
```

### 10. Segnala errori lanciando eccezioni, non restituendo valori
```typescript
// ✅ Corretto
async execute() {
  if (!isValid) throw new Error("Invalid input");
  return { content: [...], details: {} };
}

// ❌ Sbagliato - non imposta isError
async execute() {
  return { content: [...], details: {}, isError: true };  // Non funziona!
}
```
