# Indice della Documentazione

> Questo repo trasforma un'installazione **base di pi** in una configurazione **avanzata e personalizzata**. La documentazione parte da un pi appena installato e descrive, componente per componente, ogni parte aggiunta (pacchetto da pi.dev/npm o generata localmente), con riferimento ufficiale, installazione, configurazione, uso ed esempi.
>
> Ogni voce segue lo stesso template (vedi [`_TEMPLATE-componente.md`](_TEMPLATE-componente.md)): **Riferimento ufficiale · Installazione · Configurazione · Uso · Esempi**.

---

## 1. Partenza — pi base e ambiente

| Documento | Contenuto | Fonte riutilizzata |
| --- | --- | --- |
| [`getting-started/00-pi-base.md`](getting-started/00-pi-base.md) | Cos'è pi appena installato, dove vivono i file di config, come si attiva un'estensione/pacchetto | nuovo (basato su docs ufficiali pi) |
| [`getting-started/01-ambiente-tui.md`](getting-started/01-ambiente-tui.md) | Ambiente di esecuzione, interazione TUI, accesso a internet, risoluzione shell | `pi-ambiente-guida.md` |
| [`getting-started/02-variabili-editor.md`](getting-started/02-variabili-editor.md) | Variabili `$VISUAL`/`$EDITOR` | `guida-variabili-editor.md` |

## 2. Configurazione globale

| Documento | File di config | Contenuto |
| --- | --- | --- |
| [`config/settings.md`](config/settings.md) | `~/.pi/agent/settings.json` | `packages`, `theme`, `defaultProvider`/`defaultModel`, `thinking` |
| [`config/models.md`](config/models.md) | `~/.pi/agent/models.json` | Provider custom (endpoint OpenAI-compatibile) e modello per la vision |
| [`config/vision-tool.md`](config/vision-tool.md) | `~/.pi/agent/vision-tool.json` | Provider/modello/dimensione/qualità per `describe_image` |
| [`config/permission-system.md`](config/permission-system.md) | `~/.pi/agent/extensions/pi-permission-system/config.json` | Regole `permission`, `path`, `bash`, `external_directory` |
| [`config/mcp-onboarding.md`](config/mcp-onboarding.md) | `~/.pi/agent/mcp-onboarding.json` | Onboarding e discovery dei server MCP |

## 3. Pacchetti (estensioni/skill da pi.dev e npm)

> Approccio: ogni pacchetto è un'estensione pi installabile. Per ognuno: riferimento npm/GitHub, installazione, config, uso, esempi.

| # | Pacchetto | Autore / Repo | Categoria |
| --- | --- | --- | --- |
| 01 | [`packages/pi-mcp-adapter.md`](pacchetti-npm/pi-mcp-adapter.md) | nicobailon/pi-mcp-adapter | MCP |
| 02 | [`packages/pi-lens.md`](pacchetti-npm/pi-lens.md) | apmantza/pi-lens | Code intelligence |
| 03 | [`packages/pi-web-access.md`](pacchetti-npm/pi-web-access.md) | nicobailon/pi-web-access | Web access |
| 04 | [`packages/pi-studio.md`](pacchetti-npm/pi-studio.md) | omaclaren/pi-studio | Workspace/REPL |
| 05 | [`packages/pi-agent-browser-native.md`](pacchetti-npm/pi-agent-browser-native.md) | fitchmultz/pi-agent-browser-native | Browser automation |
| 06 | [`packages/pi-vision-tool.md`](pacchetti-npm/pi-vision-tool.md) | xezpeleta/pi-vision-tool | Multimodale |
| 07 | [`packages/pi-codex-goal.md`](pacchetti-npm/pi-codex-goal.md) | fitchmultz/pi-codex-goal | Goal tracking |
| 08 | [`packages/pi-subagents.md`](pacchetti-npm/pi-subagents.md) | nicobailon/pi-subagents | Sub-agent |
| 09 | [`packages/pi-questionnaire.md`](pacchetti-npm/pi-questionnaire.md) | clankercode/pi-questionnaire | TUI/interazione |
| 10 | [`packages/pi-permission-system.md`](pacchetti-npm/pi-permission-system.md) | gotgenes/pi-packages | Sicurezza |
| 11 | [`packages/pi-nocd.md`](pacchetti-npm/pi-nocd.md) | gotgenes/pi-packages | System prompt |
| 12 | [`packages/pi-session-tools.md`](pacchetti-npm/pi-session-tools.md) | gotgenes/pi-packages | Sessioni |
| 13 | [`packages/pi-github-tools.md`](pacchetti-npm/pi-github-tools.md) | gotgenes/pi-packages | GitHub CI/release |
| 14 | [`packages/pi-plan-mode.md`](pacchetti-npm/pi-plan-mode.md) | narumiruna/pi-extensions | Plan mode |
| 15 | [`packages/pi-themes.md`](pacchetti-npm/pi-themes.md) | spences10/my-pi | Temi |
| — | [`packages/_gotgenes-monorepo.md`](pacchetti-npm/_gotgenes-monorepo.md) | gotgenes/pi-packages | Panoramica monorepo gotgenes |

