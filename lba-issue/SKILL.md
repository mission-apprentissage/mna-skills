---
name: lba-issue
description: "Crée ou améliore un GitHub issue structuré pour La Bonne Alternance, prêt à être exécuté par le Copilot coding agent. Utilise ce skill dès que l'utilisateur veut créer, rédiger, améliorer ou soumettre une issue GitHub pour LBA — qu'il parte de zéro, qu'il ait un brouillon vague, ou qu'il décrive simplement un problème ou une idée. Déclenche aussi sur : 'créer une issue', 'ouvrir un ticket', 'rédiger un bug', 'proposer une feature', 'il faudrait faire', 'je veux signaler', 'peux-tu créer un issue pour', et tout énoncé de problème ou de besoin sur la plateforme LBA."
---

# lba-issue — Créateur d'issues GitHub pour La Bonne Alternance

Tu aides à créer un GitHub issue bien structuré pour le projet **La Bonne Alternance** (`mission-apprentissage/labonnealternance`), prêt à être exécuté en autonomie par le **Copilot coding agent**.

L'audience est large : dev, PO, data, bizdev, growth. Tout le monde doit pouvoir ouvrir une issue de qualité sans connaître les détails techniques. Ton rôle est de poser les bonnes questions et d'injecter le contexte technique que l'utilisateur ne connaît pas forcément.

---

## Détecter le mode dès le départ

**Mode amélioration** — l'utilisateur a fourni un brouillon ou une description substantielle → analyser ce qu'il manque, compléter, restructurer, puis présenter le résultat.

**Mode interactif** — l'utilisateur part de zéro ou n'a qu'une idée vague → poser les questions une par une dans l'ordre ci-dessous. Ne pas les poser toutes d'un coup.

**Mode découpe** — l'utilisateur décrit un besoin large à décomposer, ou demande explicitement de créer des sous-issues → voir section dédiée ci-dessous.

---

## Questions à poser en mode interactif (dans l'ordre)

1. **Type** : Bug / Feature / Task ?
2. **Titre** : une phrase courte qui sera le titre GitHub (ex. "Les emails de confirmation ne s'envoient pas")
3. **Contexte métier** : pourquoi ce besoin ? Qui est impacté ?
4. **Description** :
   - *Bug* : que se passe-t-il ? Que devrait-il se passer ? Comment reproduire ?
   - *Feature / Task* : qu'est-ce qu'on veut construire ou faire ?
5. **Critères d'acceptation** : demander un critère à la fois, continuer jusqu'à "stop" ou "c'est tout"
6. **Zone technique** : UI / Serveur / Shared / je ne sais pas
7. **Fichiers ou routes concernés** (optionnel) : passer si l'utilisateur ne sait pas
8. **Équipe** : Developer / Growth / UX/UI / Data / PO/PM / DevOps (optionnel — passer si incertain)
9. **Assignee** (optionnel) : dès que l'utilisateur veut assigner quelqu'un, appeler `list_members` proactivement et présenter la liste directement — ne pas attendre qu'il la demande. Ne jamais assigner ou déduire une équipe à partir d'une simple mention d'une personne dans le titre ou la description : une mention n'est pas une demande d'assignation. Si aucune assignation n'est explicitement demandée, laisser le champ vide.
10. **Priorité** : P1 bloquant / P2 important / P3 normal / P4 faible
11. **Sprint** (optionnel) : veut-il assigner ce ticket à un sprint, y compris un sprint futur ? Appeler `list_sprints` pour proposer la liste (avec dates), passer si l'utilisateur ne sait pas ou ne veut pas
12. **Issue parente** (optionnel) : cette issue est-elle une sous-issue d'un ticket existant ? Si un numéro de ticket a déjà été mentionné par l'utilisateur en décrivant CETTE issue (message initial ou immédiatement précédent), ne pas reposer la question — utiliser directement ce numéro. Ne jamais réutiliser un numéro mentionné pour une issue différente créée plus tôt dans la même conversation. Sinon, demander le numéro (`#123`)
13. **Bloquée par** (optionnel) : cette issue est-elle bloquée par d'autres tickets ? Si oui, demander les numéros (ex. `#45, #67`)

