---
name: add-cfa-to-blacklist
description: >
  Ajoute un ou plusieurs CFA à la liste de blocage cfaCompanyList de La Bonne Alternance
  (server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts) : normalise le nom en majuscules
  non accentuées, l'insère à sa place alphabétique, puis ouvre une PR via /pull-request-lba.
  Déclenchement explicite uniquement via la commande /add-cfa-to-blacklist, jamais automatiquement.
disable-model-invocation: true
argument-hint: "[nom CFA 1] ; [nom CFA 2] ; ..."
---

# add-cfa-to-blacklist — Blacklister un CFA via une PR automatique

Tu ajoutes un ou plusieurs CFA à `cfaCompanyList` dans le repo `mission-apprentissage/labonnealternance`,
fichier `server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts`, puis tu ouvres une PR.
Tu ne commites **jamais** sur `main`.

Cette liste bloque les offres partenaires dont l'employeur est en réalité un CFA. Le matching runtime est
insensible à la casse, aux accents et à la ponctuation, et fonctionne aussi **par inclusion de mots** :
l'entrée `BTP CFA` bloque `BTP CFA BRETAGNE`. Une entrée courte ou générique bloque donc large.

Arguments reçus : `$ARGUMENTS`

---

## Étape 0 — Pré-requis

Tout vérifier **avant de toucher au fichier**. Lancer ce bloc en une fois et lire chaque ligne :

```bash
echo "repo      : $(git remote -v 2>/dev/null | grep -q 'mission-apprentissage/labonnealternance' && echo OK || echo KO)"
echo "gh        : $(gh auth status >/dev/null 2>&1 && echo OK || echo KO)"
echo "gh accès  : $(gh repo view mission-apprentissage/labonnealternance --json name -q .name >/dev/null 2>&1 && echo OK || echo KO)"
echo "node      : $(node --version 2>/dev/null || echo KO)"
echo "yarn deps : $([ -d node_modules ] && echo OK || echo KO)"
echo "script    : $([ -f "${CLAUDE_SKILL_DIR}/scripts/add-cfa.mjs" ] && echo OK || echo KO)"
echo "tree      : $([ -z "$(git status --porcelain)" ] && echo propre || echo SALE)"
git fetch origin main -q && echo "fetch     : OK" || echo "fetch     : KO"
echo "fichier   : $(git diff --quiet origin/main -- server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts && echo 'identique à origin/main' || echo 'DIFFÉRENT de origin/main')"
```

Si une ligne est KO, s'arrêter et expliquer quoi faire. Ne pas contourner :

