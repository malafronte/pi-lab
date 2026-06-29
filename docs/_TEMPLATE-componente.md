# [Nome componente] — [breve descrizione]

> [1 riga: cosa è e a quale categoria appartiene. Es.: "Estensione pi che aggiunge il tool `describe_image`, delegando l'analisi delle immagini a un modello vision-capable."]

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Pacchetto npm | `<nome-pacchetto>` |
| Repository | `https://github.com/<autore>/<repo>` |
| Documentazione | `<link pi.dev o README ufficiale>` |
| Licenza | `<licenza>` |

## Installazione

Partendo da un pi appena installato, aggiungi il pacchetto alla configurazione globale e installalo:

```bash
# 1) aggiungi alla lista packages in ~/.pi/agent/settings.json (sezione "packages")
# 2) installa le dipendenze nella directory npm di pi
cd ~/.pi/agent/npm
npm install <nome-pacchetto>
```

> **Segnaposto:** i path fanno riferimento a `~/.pi/agent/...` (directory utente di pi). Sostituisci con il tuo percorso reale se diverso.

## Configurazione

[Eventuale file di config con SEGAPOSTO SEMANTICI. Nessun segreto, nessun path specifico dell'installazione reale.]

```jsonc
// ~/.pi/agent/<file-di-config>.json
{
  "<CHIAVE>": "<SEGNAPOSTO_VALORE>"
}
```

Se il componente non richiede file di configurazione, scrivi: _"Nessuna configurazione richiesta: funziona appena installato."_

## Uso

[Istruzioni dettagliate: comandi slash, tool esposti, flag/opzioni principali, comportamento.]

```text
/<comando> <argomenti>
```

## Esempi

[Casi d'uso concreti, verificati contro la documentazione ufficiale o il codice installato. Niente scenari inventati.]

### Esempio 1 — [titolo]

```text
[comando/input]
```

```text
[output atteso / comportamento]
```

### Esempio 2 — [titolo]

[...]
