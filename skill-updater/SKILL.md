---
name: skill-updater
description: >
  Lit les feedbacks Notion accumulés sur un skill Claude, analyse les pistes d'amélioration,
  modifie le SKILL.md et génère un fichier .skill sur le Bureau prêt à publier dans le repo d'organisation.
  Déclencher quand l'utilisateur veut améliorer un skill à partir des retours Notion :
  "améliore le skill X", "applique les feedbacks sur lba-issue", "mets à jour le skill avec les retours",
  "y'a des feedbacks à intégrer sur X", "quel est le statut des feedbacks sur X".
---

# skill-updater — Amélioration des skills à partir des feedbacks Notion

Tu améliores un skill Claude en lisant les feedbacks accumulés dans Notion par le skill `/feedback`,
en analysant ce qui doit changer, en appliquant les modifications et en générant un `.skill` sur le Bureau.

---

## Étape 1 — Identifier le skill à améliorer

Si le nom du skill est passé en argument, utilise-le directement.

Sinon, liste les skills disponibles dans le repo org en priorité, puis en local :
```bash
ls ~/Documents/_project/beta/mna-skills/
ls ~/.claude/skills/
```
Demande lequel améliorer si ce n'est pas clair.

---

## Étape 2 — Lire les feedbacks Notion

### Si les outils Notion sont disponibles (`notion-search`, `notion-fetch`)

La page mère "Feedbacks / amélioration continue" a l'ID connu : `36c0c88032c881e1bf98e2bd40db4e7b`

**2a — Trouver la page du skill dans cette section**
```
notion-search("<nom-du-skill>", page_url="36c0c88032c881e1bf98e2bd40db4e7b")
```
Si aucun résultat, essayer sans restriction de page, puis vérifier que `parent.page_id` correspond à `36c0c88032c881e1bf98e2bd40db4e7b`.

**2b — Lire le contenu complet de la page**
```
notion-fetch("<page-id>")
```
Extraire toutes les entrées (chaque bloc `### <date> — <auteur> — <résumé>`).

S'il n'y a aucun feedback pour ce skill, l'indiquer et s'arrêter : rien à intégrer.

### Si les outils Notion ne sont pas disponibles
Demander à l'utilisateur de coller les feedbacks directement dans la conversation.

---

## Étape 3 — Lire le SKILL.md actuel

Chercher dans cet ordre :
1. `~/Documents/_project/beta/mna-skills/<skill-name>/SKILL.md` (repo org — source de vérité)
2. `~/.claude/skills/<skill-name>/SKILL.md` (fallback local)

Lire le fichier trouvé et noter son chemin source.

---

## Étape 4 — Analyser et proposer les modifications

Mets en regard les feedbacks et le SKILL.md actuel. Pour chaque piste d'amélioration identifiée :

- **Claire et actionnable** → planifie la modification directement, sans demander
- **Ambiguë ou qui implique un choix de design non trivial** → note-la comme une question

Présente un résumé avant d'implémenter :

```
Feedbacks analysés : <N> entrées (<date la plus récente>)

Modifications prévues :
- [ce qui change] → [raison tirée du feedback + auteur/date si utile]
- ...

Questions (si applicable) :
- [question précise sur un point ambigu]
```

Si tu as des questions, attends les réponses avant de continuer.
Si tout est clair, implémente directement après validation du résumé.

---

## Étape 5 — Implémenter les modifications

Copie le dossier source dans `/tmp/` pour ne pas modifier l'original :
```bash
cp -r <source-skill-path> /tmp/<skill-name>/
```

Applique les modifications sur `/tmp/<skill-name>/SKILL.md`.
Ne touche pas aux sous-dossiers (`evals/`, `references/`) sauf si un feedback le demande explicitement.

---

## Étape 6 — Générer le fichier .skill sur le Bureau

Utilise le script officiel de packaging (disponible dans les plugins Claude) :
```bash
cd /tmp && python ~/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator/scripts/package_skill.py <skill-name>/ ~/Desktop/
```

Si le script échoue ou n'est pas accessible, repli sur zip :
```bash
cd /tmp && zip -r <skill-name>.skill <skill-name>/ && mv /tmp/<skill-name>.skill ~/Desktop/
```

Confirme à l'utilisateur :

```
✅ <skill-name>.skill déposé sur le Bureau.

Feedbacks intégrés : <N> (de <date> à <date>)
Modifications appliquées :
- ...

Pour publier : copie le dossier extrait dans mna-skills/<skill-name>/ et ouvre une PR.
```

---

## Étape 7 — Archiver les feedbacks intégrés dans Notion

### Si les outils Notion sont disponibles

Une fois le `.skill` généré, déplacer les feedbacks traités dans une section `## Archivés` en bas de la page.

**7a — Relire le contenu actuel de la page**
```
notion-fetch("<page-id-du-skill>")
```

**7b — Reconstruire le contenu**
- Garder en haut tous les feedbacks **non traités** (ceux qui n'ont pas été intégrés dans cette itération)
- Déplacer les feedbacks traités dans un toggle `<details>` en bas, avec comme titre : `Archivés (<N>) — intégrés le <date>`
- Si un toggle `<details>` Archivés existe déjà, ajouter les nouveaux feedbacks à l'intérieur sans écraser l'existant (mettre à jour le compteur dans le titre)
- Les blocs enfants du toggle doivent être indentés avec une tabulation

Exemple de structure :
```
<details>
<summary>Archivés (2) — intégrés le 30/05/2026</summary>
	---
	### 27/05/2026 — Auteur — Titre du feedback
	[contenu]
</details>
```

**7c — Mettre à jour la page**
```
notion-update-page("<page-id-du-skill>", command="replace_content", new_str=<contenu reconstruit>)
```

### Si les outils Notion ne sont pas disponibles
Indiquer à l'utilisateur quels feedbacks peuvent être archivés et lui demander de le faire manuellement.

---

## Notes

- Travaille toujours dans `/tmp/` — ne modifie jamais les originaux directement.
- Si le même point de feedback a manifestement déjà été intégré dans le SKILL.md actuel, ne le recompte pas.
- Si plusieurs auteurs donnent des feedbacks contradictoires, tranche en faveur de ce qui simplifie le skill, et signale-le dans le résumé.
