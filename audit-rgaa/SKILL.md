---
name: audit-rgaa
description: "Audit d'accessibilité RGAA 4.1.2 de toute l'UI du projet Next.js courant (La bonne alternance, BAL, api-apprentissage…) pour un critère précis (ex. 1.1) ou une thématique entière (ex. 1 ou 'images') : inventorie pages et composants, applique les sondes du critère à tout le code, qualifie chaque occurrence, puis rend un rapport avec anomalies, corrections proposées et pages impactées, ou déclare le critère conforme. Déclenche sur : '/audit-rgaa', 'audit accessibilité', 'auditer le critère', 'passer en revue tout le site pour', 'état de conformité du critère', 'RGAA thème'."
---

# audit-rgaa — Audit RGAA d'un critère ou d'une thématique sur toute l'UI

Tu agis comme auditeur RGAA et développeur front senior. L'audit est **le tien** : un scanner ne couvre qu'un tiers des critères, et aucune conformité ne se déclare sans avoir qualifié chaque occurrence trouvée.

Différence avec `review-rgaa` : `review-rgaa` regarde un diff (PR, branche) et tous les critères ; `audit-rgaa` regarde **tout le code UI** pour **un ou quelques critères**. Les deux partagent les références de `review-rgaa` quand elles sont installées.

**Référentiel** : RGAA 4.1.2 (106 critères, 13 thématiques). WCAG 2.2 AA et WAI-ARIA 1.2 servent de lecture complémentaire, pas de périmètre.

---

## 1. Déterminer la cible

Lire `$ARGUMENTS`. Formes acceptées :

| Argument | Cible |
|---|---|
| `1.1` | un critère |
| `1.1 1.2 6.1` | plusieurs critères, un rapport par critère |
| `1` ou `images` | toute la thématique (voir tableau) |
| `11 --runtime` | thématique + vérification navigateur (section 5) |
| `1.1 --pages /recherche,/contact` | restreint aux pages listées (et à leurs composants) |
| aucun argument | demander la cible : c'est le seul cas où une question est nécessaire |

Un argument qui n'est ni un numéro valide ni un nom de thématique s'arrête sur une ligne d'erreur qui liste les 13 thématiques.

| N° | Thématique | Critères |
|---|---|---|
| 1 | Images | 1.1 → 1.9 |
| 2 | Cadres | 2.1, 2.2 |
| 3 | Couleurs | 3.1 → 3.3 |
| 4 | Multimédia | 4.1 → 4.13 |
| 5 | Tableaux | 5.1 → 5.8 |
| 6 | Liens | 6.1, 6.2 |
| 7 | Scripts | 7.1 → 7.5 |
| 8 | Éléments obligatoires | 8.1 → 8.10 |
| 9 | Structuration de l'information | 9.1 → 9.4 |
| 10 | Présentation de l'information | 10.1 → 10.14 |
| 11 | Formulaires | 11.1 → 11.13 |
| 12 | Navigation | 12.1 → 12.11 |
| 13 | Consultation | 13.1 → 13.12 |

Pour l'énoncé exact, le test de code et la correspondance WCAG de chaque critère, lire `~/.claude/skills/review-rgaa/references/criteres.md` (ou `<repo mna-skills>/review-rgaa/references/criteres.md`). Si ce fichier est absent, s'appuyer sur l'énoncé officiel du RGAA 4.1.2 et le dire dans le rapport.

---

## 2. Détecter le projet et inventorier l'UI

Ne rien supposer du repo : le skill tourne sur LBA, BAL, api-apprentissage ou un autre projet Next.js.

1. **Racine UI** : chercher `package.json` contenant `"next"` (`ui/package.json` dans les repos de la mission, sinon la racine). Noter `UI_ROOT`.
2. **Stack** : dans ce `package.json`, relever `@codegouvfr/react-dsfr`, `@mui/material`, `@chakra-ui/react`, `tailwindcss`, `formik`, `react-hook-form`, `downshift`, `react-dropzone`, `next-plausible`. Les sondes de `references/sondes.md` ont des variantes par bibliothèque : n'appliquer que celles de la stack détectée.
3. **Routes** : `find $UI_ROOT/app -name "page.tsx" -o -name "page.jsx"` (App Router) et `$UI_ROOT/pages/**` (Pages Router). Noter les `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` : ce sont aussi des pages.
4. **Composants** : tous les `*.tsx` / `*.jsx` sous `$UI_ROOT` hors `node_modules`, `.next`, `out`, `dist`, `coverage`, `e2e`, `tests`, `__tests__`, `*.test.*`, `*.stories.*`, `scripts`. Compter les fichiers : ce nombre figure dans le rapport (couverture).
5. **Styles** : `*.css`, `*.scss`, thème MUI (`theme/`), `sx` inline. Concernés par les thèmes 3 et 10.
6. **Registre des titres et métadonnées** : `metadata`, `generateMetadata`, `METADATA` (LBA : `ui/utils/routes.metadata.utils.ts`).
7. **Graphe composant → pages** : pour rattacher une anomalie aux pages qui la rendent, remonter les imports (`grep -rl "from \"@/…/Composant\""`) jusqu'aux `page.tsx` / `layout.tsx`. Un composant importé par un `layout.tsx` racine ou par le header/footer touche toutes les pages : le dire.