---

## Structure de l'issue à produire

Utilise exactement ce format :

```
## Contexte
[Pourquoi ce besoin existe — contexte métier, impact utilisateur]

## Problème / Besoin
[Description précise.
Bug : comportement actuel, comportement attendu, étapes de reproduction.
Feature/Task : ce qu'on veut faire et pourquoi.]

## Critères d'acceptation
- [ ] Critère vérifiable et testable 1
- [ ] Critère vérifiable et testable 2

## Contexte technique
- **Zone** : ui / server / shared (ou plusieurs)
- **Fichiers / routes concernés** : (ex. `server/src/http/controllers/jobs.controller.ts`)
- **Patterns à suivre** : (ex. voir les autres controllers pour le pattern Fastify + Zod)
- **Contraintes** : (ex. doit passer `yarn typecheck` et `yarn lint`, ne pas modifier l'API publique)

## Définition of Done
- [ ] Code review approuvée et mergée
- [ ] `yarn typecheck` passe
- [ ] `yarn lint` passe
- [ ] Tests ajoutés ou mis à jour si pertinent
- [ ] Testé en local
```

---

## Comment enrichir le contexte technique

Si l'utilisateur ne connaît pas les fichiers ou la zone technique, appuie-toi sur cette structure :

**Stack :**
- UI : Next.js 15 App Router, Chakra UI + DSFR (design system gouvernemental français)
- Server : Fastify + TypeScript strict, MongoDB
- Shared : Zod schemas et types partagés entre UI et server
- Tests : Vitest (unit + integration avec MongoDB réel)
- CI : typecheck + lint + prettier + tests (pas de build en CI)

**Structure :**
- `ui/app/` — pages Next.js App Router (routes)
- `ui/components/` — composants réutilisables
- `server/src/http/controllers/` — handlers API
- `server/src/services/` — logique métier
- `server/src/jobs/` — traitements batch
- `shared/src/routes/` — schémas Zod des routes API
- `shared/src/models/` — types TypeScript partagés

Quand l'utilisateur décrit un problème sur l'UI (candidats, employeurs, formations), oriente vers `ui/`. Quand c'est lié à une API, emails, imports de données, oriente vers `server/`.

---

## Ce qui rend une issue exécutable par Copilot

Une issue que Copilot peut exécuter seul a :
- Un **scope étroit** : une seule chose à faire, pas de dépendances implicites
- Des **critères d'acceptation vérifiables** individuellement (pas "ça marche mieux")
- Des **chemins de fichiers** quand c'est possible
- **Zéro ambiguïté** sur ce que "terminé" signifie
- Les **exigences de test explicites**

Si l'issue est trop large pour Copilot, signale-le et propose de la découper en sous-issues.

---

## Mode découpe — parent + sous-issues en une session

Déclencher quand l'utilisateur :
- décrit un besoin large qu'il veut décomposer en sous-issues
- demande explicitement "crée-moi des sous-issues pour X"
- mentionne un ticket parent qui n'existe pas encore

### Étape 1 — Proposer la décomposition

Analyser le besoin et proposer :
- une **issue parente** (titre + contexte haut niveau, sans critères d'acceptation détaillés — c'est un ticket chapeau)
- N **sous-issues** avec chacune un scope étroit et des critères d'acceptation vérifiables

Présenter le plan complet et demander validation avant toute création.

### Étape 2 — Créer le parent en premier

Appeler `create_issue` pour l'issue parente → récupérer son **numéro** dans la réponse (ex. `#142`).

### Étape 3 — Créer les sous-issues en séquence

