# Skill: write-ast-grep-rule — scrivere regole ast-grep per pi-lens

> Skill (derivata da `pi-lens`) per scrivere un nuovo file YAML di regola ast-grep per pi-lens: copre schema, drop path, gotchas e vincoli del runner NAPI.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `write-ast-grep-rule` |
| Pacchetto padre | `pi-lens` (<https://github.com/apmantza/pi-lens>) |
| File skill | `skills/write-ast-grep-rule/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-lens
```

## Configurazione

**Drop path** (progetto): `rules/ast-grep-rules/rules/<id>.yml`. Lo stesso `id` di una regola built-in la **override**. Più regole per file separate con `---`.

## Uso

### Template minimo

```yaml
id: no-foo-bar
language: TypeScript        # PascalCase
severity: warning           # error | warning | info
message: "Avoid foo.bar() — use baz() instead"
note: |
  Longer explanation / fix guidance here.
rule:
  pattern: foo.bar($ARG)
```

### Valori `language` (PascalCase)

`TypeScript` `JavaScript` `Python` `Go` `Rust` `Java` `C` `Cpp` `CSharp` `Kotlin` `Ruby` `Php`

### Condizioni della regola

```yaml
rule:
  pattern: foo($X)          # $X singolo, $$$ARGS multi
  kind: call_expression     # AST node kind (alternativa a pattern)
  regex: "secret|token"     # regex sul testo del nodo
  has:                      # un discendente deve matchare
    pattern: await $$$
  not:
    kind: comment
  any:
    - pattern: foo($X)
    - pattern: bar($X)
  all:
    - pattern: $OBJ.send($$$)
    - not: { kind: await_expression }
  inside:                   # un ancestor deve matchare
    kind: function_declaration
    stopBy: end             # cerca TUTTI gli ancestor (default: parent diretto)
```

Il runner matcha ogni regola tramite il motore nativo napi; la **full grammatica ast-grep funziona** (nest liberamente, niente è saltato in silenzio).

## Esempi

### Esempio 1 — vietare `foo.bar()`

```yaml
id: no-foo-bar
language: TypeScript
severity: warning
message: "Avoid foo.bar() — use baz() instead"
rule:
  pattern: foo.bar($ARG)
```

### Esempio 2 — chiamata `send` senza `await`

```yaml
id: no-unawaited-send
language: TypeScript
severity: warning
message: "send() should be awaited"
rule:
  all:
    - pattern: $OBJ.send($$$)
    - not: { kind: await_expression }
```

### Esempio 3 — chiamata solo dentro una function declaration

```yaml
id: only-in-function
language: TypeScript
severity: info
message: "This call should appear inside a function"
rule:
  pattern: foo($$$)
  inside:
    kind: function_declaration
    stopBy: end
```
