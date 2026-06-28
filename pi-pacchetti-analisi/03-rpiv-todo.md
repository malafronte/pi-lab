# Analisi: @juicesharp/rpiv-todo

**Pacchetto:** `@juicesharp/rpiv-todo` · **Versione:** 1.20.0 (103 release, molto attivo) · **Autore:** juicesharp · **Licenza:** MIT · **Repo:** `github.com/juicesharp/rpiv-mono`

> Una todo list per il modello, renderizzata come overlay live sopra l'editor, che **sopravvive a `/reload` e alla compaction**.

## A cosa serve

Dà all'agente uno strumento persistente per tenere una **todo list** durante task lunghi. Il punto forte: i task **sopravvivono a `/reload` e alla compaction del contesto** perché sono replayati dalla conversazione (branch), non da disco. Così il modello "riprende da dove aveva lasciato" anche dopo un reload o un context compattato.

## Feature

- **Overlay live sopra l'editor**: vedi sempre il piano del modello; i task completati restano visibili fino alla prossima risposta, poi cadono; auto-hide quando vuoto
- **Sopravvive `/reload` e compaction**: replay dal branch di conversazione
- **Stati**: `pending` → `in_progress` → `completed`, più tombstone `deleted` per audit
- **Dipendenze tra task**: `blockedBy` con **cycle detection** (il modello può sequenziare il lavoro senza loop)
- **Smart truncation**: collasso a 12 righe; i completati cadono per primi, i pending restano visibili

## Comandi e tool

**Comando slash:** `/todos` — mostra la todo list

**Tool per l'LLM:** `todo({ action, ... })`
- `action`: `create` | `update` | `list` | `get` | `delete` | `clear`
- Macchina a 4 stati + tombstone
- Supporto `blockedBy` con cycle detection

## Installazione

```bash
pi install npm:@juicesharp/rpiv-todo
```
Dipendenze: `@juicesharp/rpiv-config` (runtime), peer `@juicesharp/rpiv-i18n` (opzionale, per localizzazione).

### Localizzazione opzionale
Funziona standalone (UI inglese). Per localizzare (heading overlay, header `/todos`, stati nella tua lingua):
```bash
pi install npm:@juicesharp/rpiv-i18n
```
Locale risolta da: `--locale <code>` → `~/.config/rpiv-i18n/locale.json` → `LANG`/`LC_ALL` → English.

## ✅ Sicurezza (ottima)

- **Nessun `child_process`/exec**, **nessun server locale**, **nessuna URL esterna** (solo link github/opensource nei commenti doc)
- Molto piccolo (67KB scompattato), codice `.ts` leggibile
- Il più pulito dei sette analizzati dal punto di vista superficie di attacco

## Pro

- ✅ Todo list persistente che sopravvive a reload/compaction (vero differentiator)
- ✅ Dependency tracking con cycle detection
- ✅ Overlay UI live, non invadente (auto-hide)
- ✅ **Sicurezza eccellente** (nessuna superficie rete/exec)
- ✅ Codice leggibile e leggero
- ✅ Molto attivo (103 release), i18n opzionale

## Contro

- ❌ **Conflitto di comando `/todos`** con la nostra estensione plan-mode locale (che registra anch'essa `/todos`) → se installati insieme diventano `/todos:1` e `/todos:2`. Vedi documento raccomandazioni.
- ❌ Dipende dal mono-repo juicesharp (`rpiv-config` runtime, `rpiv-i18n` opzionale) — sebbene minimo
- ❌ Concettualmente ridondante con il todo-tracking del plan-mode (nostra o 2008muyu): scegli un solo modo di tracciare i task

## Compatibilità

- pi 0.79.10: ✅ compatibile (peer `*`)
- ⚠️ **Conflitto `/todos`** con la nostra `.pi/extensions/plan-mode` locale

## Quando usarlo

**Sì** se: vuoi un todo-tracker dedicato, persistente, pulito, con dependency tracking — separato dal plan-mode.
**No** se: già usi un plan-mode con todo-tracking (nostra o 2008muyu) → ridondanza + conflitto `/todos`.
