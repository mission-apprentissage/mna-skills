# mna-skills

Skills Claude pour la mission apprentissage.

## Utilisation dans Claude Code

Les skills sont auto-découverts au démarrage de Claude Code si le dossier est présent dans le projet. Pour utiliser ces skills dans un projet :

1. Cloner ce repo dans le dossier `.claude/skills/` de ton projet (ou globalement dans `~/.claude/skills/`)
2. Redémarrer Claude Code — les skills apparaissent automatiquement

Chaque skill s'active via `/nom-du-skill` dans la conversation.

## Créer un nouveau skill

On utilise le skill `skill-creator` pour générer de nouveaux skills. Dans Claude Code :

1. Décris à Claude ce que tu veux automatiser ("je veux un skill qui fait X")
2. Claude génère le fichier `SKILL.md` avec les instructions
3. Place le dossier dans ce repo et ouvre une PR

Le `skill-creator` gère aussi l'amélioration de skills existants et les évaluations de performance.

Pour parcourir les skills disponibles, consulte directement les dossiers de ce repo — une liste statique dans ce README serait vite obsolète.
