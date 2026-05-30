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
9. **Assignee** (optionnel) : si l'utilisateur veut assigner, appeler `list_members` pour proposer la liste, sinon passer
10. **Priorité** : P1 Urgent / P2 High / P3 Medium / P4 Low

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
- UI : Next.js 15 App Router, MUI + DSFR (design system gouvernemental français), icônes Remixicons
- Server : Fastify + TypeScript strict, MongoDB
- Shared : Zod schemas et types partagés entre UI et server
- Tests : Vitest (unit + integration avec MongoDB réel)
- CI : typecheck + lint + tests (pas de build en CI)

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

## Création finale via MCP

Une fois l'issue construite et validée par l'utilisateur :

1. Présente le résultat complet
2. Demande : "Je crée l'issue sur GitHub ?"
3. Si oui, enchaîner ces appels MCP dans l'ordre :

**Étape 1 — Créer l'issue**
Appeler `create_issue` avec :
- `title` : le titre de l'issue
- `description` : le body complet au format markdown (sections Contexte, Problème, Critères, etc.)
- `type` : `"Bug"` | `"Feature"` | `"Task"` selon le type choisi à l'étape 1
- `assignees` : tableau avec le login GitHub si un assignee a été choisi, sinon omettre

→ Récupérer le `project item ID` retourné dans la réponse.

**Étape 2 — Définir la priorité**
Appeler `set_project_field` avec :
- `item_id` : le project item ID de l'étape 1
- `field` : `"priority"`
- `value` : `"Urgent"` | `"High"` | `"Medium"` | `"Low"` (correspondance : P1=Urgent, P2=High, P3=Medium, P4=Low)

**Étape 3 — Définir l'équipe** (si l'utilisateur en a renseigné une)
Appeler `set_project_field` avec :
- `item_id` : le project item ID de l'étape 1
- `field` : `"team"`
- `value` : la valeur correspondante (Developer / Growth / UX/UI / Data / PO/PM / DevOps)

Afficher l'URL de l'issue et confirmer que la priorité et l'équipe ont été assignées dans le projet.

> **Si le MCP n'est pas disponible** (outil `create_issue` absent) : le connecteur `lba-github` n'est pas activé pour cet utilisateur. Copier le markdown généré et créer l'issue manuellement sur GitHub.
