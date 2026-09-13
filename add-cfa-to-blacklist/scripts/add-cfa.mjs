#!/usr/bin/env node
/**
 * Ajoute un ou plusieurs CFA à `cfaCompanyList` dans
 * server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts (La Bonne Alternance).
 *
 * - Normalise chaque nom : majuscules, sans accents ni ligatures, espaces simples.
 * - Détecte les doublons avec la même normalisation que le runtime (`stringNormaliser` de `shared`).
 * - Avertit quand une entrée est déjà couverte par inclusion de mots (ou en couvrirait d'autres).
 * - Insère chaque entrée au premier emplacement alphabétique cohérent (comparaison sans accents),
 *   sans retrier la liste existante.
 *
 * Usage :
 *   node add-cfa.mjs --file <chemin> [--dry-run] --stdin   <<'NAMES'
 *   Nom du CFA 1
 *   Nom du CFA 2
 *   NAMES
 *
 *   node add-cfa.mjs --file <chemin> [--dry-run] "<nom 1>" "<nom 2>"   (arguments positionnels)
 *
 * Codes retour : 0 = au moins une insertion, 2 = rien inséré (doublons / aucun nom), 1 = erreur.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

const ARRAY_START = "export const cfaCompanyList = ["
const ARRAY_END_RE = /\n[ \t]*\](?:\s*as\s+const)?[ \t]*;?/

const LIGATURES = { Œ: "OE", œ: "oe", Æ: "AE", æ: "ae", ß: "ss" }

const stripAccents = (s) =>
  s
    .replace(/[ŒœÆæß]/g, (c) => LIGATURES[c])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

/** Forme insérée dans le fichier : majuscules non accentuées, espaces simples. */
export const normalizeEntry = (raw) =>
  stripAccents(String(raw).replace(/[’‘]/g, "'"))
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()

/** Réimplémentation de `stringNormaliser` (shared/src/utils/string-utils.ts) pour la détection de doublons. */
export const dedupKey = (s) =>
  stripAccents(String(s).toLowerCase())
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")

/** Vrai si `container` contient `part` comme suite de mots entiers (même règle que le runtime). */
const containsWords = (container, part) => ` ${container} `.includes(` ${part} `)

export function parseArgs(argv) {
  const names = []
  let file = null
  let dryRun = false
  let stdin = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--file") file = argv[++i]
    else if (a.startsWith("--file=")) file = a.slice("--file=".length)
    else if (a === "--dry-run") dryRun = true
    else if (a === "--stdin") stdin = true
    else if (a.startsWith("--")) throw new Error(`Option inconnue : ${a}`)
    else names.push(a)
  }
  return { file, dryRun, stdin, names }
}

export function parseList(source) {
  const start = source.indexOf(ARRAY_START)
  if (start < 0) throw new Error(`Bloc "${ARRAY_START}" introuvable`)
  const bodyStart = start + ARRAY_START.length
  const endMatch = ARRAY_END_RE.exec(source.slice(bodyStart))
  if (!endMatch) throw new Error("Fin du tableau cfaCompanyList introuvable")
  const end = bodyStart + endMatch.index
  const body = source.slice(bodyStart, end)
  const lines = body.split("\n").filter((l) => l.trim() !== "")
  const entries = lines.map((l) => {
    const t = l.trim().replace(/,$/, "")
    try {
      const v = JSON.parse(t)
      if (typeof v !== "string") throw new Error()
      return v
    } catch {
      throw new Error(`Ligne non reconnue dans cfaCompanyList : ${l}`)
    }
  })
  return { entries, before: source.slice(0, bodyStart), after: source.slice(end) }
}

const serializeList = (entries) => "\n" + entries.map((e) => `  ${JSON.stringify(e)},`).join("\n")

/**
 * Calcule les insertions pour `rawNames` dans `entries` (non muté).
 * Retourne { results, entries: nouvelle liste, inserted }.
 */
export function planInsertions(entries, rawNames) {
  const next = [...entries]
  const keys = new Set(next.map(dedupKey))
  const results = []
  let inserted = 0

  for (const raw of rawNames) {
    const normalized = normalizeEntry(raw)
    if (!normalized) {
      results.push({ raw, normalized: "", status: "ignorée (vide après normalisation)" })
      continue
    }
    const key = dedupKey(normalized)
    if (keys.has(key)) {
      const existing = next.find((e) => dedupKey(e) === key)
      results.push({ raw, normalized, status: `déjà présente (\`${existing}\`), ignorée` })
      continue
    }

    const warnings = []
    const coveredBy = next.filter((e) => containsWords(key, dedupKey(e)))
    if (coveredBy.length > 0) {
      warnings.push(`⚠️ déjà couverte par inclusion via \`${coveredBy[0]}\` (insertion probablement inutile)`)
    }
    const covers = next.filter((e) => containsWords(dedupKey(e), key))
    if (covers.length > 0) {
      warnings.push(`⚠️ couvrirait ${covers.length} entrée(s) existante(s) par inclusion (ex. \`${covers[0]}\`) : vérifier que le nom n'est pas trop générique`)
    }

    let idx = next.findIndex((e) => stripAccents(e) > normalized)
    if (idx < 0) idx = next.length
    const prev = idx > 0 ? next[idx - 1] : null
    const after = idx < next.length ? next[idx] : null
    next.splice(idx, 0, normalized)
    keys.add(key)
    inserted++
    results.push({
      raw,
      normalized,
      status: [`insérée entre \`${prev ?? "<début>"}\` et \`${after ?? "<fin>"}\``, ...warnings].join(" — "),
    })
  }

  return { results, entries: next, inserted }
}

function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
  const { file, dryRun, stdin, names } = opts
  if (!file) {
    console.error('Usage : node add-cfa.mjs --file <fichier> [--dry-run] (--stdin | "<nom 1>" "<nom 2>" ...)')
    process.exit(1)
  }
  if (stdin) names.push(...readFileSync(0, "utf8").split(/\r?\n/))
  const rawNames = names.map((n) => n.trim()).filter(Boolean)
  if (rawNames.length === 0) {
    console.error("Aucun nom de CFA fourni.")
    process.exit(2)
  }

  let source
  try {
    source = readFileSync(file, "utf8")
  } catch (e) {
    console.error(`Impossible de lire ${file} : ${e.message}`)
    process.exit(1)
  }

  let parsed
  try {
    parsed = parseList(source)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }

  const { results, entries, inserted } = planInsertions(parsed.entries, rawNames)

  console.log("| Entrée fournie | Normalisée | Résultat |")
  console.log("|---|---|---|")
  for (const r of results) console.log(`| ${r.raw} | ${r.normalized} | ${r.status} |`)
  console.log("")

  if (inserted === 0) {
    console.log("Aucune insertion : le fichier n'a pas été modifié.")
    process.exit(2)
  }

  if (dryRun) {
    console.log(`Dry-run : ${inserted} insertion(s) prévue(s), fichier non modifié.`)
    process.exit(0)
  }

  writeFileSync(file, parsed.before + serializeList(entries) + parsed.after, "utf8")
  console.log(`${inserted} insertion(s) écrite(s) dans ${file} (${parsed.entries.length} → ${entries.length} entrées).`)
  process.exit(0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
