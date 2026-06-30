# Skill — panoramica e origine

> La cartella `docs/skills/` distingue due categorie di skill in base alla **provenienza**, non in base a un presunto stato "builtin" (pi core **non** porta skill proprie: tutte le skill arrivano dai pacchetti o dall'utente).

## Due categorie, due sottocartelle

| Sottocartella | Cosa contiene | Come arrivano | Stato attuale |
| --- | --- | --- | --- |
| [`da-pacchetti/`](da-pacchetti/) | skill fornite dai pacchetti npm | automatiche: il campo `pi.skills` del `package.json` del pacchetto le dichiara; pi le carica insieme all'estensione | 6 |
| [`personali/`](personali/) | skill installate esplicitamente dall'utente | skill custom in `~/.pi/agent/skills/<nome>/SKILL.md` (globale) o `<cwd>/.pi/skills/<nome>/SKILL.md` (progetto), oppure pacchetto skill dedicato | 0 |

> **Disinstallando il pacchetto padre, la skill in `da-pacchetti/` sparisce.** Le skill in `personali/` sono invece indipendenti dai pacchetti.

## Come arrivano le skill (in generale)

In pi, una skill è un set di istruzioni specializzate (un `SKILL.md`) che l'agente carica quando il task corrisponde alla sua descrizione. Le fonti possibili:

| Fonte | Dove risiede | Sottocartella docs |
| --- | --- | --- |
| **Pacchetto npm** | `node_modules/<pkg>/<pi.skills-path>/` | `da-pacchetti/` |
| **Skill globale custom** | `~/.pi/agent/skills/<nome>/SKILL.md` | `personali/` |
| **Skill di progetto** | `<cwd>/.pi/skills/<nome>/SKILL.md` | `personali/` |

## Mappa pacchetto → skill (categoria `da-pacchetti/`)

| Pacchetto (campo `pi.skills`) | Skill fornite |
| --- | --- |
| [`pi-web-access`](../pacchetti-npm/pi-web-access.md) (`pi.skills: ["./skills"]`) | [`librarian`](da-pacchetti/librarian.md) |
| [`pi-subagents`](../pacchetti-npm/pi-subagents.md) (`pi.skills: ["./skills"]`) | [`pi-subagents`](da-pacchetti/pi-subagents.md) |
| [`pi-lens`](../pacchetti-npm/pi-lens.md) (`pi.skills: ["../../skills"]`) | [`ast-grep`](da-pacchetti/ast-grep.md) · [`lsp-navigation`](da-pacchetti/lsp-navigation.md) · [`write-ast-grep-rule`](da-pacchetti/write-ast-grep-rule.md) · [`write-tree-sitter-rule`](da-pacchetti/write-tree-sitter-rule.md) |

## Installazione

- **Skill da pacchetto**: si installa il pacchetto padre (`pi install npm:pi-lens` ecc.); la skill si attiva automaticamente.
- **Skill personali**: vedi [`personali/README.md`](personali/README.md) per come aggiungerle (globale o di progetto).

Per verificarne la presenza a runtime: l'agente elenca le skill disponibili nel proprio contesto; ciascuna indica il `SKILL.md` di origine (dentro `node_modules/<pkg>/...` per `da-pacchetti/`, o sotto `~/.pi/agent/skills/` / `.pi/skills/` per `personali/`).
