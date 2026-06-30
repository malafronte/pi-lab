# Skill personali — installate esplicitamente dall'utente

> Questa cartella documenta le skill **installate esplicitamente dall'utente**, indipendenti dai pacchetti npm. Al momento è **vuota** (nessuna skill personale installata).

A differenza delle skill in [`../da-pacchetti/`](../da-pacchetti/) (che arrivano automaticamente con i pacchetti via `pi.skills`), le skill personali le aggiungi tu, una per una, come `SKILL.md` standalone.

## Come aggiungere una skill personale

Una skill è una cartella con un file `SKILL.md` (con frontmatter `name` + `description`). Due scope possibili:

| Scope | Percorso | Effetto |
| --- | --- | --- |
| **Globale** | `~/.pi/agent/skills/<nome>/SKILL.md` | disponibile in tutti i progetti |
| **Progetto** | `<cwd>/.pi/skills/<nome>/SKILL.md` | disponibile solo in quel progetto |

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
