# `vision-tool.json` — configurazione del tool `describe_image`

> File di configurazione di `pi-vision-tool`: specifica provider/modello vision, compressione immagine e reasoning di default. Percorso: `~/.pi/agent/vision-tool.json`. Si popola preferibilmente via comando `/vision config`.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| File | `~/.pi/agent/vision-tool.json` |
| Pacchetto | `pi-vision-tool` (<https://github.com/xezpeleta/pi-vision-tool>) |
| Documentazione | <https://github.com/xezpeleta/pi-vision-tool#readme> |

## Installazione / creazione

Il file è creato/aggiornato dal comando `/vision config provider` e `/vision config model`. Lo si può anche editare a mano.

## Configurazione

Esempio con **segnaposto semantici**:

```jsonc
// ~/.pi/agent/vision-tool.json  (SEGAPOSTO)
{
  "provider": "<VISION_PROVIDER>",          // provider id definito in models.json
  "model": "<VISION_MODEL>",                // modello multimodale (input: text,image)
  "maxDimension": 1568,                      // max larghezza/altezza prima del downscale (con sharp)
  "jpegQuality": 85,                        // qualità JPEG (1-100) per immagini compresse
  "defaultReasoningEffort": "high",         // off|minimal|low|medium|high|xhigh
  "enabled": false                          // tool describe_image abilitato o meno
}
```

Il file ha priorità sulle variabili d'ambiente legacy (`PI_VISION_PROVIDER`, `PI_VISION_MODEL`, `PI_VISION_REASONING_EFFORT`, `PI_VISION_MAX_DIM`, `PI_VISION_JPEG_QUALITY`).

## Uso

```text
/vision config provider <VISION_PROVIDER>   # imposta il provider (persistente)
/vision config model <VISION_MODEL>         # imposta il modello (persistente)
/vision on                                  # abilita describe_image
/vision off                                 # disabilita (👁 scompare dal footer)
/vision                                     # mostra la config corrente
```

Le modifiche hanno effetto immediato (nessun `/reload`). Per il modello multimodale e la API key, vedi [`models.md`](models.md).

## Esempi

### Esempio 1 — configurazione minima via comandi

```text
/vision config provider my-vision-provider
/vision config model qwen3.5
/vision on
```

### Esempio 2 — disabilitare temporaneamente

```text
/vision off
```

### Esempio 3 — impostare il reasoning di default via env

```bash
export PI_VISION_REASONING_EFFORT=medium
```

Vedi [`docs/pacchetti-npm/pi-vision-tool.md`](../pacchetti-npm/pi-vision-tool.md) per il dettaglio del tool `describe_image`.