Écrire l'inventaire dans le scratchpad (`inventaire.md` : racine, stack, nombre de pages, nombre de composants, liste des routes). Le rapport y renvoie.

**Contexte LBA** : si le repo est `labonnealternance`, charger `~/.claude/skills/review-rgaa/references/audit-2025.md` : statut du critère dans l'audit du 25/11/2025, pages NC, correspondance pages ↔ routes, méthode de calcul des points. Le rapport indique alors ce que l'audit a relevé, ce qui est corrigé, ce qui reste, et le gain si le critère bascule (+1,67 pt par critère). Pour un autre repo, cette section n'existe pas : ne pas l'inventer.

---

## 3. Auditer chaque critère

Pour chaque critère de la cible, dans l'ordre :

### 3.1 Applicabilité
Lancer la **sonde d'inventaire** du critère (`references/sondes.md`). Si aucun élément concerné n'existe dans le code (aucun `<iframe>` pour 2.1, aucun `<video>` pour 4.x, aucun `<table>` pour 5.x), le critère est **Non applicable**, avec la preuve : la commande lancée et son résultat vide, confirmée par une seconde recherche de forme différente (un `grep` vide n'est pas une preuve d'absence).

### 3.2 Collecte
Lancer les **sondes de détection** du critère sur tout `UI_ROOT`. Chaque occurrence est un **candidat**, pas une anomalie. Consigner le nombre de candidats.

### 3.3 Qualification
Ouvrir chaque candidat dans son contexte (10 lignes autour, le composant parent si nécessaire) et trancher selon les **règles de qualification** du critère : anomalie, conforme, ou non décidable statiquement. Une sonde qui matche un composant qui fait le travail (react-dsfr `Input` avec `label`, MUI `TextField` avec `id`) se classe conforme après lecture, pas avant.