## 4. Estensioni locali

Estensioni installate come **directory di codice** (non solo pacchetto npm elencato), con file di config locale.

| Documento | Scope | Comando/effetto |
| --- | --- | --- |
| [`estensioni-locali/pi-fixmd.md`](estensioni-locali/pi-fixmd.md) | progetto (`.pi/extensions/`) | comando `/fixmd` (usa `scripts/fix-markdown.cjs`) |

> **`@gotgenes/pi-permission-system`** è installato sia come pacchetto npm **sia** come estensione globale con `config.json` custom. Le due facce sono documentate **in una sola pagina** con sezioni distinte (canale npm + installazione globale + config): [`pacchetti-npm/pi-permission-system.md`](pacchetti-npm/pi-permission-system.md). Vedi anche [`config/permission-system.md`](config/permission-system.md) per il riferimento del file di policy.

## 5. Skill

Le skill si dividono per **provenienza** in due sottocartelle (vedi [`skills/README.md`](skills/README.md) per la panoramica):

- **[`skills/da-pacchetti/`](skills/da-pacchetti/)** — 6 skill **automatiche**, fornite dai pacchetti tramite il campo `pi.skills` (non installate separatamente). Derivano da 3 pacchetti: `pi-web-access`→librarian, `pi-subagents`→pi-subagents, `pi-lens`→le altre 4.
- **[`skills/personali/`](skills/personali/)** — skill **installate esplicitamente dall'utente** (custom, indipendenti dai pacchetti). Al momento vuota.

| Skill | Categoria | Provenienza | Quando usarla |
| --- | --- | --- | --- |
| [`skills/da-pacchetti/librarian.md`](skills/da-pacchetti/librarian.md) | da pacchetto | pi-web-access | ricerca librerie open-source con citazioni |
| [`skills/da-pacchetti/pi-subagents.md`](skills/da-pacchetti/pi-subagents.md) | da pacchetto | pi-subagents | delegare lavoro a sub-agent |
| [`skills/da-pacchetti/ast-grep.md`](skills/da-pacchetti/ast-grep.md) | da pacchetto | pi-lens | ricerca/sostituzione AST-aware |
| [`skills/da-pacchetti/lsp-navigation.md`](skills/da-pacchetti/lsp-navigation.md) | da pacchetto | pi-lens | navigazione e diagnostica LSP |
| [`skills/da-pacchetti/write-ast-grep-rule.md`](skills/da-pacchetti/write-ast-grep-rule.md) | da pacchetto | pi-lens | scrivere regole ast-grep |
| [`skills/da-pacchetti/write-tree-sitter-rule.md`](skills/da-pacchetti/write-tree-sitter-rule.md) | da pacchetto | pi-lens | scrivere regole tree-sitter |

## 6. MCP — server e proxy

| Documento | Contenuto | Fonte riutilizzata |
| --- | --- | --- |
| [`mcp/mcp-guida.md`](mcp/mcp-guida.md) | Riferimento completo MCP in pi (installazione, comandi, opzioni server) | `pi-mcp-guida.md` |
| [`mcp/stitch-proxy.md`](mcp/stitch-proxy.md) | Proxy locale per Google Stitch (workaround `$ref`) | `pi-stitch-proxy-guida.md` |
| [`mcp/mcp-audit.md`](mcp/mcp-audit.md) | Audit di sicurezza statico di `pi-mcp-adapter` | `pi-mcp-audit.md` |

## 7. Componenti locali

