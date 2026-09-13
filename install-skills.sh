#!/bin/bash
REPO="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.claude/skills"
SKILLS=(add-cfa-to-blacklist feedback lba-issue mna-security-audit pull-request-lba review-code skill-updater)

mkdir -p "$TARGET"
echo "🔍 Skills déjà présents dans $TARGET :"
ls "$TARGET" 2>/dev/null || echo "  (vide)"
echo ""

installed=0
skipped=0
for skill in "${SKILLS[@]}"; do
  if [ -d "$TARGET/$skill" ]; then
    echo "⏭  $skill — déjà présent, ignoré"
    ((skipped++))
  else
    cp -r "$REPO/$skill" "$TARGET/$skill"
    echo "✅  $skill — installé"
    ((installed++))
  fi
done

echo ""
echo "Résultat : $installed installé(s), $skipped ignoré(s)"
echo "Skills dans ~/.claude/skills/ :"
ls "$TARGET"
