---
name: pull-request-lba
description: >
  Crée une branche Git, commite les changements et ouvre une PR GitHub pour le projet La Bonne Alternance.
  Synchronise aussi le statut de l'issue liée dans le GitHub Project "La bonne alternance".
  Déclencher dès que l'utilisateur veut créer une PR, une branche, commiter son travail, soumettre
  pour review, ou qu'il passe un numéro d'issue ou une URL GitHub en argument — même sans mentionner
  "/lba-pr" explicitement.
---

# Skill : LBA PR

## Objectif

En une commande : créer une branche depuis `main`, commiter les changements, ouvrir une PR GitHub,
et mettre à jour le statut de l'issue liée dans le GitHub Project "La bonne alternance".

## Références projet (hardcodées)

- **Org / Repo** : `mission-apprentissage/labonnealternance`
- **GitHub Project ID** : `PVT_kwDOA8sl_s4BW3Li`
- **Champ Status** : `PVTSSF_lADOA8sl_s4BW3LizhSIG_8`
  - `en-cours` → `47fc9ee4`
  - `en-revu-technique` → `df73e18b`
  - `pret-a-tester` → `61e4505c`
  - `terminer` → `98236657`

## Étape 0 — Résoudre l'assignee

Vérifier en mémoire si le login GitHub de l'utilisateur est connu (fichier `user_github_login.md` dans le répertoire mémoire du projet) :
- **Connu** → utiliser ce login comme `<ASSIGNEE>` pour toute la session, sans poser de question
- **Inconnu** → appeler `list_members`, présenter la liste, demander "quel est ton login GitHub ?", sauvegarder la réponse en mémoire (type `user`, fichier `user_github_login.md`), puis utiliser ce login comme `<ASSIGNEE>`

---

## Étape 1 — Collecter les informations

Les arguments peuvent être passés directement après la commande :

- `/lba-pr feat 3456` → type = `feat`, issue = `3456`
- `/lba-pr fix 1234` → type = `fix`, issue = `1234`
- `/lba-pr https://github.com/mission-apprentissage/labonnealternance/issues/4691` → extraire `4691`, demander le type
- `/lba-pr feat https://github.com/.../issues/4691` → type = `feat`, issue = `4691`

Si l'argument est une URL GitHub d'issue, extraire le numéro automatiquement depuis le path.

Si des informations manquent, poser les questions manquantes **en une seule fois** :

```
Quel type de changement ?
  1) feat  — nouvelle fonctionnalité
  2) fix   — correction de bug
  3) chore — maintenance, dépendances, config

Quel est le numéro de l'issue GitHub ?
  (ex: 1234, une URL GitHub, ou "créer" pour en créer une nouvelle)
```

Attendre la réponse avant de continuer.

## Étape 2 — Gérer l'issue

### Cas A — Issue existante

Demander le statut à donner dans le projet (question séparée, après avoir le numéro) :

```
Quel statut donner à l'issue dans le projet ?
  1) en-cours          (je commence le développement)
  2) en-revu-technique (je soumets pour review)
```

Puis récupérer l'item projet et mettre à jour le statut. Le `first: 100` et le `| first` dans le jq
évitent les edge cases où une issue a beaucoup de project items ou le filtre retourne plusieurs lignes :

```bash
ITEM_ID=$(gh api graphql -f query='
  query($owner: String!, $repo: String!, $issue: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $issue) {
        projectItems(first: 100) {
          nodes { id project { number } }
        }
      }
    }
  }
' -f owner="mission-apprentissage" -f repo="labonnealternance" -F issue=<NUMERO> \
--jq '[.data.repository.issue.projectItems.nodes[] | select(.project.number == 14) | .id] | first')

if [[ -z "$ITEM_ID" || "$ITEM_ID" == "null" ]]; then
  # Issue pas encore dans le projet, l'y ajouter
  ITEM_ID=$(gh project item-add 14 --owner mission-apprentissage \
    --url "https://github.com/mission-apprentissage/labonnealternance/issues/<NUMERO>" \
    --format json --jq '.id')
fi

gh api graphql -f query='
  mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }) { projectV2Item { id } }
  }
' -f projectId="PVT_kwDOA8sl_s4BW3Li" \
  -f itemId="$ITEM_ID" \
  -f fieldId="PVTSSF_lADOA8sl_s4BW3LizhSIG_8" \
  -f optionId="<OPTION_ID_STATUT_CHOISI>"
```

