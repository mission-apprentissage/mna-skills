# Gabarit du rapport d'audit RGAA

Fichier : `rapport-rgaa-<critères>-<AAAA-MM-JJ>.md` dans le scratchpad. Le même contenu, sans les blocs « Méthode », est restitué dans la conversation. Sévérités : échelle de l'audit (Bloquant / Majeur / Mineur). Aucune mention d'outil de génération.

```markdown
# Audit RGAA 4.1.2 — <Nom du projet> — <critères ou thématique> — <date>

## Périmètre et méthode
- Projet : <repo>, racine UI `<UI_ROOT>`, stack : <Next.js x, react-dsfr x, MUI x, Formik…>
- Inventaire : <n> pages (`page.tsx`), <n> layouts, <n> composants scannés — détail dans `inventaire.md`
- Méthode : sondes statiques de `sondes.md` sur toute la racine UI, qualification manuelle de chaque candidat ; runtime <exécuté sur n routes | non exécuté>
- Exclusions : tests, e2e, stories, scripts ; contenu externe (<Notion, Markdown…>) audité via son transformateur uniquement
- Référence (LBA uniquement) : grille DGEFP du 21/10/2026, 27 pages, taux 81,97 % (48,33 % à l'audit Audit-Web du 25/11/2025)

## Récapitulatif

| Critère | Verdict | Candidats | Anomalies (B/M/m) | Runtime | Audit 10/2026 → après correction | Gain |
|---|---|---|---|---|---|---|
| 1.1 | Non conforme | 87 | 6 (2/4/0) | 2 | C → NC si A1, A4 non corrigées | −1,64 |
| 9.3 | Conforme sur le code statique | 44 | 0 | 3 | NC (P05, P15–P17) → C | +1,64 |
| 1.4 | Non applicable | 0 | — | — | NA | — |

Gain total si toutes les anomalies sont corrigées : +X,XX pt sur le taux global (n critères basculent). <Omettre la colonne et la ligne hors LBA.>

## Critère 1.1 — <énoncé exact du RGAA>
Verdict : <Conforme | Conforme sur le code statique | Non conforme | Non applicable | Non vérifiable statiquement>   Sévérité max : <B/M/m>
Couverture : <n> fichiers scannés · <n> candidats · <n> conformes · <n> anomalies · <n> à vérifier au runtime
Audit 10/2026 : <statut, pages NC ; ce qui est corrigé depuis ; ce qui reste ; bascule si … ou régression si …> <LBA uniquement>

### Anomalies
**A1 — `chemin/fichier.tsx:42`** (aussi `autre.tsx:17`, `…`) · Sévérité : <B/M/m>
Extrait : `<img src={logo} />`
Pages impactées : `/`, `/recherche` (composant Header : toutes les pages)
Impact : <qui est exclu et comment>
Correction :
```tsx
<code prêt à coller>
```

**A2 — …**

### Correction à la source
<Quand plusieurs anomalies partagent une cause : la modification unique (composant, helper, règle CSS, règle de lint) et la liste des An qu'elle règle.>

### Conformes
<Une ligne : « 79 `<img>` avec `alt` pertinent, 14 `<svg>` décoratifs masqués, 3 logos avec `alt` = texte de l'image ».>

### À vérifier au runtime
- `/recherche` : <test attendu, ex. contraste de l'option survolée>

### Zones non couvertes
- <pages authentifiées non rendues, contenu Notion, fichiers exclus>

## Critère 1.4 — <énoncé>
Verdict : Non applicable
Preuve : `grep -rniE 'captcha|hcaptcha|recaptcha|turnstile' ui/` → 0 résultat ; `grep -rn 'type="image"' ui/` → 0 résultat.

## Critère 1.2 — <énoncé>
Verdict : Conforme sur le code statique
Couverture : 312 fichiers · 44 candidats · 41 conformes · 3 à vérifier au runtime (icônes CSS de `notion.css`)
Conformes : <une ligne>
```

Règles de rédaction :
- Une anomalie sans `fichier:ligne`, sans pages impactées ou sans correction n'entre pas dans le rapport.
- Regrouper les occurrences identiques d'un composant partagé sous un seul `An` : une cause, une correction.
- Les verdicts « Conforme » portent la couverture chiffrée ; « sur le code statique » dès qu'un point runtime reste.
- Les comptes bouclent : conformes + anomalies + à vérifier au runtime = candidats. Un écart signale des candidats non qualifiés.
- Un « Conforme » sur zéro candidat cite la sonde et sa contre-sonde, comme un « Non applicable ».
- Les colonnes Audit et Gain n'existent que pour La bonne alternance, sur l'échantillon de la grille du 21/10/2026 ; les chiffres viennent de `review-rgaa/references/audit.md`.
- Phrases courtes, pas de tiret cadratin, pas d'emoji, français.
