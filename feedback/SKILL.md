---
name: feedback
description: "Analyse la conversation en cours pour faire émerger des pistes d'amélioration du skill utilisé, puis publie le feedback sur Notion. Déclenche sur : 'feedback', '/feedback', 'amélioration', 'retour sur le skill', 'ce qui pourrait être amélioré', 'note le skill', 'qu'est-ce qu'on peut améliorer', 'documente cette conversation'. Utilise ce skill dès que l'utilisateur veut capturer un retour d'expérience sur un skill Claude, même s'il ne mentionne pas explicitement Notion."
---

# feedback — Amélioration continue des skills Claude

Tu aides à capturer un retour d'expérience structuré sur un skill Claude utilisé dans la conversation, et à le publier sur Notion pour alimenter l'amélioration continue.

---

## Étape 1 — Identifier le skill et l'auteur du feedback

**Skill concerné** : Parcours la conversation pour identifier quel(s) skill(s) ont été invoqués (cherche les mentions de noms de skills dans les system-reminder, les appels via `/`, ou les références explicites). Si plusieurs skills ont été utilisés, demande lequel documenter.

**Auteur** : Cherche le nom dans la conversation en cours — l'utilisateur a peut-être signé un message, mentionné son prénom, ou il apparaît dans un git config / assignee visible. Si introuvable dans le contexte, demande-le avant de publier : *"Je vais publier ce feedback — de ta part, c'est qui ?"*

---

## Étape 2 — Construire le feedback

Analyse la conversation et produis ce bilan, puis présente-le à l'utilisateur avant de publier. S'il veut corriger ou compléter, intègre ses ajustements.

**Skill** : `<nom-du-skill>`
**Par** : `<prénom ou nom de l'auteur>`
**Date** : `<date et heure actuelles, format : DD/MM/YYYY HH:MM>`

**Contexte**
2-3 phrases résumant ce que l'utilisateur essayait d'accomplir et comment le skill a été utilisé.

**Ce qui a bien fonctionné**
Comportements du skill qui ont répondu au besoin sans friction, sans correction de l'utilisateur. S'il n'y a rien à noter, l'omettre.

**Pistes d'amélioration**
Suggestions concrètes déduites des moments où l'utilisateur a dû corriger, reformuler, ou contourner. Chaque suggestion doit être actionnable (ex. "Ajouter une question sur X", "Supprimer l'étape Y qui crée de la friction", "Clarifier la formulation Z").

**Verbatim utile** (optionnel)
Citations courtes de l'utilisateur particulièrement éclairantes sur ses attentes.

---

## Étape 3 — Publier sur Notion

### Si les outils Notion sont disponibles (`notion-search`, `notion-create-pages`, etc.)

Suis ces étapes dans l'ordre :

**3a — Trouver ou créer "Feedbacks / amélioration continue"**

```
notion-search("Feedbacks / amélioration continue")
```

- Si une page avec ce titre est trouvée → noter son ID, continuer.
- Si absente → créer avec `notion-create-pages`, parent ID `3620c88032c880ffaaa4e441f0d317e3`, titre "Feedbacks / amélioration continue".

**3b — Trouver ou créer la page du skill**

```
notion-search("<nom-du-skill>")
```

Parmi les résultats, vérifier qu'une page avec ce titre exact est bien enfant de "Feedbacks / amélioration continue" (comparer le `parent.page_id` avec l'ID trouvé en 3a — utilise `notion-fetch` si besoin).

- **Page trouvée** → noter son ID. Ne pas recréer. On va y ajouter le feedback.
- **Page absente** → créer avec `notion-create-pages`, parent = ID de "Feedbacks / amélioration continue", titre = `<nom-du-skill>`.

**3c — Ajouter l'entrée dans la page du skill**

Que la page existait déjà ou vienne d'être créée, ajouter le feedback à la suite du contenu existant avec `notion-update-page`. Le feedback ne remplace jamais le contenu existant — il s'accumule.

Format de l'entrée à ajouter :

```
---

### <DD/MM/YYYY> — <prénom de l'auteur> — <résumé en une phrase>

**Contexte** : <contexte>

**✅ Ce qui a bien fonctionné**
- <item>

**🔧 Pistes d'amélioration**
- <item>

**💬 Verbatim** (si pertinent)
> <citation>
```

Afficher l'URL de la page Notion en confirmation.

---

### Si les outils Notion ne sont pas disponibles

Générer l'export markdown ci-dessous et indiquer à l'utilisateur où le coller : `All-things-Claude > Feedbacks / amélioration continue > <nom-du-skill>`.

```markdown
---

### <DD/MM/YYYY> — <prénom de l'auteur> — <résumé en une phrase>

**Contexte** : <contexte>

**✅ Ce qui a bien fonctionné**
- <item>

**🔧 Pistes d'amélioration**
- <item>

**💬 Verbatim** (si pertinent)
> <citation>
```
