---
name: mna-security-audit
description: Audit mensuel de sécurité des repos GitHub Mission Nationale Apprentissage. Récupère les alertes critiques (code scanning Docker Scout + Dependabot), analyse les CVE, corrige les dépendances vulnérables dans une branche dédiée par repo, ouvre des PRs explicatives et dismisses les alertes avec commentaire. Utiliser ce skill quand l'utilisateur demande un audit de sécurité, veut corriger des CVE critiques, ou mentionne un audit mensuel sur les repos MNA (labonnealternance, bal, api-apprentissage).
---

# MNA Security Audit

Audit mensuel de sécurité sur les 3 repos GitHub de Mission Nationale Apprentissage.

## Repos cibles

| GitHub | Chemin local | Package manager |
|--------|-------------|-----------------|
| `mission-apprentissage/labonnealternance` | `/Users/kevin-macmini/Documents/_project/beta/labonnealternance` | Yarn Berry |
| `mission-apprentissage/bal` | `/Users/kevin-macmini/Documents/_project/beta/bal` | **pnpm** |
| `mission-apprentissage/api-apprentissage` | `/Users/kevin-macmini/Documents/_project/beta/api-apprentissage` | Yarn Berry |

## Entrée — Issue de suivi

L'audit doit être lié à une issue GitHub dans le projet LBA.

**Si l'utilisateur fournit un numéro d'issue** (ex: `#142`) → l'utiliser directement pour nommer les branches et lier les PRs.

**Si l'utilisateur n'en a pas** → invoquer le skill `/lba-issue` pour en créer une :
- Type : `Task`
- Titre suggéré : `Audit sécurité mensuel — <mois année>`
- Contexte : audit mensuel des CVE critiques sur les repos MNA
- Critère d'acceptation : toutes les alertes critiques corrigées ou dismissées avec commentaire

Récupérer le numéro de l'issue créée (ex: `#142`) et l'utiliser pour la suite.

---

## Étape 1 — Collecter toutes les alertes critiques

Pour **chaque repo**, récupérer en parallèle les alertes ouvertes :

```bash
# Code scanning (Docker Scout, CodeQL, etc.)
gh api "repos/mission-apprentissage/<REPO>/code-scanning/alerts?severity=critical&state=open"

# Dependabot
gh api "repos/mission-apprentissage/<REPO>/dependabot/alerts?severity=critical&state=open"
```

Si un repo n'a aucune alerte critique, le noter et passer au suivant sans créer de branche.

**Présenter un tableau récapitulatif** avant de continuer :

```
| Repo               | # Alertes | Packages vulnérables         |
|--------------------|-----------|------------------------------|
| labonnealternance  | 3         | handlebars, fast-xml-parser  |
| bal                | 1         | lodash                       |
| api-apprentissage  | 0         | —                            |
```

---

## Étape 2 — Analyser chaque alerte

Pour chaque alerte, extraire :
- **Package** + version actuelle
- **Version corrigée** (`first_patched_version` / `fixed version` dans le message)
- **Type de dépendance** : directe (dans un `package.json`) ou transitive
- **Origine** : qui dans l'arbre de dépendances tire ce package

Voir `references/dependency-analysis.md` pour la stratégie de correction selon le type.

---

## Étape 3 — Préparer l'environnement local pour chaque repo affecté

Les clones locaux sont dans `/Users/kevin-macmini/Documents/_project/beta/`. Si un repo n'est pas présent à cet emplacement, le cloner dans `/tmp/` :

```bash
git clone git@github.com:mission-apprentissage/<REPO>.git /tmp/mna-audit-<REPO>
```

**Package managers par repo (déjà connus) :**
- `labonnealternance` → **Yarn Berry** (`yarn install`, `yarn why`, `resolutions` dans package.json)
- `bal` → **pnpm** (`pnpm install`, `pnpm why`, `pnpm.overrides` dans package.json)
- `api-apprentissage` → **Yarn Berry** (`yarn install`, `yarn why`, `resolutions` dans package.json)

Voir `references/package-managers.md` pour les commandes et syntaxes d'override par package manager.

---

## Étape 4 — Créer la branche et appliquer les corrections

```bash
git fetch origin main
git checkout -b fix/security-audit-<ISSUE> origin/main
```

### Stratégie de correction (voir aussi references/dependency-analysis.md)

**Dépendance directe** → mettre à jour la version dans le `package.json` concerné :
```json
"<package>": "^<fixed_version>"
```

**Dépendance transitive (labonnealternance / api-apprentissage — Yarn Berry)** → `resolutions` dans `package.json` racine :
```json
"resolutions": {
  "<package>": "^<fixed_version>"
}
```

**Dépendance transitive (bal — pnpm)** → `pnpm.overrides` dans `package.json` racine :
```json
"pnpm": {
  "overrides": {
    "<package>": "^<fixed_version>"
  }
}
```

> Ces mécanismes forcent une version dans tout l'arbre de dépendances, indépendamment de ce que les packages parents déclarent. C'est le moyen standard de patcher des transitives sans toucher aux dépendants tiers.