| Ligne | Si KO |
|---|---|
| repo | Pas dans un clone de La Bonne Alternance. Demander le chemin du clone local et y exécuter toutes les commandes. Sans clone local, le skill ne peut pas fonctionner. |
| gh | `gh` absent ou non connecté : `gh auth login` (compte GitHub membre de l'org `mission-apprentissage`). |
| gh accès | Le compte n'a pas accès au repo : demander l'ajout à l'org. |
| node | Node.js requis pour le script d'insertion. L'installer (le repo en a besoin de toute façon). |
| yarn deps | `yarn install` à lancer dans le repo : `yarn check:fix` et les hooks de pre-commit (lint-staged, gitleaks) en dépendent. Sans ça, le commit échouera après modification du fichier. |
| script | `${CLAUDE_SKILL_DIR}` non résolu ou skill incomplet : vérifier l'installation du skill (dossier `scripts/` présent). |
| tree | Working tree non vide : demander à l'utilisateur de committer ou mettre de côté ses changements. `/pull-request-lba` fait `git add -A` sur une branche créée depuis `origin/main` : tout changement en cours partirait dans la PR. |
| fetch | Pas de réseau ou remote inaccessible. |
| fichier | Le fichier local n'est pas celui de `main` (branche en retard). Le remettre à l'état de `main` avant de continuer, la PR doit partir de là : `git checkout origin/main -- server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts` |

Quand tout est OK, continuer.

---

## Étape 1 — Collecter les noms de CFA

Les noms peuvent être passés directement après la commande, séparés par `;` ou par des retours à la ligne
(les noms de CFA contiennent souvent des virgules, des espaces et des apostrophes) :

- `/add-cfa-to-blacklist Cfa Élite Formation` → 1 CFA
- `/add-cfa-to-blacklist Cfa Élite Formation ; Institut Machin` → 2 CFA

Si aucun nom n'est fourni, poser **une seule** question :

```
Quel(s) CFA blacklister ? Donne le libellé exact tel qu'il apparaît comme nom d'employeur
dans les offres (un par ligne ou séparés par « ; »).
```

Attendre la réponse avant de continuer.

Avant d'insérer, avertir (sans bloquer) si un nom est risqué :
- **≤ 3 caractères** ou **un seul mot courant** (ex. `FORMATION`, `ECOLE`, `CAMPUS`) → risque de bloquer des employeurs légitimes par inclusion de mots.
- Contient un lieu ou un suffixe qui semble être une variante (ex. `WIN LYON` alors que `WIN` n'est pas générique) → c'est normal, la liste contient déjà ce type d'entrées.

---

## Étape 2 — Normaliser et insérer

Lancer le script fourni avec le skill (Node, sans dépendance). Il normalise, détecte les doublons et insère
chaque entrée à sa place alphabétique sans retrier la liste existante :

Toujours passer les noms **par stdin avec un heredoc à délimiteur quoté** (`<<'NAMES'`), jamais en arguments
interpolés : un libellé venu d'une demande support peut contenir `"`, `$(` ou des backticks, et le heredoc quoté
neutralise toute interprétation par le shell.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/add-cfa.mjs" --stdin \
  --file server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts <<'NAMES'
<nom 1>
<nom 2>
NAMES
```

Le script imprime un tableau `Entrée fournie | Normalisée | Résultat` puis :
- code retour `0` → au moins une entrée insérée, le fichier est modifié ;
- code retour `2` → rien inséré (toutes déjà présentes) → **afficher le tableau et s'arrêter, pas de PR** ;
- code retour `1` → fichier non trouvé ou format inattendu → afficher l'erreur et s'arrêter.

Règles appliquées par le script (ne pas les refaire à la main) :
- normalisation : majuscules, sans accents ni ligatures (`Œ` → `OE`, `ß` → `SS`), apostrophes typographiques → `'`,
  espaces multiples → un seul (`Cfa Élite Formation` → `CFA ELITE FORMATION`) ;
- doublon : comparaison avec la même normalisation que le runtime (`stringNormaliser` de `shared`), donc
  `Académie du Tourisme` est reconnu comme déjà présent via `ACADÉMIE DU TOURISME` ;
- position : avant la première entrée existante qui trie après (comparaison sans accents). La liste actuelle
  n'est pas strictement triée, on ne la retrie pas (ça ferait un diff de 1 700 lignes).
- avertissements ⚠️ (l'entrée est quand même insérée) : « déjà couverte par inclusion via `X` » (le runtime
  bloque déjà ce nom grâce à une entrée plus courte, l'ajout est probablement inutile) ou « couvrirait N entrées
  existantes » (le nom est court/générique et bloquerait large). Dans les deux cas, relayer l'avertissement à
  l'utilisateur à l'étape 3 et lui laisser décider.

Ne jamais supprimer ou modifier une entrée existante avec ce skill.

---

## Étape 3 — Récapitulatif et confirmation

Afficher le tableau du script et le diff :

```bash
git diff --stat
git diff server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts
```

Le diff doit contenir **uniquement des lignes ajoutées** (`+  "NOM",`), une par entrée insérée. Sinon, s'arrêter et
restaurer le fichier (`git checkout -- server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts`).

Demander confirmation :

```
<N> entrée(s) prête(s) à être ajoutée(s) : <NOM1>, <NOM2>.
J'ouvre la PR ? (oui / non)
```

Si « non » → restaurer le fichier et s'arrêter.

---

## Étape 4 — Ouvrir la PR via `/pull-request-lba`

Invoquer le skill `pull-request-lba` (tool Skill) avec les arguments `fix aucune` (type `fix`, **sans issue**)
et lui fournir les valeurs pré-rédigées ci-dessous, qu'il doit utiliser telles quelles :

- **Branche** : `fix/blacklist-cfa-<premier-nom-en-kebab>` ; si plusieurs entrées, suffixer `-et-<N-1>-autres`
  (ex. `fix/blacklist-cfa-cfa-elite-formation-et-2-autres`). Tronquer à ~50 caractères.
- **Commit** : `fix: ajout de <N> CFA à la liste de blocage` (`fix: ajout de 1 CFA à la liste de blocage` au singulier).
- **Titre PR** : `fix: MAJ liste CFA blacklist — <NOM1>[, <NOM2>...]` (tronquer la liste à 3 noms puis `...`).
- **Body PR** :

```markdown
## Changements

Ajout à `cfaCompanyList` (`server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts`) :

- `<NOM1>`
- `<NOM2>`

Entrées ignorées car déjà présentes : <liste ou « aucune »>.

Généré via le skill `/add-cfa-to-blacklist` (demande support, sans ticket).

## Plan de test

- [ ] `yarn test server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.test.ts` passe
- [ ] `isCompanyInBlockedCfaList("<NOM1>")` renvoie `true`
- [ ] Le diff ne contient que des lignes ajoutées
```

Pas de `Closes #`, pas de numéro d'issue dans le titre ni le body.

**Repli** si le tool Skill n'est pas disponible : exécuter toi-même les étapes 3 à 9 de `pull-request-lba` avec les
mêmes conventions, dans cet ordre :

```bash
git checkout -b <branche> origin/main
yarn check:fix
git add -A
git commit -m "<message de commit>"
git push -u origin <branche>
gh pr create --title "<titre>" --assignee <login GitHub de l'utilisateur> --body "<body>"
```

Jamais de `--no-verify`, jamais de push sur `main`, pas de mention d'IA ni de co-author dans le commit.

---

## Étape 5 — Conclure

Afficher l'URL de la PR et rappeler :

```
PR ouverte : <URL>
Les nouvelles entrées seront actives après merge et déploiement, au prochain passage du job de blocage
des offres partenaires (blockJobsPartnersFromCfaList).
```

---

## Notes

- Fichier cible : `server/src/jobs/offre-partenaire/is-company-in-blocked-cfa-list.ts`, tableau `cfaCompanyList`, une entrée par ligne.
- Le skill ajoute uniquement ; retirer un CFA de la liste reste une PR manuelle.
- Si `/pull-request-lba` demande le login GitHub de l'utilisateur, le laisser gérer (il le résout en mémoire).
- Ce skill ne doit jamais se déclencher implicitement : uniquement via `/add-cfa-to-blacklist`.
