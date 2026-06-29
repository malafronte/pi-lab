# `models.json` — provider e modelli custom

> File che definisce provider personalizzati (endpoint OpenAI-compatibili) e i relativi modelli, inclusi i modelli multimodali per la vision. Percorso: `~/.pi/agent/models.json`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| File | `~/.pi/agent/models.json` |
| Documentazione | <https://github.com/earendil-works/pi-coding-agent/blob/main/docs/models.md> |

## Installazione / creazione

Il file è opzionale: si crea solo per aggiungere provider/modelli non bundled. La struttura è `providers` → `<PROVIDER_ID>` → `models[]`.

## Configurazione

Esempio di provider custom con endpoint OpenAI-compatibile e un modello multimodale per la vision (**segnaposto semantici**):

```jsonc
// ~/.pi/agent/models.json  (SEGAPOSTO: nessun baseUrl/chiave reale)
{
  "providers": {
    "<PROVIDER_ID>": {
      "models": [
        {
          "id": "<MODEL_ID>",
          "name": "<Display Name>",
          "baseUrl": "https://<endpoint>/v1",
          "api": "openai-completions",
          "reasoning": true,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

Campi rilevanti:

| Campo | Significato |
| --- | --- |
| `providers.<ID>.baseUrl` | endpoint del provider (formato OpenAI completions). |
| `providers.<ID>.api` | tipo di API (es. `openai-completions`). |
| `models[].id` | identificatore modello (usato con `pi --model <id>`). |
| `models[].reasoning` | il modello supporta il reasoning/extended thinking. |
| `models[].input` | modalità di input: `["text"]` e/o `["image"]`. `["text","image"]` è **obbligatorio** per i modelli vision (vedi [`vision-tool.md`](vision-tool.md)). |
| `models[].compat.thinkingFormat` | formato del parametro di thinking per provider non-OpenAI (`qwen`, `deepseek`, `openrouter`, `together`, `qwen-chat-template`). |
| `models[].thinkingLevelMap` | mappa i livelli pi ai valori del provider (es. `"off": "none"`). |

La API key del provider va in `~/.pi/agent/auth.json` (NON qui):

```jsonc
// ~/.pi/agent/auth.json  (SEGAPOSTO)
{ "<PROVIDER_ID>": { "type": "api_key", "key": "<PROVIDER_API_KEY>" } }
```

## Uso

- imposta il modello di default in [`settings.json`](settings.md) (`defaultProvider`/`defaultModel`);
- oppure a runtime: `pi --model <PROVIDER_ID>/<MODEL_ID>`;
- per la vision, configura il modello in [`vision-tool.json`](vision-tool.md) via `/vision config`.

## Esempi

### Esempio 1 — provider OpenAI-compatibile non multimodale

```jsonc
{
  "providers": {
    "my-provider": {
      "baseUrl": "https://<endpoint>/v1",
      "api": "openai-completions",
      "models": [{ "id": "my-model", "reasoning": false, "input": ["text"] }]
    }
  }
}
```

### Esempio 2 — modello vision con `thinkingFormat` Qwen

```jsonc
{
  "providers": {
    "my-vision-provider": {
      "models": [{
        "id": "qwen3.5",
        "reasoning": true,
        "input": ["text", "image"],
        "compat": { "thinkingFormat": "qwen" }
      }]
    }
  }
}
```
