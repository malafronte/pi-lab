#!/usr/bin/env node
/**
 * count-by-ext.cjs
 *
 * Conta ricorsivamente i file per estensione in una directory.
 *
 * Uso:
 *   node scripts/count-by-ext.cjs [directory]
 *
 * - Se la directory non viene passata, usa la directory corrente (process.cwd()).
 * - Salta i link simbolici per evitare cicli infiniti.
 * - Le estensioni vengono normalizzate in minuscolo; i file senza estensione
 *   (inclusi i dotfile puri come ".gitignore") finiscono nel gruppo "(no extension)".
 * - Output ordinato per conteggio decrescente, a parità di conteggio in ordine
 *   alfabetico per estensione.
 *
 * Codici di uscita:
 *   0 = esecuzione corretta
 *   1 = la directory argomento non esiste (messaggio su stderr)
 */

"use strict";

const fs = require("fs");
const path = require("path");

// Etichetta usata per i file senza estensione.
const NO_EXTENSION = "(no extension)";

/**
 * Restituisce l'estensione normalizzata di un nome file.
 * - minuscolo
 * - "" o dotfile puro (es. ".gitignore") -> NO_EXTENSION
 * - dotfile con estensione (es. ".env.local") -> ".local"
 *
 * @param {string} name - Nome del file (basename).
 * @returns {string} Estensione normalizzata, incluso il punto iniziale.
 */
function normalizeExtension(name) {
  const base = path.basename(name);

  // Dotfile senza ulteriori punti (es. ".gitignore", ".env"):
  // path.extname lo restituirebbe per intero (".gitignore"), quindi lo trattiamo
  // esplicitamente come "nessuna estensione".
  if (base.startsWith(".") && base.indexOf(".", 1) === -1) {
    return NO_EXTENSION;
  }

  const ext = path.extname(base).toLowerCase();
  return ext === "" ? NO_EXTENSION : ext;
}

/**
 * Cammina ricorsivamente una directory e conta i file per estensione.
 *
 * @param {string} dir - Directory da esaminare.
 * @param {Map<string, number>} counts - Mappa estensione -> conteggio (mutata).
 * @param {number} dirCount - Contatore directory visitate (inclusa la radice).
 * @returns {number} Numero totale di directory visitate dopo questa chiamata.
 */
function walk(dir, counts, dirCount) {
  // readdirSync con withFileTypes: ogni voce è un fs.Dirent.
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Salta i link simbolici per evitare cicli infiniti.
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      // Ricorsione nelle sottodirectory; il contatore directory incrementa.
      dirCount = walk(path.join(dir, entry.name), counts, dirCount + 1);
    } else if (entry.isFile()) {
      const ext = normalizeExtension(entry.name);
      counts.set(ext, (counts.get(ext) || 0) + 1);
    }
    // Tutto ciò che non è file, directory o symlink viene ignorato.
  }

  return dirCount;
}

/**
 * Avvia l'analisi su una directory e stampa il risultato.
 *
 * @param {string} root - Directory radice da analizzare.
 * @returns {number} Codice di uscita (0 ok, 1 errore).
 */
function main(root) {
  // Verifica l'esistenza della directory. Controlliamo anche che sia davvero
  // una directory: se è un file o altro, lo segnaliamo allo stesso modo.
  try {
    const stat = fs.statSync(root);
    if (!stat.isDirectory()) {
      process.stderr.write(`Errore: la directory '${root}' non esiste.\n`);
      return 1;
    }
  } catch (err) {
    // statSync lancia se il percorso non esiste.
    process.stderr.write(`Errore: la directory '${root}' non esiste.\n`);
    return 1;
  }

  const counts = new Map();
  // dirCount parte da 1 per includere la directory radice nel totale.
  const dirCount = walk(root, counts, 1);

  // Conversione in array e ordinamento:
  //  - conteggio decrescente (b[1] - a[1])
  //  - a parità di conteggio, ordine alfabetico per estensione (a[0] < b[0])
  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });

  let total = 0;
  for (const [ext, count] of sorted) {
    process.stdout.write(`${ext} ${count}\n`);
    total += count;
  }

  process.stdout.write(`${total} file totali in ${dirCount} directory\n`);
  return 0;
}

// --- Punto di ingresso ---

// argv[0] = node, argv[1] = percorso script, argv[2] = primo argomento utente.
const target = process.argv[2] !== undefined ? process.argv[2] : process.cwd();
const exitCode = main(target);
process.exit(exitCode);
