# Commandes par package manager

## Détection

```bash
# Yarn Berry
cat package.json | grep '"packageManager"'   # → "yarn@3.x.x" ou "yarn@4.x.x"

# npm
ls package-lock.json

# pnpm
ls pnpm-lock.yaml
```

## Installer les dépendances

| Manager | Commande |
|---------|----------|
| Yarn Berry | `yarn install` |
| npm | `npm install` |
| pnpm | `pnpm install` |

## Tracer l'origine d'un package

| Manager | Commande |
|---------|----------|
| Yarn Berry | `yarn why <package>` |
| npm | `npm ls <package>` |
| pnpm | `pnpm why <package>` |

## Forcer une version (overrides/resolutions)

### Yarn Berry — `resolutions` dans `package.json` racine
```json
"resolutions": {
  "handlebars": "^4.7.9"
}
```

### npm — `overrides` dans `package.json` racine
```json
"overrides": {
  "handlebars": "^4.7.9"
}
```

### pnpm — `pnpm.overrides` dans `package.json` racine
```json
"pnpm": {
  "overrides": {
    "handlebars": "^4.7.9"
  }
}
```

## Vérifier la version résolue après installation

```bash
# Yarn Berry
yarn why handlebars

# npm
npm ls handlebars

# pnpm
pnpm why handlebars
```
