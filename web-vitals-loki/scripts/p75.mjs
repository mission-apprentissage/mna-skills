#!/usr/bin/env node
// p75 et verdict à partir d'histogrammes Loki (sum by (..., le) (count_over_time(...))), cf. SKILL.md.
// Entrée : un ou plusieurs TSV, en-tête obligatoire, colonnes de groupe puis `le` puis `count`.
// Plusieurs fichiers (fenêtres de 7 j) : les comptes sont additionnés par (groupe, le) avant calcul.
// Usage : node p75.mjs --metric INP [--min 100] [--sort key] [--hide-small] fenetre1.tsv [fenetre2.tsv ...]
// --sort key : ordre des groupes (versions dans l'ordre semver) au lieu de n décroissant ; --hide-small : groupes sous --min omis.
import { readFileSync } from "node:fs"

// Seuils Google (good ≤, poor >), alignés sur des bornes de l'histogramme. Verdict exact pour les métriques en ms ;
// pour le CLS, la valeur journalisée est arrondie à 4 décimales (buildClsReport), d'où « limite » près de 75 %.
const THRESHOLDS = {
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
}

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i !== -1) args.splice(i, 1)
  return i !== -1
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return fallback
  const [, value] = args.splice(i, 2)
  return value
}
const metric = opt("metric")
const min = Number(opt("min", "100"))
const sortByKey = opt("sort", "n") === "key"
const hideSmall = flag("hide-small")
const files = args
const t = THRESHOLDS[metric]
if (!t || files.length === 0) {
  console.error(`usage : node p75.mjs --metric <${Object.keys(THRESHOLDS).join("|")}> [--min 100] fichier.tsv [...]`)
  process.exit(2)
}

let header
let dataLines = 0
const groups = new Map()
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n").map((l) => l.trimEnd()).filter(Boolean)
  const cols = lines.shift().split("\t")
  if (cols.at(-2) !== "le" || cols.at(-1) !== "count") {
    console.error(`${file} : l'en-tête doit finir par les colonnes le et count`)
    process.exit(2)
  }
  if (header && header.join("\t") !== cols.join("\t")) {
    console.error(`${file} : en-tête différent des fichiers précédents`)
    process.exit(2)
  }
  header = cols
  for (const [n, line] of lines.entries()) {
    const cells = line.split("\t")
    const count = Number(cells.at(-1))
    const le = cells.at(-2) === "+Inf" ? Infinity : Number(cells.at(-2))
    if (cells.length !== cols.length || !Number.isFinite(count) || Number.isNaN(le)) {
      console.error(`${file}:${n + 2} : ligne invalide « ${line} »`)
      process.exit(2)
    }
    dataLines++
    const key = cells.slice(0, -2).join("\t")
    const buckets = groups.get(key) ?? new Map()
    buckets.set(le, (buckets.get(le) ?? 0) + count)
    groups.set(key, buckets)
  }
}
if (groups.size === 0) {
  console.error("aucune ligne de données : rapport impossible")
  process.exit(1)
}

const fmt = (v) => (v === Infinity ? "∞" : metric === "CLS" ? v.toFixed(3) : String(Math.round(v)))
const rows = []
for (const [key, buckets] of groups) {
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0])
  const n = sorted.reduce((s, [, c]) => s + c, 0)
  const target = 0.75 * n
  let cum = 0
  let lower = 0
  let p75 = "?"
  for (const [le, c] of sorted) {
    if (cum + c >= target) {
      p75 = le === Infinity ? `> ${fmt(lower)}` : fmt(lower + ((target - cum) / c) * (le - lower))
      break
    }
    cum += c
    lower = le
  }
  const below = (limit) => sorted.filter(([le]) => le <= limit).reduce((s, [, c]) => s + c, 0)
  const good = below(t.good) / n
  const poor = 1 - below(t.poor) / n
  const base = good >= 0.75 ? "bon" : below(t.poor) / n >= 0.75 ? "à améliorer" : "mauvais"
  const close = Math.abs(good - 0.75) < 0.005 || Math.abs(below(t.poor) / n - 0.75) < 0.005
  const verdict = n < min ? "non significatif" : close ? `${base} (limite)` : base
  rows.push({ key: key.split("\t"), n, p75, good, poor, verdict })
}
const collator = new Intl.Collator("fr", { numeric: true })
rows.sort(sortByKey ? (a, b) => collator.compare(a.key.join("\t"), b.key.join("\t")) : (a, b) => b.n - a.n)
// à comparer au linesReturned des requêtes : un écart trahit une ligne perdue à la recopie
console.error(`lignes lues : ${dataLines} (${files.length} fichier(s)), groupes : ${rows.length}`)

const groupCols = header.slice(0, -2)
const pct = (x) => `${(x * 100).toFixed(1)} %`
console.log(`| ${[...groupCols, "n", `p75 ${t.unit}`.trim(), `≤ ${t.good}`, `> ${t.poor}`, "verdict"].join(" | ")} |`)
console.log(`|${" --- |".repeat(groupCols.length + 5)}`)
for (const r of rows.filter((r) => !hideSmall || r.n >= min)) {
  console.log(`| ${[...r.key, r.n, r.p75, pct(r.good), pct(r.poor), r.verdict].join(" | ")} |`)
}
