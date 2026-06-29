# @gotgenes/pi-nocd — inietta il divieto di `cd`-prefissare la CWD

> Estensione pi che aggiunge al system prompt un'istruzione che vieta all'agente di prefissare i comandi con `cd <path> &&` o `cd $(pwd) &&`. Pi comunica già la CWD risolta nel footer del system prompt, ma non include alcuna *istruzione* contro il prefisso `cd`: questa estensione aggiunge il divieto mancante.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `@gotgenes/pi-nocd` |
| Repository | <https://github.com/gotgenes/pi-packages> (sottocartella `packages/pi-nocd`) |
| Documentazione | <https://github.com/gotgenes/pi-packages/tree/main/packages/pi-nocd#readme> |
| Licenza | MIT |

## Installazione

```bash
pi install npm:@gotgenes/pi-nocd
```

Oppure aggiungilo a `~/.pi/agent/settings.json`:

```jsonc
{ "packages": ["npm:@gotgenes/pi-nocd"] }
```

## Configurazione

Nessuna configurazione richiesta: funziona appena installato. Non espone tool né comandi slash; opera via hook `before_agent_start`.

## Uso

Aggancia `before_agent_start` e appende al system prompt un blocco `# Working Directory` che nomina la CWD risolta (`ctx.cwd`) e vieta entrambe le forme di `cd`-prefisso. L'append è **idempotente**: se un blocco `# Working Directory` è già presente, il prompt resta invariato.

Per una sessione la cui CWD risolve a `/Users/you/project`, il blocco iniettato è:

```markdown
# Working Directory

Shell commands already execute in `/Users/you/project`.
Never prefix a command with `cd` into the current working directory — neither `cd /Users/you/project &&` nor `cd $(pwd) &&`.
Just run the command directly.
```

## Esempi

### Esempio 1 — senza pi-nocd (comportamento di default)

L'agente produce spesso:

```bash
cd /Users/you/project && npm test
```

### Esempio 2 — con pi-nocd

L'agente esegue direttamente (perché il system prompt glielo vieta esplicitamente):

```bash
npm test
```

## Perché

Il footer `Current working directory: <path>` di pi è una mera constatazione, non una regola: l'abitudine di prefissare con `cd $(pwd) &&` sopravvive. pi-nocd colma il vuoto con un divieto esplicito. Complementare a `@gotgenes/pi-anthropic-auth` (che riscrive solo il preamble e preserva il footer).

Per la valutazione d'uso vedi [`docs/approfondimenti/gotgenes-packages-guida.md`](../approfondimenti/gotgenes-packages-guida.md).
