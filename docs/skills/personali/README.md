# Skill personali — installate esplicitamente dall'utente

> Questa cartella documenta le skill **installate esplicitamente dall'utente**, indipendenti dai pacchetti npm. Al momento è **vuota** (nessuna skill personale installata).

A differenza delle skill in [`../da-pacchetti/`](../da-pacchetti/) (che arrivano automaticamente con i pacchetti via `pi.skills`), le skill personali le aggiungi tu, una per una, come `SKILL.md` standalone.

## Come aggiungere una skill personale

Una skill è una directory con un file `SKILL.md` (con frontmatter `name` + `description`). Secondo [`docs/skills.md`](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/skills.md) di pi, le sedi per skill utente sono diverse (tutte equivalenti per lo scopo di questa cartella):

| Scope | Percorso | Effetto |
| --- | --- | --- |
| **Globale pi** | `~/.pi/agent/skills/<nome>/SKILL.md` (anche `.md` singoli alla radice) | disponibile in tutti i progetti |
| **Globale `~/.agents`** | `~/.agents/skills/<nome>/SKILL.md` | disponibile in tutti i progetti (standard condiviso tra harness; solo subdir con `SKILL.md`) |
| **Progetto pi** | `<cwd>/.pi/skills/<nome>/SKILL.md` | disponibile solo in quel progetto (richiede progetto fidato) |
| **Progetto `~/.agents`** | `.agents/skills/<nome>/SKILL.md` in `cwd` o ancestor | disponibile nel progetto/ancestor |
| **Settings** | array `skills` in `settings.json` o `.pi/settings.json` | file/directory aggiuntivi |
| **CLI** | `--skill <path>` | per una singola esecuzione (additivo) |

> Inoltre ogni skill è richiamabile come comando `/skill:<nome>` (forza il caricamento).

Template minimo di `SKILL.md`:

```markdown
---
name: <nome-skill>
description: <quando usarla — l'agente la carica se il task corrisponde>
---

# <Nome Skill>

<istruzioni specializzate per l'agente>
```

Dopo aver creato la cartella, riavvia pi (o `/reload`) perché la skill venga caricata.

## Documentare una skill personale qui

Quando aggiungi una skill personale, crea in questa cartella un `<nome>.md` che segua il template delle 5 sezioni (vedi [`../_TEMPLATE-componente.md`](../../_TEMPLATE-componente.md)), indicando in "Riferimento ufficiale" il percorso `SKILL.md` e lo scope (globale/progetto).

### Convenzione di nomenclatura

- `da-pacchetti/` → skill **automatiche** (provenienti dai pacchetti npm).
- `personali/` → skill **esplicite** dell'utente (questa cartella).
