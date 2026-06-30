# Skill — panoramica e origine

> Le 6 skill documentate qui **non sono installate separatamente**: derivano **automaticamente dai pacchetti** installati. Ogni pacchetto può dichiarare le proprie skill nel campo `pi.skills` del proprio `package.json`; pi le carica insieme all'estensione quando il pacchetto è attivo.

## Come arrivano queste skill

In pi, una skill è un set di istruzioni specializzate (un `SKILL.md`) che l'agente carica quando il task corrisponde alla sua descrizione. Una skill può provenire da tre fonti:

| Fonte | Dove risiede | Come si attiva |
| --- | --- | --- |
| **Pacchetto npm** (caso attuale) | `node_modules/<pkg>/<pi.skills-path>/` | automatica: il campo `pi.skills` del `package.json` del pacchetto la dichiara |
| **Skill globale custom** | `~/.pi/agent/skills/<nome>/SKILL.md` | caricata da pi all'avvio |
| **Skill di progetto** | `<cwd>/.pi/skills/<nome>/SKILL.md` | caricata da pi per quel progetto |

**Nella configurazione attuale tutte le 6 skill provengono dalla prima fonte** (pacchetti npm): `~/.pi/agent/skills/` è vuoto, quindi nessuna skill è installata separatamente. Disinstallando il pacchetto padre, la skill sparisce.

## Mappa pacchetto → skill

| Pacchetto (campo `pi.skills`) | Skill fornite |
| --- | --- |
| [`pi-web-access`](../pacchetti-npm/pi-web-access.md) (`pi.skills: ["./skills"]`) | [`librarian`](librarian.md) |
| [`pi-subagents`](../pacchetti-npm/pi-subagents.md) (`pi.skills: ["./skills"]`) | [`pi-subagents`](pi-subagents.md) |
| [`pi-lens`](../pacchetti-npm/pi-lens.md) (`pi.skills: ["../../skills"]`) | [`ast-grep`](ast-grep.md) · [`lsp-navigation`](lsp-navigation.md) · [`write-ast-grep-rule`](write-ast-grep-rule.md) · [`write-tree-sitter-rule`](write-tree-sitter-rule.md) |

## Installazione (delle skill)

Queste skill **non si installano da sole**: per attivarle si installa il **pacchetto padre**:

```bash
pi install npm:pi-web-access      # attiva librarian
pi install npm:pi-subagents       # attiva pi-subagents
pi install npm:pi-lens            # attiva ast-grep, lsp-navigation, write-ast-grep-rule, write-tree-sitter-rule
```

Per verificarne la presenza a runtime: l'agente elenca le skill disponibili nel proprio contesto; ciascuna indica il `SKILL.md` di origine (dentro `node_modules/<pkg>/...`).

## Aggiungere skill nuove (future)

Per aggiungere skill non fornite dai pacchetti attuali, si può:

- **creare una skill custom globale** in `~/.pi/agent/skills/<nome>/SKILL.md`;
- **creare una skill di progetto** in `<cwd>/.pi/skills/<nome>/SKILL.md`;
- **pubblicare/installare un pacchetto npm** che le dichiari via `pi.skills`.

Queste skill "esterne" vanno documentate qui come nuove voci, distinte da quelle "fornite dai pacchetti".

## Elenco delle skill attuali

| Skill | Pacchetto padre | Quando usarla |
| --- | --- | --- |
| [`librarian.md`](librarian.md) | pi-web-access | ricerca librerie open-source con citazioni e permalink GitHub |
| [`pi-subagents.md`](pi-subagents.md) | pi-subagents | delegare lavoro a sub-agent (chain, parallel, async, fork) |
| [`ast-grep.md`](ast-grep.md) | pi-lens | search/replace di codice AST-aware |
| [`lsp-navigation.md`](lsp-navigation.md) | pi-lens | navigazione e diagnostica LSP |
| [`write-ast-grep-rule.md`](write-ast-grep-rule.md) | pi-lens | scrivere regole ast-grep per pi-lens |
| [`write-tree-sitter-rule.md`](write-tree-sitter-rule.md) | pi-lens | scrivere regole tree-sitter per pi-lens |