| Documento | Percorso | Contenuto |
| --- | --- | --- |
| [`components-locali/stitch-proxy.md`](components-locali/stitch-proxy.md) | `.pi/stitch-proxy/` | `stitch-proxy.mjs` + `start-pi.ps1` |
| [`components-locali/scripts.md`](components-locali/scripts.md) | `scripts/` | `count-by-ext.cjs`, `fix-markdown.cjs`, `parse-perm-log.cjs`, `inspect-packages.cjs` |

## 8. Approfondimenti e analisi (valore documentale)

| Documento | Contenuto | Fonte riutilizzata |
| --- | --- | --- |
| [`approfondimenti/extensions-guide.md`](approfondimenti/extensions-guide.md) | Guida generale alle estensioni di pi | `pi-extensions-guide.md` |
| [`approfondimenti/pacchetti-top-scaricati.md`](approfondimenti/pacchetti-top-scaricati.md) | Top 13 pacchetti più scaricati da pi.dev | `pi-packages-guide.md` |
| [`approfondimenti/gotgenes-packages-guida.md`](approfondimenti/gotgenes-packages-guida.md) | Valutazione degli 8 pacchetti del monorepo gotgenes | `pi-gotgenes-packages-guida.md` |
| [`approfondimenti/subagents-tutorial.md`](approfondimenti/subagents-tutorial.md) | Tutorial sub-agent + worktrees | `pi-subagents-tutorial.md` |
| [`approfondimenti/subagents-nicobailon-guida.md`](approfondimenti/subagents-nicobailon-guida.md) | Guida pi-subagents (nicobailon) | `pi-subagents-nicobailon-guida.md` |
| [`approfondimenti/subagents-confronto.md`](approfondimenti/subagents-confronto.md) | Confronto pi-subagents vs gotgenes | `pi-subagents-confronto.md` |
| [`approfondimenti/plan-mode-narumitw.md`](approfondimenti/plan-mode-narumitw.md) | Guida operativa @narumitw/pi-plan-mode | `pi-plan-mode-narumitw.md` |
| [`approfondimenti/plan-mode-confronto.md`](approfondimenti/plan-mode-confronto.md) | Confronto a tre estensioni plan mode | `pi-plan-mode-confronto.md` |
| [`approfondimenti/pacchetti-analisi/00-raccomandazioni.md`](approfondimenti/pacchetti-analisi/00-raccomandazioni.md) | Raccomandazioni e profili di configurazione (7 pacchetti) | `pi-pacchetti-analisi/00-raccomandazioni.md` |
| [`approfondimenti/pacchetti-analisi/01-pi-lens.md`](approfondimenti/pacchetti-analisi/01-pi-lens.md) | Analisi di pi-lens | `pi-pacchetti-analisi/01-pi-lens.md` |
| [`approfondimenti/pacchetti-analisi/02-pi-web-access.md`](approfondimenti/pacchetti-analisi/02-pi-web-access.md) | Analisi di pi-web-access | `pi-pacchetti-analisi/02-pi-web-access.md` |
| [`approfondimenti/pacchetti-analisi/03-rpiv-todo.md`](approfondimenti/pacchetti-analisi/03-rpiv-todo.md) | Analisi di @juicesharp/rpiv-todo | `pi-pacchetti-analisi/03-rpiv-todo.md` |
| [`approfondimenti/pacchetti-analisi/04-pi-studio.md`](approfondimenti/pacchetti-analisi/04-pi-studio.md) | Analisi di pi-studio | `pi-pacchetti-analisi/04-pi-studio.md` |
| [`approfondimenti/pacchetti-analisi/05-pi-powerline-footer.md`](approfondimenti/pacchetti-analisi/05-pi-powerline-footer.md) | Analisi di pi-powerline-footer | `pi-pacchetti-analisi/05-pi-powerline-footer.md` |
| [`approfondimenti/pacchetti-analisi/06-pi-mono-status-line.md`](approfondimenti/pacchetti-analisi/06-pi-mono-status-line.md) | Analisi di pi-mono-status-line | `pi-pacchetti-analisi/06-pi-mono-status-line.md` |
| [`approfondimenti/pacchetti-analisi/07-pi-themes.md`](approfondimenti/pacchetti-analisi/07-pi-themes.md) | Analisi di @spences10/pi-themes | `pi-pacchetti-analisi/07-pi-themes.md` |
| [`approfondimenti/handoff-subagents-test.md`](approfondimenti/handoff-subagents-test.md) | Handoff di una sessione di test subagents (archiviato) | `HANDOFF-subagents-test.md` |

---