- **Plus de 40 candidats** : découper par dossier et déléguer à des sous-agents en parallèle avec la même grille de qualification (extrait de `sondes.md` collé dans le prompt) ; chacun rend un tableau `fichier:ligne | extrait | verdict | justification`. Consolider ensuite soi-même.
- **Composants partagés** : qualifier une seule fois, lister toutes les pages rendues.
- **Non décidable statiquement** (contraste calculé, focus visible, ordre de tabulation, restitution d'un composant tiers) : classer « à vérifier au runtime » et compter à part. Ne jamais l'écrire « conforme ».

### 3.4 Correction
Pour chaque anomalie : la correction en React, prête à coller, dans l'ordre composant du design system → bibliothèque UI (`slotProps`, `component=`) → HTML natif. Les patterns par stack sont dans `~/.claude/skills/review-rgaa/references/patterns-stack.md`. Quand la même anomalie se répète dans N fichiers, proposer la correction **à la source** (composant partagé, wrapper, règle de lint) plutôt que N patchs.

### 3.5 Verdict du critère
- **Non conforme** : au moins une anomalie confirmée.
- **Conforme** : tous les candidats qualifiés conformes, sondes lancées sur toute la racine UI, aucun point « runtime » en attente. Préciser « sur le code statique » si des points runtime restent.
- **Non applicable** : voir 3.1.
- **Non vérifiable statiquement** : aucun candidat anormal mais le critère exige le rendu (3.2, 3.3, 10.4, 10.7, 10.11, 10.12, 12.8, 13.7, 13.9). Verdict réservé à la section 5.

Ne pas remplir. Un critère conforme se dit en trois lignes : verdict, ce qui a été contrôlé, comment.

---

## 4. Angles morts (à passer pour chaque critère audité)

- **Le composant tiers** : lire le DOM que produit MUI, react-dsfr ou downshift dans le cas d'usage réel (`renderGroup`, `slotProps`, `nativeInputProps`), pas la documentation.
- **Le rendu conditionnel** : un `alt`, un `label`, un `aria-label` présent dans une branche et absent dans l'autre (`{icon ? <img alt=… /> : <img />}`).
- **Les chaînes calculées** : `alt={title}` ou `aria-label={label}` sont conformes seulement si la valeur ne peut pas être vide ou technique ; remonter à la source de la donnée.
- **Les deux arbres** : desktop et mobile rendus tous deux en DOM (`display: none`) doublent les `id`, les `h1`, les liens d'évitement.
- **Le contenu externe** : Notion, Markdown, CMS, emails HTML rendus dans l'UI (`dangerouslySetInnerHTML`, `react-notion-x`) : la conformité dépend de la transformation appliquée, pas du contenu source. Le signaler comme zone à risque, auditer le transformateur.
- **Le nom accessible ≠ libellé visible** : tout `aria-label` ou `title` doit commencer par le texte affiché (WCAG 2.5.3).

---

## 5. Vérifier au runtime (optionnel, `--runtime`)

Pour les critères non vérifiables statiquement, ou pour confirmer un verdict : outils du navigateur intégré de Claude Code, configurations de `.claude/launch.json` du repo (`ui-dev`, `server-dev` pour LBA ; vérifier le nom dans le repo courant). Si la session n'expose pas ces outils, le dire et livrer le verdict statique.

1. `preview_start`, puis parcourir un **échantillon de routes** : toutes les routes statiques de l'inventaire ; pour les routes dynamiques, une instance par gabarit (prendre les URL du sitemap ou demander un identifiant). Les pages authentifiées sont marquées « non testées » sauf si un compte de test est fourni.
2. `read_page` : arbre d'accessibilité (noms, rôles, états, titres, landmarks).
3. `javascript_tool` : contrôles mécaniques du critère (voir `sondes.md`, colonne runtime : titres, landmarks, `id` dupliqués, références ARIA cassées, contraste calculé, `scrollWidth` à 320 px).
4. axe-core : la CSP des projets de la mission (`script-src 'self'`) interdit tout CDN. Servir `axe.min.js` depuis `$UI_ROOT/public` le temps de la session (fichier à supprimer ensuite, jamais commité) ou script Playwright avec `@axe-core/playwright` ; `axe-core` en devDependency à proposer, jamais à installer sans accord.
5. Clavier : `computer` avec `action: "key"`, `text: "Tab"`, puis `screenshot`.

Toute preuve runtime est citée dans le rapport avec la route testée.

---

## 6. Rapport

Écrire le rapport dans le scratchpad (`rapport-rgaa-<critères>-<date>.md`) selon `references/rapport.md`, puis le restituer dans la conversation. Ne rien écrire dans le repo sans demande.

Structure, par critère audité :

```
## Critère 1.1 — Chaque image porteuse d'information a-t-elle une alternative textuelle ?
Verdict : Non conforme   Sévérité max : Bloquant
Couverture : 312 fichiers scannés · 87 candidats · 79 conformes · 6 anomalies · 2 à vérifier au runtime
Audit 11/2025 (LBA) : NC sur P23 · reste NC (1 anomalie sur P23) · bascule si A1 et A4 corrigées : +1,67 pt
```

Puis :

**Anomalies** — `A1, A2…` numérotation stable par critère : `An — fichier:ligne` · extrait · pages impactées (routes) · sévérité (Bloquant / Majeur / Mineur, échelle de l'audit) · impact utilisateur · correction (bloc de code). Regrouper les anomalies identiques d'un composant partagé sous un seul `An` avec la liste des fichiers.

**Correction à la source** — quand plusieurs anomalies partagent une cause (composant, helper, règle CSS) : la modification unique qui les règle toutes.

**Conformes** — une ligne : ce qui a été contrôlé et trouvé conforme (« 79 `<img>` avec `alt` pertinent, 14 `<svg>` décoratifs masqués »).

**À vérifier au runtime** — liste courte avec la route et le test attendu.

**Zones non couvertes** — contenu externe, pages authentifiées non testées, fichiers exclus.

Un critère **conforme** tient en un bloc : verdict, couverture, une ligne « Conformes », zéro anomalie. Un critère **non applicable** : verdict, preuve d'absence (deux recherches), une ligne.

Terminer par un récapitulatif (tableau critère → verdict → anomalies → gain LBA le cas échéant) et un `AskUserQuestion` : appliquer les corrections (toutes ou sélection par `An`), lancer le runtime, ouvrir des issues (`/lba-issue` sur LBA), publier le rapport en Artifact.

---

## 7. Appliquer les corrections

Sur demande uniquement. Corriger par numéro, à la source quand c'est possible, en respectant `patterns-stack.md`. Relancer le typecheck du projet (`yarn typecheck`, `pnpm typecheck`, selon le repo) et la sonde du critère pour montrer que le compte d'anomalies tombe à zéro. Ne pas commiter ni pousser : l'utilisateur commite lui-même. Enchaîner sur le skill de PR du projet s'il le demande.

---

## Règles importantes

- Une anomalie = critère + preuve (`fichier:ligne`, extrait) + pages impactées + correction. Pas de finding sans les quatre.
- Une conformité = couverture chiffrée + méthode. « Aucune occurrence trouvée » exige deux recherches de forme différente.
- Distinguer toujours statique et runtime. Ce qui n'a pas été rendu n'est pas « conforme », il est « conforme sur le code statique » ou « à vérifier ».
- Les chiffres de points ne concernent que LBA et l'échantillon du 25/11/2025 : les citer comme tels, jamais pour un autre repo.
- Aucune mention de Claude, d'IA ou d'outil de génération dans un rapport destiné à être partagé.
