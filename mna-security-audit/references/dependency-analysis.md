# Stratégie de correction des dépendances

## Identifier le type de dépendance

```bash
# Yarn : tracer l'origine d'un package
yarn why <package>

# npm
npm why <package>   # ou : npm ls <package>

# pnpm
pnpm why <package>
```

### Lecture du résultat `yarn why`

```
└─ conventional-changelog-writer@npm:8.2.0
   └─ handlebars@npm:4.7.8 (via npm:^4.7.7)
```
→ **Transitive** : `handlebars` est tiré par `conventional-changelog-writer`, pas déclaré directement. Utiliser `resolutions`.

```
└─ server@workspace:server
   └─ basic-ftp@npm:5.1.0 (via npm:^5.1.0)
```
→ **Directe** : déclarée dans `server/package.json`. Mettre à jour la version directement.

---

## Cas 1 — Dépendance directe

Modifier le `package.json` qui la déclare :

```json
// Avant
"basic-ftp": "^5.1.0"

// Après
"basic-ftp": "^5.2.0"
```

Puis : `yarn install` (ou équivalent).

---

## Cas 2 — Dépendance transitive (Yarn Berry)

Ajouter dans le `package.json` **racine** (monorepo) :

```json
"resolutions": {
  "<package>": "^<version_patchée>"
}
```

**Pourquoi les resolutions ?**
Yarn Berry résout les versions dans tout l'arbre de dépendances selon ces overrides, indépendamment de ce que les packages parents déclarent. C'est le mécanisme officiel pour forcer une version sans toucher aux dépendants (qui pourraient être maintenus par des tiers ou publiés sur npm).

**Cas particulier — pin exact** : si le parent déclare une version exacte (ex: `"fast-xml-parser": "5.2.5"` sans `^`), la resolution est le seul moyen de forcer une version plus récente sans modifier le parent.

---

## Cas 3 — Dépendance transitive (npm workspaces)

Utiliser `overrides` dans le `package.json` racine :

```json
"overrides": {
  "<package>": "^<version_patchée>"
}
```

---

## Cas 4 — Dépendance transitive (pnpm)

Utiliser `pnpm.overrides` dans le `package.json` racine :

```json
"pnpm": {
  "overrides": {
    "<package>": "^<version_patchée>"
  }
}
```

---

## Cas non corrigeables

Certaines alertes ne peuvent pas être corrigées par une mise à jour de dépendance :

| Situation | Exemple | Action |
|-----------|---------|--------|
| Vulnérabilité dans un binaire natif (Go, Rust) embarqué dans un outil de build | Go stdlib dans esbuild | Dismisser "won't fix" + attendre une mise à jour de l'outil |
| Pas de version patchée disponible | CVE récent sans fix | Dismisser avec note + réévaluer au prochain audit |
| Dépendance de dev sans surface d'attaque runtime | outil de changelog | Évaluer le risque réel avant de patcher |

---

## Vérification post-correction

```bash
# Yarn : vérifier la version résolue
yarn why <package>
# Doit afficher la version patchée

# Vérifier qu'il n'y a pas d'autres versions du même package
grep "<package>" yarn.lock | grep "^\"<package>"
```
