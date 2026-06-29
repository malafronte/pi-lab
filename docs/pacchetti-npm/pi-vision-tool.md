# pi-vision-tool — `describe_image` per modelli non multimodali

> Estensione pi che aggiunge il tool `describe_image`, consentendo ai modelli **non multimodali** (senza supporto nativo alle immagini) di delegare l'analisi delle immagini a un modello vision-capable (es. Qwen VL).

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `pi-vision-tool` |
| Repository | <https://github.com/xezpeleta/pi-vision-tool> |
| Documentazione | <https://github.com/xezpeleta/pi-vision-tool#readme> |
| Licenza | MIT |

## Installazione

```bash
# via npm (metodo primario, come da pi.dev/packages)
pi install npm:pi-vision-tool

# via git
pi install git:github.com/xezpeleta/pi-vision-tool

# via path locale
pi install /path/to/pi-vision-tool

# test rapido senza installare
pi -e /path/to/pi-vision-tool
```

## Configurazione

### 1. Aggiungere un modello vision a `~/.pi/agent/models.json`

Il campo `input: ["text","image"]` è **obbligatorio**: dice a pi che il modello supporta le immagini.

```jsonc
// ~/.pi/agent/models.json
{
  "providers": {
    "<VISION_PROVIDER>": {
      "baseUrl": "https://<endpoint>/v1",
      "apiKey": "$<VISION_API_KEY>",          // riferimento a variabile d'ambiente
      "api": "openai-completions",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "<VISION_MODEL>",
          "reasoning": true,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

Per modelli non-OpenAI (Qwen, llama.cpp, DeepSeek, ecc.) imposta `compat.thinkingFormat`, altrimenti il tool invia `reasoning_effort` (formato OpenAI) che il provider può rifiutare:

| `thinkingFormat` | Parametro inviato | Caso d'uso |
| --- | --- | --- |
| (default) | `reasoning_effort` | OpenAI / proxy OpenAI-compatibile |
| `qwen` | `enable_thinking` | Qwen via llama.cpp/vLLM/Ollama |
| `qwen-chat-template` | `chat_template_kwargs.enable_thinking` | llama-server con chat template Qwen |
| `deepseek` | `reasoning: { effort }` | DeepSeek API |
| `openrouter` | `reasoning: { effort }` | OpenRouter |
| `together` | `reasoning: { enabled: boolean }` + `reasoning_effort` | Together AI |

### 2. Impostare la API key in `~/.pi/agent/auth.json`

```jsonc
// ~/.pi/agent/auth.json  (SEGAPOSTO: non usare chiavi reali)
{
  "<VISION_PROVIDER>": {
    "type": "api_key",
    "key": "<VISION_API_KEY>"
  }
}
```

### 3. Configurare il modello vision (persistente)

In una sessione pi con l'estensione caricata:

```text
/vision config provider <VISION_PROVIDER>
/vision config model <VISION_MODEL>
```

Le impostazioni si salvano in `~/.pi/agent/vision-tool.json` e persistono tra sessioni (effetto immediato, senza `/reload`).

```jsonc
// ~/.pi/agent/vision-tool.json  (esempio con segnaposto)
{
  "provider": "<VISION_PROVIDER>",
  "model": "<VISION_MODEL>",
  "maxDimension": 1568,
  "jpegQuality": 85,
  "defaultReasoningEffort": "high",
  "enabled": false
}
```

Abilita/disabilita: `/vision on` · `/vision off`. `/vision` senza argomenti mostra la config corrente. Variabili d'ambiente legacy: `PI_VISION_PROVIDER`, `PI_VISION_MODEL`, `PI_VISION_REASONING_EFFORT`, `PI_VISION_MAX_DIM`, `PI_VISION_JPEG_QUALITY` (il file di config ha priorità sulle env-var).

### 4. (Opzionale) `sharp` per la compressione

```bash
npm install sharp
```

Con `sharp` disponibile le immagini vengono compresse automaticamente (max 1568px, alpha rimosso, PNG → JPEG q85, ~4× più leggere); senza, vengono inviate raw.

## Uso

Una volta installato, qualsiasi modello vede il tool `describe_image`. Il modello chiamante controlla ogni chiamata:

| Parametro | Cosa controlla |
| --- | --- |
| `image_path` | sorgente: file path, data URL o base64 grezzo (>100 char) |
| `prompt` | istruzione free-text ("describe", "extract text", "find the bug"…) |
| `compress` | `true` (veloce/generale) · `false` (accuratezza pixel-perfect) |
| `reasoning` | `off`/`minimal`/`low`/`medium`/`high`/`xhigh` (solo modelli con `reasoning: true`) |

Formati immagine supportati: PNG, JPEG, GIF, WebP, BMP.

## Esempi

### Esempio 1 — descrizione di uno screenshot

```json
{ "image_path": "/tmp/screenshot.png", "prompt": "Describe everything visible in this screenshot", "compress": true }
```

### Esempio 2 — estrazione testo strutturata

```json
{ "image_path": "/tmp/ui.png", "prompt": "Read all visible text, preserving structure", "compress": true }
```

### Esempio 3 — analisi complessa con reasoning alto

```json
{ "image_path": "/tmp/architecture.png", "prompt": "Analyze this system architecture diagram in detail", "compress": true, "reasoning": "high" }
```

### Esempio 4 — coordinate pixel (usa `compress: false`)

```json
{ "image_path": "/tmp/toolbar.png", "prompt": "Give [x,y,w,h] bounding boxes for all buttons", "compress": false }
```
