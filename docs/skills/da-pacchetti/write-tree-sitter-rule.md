# Skill: write-tree-sitter-rule — scrivere regole tree-sitter per pi-lens

> Skill (derivata da `pi-lens`) per scrivere un nuovo file YAML di regola tree-sitter query per pi-lens: copre schema, sintassi S-expression, capture name, predicati e gotchas.

## Riferimento ufficiale

| Campo | Valore |
| --- | --- |
| Skill | `write-tree-sitter-rule` |
| Pacchetto padre | `pi-lens` (<https://github.com/apmantza/pi-lens>) |
| File skill | `skills/write-tree-sitter-rule/SKILL.md` (nel pacchetto) |

## Installazione

La skill si ottiene installando il pacchetto padre:

```bash
pi install npm:pi-lens
```

## Configurazione

**Drop path** (progetto): `rules/tree-sitter-queries/<language>/<id>.yml`. La directory del linguaggio è **lowercase**: `typescript` `javascript` `tsx` `python` `go` `rust` `java` `csharp` `kotlin` `ruby` `cpp` `c` `css`. Le regole di progetto si mergiano con le built-in (entrambe girano). Per disabilitare i built-in di un linguaggio: rinomina la dir in `<lang>-disabled/`.

## Uso

### Template minimo

```yaml
id: no-eval
severity: error
inline_tier: blocking       # blocking | warning | review
language: typescript        # lowercase, inferito dalla dir se omesso
message: "eval() is dangerous — use a safer alternative"
query: |
  (call_expression
    function: (identifier) @FN
    (#eq? @FN "eval"))
metavars: [FN]
has_fix: false
```

### Sintassi query S-expression

```scheme
; Nodo con field
(call_expression
  function: (identifier) @NAME
  arguments: (arguments) @ARGS)

; Alternative — TUTTI i branch devono usare gli STESSI capture name
[
  (function_declaration name: (identifier) @FN)
  (arrow_function) @FN
]

; Predicati (inline)
(#eq? @NAME "fetch")        ; exact match
(#match? @NAME "^on[A-Z]")  ; regex match
```

### Predicati via YAML (più veloci — girano in WASM)

```yaml
predicates:
  - type: eq       # eq | match | any-of
    var: "@FN"
    value: "dangerousMethod"
  - type: match
    var: "@NAME"
    value: "^(get|set)[A-Z]"
```

### `inline_tier`

`blocking` (errore bloccante) · `warning` · `review`.

## Esempi

### Esempio 1 — vietare `eval()`

```yaml
id: no-eval
severity: error
inline_tier: blocking
language: typescript
message: "eval() is dangerous — use a safer alternative"
query: |
  (call_expression
    function: (identifier) @FN
    (#eq? @FN "eval"))
metavars: [FN]
has_fix: false
```

### Esempio 2 — method handler non conforme (regex)

```yaml
id: no-non-handler-prefix
severity: warning
language: typescript
message: "Handler method should start with 'on' or 'handle'"
query: |
  (method_definition name: (property_identifier) @NAME)
predicates:
  - type: match
    var: "@NAME"
    value: "^(get|set)[A-Z]"
```

### Esempio 3 — alternativa con due branch

```yaml
id: fn-naming
severity: info
language: typescript
query: |
  [
    (function_declaration name: (identifier) @FN)
    (arrow_function) @FN
  ]
```
