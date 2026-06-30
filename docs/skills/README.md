# Skill — panoramica e origine

> La cartella `docs/skills/` distingue due categorie di skill in base alla **provenienza**, non in base a un presunto stato "builtin".
>
> **Precisazione importante (corregge una versione precedente di questo documento):** pi core **ha un sistema di skill completo** — implementa lo [standard Agent Skills](https://agentskills.io/specification) e carica le skill da diverse fonti (vedi tabella sotto). Tuttavia pi **non distribuisce skill preinstallate** nel proprio pacchetto core: le 6 skill attualmente attive in questa configurazione provengono **tutte dai pacchetti npm** (`pi-web-access`, `pi-subagents`, `pi-lens`). Il termine "builtin" è quindi impreciso: il _meccanismo_ di caricamento è di pi core, ma le _skill_ specifiche arrivano dai pacchetti o dall'utente. Riferimento ufficiale: [`docs/skills.md`](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/skills.md) di pi.

## Due categorie, due sottocartelle

| Sottocartella | Cosa contiene | Come arrivano | Stato attuale |
| --- | --- | --- | --- |
| [`da-pacchetti/`](da-pacchetti/) | skill fornite dai pacchetti npm | automatiche: il campo `pi.skills` del `package.json` del pacchetto le dichiara; pi le carica insieme all'estensione | 6 |
| [`personali/`](personali/) | skill installate esplicitamente dall'utente | skill custom in `~/.pi/agent/skills/<nome>/SKILL.md` (globale) o `<cwd>/.pi/skills/<nome>/SKILL.md` (progetto), oppure pacchetto skill dedicato | 0 |

> **Disinstallando il pacchetto padre, la skill in `da-pacchetti/` sparisce.** Le skill in `personali/` sono invece indipendenti dai pacchetti.

## Come arrivano le skill (in generale)

In pi, una skill è un set di istruzioni specializzate (un `SKILL.md`) che l'agente carica quando il task corrisponde alla sua descrizione. Pi carica le skill dalle seguenti fonti (verificate su [`docs/skills.md`](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/skills.md) di pi core):

| Fonte | Dove risiede | Sottocartella docs |
| --- | --- | --- |
| **Pacchetto npm** (via `pi.skills` del `package.json` o dir `skills/` del pacchetto) | `node_modules/<pkg>/<pi.skills-path>/` | `da-pacchetti/` |
| **Skill globale pi** | `~/.pi/agent/skills/<nome>/SKILL.md` (dir o `.md` singoli alla radice) | `personali/` |
| **Skill globale `~/.agents`** (standard condiviso tra harness) | `~/.agents/skills/<nome>/SKILL.md` (solo subdir con `SKILL.md`) | `personali/` |
| **Skill di progetto pi** | `<cwd>/.pi/skills/<nome>/SKILL.md` (richiede progetto fidato) | `personali/` |
| **Skill di progetto `~/.agents`** | `.agents/skills/` in `cwd` e directory ancestor (fino alla root del repo/git) | `personali/` |
| **Settings `skills`** | array `skills` con file/directory in `settings.json` | `personali/` |
| **CLI** | `--skill <path>` (additivo, anche con `--no-skills`) | `personali/` |

Le skill si registrano anche come comandi `/skill:<nome>` (forzano il caricamento). In questa configurazione **tutte le 6 skill attive provengono dalla prima fonte** (pacchetti npm): `~/.pi/agent/skills/` non esiste, quindi nessuna skill è installata separatamente dall'utente.

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
