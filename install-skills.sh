#!/bin/bash
# Installe (ou met à jour avec --force) les skills de ce repo dans ~/.claude/skills/
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.claude/skills"
SKILLS=(add-cfa-to-blacklist feedback lba-issue mna-security-audit pull-request-lba review-code skill-updater)

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force|--update) FORCE=1 ;;
    -h|--help) echo "Usage : $0 [--force]   (--force : écrase les skills déjà installés)"; exit 0 ;;
    *) echo "Option inconnue : $arg" >&2; exit 1 ;;
  esac
done

mkdir -p "$TARGET"
echo "🔍 Skills déjà présents dans $TARGET :"
ls "$TARGET" 2>/dev/null || echo "  (vide)"
echo ""

installed=0
updated=0
skipped=0
for skill in "${SKILLS[@]}"; do
  if [ ! -d "$REPO/$skill" ]; then
    echo "❌  $skill — absent du repo ($REPO/$skill)" >&2
    exit 1
  fi
  if [ -d "$TARGET/$skill" ]; then
    if [ "$FORCE" -eq 1 ]; then
      rm -rf "$TARGET/$skill"
      cp -r "$REPO/$skill" "$TARGET/$skill" || { echo "❌  $skill — échec de la copie" >&2; exit 1; }
      echo "🔄  $skill — mis à jour"
      updated=$((updated + 1))
    else
      echo "⏭  $skill — déjà présent, ignoré (utiliser --force pour mettre à jour)"
      skipped=$((skipped + 1))
    fi
  else
    cp -r "$REPO/$skill" "$TARGET/$skill" || { echo "❌  $skill — échec de la copie" >&2; exit 1; }
    echo "✅  $skill — installé"
    installed=$((installed + 1))
  fi
done

echo ""
echo "Résultat : $installed installé(s), $updated mis à jour, $skipped ignoré(s)"
echo "Skills dans $TARGET :"
ls "$TARGET"