### Cas B — Pas d'issue ("créer")

Analyser `git diff --stat` et le contenu des fichiers modifiés pour inférer un titre et une description
pertinents. Proposer à l'utilisateur sans poser de question :

```
Je vais créer l'issue avec :
  Titre : <titre inféré>
  Description : <description inférée>
Confirme ou corrige.
```

Attendre la confirmation avant de continuer. Si l'utilisateur valide sans rien dire, utiliser les valeurs proposées.

Créer l'issue, l'ajouter au projet en `en-cours` :

```bash
ISSUE_URL=$(gh issue create \
  --title "<titre>" \
  --body "<description>" \
  --assignee <ASSIGNEE>)

NUMERO=$(echo "$ISSUE_URL" | grep -oP '\d+$')

ITEM_ID=$(gh project item-add 14 --owner mission-apprentissage \
  --url "$ISSUE_URL" --format json --jq '.id')

gh project item-edit \
  --project-id PVT_kwDOA8sl_s4BW3Li \
  --id "$ITEM_ID" \
  --field-id PVTSSF_lADOA8sl_s4BW3LizhSIG_8 \
  --single-select-option-id 47fc9ee4
```

Afficher : "Issue #<NUMERO> créée et ajoutée au projet en 'en-cours' : <URL>"

## Étape 3 — Vérifier l'état Git

```bash
git status && git diff --stat
```

Si le working tree est propre et rien n'est staged → informer l'utilisateur et arrêter.

## Étape 4 — Créer la branche

Avec issue :
```bash
git fetch origin main
git checkout -b <type>/issue-<NUMERO> origin/main
```

Sans issue (branche nommée d'après le contenu) :
```bash
git fetch origin main
git checkout -b <type>/<description-courte-kebab> origin/main
```

Si la branche existe déjà, demander : supprimer et recréer, ou utiliser telle quelle.

## Étape 5 — Corriger le formatage

```bash
yarn check:fix
```

Si des erreurs non auto-corrigibles apparaissent, les afficher et arrêter.

## Étape 6 — Stager et commiter

```bash
git add -A
```

Message en conventional commit, en français, **sans numéro d'issue** (le lien est dans la PR) :

```bash
git commit -m "$(cat <<'EOF'
<type>: <description concise en minuscules>
EOF
)"
```

Ne jamais ajouter de référence à Claude, co-authored-by ou mention d'IA dans le message de commit.
Ne jamais utiliser `--no-verify`. Si un hook échoue, corriger avant de recommitter.

## Étape 7 — Pusher

```bash
git push -u origin <nom-branche>
```

## Étape 8 — Créer la PR

Le titre ne contient pas le numéro d'issue — `Closes #XXXX` dans le body établit le lien.
Ne jamais écrire `#N` dans le body sauf pour `Closes #N` : GitHub transforme tout `#N` en
lien cliquable, ce qui crée des références parasites vers d'autres issues ou PRs.

Avec issue :
```bash
gh pr create \
  --title "<type>: <description>" \
  --assignee <ASSIGNEE> \
  --body "$(cat <<'EOF'
Closes #<NUMERO>

## Changements

- <bullet points en français>

## Plan de test

- [ ] <étapes de test>
EOF
)"
```

Sans issue :
```bash
gh pr create \
  --title "<type>: <description>" \
  --assignee <ASSIGNEE> \
  --body "$(cat <<'EOF'
## Changements

- <bullet points en français>

## Plan de test

- [ ] <étapes de test>
EOF
)"
```

Ne pas ajouter la PR au GitHub Project — elle s'y lie automatiquement via `Closes #N`
dans le champ "Linked pull requests" de l'item issue. Créer un item PR séparé casserait
la gestion du statut (deux items indépendants au lieu d'un).

## Étape 9 — Afficher l'URL de la PR

## Notes

- Le login GitHub de l'utilisateur est résolu en mémoire à l'étape 0 (`user_github_login.md`)
- Branches nommées `<type>/issue-<NUMERO>` (minuscules)
- Ne jamais force-push sur `main`
- Si CI échoue après la PR, investiguer — ne pas ignorer
