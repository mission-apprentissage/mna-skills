#!/usr/bin/env node
/**
 * Ajoute un ou plusieurs CFA à `cfaCompanyList` dans
 * server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts (La Bonne Alternance).
 *
 * - Normalise chaque nom : majuscules, sans accents, espaces simples.
 * - Détecte les doublons avec la même normalisation que le runtime (`stringNormaliser` de `shared`).
 * - Insère chaque entrée au premier emplacement alphabétique cohérent (comparaison sans accents),
 *   sans retrier la liste existante.
 *
 * Usage :
 *   node add-cfa.mjs --file <chemin-du-fichier> [--dry-run] "<nom 1>" "<nom 2>" ...
 *
 * Codes retour : 0 = au moins une insertion, 2 = rien inséré (doublons / aucun nom), 1 = erreur.
 */

import { readFileSync, writeFileSync } from "node:fs"

const ARRAY_START = "export const cfaCompanyList = ["

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")

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

function parseArgs(argv) {
  const names = []
  let file = null
  let dryRun = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--file") file = argv[++i]
    else if (a.startsWith("--file=")) file = a.slice("--file=".length)
    else if (a === "--dry-run") dryRun = true
    else names.push(a)
  }
  return { file, dryRun, names }
}

function parseList(source) {
  const start = source.indexOf(ARRAY_START)
  if (start < 0) throw new Error(`Bloc "${ARRAY_START}" introuvable`)
  const bodyStart = start + ARRAY_START.length
  const end = source.indexOf("\n]", bodyStart)
  if (end < 0) throw new Error("Fin du tableau cfaCompanyList introuvable")
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

function serializeList(entries) {
  return "\n" + entries.map((e) => `  ${JSON.stringify(e)},`).join("\n")
}

function main() {
  const { file, dryRun, names } = parseArgs(process.argv.slice(2))
  if (!file) {
    console.error("Usage : node add-cfa.mjs --file <fichier> [--dry-run] \"<nom 1>\" \"<nom 2>\" ...")
    process.exit(1)
  }
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

  const entries = [...parsed.entries]
  const keys = new Set(entries.map(dedupKey))
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
      const existing = entries.find((e) => dedupKey(e) === key)
      results.push({ raw, normalized, status: `déjà présente (\`${existing}\`), ignorée` })
      continue
    }
    let idx = entries.findIndex((e) => stripAccents(e) > normalized)
    if (idx < 0) idx = entries.length
    const prev = idx > 0 ? entries[idx - 1] : null
    const next = idx < entries.length ? entries[idx] : null
    entries.splice(idx, 0, normalized)
    keys.add(key)
    inserted++
    results.push({
      raw,
      normalized,
      status: `insérée entre \`${prev ?? "<début>"}\` et \`${next ?? "<fin>"}\``,
    })
  }

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

main()