**Après chaque modification**, lancer l'installation pour mettre à jour le lockfile :
```bash
# labonnealternance / api-apprentissage
yarn install

# bal
pnpm install
```

Vérifier que les nouvelles versions sont bien résolues :
```bash
yarn why <package>   # Yarn
pnpm why <package>   # pnpm
```

---

## Étape 5 — Commiter et pusher

```bash
git add package.json <workspace>/package.json yarn.lock  # ou les fichiers modifiés
git commit -m "fix(security-audit-<ISSUE>): corriger <N> CVE critiques (<liste des packages>)"
git push -u origin fix/security-audit-<ISSUE>
```

**Règles de commit impératives :**
- Format conventional commit : `fix(security-audit-<ISSUE>): <description en minuscules>`
- Ne jamais ajouter de référence à Claude, co-authored-by ou mention d'IA
- Ne jamais utiliser `--no-verify`
- Si un hook échoue, diagnostiquer et corriger avant de recréer le commit

---

## Étape 6 — Créer la PR GitHub

**Labels par repo :**
- `api-apprentissage` → ajouter `--label "dependencies"`
- `bal`, `labonnealternance` → pas de label spécifique

```bash
gh pr create \
  --title "fix(security-audit-<ISSUE>): corriger <N> CVE critiques (<packages>)" \
  --label "dependencies" \   # api-apprentissage uniquement
  --body "$(cat <<'EOF'
Fixes #<ISSUE>

---

## Changements

<pour chaque package corrigé :>
- `<package>` : <version vulnérable> → <version corrigée> (<méthode : dépendance directe / resolution>) — CVE-XXXX (CVSS X.X)

## Contexte

<explication des dépendances transitives si applicable, et pourquoi la résolution est nécessaire>

## Plan de test

- [ ] `yarn install` sans erreur, lockfile cohérent
- [ ] Les alertes Dependabot / Docker Scout disparaissent après la prochaine release (ou au merge pour Dependabot)
- [ ] Tests CI passent sans régression

EOF
)"
```

---

## Étape 7 — Dismisser les alertes avec commentaire

Pour les alertes **corrigées dans la PR** :

```bash
# Code scanning
gh api -X PATCH "repos/mission-apprentissage/<REPO>/code-scanning/alerts/<N>" \
  --field state="dismissed" \
  --field dismissed_reason="won't fix" \
  --field dismissed_comment="Corrigé dans la PR #<PR> (fix/security-audit-<ISSUE>) : <package> mis à jour vers <version>. L'alerte se fermera automatiquement à la prochaine release."

# Dependabot
gh api -X PATCH "repos/mission-apprentissage/<REPO>/dependabot/alerts/<N>" \
  --field state="dismissed" \
  --field dismissed_reason="fix_started" \
  --field dismissed_comment="Corrigé dans la PR #<PR> (fix/security-audit-<ISSUE>) : <package> mis à jour vers <version>. L'alerte se fermera automatiquement au merge."
```

Pour les alertes **non corrigibles** (ex: binaire build-tool embarqué, pas de version patchée disponible) :

```bash
gh api -X PATCH "repos/mission-apprentissage/<REPO>/code-scanning/alerts/<N>" \
  --field state="dismissed" \
  --field dismissed_reason="won't fix" \
  --field dismissed_comment="<Raison> : pas de surface d'attaque runtime / pas de version corrigée disponible. À réévaluer lors du prochain audit."
```

---

## Étape 8 — Rapport final

Présenter un récapitulatif :

```
## Audit sécurité #<ISSUE> — <date>

### mission-apprentissage/labonnealternance
- PR #XXXX créée : fix/security-audit-<ISSUE>
- ✅ handlebars 4.7.8 → 4.7.9 (résolution transitive)
- ✅ fast-xml-parser 5.2.5 → 5.5.9 (résolution transitive)
- ⚠️  esbuild/Go stdlib : dismissé (build-tool uniquement)

### mission-apprentissage/bal
- PR #XXXX créée : fix/security-audit-<ISSUE>
- ✅ lodash 4.17.20 → 4.17.21 (dépendance directe)

### mission-apprentissage/api-apprentissage
- ✅ Aucune alerte critique — rien à faire
```

---

## Notes importantes

- **Ne jamais force-push** sur `main`
- Les clones locaux sont dans `/Users/kevin-macmini/Documents/_project/beta/` — si absent, cloner dans `/tmp/mna-audit-<REPO>/`
- **bal utilise pnpm** : `pnpm install`, `pnpm why`, `pnpm.overrides` dans package.json — ne pas utiliser yarn sur ce repo
- Si `yarn install` ou `pnpm install` échoue après modification des overrides, vérifier la compatibilité de version avec le package parent avant de forcer
- Les alertes Docker Scout (code scanning) ne disparaissent qu'après une release qui rebuild l'image — préciser cela dans les commentaires de dismissal
- Les alertes Dependabot disparaissent au merge de la PR