Pour chaque sous-issue, appeler `create_issue` avec `parent_issue_number` = numéro récupéré à l'étape 2.

Ne pas paralléliser : créer les sous-issues une par une pour garder la lisibilité des retours et détecter une éventuelle erreur.

### Étape 4 — Récapitulatif

Afficher un tableau récapitulatif :

| Issue | URL | Lien parent |
|---|---|---|
| Parente | url | — |
| Sous-issue 1 | url | ✅ #142 |
| Sous-issue 2 | url | ✅ #142 |

---

## Création finale via MCP

Une fois l'issue construite et validée par l'utilisateur :

1. Présente le résultat complet
2. Demande : "Je crée l'issue sur GitHub ?"
3. Si oui, enchaîner ces appels MCP dans l'ordre :

**Étape 1 — Créer l'issue**
Appeler `create_issue` avec :
- `title` : le titre de l'issue
- `description` : le body complet au format markdown (sections Contexte, Problème, Critères, etc.)
- `assignees` : tableau avec le login GitHub si un assignee a été choisi, sinon omettre
- `parent_issue_number` : numéro de l'issue parente si renseigné (number, pas string)
- `blocked_by` : tableau des numéros d'issues bloquantes si renseignés (number[], pas string[])

→ Récupérer dans la réponse le **project item ID** _(status, team, epic, approver, sprint)_ et l'**issue node ID** _(priority, type)_ — les deux sont distincts et clairement étiquetés.
→ Si `parent_issue_url` est présent dans la réponse, l'afficher.
→ Si `blocked_by` est présent dans la réponse, confirmer les liaisons établies.

**Étapes 2 & 3 — Définir le type et la priorité** (toujours, en parallèle)

Les deux utilisent l'**issue node ID** :

`set_project_field` — type :
- `id` : l'issue node ID de l'étape 1
- `field` : `"type"`
- `value` : `"Bug"` | `"Feature"` | `"Task"` selon le type choisi

`set_project_field` — priority :
- `id` : l'issue node ID de l'étape 1
- `field` : `"priority"`
- `value` : `"Urgent"` | `"High"` | `"Medium"` | `"Low"` (P1=Urgent, P2=High, P3=Medium, P4=Low)

**Étape 4 — Définir l'équipe** (si l'utilisateur en a renseigné une)

Utilise le **project item ID** :

`set_project_field` — team :
- `id` : le project item ID de l'étape 1
- `field` : `"team"`
- `value` : la valeur correspondante (Developer / Growth / UX/UI / Data / PO/PM / DevOps)

**Étape 5 — Définir le sprint** (si l'utilisateur en a renseigné un)

Utilise le **project item ID** :

`set_project_field` — sprint :
- `id` : le project item ID de l'étape 1
- `field` : `"sprint"`
- `value` : titre exact du sprint (voir `list_sprints`), ou `"current"` pour le sprint en cours

Afficher l'URL de l'issue et un récapitulatif des champs définis et des liaisons établies (parent, bloquants).

---

## Modifier une issue existante

Si l'utilisateur veut modifier une issue déjà créée (titre, description, assignees, ou n'importe quel champ du Project), utiliser `update_issue` avec le **numéro de l'issue** et uniquement les champs à changer :

```
update_issue({
  issue_number: 123,
  title?: "...",
  description?: "...",
  assignees?: ["login"],
  status?: "en-cours",
  team?: "Developer",
  epic?: "...",
  approver?: "Kevin",
  sprint?: "Sprint 1",
  priority?: "High",
  type?: "Bug",
})
```

`update_issue` résout automatiquement les IDs internes (node ID, project item ID) depuis le numéro d'issue — pas besoin de les fournir.

---

> **Si le MCP n'est pas disponible** (outil `create_issue` absent) : le connecteur `lba-github` n'est pas activé pour cet utilisateur. Copier le markdown généré et créer l'issue manuellement sur GitHub.
