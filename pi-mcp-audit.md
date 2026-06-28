# Audit di sicurezza: `pi-mcp-adapter` v2.10.0

> Audit **statico** del codice installato in `~/.pi/agent/npm/node_modules/pi-mcp-adapter` (v2.10.0), eseguito dopo l'installazione. Metodo: lettura del sorgente TypeScript + analisi dell'albero delle dipendenze + verifica del bundle. Non è stata fatta analisi dinamica (runtime/network) e l'audit di un bundle minificato da 295 KB non può essere considerato completo al 100%. Limiti dichiarati in fondo.

## Verdetto sintetico

**Nessun red flag trovato.** Codice ben ingegnerizzato sul fronte credenziali. Nessuna telemetria, nessun phone-home, nessun esfiltrazione dati, nessun `eval` nascosto. La API key di Stitch scorre **solo** verso l'URL del server configurato, non viene mai loggata né restituita all'LLM.

I rischi residui sono quelli **intrinseci** della supply-chain (pacchetto di terzi con pieno accesso al sistema) e del protocollo MCP stesso (il server configurato riceve gli input dei tool + la tua chiave — che è lo scopo del protocollo).

## Indice

1. [Superfici esaminate](#1-superfici-esaminate)
2. [Punti di forza (riscontri positivi)](#2-punti-di-forza-riscontri-positivi)
3. [Debolezze e findings minori](#3-debolezze-e-findings-minori)
4. [Dipendenze e supply-chain](#4-dipendenze-e-supply-chain)
5. [Flusso della API key (caso Stitch)](#5-flusso-della-api-key-caso-stitch)
6. [Limiti di questo audit](#6-limiti-di-questo-audit)
7. [Raccomandazioni](#7-raccomandazioni)

---

## 1. Superfici esaminate

| Area | File controllati | Esito |
|---|---|---|
| Traffico di rete | grep URL/fetch/http in tutti i `.ts` | solo URL locali + GitHub del repo |
| Server locali | `ui-server.ts`, `mcp-callback-server.ts`, `ui-session.ts` | loopback 127.0.0.1, token di sessione |
| Gestione credenziali | `mcp-auth.ts`, `mcp-auth-flow.ts`, `oauth-handler.ts` | OK (vedi §2) |
| Esecuzione codice | grep `eval`/`Function`/`child_process` | limitato a `npx-resolver.ts` (by design) e `glimpse-ui.ts` (macOS-only) |
| Bundle minificato | `app-bridge.bundle.js` (295 KB) | è solo **zod** (validation library) |
| Telemetria | grep telemetry/analytics/sentry/posthog | **assente** |
| Script install-time | scan `postinstall`/`install`/`prepare` in tutto l'albero | vedi §4 |
| Dipendenze | `@modelcontextprotocol/sdk`, `zod`, `open`, `recheck`, ecc. | versioni aggiornate, vedi §4 |

## 2. Punti di forza (riscontri positivi)

### 2.1 OAuth con protezione CSRF solida
- `generateState()` in `mcp-auth-flow.ts` usa `crypto.getRandomValues` a **32 byte** (token crittograficamente sicuro).
- Validazione esplicita dello state: lancia *"OAuth state missing"* e *"OAuth state mismatch - potential CSRF attack"* (`mcp-auth-flow.ts:310-314`).

### 2.2 Token salvati con permessi corretti
- File credenziali scritti con `mode: 0o600` (lettura/scrittura solo owner), directory con `mode: 0o700` (`mcp-auth.ts:72,100,146`).
- Le credenziali sono invalidate se l'URL del server cambia (`mcp-auth.ts`).

### 2.3 Server UI locale ben confinato
- Bind a **`127.0.0.1`** solo (loopback, non esposto in rete), porta **OS-assegnata** (random) (`ui-server.ts:498`).
- **Session token** (`randomUUID()`) validato su **ogni** richiesta via `validateTokenQuery` (GET) / `validateTokenBody` (POST). Un sito web malevolo non può guidare il server senza il token.
- Endpoint pericolosi neutri: `/proxy/ui/open-link` valida l'URL e restituisce solo `isError` (non esegue `open()` lato server); `/proxy/ui/download-file` è un no-op.

### 2.4 Consent gate sui tool
- `ConsentManager` (`consent-manager.ts`) richiede approvazione esplicita prima delle chiamate ai tool MCP. Modalità: `never` / `once-per-server` (default) / `always`.
- `/proxy/tools/call` chiama `consentManager.ensureApproved()` prima di inoltrare.

### 2.5 La API key non trapola
- `resolveHeaders()` (`server-manager.ts:440`) interpola le var d'ambiente e passa gli header **solo** al transport verso l'URL configurato.
- La chiave **non** compare nei risultati dei tool restituiti all'LLM (verificato: `proxy-modes.ts`/`direct-tools.ts` non gestiscono header/token).
- **Nessun log** di chiavi/token: i log citano solo nomi server e operazioni (es. *"MCP Auth: Token expired for {serverName}"*), mai valori.

### 2.6 Nessuna telemetria / phone-home
- Nessun riferimento a posthog/amplitude/sentry/segment/track/beacon.
- L'unica URL esterna hardcodata nei `.ts` è `https://github.com/nicobailon/pi-mcp-adapter` (il repo del progetto).
- Il bundle minificato non contiene URL esterne.

### 2.7 Nessun codice pericoloso nel core
- Nessun `eval`, `new Function`, `vm.runIn*` nei file dell'adattatore.
- `child_process` appare solo in:
  - `npx-resolver.ts` — by design, per risolvere/avviare server MCP **stdio** via `npx exec`. **Non è raggiunto** per server remoti (come Stitch): `server-manager.ts` usa `StreamableHTTPClientTransport` quando c'è `url`, il branch `command` (npx) viene saltato.
  - `glimpse-ui.ts` — funzionalità preview **macOS-only** (`if platform() !== "darwin" return false`). Su Windows è no-op.

### 2.8 Interpolazione variabili sicura
- `interpolateEnvVars()` (`utils.ts:62`) è pura sostituzione stringa di `${VAR}` e `$env:VAR` con `process.env[VAR]`. Nessun rischio di injection.

## 3. Debolezze e findings minori

### 3.1 (Basso) Confronto token non timing-safe
`validateTokenQuery`/`validateTokenBody` usano `===` invece di `crypto.timingSafeEqual`. **Rilevanza: trascurabile.** Il server è solo loopback, il token è un UUID casuale (122 bit di entropia), e un timing attack su loopback è impraticabile. Segnalato per completezza.

### 3.2 (Info) Server UI senza verifica Host/Origin header
Non c'è un check esplicito sull'header `Host`/`Origin` (protezione DNS rebinding). **Mitigato** dal session token obbligatorio e dal binding loopback + porta random. Un attacco DNS rebinding richiederebbe di indovinare anche la porta OS-assegnata.

### 3.3 (Info) `open` apre il browser per OAuth
La dipendenza `open` avvia il browser predefinito per il flusso OAuth. Normale per flussi OAuth interattivi; non rilevante per Stitch (che usa header API key, non OAuth).

### 3.4 (Info) npx-resolver per server stdio
Se in futuro configuri un server MCP **stdio** con `command: "npx"`, questo eseguirà il pacchetto npm specificato. È il comportamento standard di MCP, ma significa che un server stdio malevolo = esecuzione di codice arbitrario. **Non riguarda Stitch** (remoto), ma vale per qualsiasi server stdio tu aggiunga in futuro: rivedi sempre il package prima di metterlo in `command`.

## 4. Dipendenze e supply-chain

Versioni rilevate (tutte aggiornate):

| Pacchetto | Versione | Note |
|---|---|---|
| `@modelcontextprotocol/sdk` | 1.29.0 | SDK MCP ufficiale |
| `@modelcontextprotocol/ext-apps` | 1.7.4 | MCP ufficiale |
| `zod` | 4.4.3 | validation |
| `open` | 10.2.0 | apre browser (OAuth) |
| `recheck` | 4.5.0 | analisi sicurezza regex (ReDoS) — segno di cura |
| `@google/genai` | 1.52.0 | SDK Google ufficiale (da `@earendil-works/pi-ai`) |
| `koffi` | 2.16.2 | C FFI (vedi sotto) |

### Script install-time (girano durante `pi install`)

| Pacchetto | Script | Valutazione |
|---|---|---|
| `koffi` | `install: node src/cnoke/cnoke.js --prebuild` | FFI native. **Ma**: è richiesto da `@earendil-works/pi-tui`, che pi usa **già di suo**. Non è superficie d'attacco nuova introdotta dall'adattatore. |
| `protobufjs` | `postinstall: node scripts/postinstall` | **Benigno**: 32 righe, solo `require` di path/fs/pkg, nessuna rete/exec. |
| (altri) | `prepublishOnly`/`prepare` | Non girano su install da registry npm. |

Nessuno script di install sospetto o con chiamate di rete.

### Autore e manutenzione
- Pacchetto di **terzi**, autore `nicobailon` (maintainer singolo o piccolo team), repo `github.com/nicobailon/pi-mcp-adapter`.
- Versione 2.10.0 — indica iterazione attiva.
- Risk-profile tipico della supply-chain: il codice girerà con pieno accesso al sistema e gestirà la tua chiave Google.

## 5. Flusso della API key (caso Stitch)

Verificato il percorso completo per la nostra configurazione (`.mcp.json` con `url` + `headers.X-Goog-Api-Key: "${STITCH_API_KEY}"`):

```
process.env.STITCH_API_KEY
   │  interpolateEnvVars("${STITCH_API_KEY}")  →  valore reale
   ▼
resolveHeaders() [server-manager.ts:440]
   │  headers = { "X-Goog-Api-Key": "<valore>" }
   ▼
createHttpTransport() [server-manager.ts:115]   (URL = stitch.googleapis.com)
   │  requestInit = { headers }
   ▼
StreamableHTTPClientTransport  →  invia header SOLO a https://stitch.googleapis.com/mcp
```

- La chiave è interpolata a runtime dall'ambiente (non sta nel file `.mcp.json` in chiaro).
- Viene inviata **solo** all'URL configurato.
- Non è loggata.
- Non è inclusa nei risultati restituiti all'LLM.
- Quando tu (o l'agente) chiamate un tool Stitch, gli **argomenti del tool** viaggiano verso `stitch.googleapis.com` — questo è il comportamento atteso e inevitabile di Stitch.

> **Aggiornamento (post-test):** il percorso della chiave qui sopra descrive la connessione *diretta*. In pratica la connessione diretta a Stitch **fallisce** per un difetto di conformità dei suoi JSON Schema (`$ref` non risolvibili), non per ragioni di sicurezza del pacchetto. La soluzione in produzione è un **proxy locale** che inoltra a Stitch e ripulisce gli schema: in quel caso l'URL configurato diventa `http://127.0.0.1:9020/mcp`, e il proxy aggiunge `X-Goog-Api-Key` prima di inoltrare a `stitch.googleapis.com` (la chiave scorre comunque **solo** verso Google). Diagnostica e workaround in [`pi-stitch-proxy-guida.md`](pi-stitch-proxy-guida.md) e [`pi-mcp-guida.md`](pi-mcp-guida.md) §8. Le conclusioni di sicurezza di questo audit non cambiano: nessuna telemetria, nessuna esfiltrazione, chiave gestita correttamente.

## 6. Limiti di questo audit

**Onestà su cosa NON copre questo audit:**

1. **Analisi dinamica assente.** Non ho eseguito il pacchetto in runtime monitorando rete/filesystem/processi. Un comportamento malevolo attivato solo a runtime (es. codice che si attiva dopo N chiamate, o in base all'ambiente) non sarebbe rilevato dall'analisi statica.
2. **Bundle non verificato al 100%.** `app-bridge.bundle.js` (295 KB minificato) risulta essere zod dalle signature delle esportazioni, ma un minificato potrebbe nascondere codice. Ho verificato l'assenza di URL esterne e di pattern `eval`/`fetch` esterni, ma non posso garantire una copertura totale di un minified.
3. **Audit delle dipendenze di secondo livello non approfondito.** Ho controllato i pacchetti diretti e gli script install-time di tutto l'albero, ma non ho letto riga per riga il codice di `@modelcontextprotocol/sdk`, `zod`, `@google/genai`, ecc. (sono librerie ampiamente usate, ma tecnicamente fuori dal perimetro).
4. **Nessun controllo CVE formale.** Non ho interrogato database CVE/GHSA per ciascuna versione. Le versioni sono recenti (riduce la probabilità di CVE noti non patchati), ma non è una garanzia.
5. **Audit punto-nel-tempo.** Si riferisce alla **v2.10.0** installata ora. Aggiornamenti futuri del pacchetto richiedono un nuovo audit.

## 7. Raccomandazioni

1. **Pratica l'uso di `${STITCH_API_KEY}`** (già fatto nel nostro `.mcp.json`): la chiave resta fuori dai file e fuori da git. ✅
2. **Usa una chiave Google con scope minimale** se Stitch lo permette, e considera di ruotarla periodicamente.
3. **Blocca gli aggiornamenti automatici** del pacchetto finché non li ri-auditi: `pi update --extensions` aggiornerà pi-mcp-adapter a versioni future non auditate. Valuta di pinare la versione o ri-auditarla dopo ogni update.
4. **Per server MCP stdio futuri** (non Stitch): rivedi sempre il sorgente del package npm prima di metterlo in `command: "npx ..."`, perché girerà con i tuoi permessi.
5. **Se la paranoia è alta:** valuta l'alternativa D (estensione su misura) discussa in chat — più controllo ma più lavoro. Oppure esegui pi in container, come raccomanda la filosofia di pi.
6. **Monitora l'effettivo traffico di rete** del processo `pi` durante il primo uso di Stitch (es. con Wireshark / `netstat`) per confermare empiricamente che le connessioni vadano solo verso `stitch.googleapis.com`.

---

*Audit eseguito su `pi-mcp-adapter@2.10.0`, codice installato in `~/.pi/agent/npm/node_modules/pi-mcp-adapter`. Metodo: analisi statica del sorgente TypeScript + albero dipendenze + ispezione bundle. Data audit: 2026-06-23.*
