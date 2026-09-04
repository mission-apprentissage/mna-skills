# Sondes statiques par critère RGAA 4.1.2 — React / Next.js / react-dsfr / MUI

Conventions : `$UI_ROOT` = racine UI détectée (section 2 du skill). Toutes les commandes excluent les dossiers non pertinents :

```bash
G() { grep -rnE "$1" "$UI_ROOT" --include='*.tsx' --include='*.jsx' ${2:-} \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out --exclude-dir=dist --exclude-dir=coverage \
  --exclude-dir=e2e --exclude-dir=tests --exclude-dir=__tests__ --exclude='*.test.*' --exclude='*.stories.*'; }
# usage : G 'motif'            → TSX/JSX
#         G 'motif' "--include=*.css --include=*.scss"   → ajouter les styles
```

Pour chaque critère : **Inventaire** (le critère est-il applicable ?), **Détection** (candidats), **Qualification** (anomalie / conforme / runtime), **Correction type**. `S` = décidable statiquement, `R` = rendu requis. Les variantes de bibliothèque ne s'appliquent que si la bibliothèque est dans la stack détectée.

Deux recherches de forme différente sont nécessaires avant de conclure à une absence.

---

## Thème 1 — Images

**Inventaire** : `G '<(img|Image|svg|picture|canvas|object|embed)\b'` · `G 'role="img"'` · `G 'fr-icon-|ri-[a-z0-9-]+-(line|fill)|iconId=|<[A-Z][A-Za-z]*Icon\b'` · `G 'background(-image)?:|backgroundImage|url\('` (images CSS). Aucun résultat sur les quatre → thème NA (rare : le header a toujours un logo).

### 1.1 Alternative textuelle des images porteuses d'information (S)
Détection : `G '<(img|Image)\b' | grep -v 'alt='` · `G '<svg\b' | grep -vE 'aria-hidden|role="img"'` · `G 'role="img"' | grep -vE 'aria-label|aria-labelledby'` · icônes seules dans un contrôle : `G '<(a|button|Button|IconButton|Link|NextLink)\b[^>]*>\s*$' -A3 | grep -E 'fr-icon-|Icon\b|<svg' | grep -vE 'title=|aria-label|fr-sr-only|>[^<]{2,}<'`.
Qualification : `alt` absent sur une image qui porte une information non répétée à côté = anomalie Bloquant. Icône seule dans un bouton ou lien sans `title` / `aria-label` / texte sr-only = anomalie Bloquant (noter aussi 6.2 ou 11.9). `alt={variable}` : remonter la source ; anomalie si elle peut être vide ou technique (nom de fichier, URL). `next/image` exige `alt` au typage : vérifier la valeur, pas la présence.
Correction : `alt="texte de l'image"` ; `<svg role="img" aria-label="…">` ; `Button` DSFR icône avec `title`.

### 1.2 Images de décoration ignorées (S)
Détection : `G '<(img|Image)\b[^>]*alt="[^"]+"'` à confronter au texte voisin (redite = décorative) · `G '<svg\b' | grep -v 'aria-hidden="true"'` · `G 'fr-icon-|ri-[a-z0-9-]+-(line|fill)' | grep -vE 'aria-hidden|Button|iconId|title='` (icône DSFR posée à la main sur un `span` / `Box` / `Typography` à côté d'un texte) · émojis : `G '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' | grep -v aria-hidden` (grep -P si nécessaire).
Qualification : svg ou icône décorative sans `aria-hidden="true"` = anomalie Majeur. `<img alt="Logo">` à côté du nom écrit = anomalie Mineur (redite). `focusable="false"` recommandé sur svg pour IE/Edge ancien, pas exigé.
Correction : `aria-hidden="true"` (+ `focusable="false"` sur svg) ; `alt=""`.

### 1.3 Pertinence de l'alternative (S)
Détection : `G 'alt="[^"]*"' | grep -iE 'alt="(image|img|photo|logo|icon|icône|picture|\.(png|svg|jpg|webp)|[a-z_-]+\.(png|svg|jpg))"'` · `alt` = texte adjacent exact · `alt` sur logo partenaire ≠ nom visible sur l'image.
Qualification : `alt` générique, nom de fichier, ou différent du texte porté par l'image = anomalie Majeur. Logo cliquable : `alt` = destination (« Accueil - Nom du site »).

### 1.4 / 1.5 CAPTCHA (S)
Inventaire : `G -i 'captcha|hcaptcha|recaptcha|turnstile'`. Absent → NA. Présent : `alt` décrivant la nature (1.4), alternative non visuelle (1.5), sinon Bloquant.

### 1.6 / 1.7 Description détaillée (S)
Inventaire : graphiques et infographies : `G 'recharts|chart\.js|Chart\b|<Bar|<Line|<Pie|nivo|d3|<canvas|infographie|graphique'`. Absent → NA. Présent : `aria-describedby`, texte adjacent ou tableau équivalent contenant les données ; sinon Majeur.

### 1.8 Image texte (S)
Détection : `G '<(img|Image)\b' | grep -iE 'titre|title|banner|bandeau|slogan|texte|text'` puis regarder l'image. Titre ou phrase en PNG → Mineur, remplacer par du texte stylé. Logos exemptés.

### 1.9 Légende reliée (S)
Détection : `G '<figcaption|<figure|legend|légende|caption'` autour d'images. Légende en `<p>` ou `Typography` sous une image sans `<figure>` → Mineur.

## Thème 2 — Cadres

**Inventaire** : `G '<iframe\b'` · `G 'iframe' "--include=*.ts --include=*.html"` (widget embarqué, éditorial). Aucun → NA.

### 2.1 / 2.2 Titre de cadre présent et pertinent (S)
Détection : `G '<iframe\b' | grep -v 'title='`. Sans `title` → Bloquant ; `title` générique (« iframe », « frame », URL) → Majeur.

## Thème 3 — Couleurs

**Inventaire** : toujours applicable. Sources de couleur : `G 'color:|backgroundColor|background:|bgcolor|fill=|stroke=' "--include=*.css --include=*.scss"` · hex en dur : `G '#[0-9a-fA-F]{3,8}\b'` · tokens : `G 'fr\.colors\.'` · `sx=\{\{[^}]*color`.

### 3.1 Information par la couleur seule (S+R)
Détection : états visuels conditionnels : `G '(color|backgroundColor|borderColor|bgcolor)\s*[:=]\s*[^,}]*\?' ` · `G 'severity=|variant="(success|error|warning|info)"|Badge\b|Chip\b|isActive|selected|isSelected|hasError|error\s*\?'`.
Qualification : un état (actif, sélectionné, erreur, statut) rendu par la couleur sans texte, icône `aria-hidden` + texte, soulignement ou attribut ARIA (`aria-selected`, `aria-current`, `aria-invalid`, `aria-pressed`) = anomalie Majeur. Badge coloré avec texte explicite = conforme. Lien dans un paragraphe distingué par la couleur seule → 10.6.
Correction : ajouter le second indicateur et l'attribut d'état.

### 3.2 Contraste texte / fond ≥ 4,5:1 (3:1 grand texte) (R, S pour les hex)
Détection : couples hex en dur : `G '#[0-9a-fA-F]{6}\b'` pour texte (`color`) et fond (`backgroundColor`, `background`) ; opacités : `G 'opacity:\s*0?\.[0-9]|rgba\([^)]*,\s*0?\.[0-9]'` ; gris MUI : `G 'text\.secondary|text\.disabled|grey\[[4-6]00\]|mention\.grey'` ; texte sur image : `G 'backgroundImage' -A6 | grep -E 'Typography|<p|<h[1-6]|<span'`.
Qualification : calculer le ratio (formule WCAG, luminance relative) pour chaque couple hex trouvé. Tokens `fr.colors.decisions.*` sur fond DSFR : conformes par construction, sauf mélange avec un hex. Texte sur image ou dégradé : runtime obligatoire. Texte `disabled` : exempté.
Correction : token DSFR de contraste garanti ; sinon assombrir.

### 3.3 Contraste des composants d'interface et éléments graphiques ≥ 3:1 (R)
Détection : bordures de champs, indicateurs de focus, icônes informatives, fonds d'option survolée : `G 'borderColor|outline|border:\s*1px|&:hover|&:focus|Mui-focusVisible|Mui-selected'`. Verdict au runtime avec `getComputedStyle`. Statique : hex clair (`#ccc`, `#ddd`, `#eee`) sur bordure ou icône = candidat fort.

## Thème 4 — Multimédia

**Inventaire** : `G '<(video|audio|track|source)\b|ReactPlayer|youtube|vimeo|dailymotion|player|\.mp4|\.mp3|\.webm|autoplay|Leaflet|MapContainer|mapbox|maplibre'`. Aucun → thème NA (état LBA au 11/2025).
Présent : 4.1/4.2 transcription ou audiodescription (`href` vers un texte, `<details>`), 4.3/4.4 `<track kind="captions">`, 4.7 texte adjacent identifiant le média, 4.10 pas d'`autoPlay` sonore sans contrôle, 4.11/4.12 contrôles natifs (`controls`) ou lecteur accessible au clavier, 4.13 rôle et nom du lecteur. Carte interactive = média non temporel : alternative textuelle (liste des lieux) et contrôle clavier. Sévérité : Bloquant pour 4.1, 4.3, 4.11 ; Majeur sinon.

## Thème 5 — Tableaux

**Inventaire** : `G '<table\b|<Table\b|TableContainer|DataGrid|react-table|useReactTable|VirtualTable|TableWithPagination|role="(table|grid)"'`. Aucun → NA.

### 5.1 / 5.2 Résumé des tableaux complexes (S)
Détection : en-têtes sur deux niveaux : `G 'colSpan|rowSpan|colspan|rowspan'` dans un tableau de données. Présent sans `aria-describedby` vers un résumé → Majeur.

### 5.3 / 5.8 Tableaux de mise en forme (S)
Détection : `<table>` sans `<th>` ni `caption`, ou `role="presentation"`. Tableau de mise en page contenant `th`, `caption`, `scope` → Majeur ; sans `role="presentation"` → Majeur.

### 5.4 / 5.5 Titre de tableau (S)
Détection : `G '<table\b' -A3 | grep -vE 'caption|aria-label|aria-labelledby'` · DSFR `<Table` sans `caption` (ou avec `noCaption` sans `aria-label`). Absent → Mineur ; générique (« Tableau ») → Mineur.

### 5.6 / 5.7 En-têtes déclarés et associés (S)
Détection : `G '<td\b[^>]*>\s*<(strong|b)\b'` (en-tête simulé) · `G '<th\b' | grep -v 'scope='` · `G '<th\b[^>]*>\s*</th>'` (en-tête vide, colonne d'actions) · rôles fantaisistes : `G 'role="[a-z]+"' | grep -vE 'role="(button|link|img|presentation|none|status|alert|dialog|alertdialog|tooltip|tab|tablist|tabpanel|listbox|option|combobox|group|radiogroup|menu|menuitem|menubar|navigation|main|banner|contentinfo|search|region|complementary|form|list|listitem|table|grid|row|cell|columnheader|rowheader|gridcell|progressbar|switch|checkbox|radio|textbox|separator|heading|note|figure|log|marquee|timer|toolbar|tree|treeitem|feed|article|document|application|math|definition|term|directory|meter|scrollbar|slider|spinbutton|caption|code|deletion|insertion|emphasis|strong|subscript|superscript|time|generic|paragraph|blockquote|mark|suggestion|comment)"'`.
Qualification : `<td>` en gras à la place d'un `<th>` → Majeur ; `<th>` sans `scope` dans un tableau simple → Majeur ; `<th>` vide → Majeur (texte `fr-sr-only`) ; en-tête triable : `aria-sort` et bouton (voir 7.1/7.3).

## Thème 6 — Liens

**Inventaire** : toujours applicable : `G '<a\b|<Link\b|<NextLink\b|DsfrLink|linkProps=|href='`.

### 6.1 Liens explicites (S)
Détection : intitulés faibles : `G '>\s*(En savoir plus|Cliquez ici|Cliquer ici|Lire la suite|Voir plus|Ici|Plus d.infos?|C.est parti|Découvrir|Consulter|Voir)\s*<'` · `aria-label` sur lien : `G '<(a|Link|NextLink|DsfrLink)\b[^>]*aria-label='` (comparer au texte visible : le nom doit **commencer** par lui) · `title=` sur lien idem · liens `target="_blank"` : `G 'target="_blank"' | grep -viE 'nouvelle fenêtre|nouvel onglet'` · lien-image : `G '<(a|Link|NextLink)\b[^>]*>\s*<(img|Image|svg)' -A2` (alt = destination) · liens répétés (« Voir l'offre » × N) : `G '>\s*Voir (l.offre|la formation|le détail)\s*<'`.
Qualification : intitulé qui ne se comprend ni seul ni par son contexte immédiat (phrase, `<li>`, titre précédent, cellule) → Majeur. `aria-label` ≠ texte visible → Majeur (WCAG 2.5.3). Nouvelle fenêtre non annoncée dans le nom → Majeur (l'icône CSS du DSFR ne compte pas, cf. 10.2). Lien répété sans contexte machine (`aria-describedby`, texte sr-only) → Majeur.
Correction : compléter par `<span className="fr-sr-only">` ; `aria-label` commençant par le texte visible ; `title="Libellé - nouvelle fenêtre"`.

### 6.2 Liens avec intitulé (S)
Détection : `G '<(a|Link|NextLink|DsfrLink)\b[^>]*>\s*</(a|Link|NextLink|DsfrLink)>'` · lien ne contenant qu'une icône ou un svg (voir 1.1) sans `aria-label` / `title` / sr-only → Bloquant · `href="#"` ou `href=""` sans rôle bouton → 7.1.

## Thème 7 — Scripts

**Inventaire** : toujours applicable dans une app React.

### 7.1 Composants scriptés : nom, rôle, état, valeur (S+R)
Détection par famille :
- Boutons icône : `G '<(Button|IconButton|button)\b[^>]*(iconId=|fr-icon-|className=[^>]*icon)' | grep -vE 'title=|aria-label|>\s*[A-Za-zÀ-ÿ]'` et `G 'title="(close|next|previous|prev|label|open|menu|search|toggle|Toggle[^"]*)"'` (intitulé technique ou anglais, voir 8.7).
- Div/span interactifs : `G '<(div|span|Box|Stack|Typography|Grid|li|td|tr|p)\b[^>]*onClick' | grep -vE 'role="button"|role="link"|role="option"|role="tab"|role="menuitem"|component="button"|component="a"'`.
- États : `G 'onClick=\{[^}]*(toggle|setOpen|setExpanded|setIsOpen|setShow)' | grep -v aria-expanded` · onglets sans `aria-selected` : `G 'role="tab"' | grep -v aria-selected` · menus : `G 'aria-haspopup' | grep -v aria-expanded` · tri : `G 'sort' -i | grep -E '<th|Header' | grep -v aria-sort`.
- Combobox : `G 'useCombobox|<Autocomplete\b|role="combobox"'` → vérifier `role="listbox"` + `role="option"` sur les items, `aria-expanded`, `aria-activedescendant` ; `renderGroup=` et `renderOption=` personnalisés = lecture obligatoire.
- Tooltips : `G '<Tooltip\b' -A4` → déclencheur focusable (`Button`, `IconButton`, `button`) ; `role="tooltip"` + `aria-describedby` (MUI et DSFR le font si l'enfant est focusable).
- Modales : `G 'createModal|<Dialog\b|<Modal\b|role="dialog"'` → `aria-labelledby` ou `title`, `aria-modal`.
- Accordéons : `G '<details\b|<summary\b|<Accordion\b|aria-expanded'` → `summary` natif ou `button` avec `aria-expanded` + `aria-controls`.
- `role` invalides : sonde des rôles de 5.6.
Qualification : un contrôle sans nom → Bloquant ; rôle absent ou faux → Majeur ; état non reflété → Majeur ; nom ≠ libellé visible → Majeur.

### 7.2 Alternative au script (S)
Détection : `G 'dynamic\(|ssr:\s*false|ClientOnly|typeof window|useIsClient|isClient'` → contenu essentiel rendu uniquement côté client sans repli → Majeur. Rare avec Next SSR.

### 7.3 Contrôle au clavier et au pointeur (S+R)
Détection : `onClick` sur élément non natif (sonde 7.1) sans `tabIndex={0}` + `onKeyDown` → Bloquant · `G 'onMouseEnter|onMouseOver|onHover' | grep -vE 'onFocus|onKeyDown'` (contenu au survol sans équivalent focus) → Bloquant · `G 'onMouseDown|onPointerDown|onTouchStart' | grep -vE 'preventDefault|onKeyDown'` → 13.11 · dropzone : `G 'useDropzone|getRootProps' -A6 | grep -E 'tabIndex'` (double arrêt) · swipe : `G 'useSwipeable|onSwiped'` → bouton équivalent présent ? · `G 'tabIndex=\{-1\}' ` sur élément qui doit être atteignable · `G 'draggable|onDrag'` → alternative sans glisser (WCAG 2.5.7).
Correction : `<button type="button">` ; `Button` DSFR ; `role="button" tabIndex={0} onKeyDown` en dernier recours.

### 7.4 Changement de contexte contrôlé (S)
Détection : `G 'onChange=\{[^}]*(router\.push|navigate|submitForm|handleSubmit|window\.location|window\.open)'` · `G 'onFocus=\{[^}]*(router|open|submit)'` · `G 'useEffect' -A6 | grep -E 'router\.push|window\.open|\.focus\(\)'` (navigation ou focus déclenché sans action : qualifier).
Qualification : `select` qui navigue ou soumet au `onChange` sans bouton → Majeur ; ouverture de fenêtre au focus → Majeur ; redirection automatique après un délai sans avertissement → 13.1.

### 7.5 Messages de statut (S+R)
Détection : zones live existantes : `G 'aria-live|role="status"|role="alert"|role="log"'` (souvent 0 à 3 dans un repo : le nombre est un indicateur) · contenus dynamiques : `G 'useToast|toast\(|<Alert\b|<Snackbar\b|CircularProgress|Skeleton|isLoading|isPending|isFetching|résultats?\b|no.?results|Aucun résultat|Chargement'` · autocomplétions et filtres (sonde 7.1 combobox) : nombre de suggestions ou de résultats.
Qualification : contenu qui apparaît ou change sans déplacement du focus et sans zone live présente **avant** le changement → Majeur (résultats de recherche, suggestions, confirmation, erreur globale, chargement). `Alert` DSFR : pas de rôle live par défaut → envelopper. `role="alert"` + `aria-live` doublé → Mineur.
Correction : composant `<div role="status" className="fr-sr-only">{message}</div>` monté dès le départ ; `role="alert"` pour les erreurs.

## Thème 8 — Éléments obligatoires

### 8.1 / 8.2 Doctype et validité (S+R)
Détection : `id` en dur potentiellement dupliqués : `G 'id="[a-z][a-z0-9_-]*"' -o | sort | uniq -c | sort -rn | awk '$1>1'` (puis vérifier s'ils peuvent coexister dans une page, notamment desktop + mobile) · imbrications interdites : `G '<(button|Button)\b' -A3 | grep -E '<(a|Link|NextLink)\b'` et l'inverse · `<Typography>` (rend `<p>`) contenant `<Box>`, `<div>`, `<Typography>` bloc, `<ul>` : `G '<Typography\b(?![^>]*component=)' -A3 | grep -E '<(Box|div|ul|ol|Typography|Stack|Grid)\b'` · `<li>` hors liste · attributs ARIA sur un élément qui ne les admet pas (`aria-label` sur `div`/`span` sans rôle : `G '<(div|span|Box|Typography|Stack)\b[^>]*aria-label' | grep -v 'role='`).
Qualification : `id` dupliqué rendu simultanément → Majeur ; imbrication interactive → Majeur (double arrêt de tabulation, cf. 12.8) ; `div` dans `p` → Majeur ; `aria-label` sur générique → Mineur (ignoré par les lecteurs d'écran, souvent une fausse impression de conformité).

### 8.3 / 8.4 Langue par défaut (S)
Détection : `G '<html\b' | grep -v 'lang='` · `G 'lang="[a-z]{2}(-[A-Z]{2})?"'` (valeur pertinente : `fr` pour un contenu français ; `lang="en"` sur une page française = anomalie) · `getHtmlAttributes` (react-dsfr) avec `lang`.
Sévérité : absent → Bloquant ; faux → Majeur.

### 8.5 / 8.6 Titre de page (S+R)
Détection : chaque `page.tsx` a `metadata`, `generateMetadata` ou hérite d'un `layout` avec `title` : `for p in $(find $UI_ROOT/app -name page.tsx); do grep -lE 'metadata|generateMetadata' "$p" >/dev/null || echo "sans metadata: $p"; done` puis vérifier le `layout.tsx` parent · `G '<title>'` dans des composants clients (double `<title>`) · titres génériques ou identiques : `G 'title:\s*"[^"]*"' -oh | sort | uniq -c | sort -rn | awk '$1>1'`.
Qualification : page sans `<title>` → Bloquant (8.5) ; titre identique sur plusieurs pages, sans le nom de la page ou sans le nom du site → Majeur (8.6) ; deux `<title>` rendus → Majeur (8.6). Format attendu : « Nom de la page - Nom du site ».

### 8.7 / 8.8 Changements de langue (S)
Détection : attributs en anglais : `G '(title|aria-label|alt|placeholder)="(close|open|next|previous|prev|back|search|menu|label|submit|cancel|loading|toggle|Toggle[^"]*|expand|collapse)"'` · texte visible en anglais hors marques : `G '>\s*(Open source|Dashboard|Newsletter|Loading|Search|Login|Logout|Sign in|Submit|Cancel|Back|Next|Home)\s*<' | grep -v 'lang='` · `lang=` existants : valeurs valides (ISO 639-1).
Qualification : attribut en anglais → traduire (jamais `lang` sur un attribut) : Majeur si c'est le seul nom du contrôle, Mineur sinon ; mot anglais visible sans `lang="en"` → Mineur ; marques et noms propres exemptés.

### 8.9 Balises détournées pour la présentation (S)
Détection : `G '<Typography\b[^>]*variant="h[1-6]"' | grep -v 'component='` (rend `<hN>` : vérifier que c'est un vrai titre) · `G 'component="h[1-6]"'` sur un texte qui n'est pas un titre (mention, sous-titre descriptif) · `G '<br\s*/?>\s*<br'` (doubles `<br>`) · `G '<(p|Typography)>\s*</(p|Typography)>|<p></p>'` (paragraphes vides) · `G '<(em|i|strong|b)\b' -B1 -A1` (emphase pour la couleur ou l'italique décoratif) · `G '<hr\b|<Divider\b' | grep -vE 'aria-hidden|role="presentation"'` (séparateur décoratif) · deux `<h1>` pour le même texte : `G 'component="h1"|<h1\b' -A2` (comparer par fichier) · `G '<blockquote\b|<q\b'` (indentation).
Qualification : titre sémantique sans fonction de titre → Majeur ; `<br><br>`, `<p>` vide, `<hr>` décoratif non masqué → Mineur ; `<h1>` dupliqué (desktop / mobile) → Mineur.

### 8.10 Sens de lecture (S)
Détection : `G 'dir="rtl"|[\x{0590}-\x{06FF}]'`. Absent → NA.

## Thème 9 — Structuration

### 9.1 Titres (S+R)
Détection : titres simulés (gras **et** taille ≥ 18 px, ou classe de titre DSFR, sans balise de titre) : `G '<Typography\b[^>]*((fontWeight[:=]\s*"?(700|bold)[^>]*fontSize[:=]\s*"?(1[89]|[2-9][0-9])px)|(fontSize[:=]\s*"?(1[89]|[2-9][0-9])px[^>]*fontWeight[:=]\s*"?(700|bold))|fr-h[1-6]|fr-text--lead)' | grep -vE 'component="h|variant="h'` (48 candidats sur LBA au 09/2026 ; ne voit que les `sx` écrits sur une ligne : compléter par `G '<Typography\b' -A3 | grep -E 'fontWeight[:=]\s*"?(700|bold)'` puis lecture) · `G '<(p|span|div|Box)\b[^>]*(fr-h[1-6]|fr-text--lead)'` · `variant="hN"` sans `component` rend un `<hN>` : `G '<Typography\b[^>]*variant="h[1-6]"' | grep -v 'component='` → vrai titre au bon niveau, ou style seul (alors 8.9) · hiérarchie : lister par page les `component="hN"`, `variant="hN"`, `<hN` et les `titleAs` d'accordéons ; un seul `h1` par page, pas de saut de niveau · `Accordion` DSFR : `G '<Accordion\b' | grep -v titleAs` (défaut `h3` : cohérent ?) · footer / header : `fr-footer__top-cat` en `h3` sans `h2`.
Qualification : titre visuel sans balise de titre → Majeur ; page sans `h1` → Majeur ; saut de niveau ou `h1` multiple → Majeur ; hiérarchie à confirmer au runtime pour les pages composées.
Correction : `<Typography variant="…" component="hN">` ; `titleAs`.

### 9.2 Structure du document (S+R)
Détection par `layout.tsx` : `G '<(header|Header)\b|role="banner"'`, `G '<(nav|MainNavigation)\b|role="navigation"'`, `G '<main\b|component="main"|role="main"'`, `G '<(footer|Footer)\b|role="contentinfo"'` · pages sans `main` : pour chaque layout de groupe, vérifier qu'un `main` unique existe (layout racine ou page).
Qualification : `main` absent ou multiple → Majeur ; `header` ou `footer` absents d'un gabarit complet → Majeur ; pages de processus sans navigation : voir 12.2.

### 9.3 Listes (S)
Détection : puces textuelles : `G '>\s*[•·▪–-]\s' ` · énumérations dans un `Typography` : `G '<Typography\b' -A4 | grep -E '(^|\s)(1\.|2\.|-|•)\s'` · `.map(` rendant des blocs frères sans `<ul>`/`<ol>`/`List` : `G '\.map\(' -B2 | grep -vE '<(ul|ol|li|List|ListItem|tr|option|MenuItem|Tab|dl)\b'` (candidats, qualification obligatoire) · listes imbriquées mal fermées, `<ul>` à un seul `<li>` répétés · `List` MUI avec `component="div"` sur une vraie liste.
Qualification : suite d'éléments de même nature (liens de navigation, résultats, étapes) sans structure de liste → Majeur (Mineur si courte et purement décorative) ; étapes numérotées en `<ul>` ou en texte → Majeur.

### 9.4 Citations (S)
Détection : `G 'citation|témoignage|«|»|"[^"]{40,}"' -i | grep -vE '<q\b|<blockquote|<Quote'` sur du contenu éditorial. Citation sans `<q>` / `<blockquote>` → Mineur.

## Thème 10 — Présentation

### 10.1 CSS pour la présentation (S)
Détection : `G '<(center|font|big|blink|marquee|u)\b|\s(align|bgcolor|border|valign|cellpadding|cellspacing)="'`. Présent → Mineur.

### 10.2 / 10.3 Contenu présent et compréhensible sans CSS (S)
Détection 10.2 : icônes CSS porteuses de sens sans équivalent texte : sondes 1.1 (icônes seules) + `G 'target="_blank"' | grep -vE 'title=|fr-sr-only|nouvelle fenêtre'` (l'icône « lien externe » du DSFR est en `::before`) + `G 'content:\s*"' "--include=*.css --include=*.scss"` (texte généré en CSS) + `G 'background(-image)?:' "--include=*.css --include=*.scss"` sur des éléments informatifs.
Détection 10.3 : ordre du DOM ≠ ordre visuel : `G 'order:\s*[0-9]|flexDirection:\s*"(row|column)-reverse"|gridRowStart|gridRow:|position:\s*"?absolute'` · blocs déplacés par `Grid` avec `order`.
Qualification 10.2 : information portée seulement par un pseudo-élément ou une image de fond → Majeur (Bloquant si c'est le seul vecteur : bouton icône). 10.3 : ordre DOM incohérent avec la lecture → Majeur (souvent runtime).

### 10.4 Zoom 200 % (R, S pour les causes)
Détection : `G 'height:\s*"?[0-9]+px' -A3 | grep -E 'overflow:\s*"?hidden'` · `G 'fontSize:\s*"?(1[0-2])px|font-size:\s*1[0-2]px'` · `G 'user-scalable=no|maximum-scale=1'` · `G 'whiteSpace:\s*"?nowrap|white-space:\s*nowrap|textOverflow|line-clamp|WebkitLineClamp'`. Texte tronqué possible → à confirmer au runtime ; `user-scalable=no` → Bloquant direct.

### 10.5 Couleurs de fond et de police déclarées ensemble (S)
Détection : `G 'color:\s*"?#' | grep -vE 'background'` sur des conteneurs autonomes (cartes, badges, bannières) : `color` défini sans `backgroundColor` sur le même élément ou son parent immédiat → Majeur (lecture au cas par cas ; texte courant sur le fond de page exempté).

### 10.6 Liens visibles dans le texte (S+R)
Détection : `G 'underline="none"|textDecoration:\s*"?none|text-decoration:\s*none'` appliqué à des liens dans du texte courant · classes `fr-link` retirées.
Qualification : lien distingué par la couleur seule, ratio lien/texte < 3:1 ou pas d'indicateur au survol/focus → Majeur.

### 10.7 Focus visible (S+R)
Détection : `G 'outline:\s*"?(none|0)|outline-?[wW]idth:\s*"?0|boxShadow:\s*"?none.*focus|:focus\s*\{[^}]*outline:\s*(none|0)' "--include=*.css --include=*.scss"` sans `:focus-visible` de remplacement dans le même fichier · `G 'disableFocusRipple|disableRipple'` (indicateur MUI supprimé sans outline) · styles Notion / Markdown (`notion.css`) écrasant l'outline des liens.
Qualification : outline supprimé sans remplacement visible → Bloquant. Confirmer au runtime avec Tab + screenshot.

### 10.8 Contenus cachés (S)
Détection : `G 'aria-hidden="true"' -A3 | grep -E '<(a|button|Button|input|select|textarea|Link)\b|tabIndex=\{0\}|onClick'` (focusable masqué) · `G 'display:\s*"?none|visibility:\s*"?hidden|hidden\b' -B2 -A2` sur un contenu qui doit être lu · `G 'fr-sr-only|visuallyHidden|sr-only'` (contenu masqué qui devrait être visible : mention obligatoire, légende utile à tous ?) · `G 'fontSize:\s*"?0|font-size:\s*0|text-indent:\s*-9999'` (texte masqué par CSS mais lu : acceptable, préférer sr-only).
Qualification : `aria-hidden` sur un élément focusable ou contenant du focus → Bloquant ; contenu utile en `display: none` → Majeur.

### 10.9 / 10.10 Forme, taille, position (S)
Détection : `G -i '(à|a) (droite|gauche)|en haut|en bas|ci-dessous|ci-dessus|le bouton (rond|vert|rouge|bleu)|en (rouge|vert|bleu|gras)'` dans des consignes. Consigne qui ne repose que sur la position, la forme ou la couleur → Majeur.

### 10.11 Reflow 320 px (R, S pour les causes)
Détection : `G 'minWidth:\s*"?[4-9][0-9]{2}px|min-width:\s*[4-9][0-9]{2}px|width:\s*"?[6-9][0-9]{2}px|overflowX:\s*"?(scroll|auto)'`. Largeur fixe > 320 px hors tableaux et cartes → à confirmer au runtime avec `resize_window` mobile.

### 10.12 Espacement du texte (R, S pour les causes)
Détection : hauteurs fixes avec `overflow: hidden` (sonde 10.4), `lineHeight` en px sur du texte courant, `letterSpacing` négatif. Candidats → runtime.

### 10.13 Contenus additionnels au survol / focus (S+R)
Détection : `G '<Tooltip\b' -A6` (déclencheur focusable ? `disableInteractive` ? Échap ?) · tooltips maison : `G 'onMouseEnter' -A6 | grep -E 'setShow|setOpen|setVisible'` → fermeture Échap (`onKeyDown` Escape), persistance au survol du contenu, déclencheur focusable · `G 'Popover\b|Popper\b' -A4`.
Qualification : contenu au survol non fermable au clavier, disparaissant quand le pointeur le survole, ou lié à un déclencheur non focusable → Majeur (+ 7.3 Bloquant si non atteignable).

### 10.14 Contenus CSS-only au survol (S)
Détection : `G ':hover\s*\{' "--include=*.css --include=*.scss" -A4 | grep -E 'display:\s*(block|flex)|visibility:\s*visible|opacity:\s*1'` puis vérifier qu'une règle `:focus-within` ou `:focus` équivalente existe · `sx` : `G '&:hover' -A3 | grep -E 'display|visibility|opacity'`.
Qualification : contenu révélé au `:hover` sans équivalent focus → Bloquant.

## Thème 11 — Formulaires

**Inventaire** : `G '<(form|Form|Formik)\b|useForm\(|useFormik|<(input|select|textarea|Input|TextField|Select|SelectNext|Checkbox|RadioButtons|Radio|Switch|Autocomplete|TextareaAutosize|OutlinedInput|NativeSelect|Slider|Upload)\b'`. Aucun → NA (improbable).

### 11.1 Étiquette (S+R)
Détection par bibliothèque :
- HTML natif : `G '<(input|select|textarea)\b' | grep -vE 'type="(hidden|submit|button|reset)"|aria-label|aria-labelledby|title=|id='` → puis, pour ceux avec `id`, vérifier qu'un `htmlFor` identique existe dans le même composant.
- MUI : `G '<(Input|OutlinedInput|InputBase|NativeSelect|Select|TextareaAutosize|Checkbox|Radio|Switch)\b' | grep -vE 'aria-label|aria-labelledby|id='` · `G '<FormLabel\b' | grep -v htmlFor` · `G '<FormControlLabel\b' -A4 | grep -vE 'htmlFor|aria-label'` (RGAA exige `for`, l'imbrication ne suffit pas) · `<TextField` sans `label` ni `aria-label` ni `id` + `InputLabel`.
- react-dsfr : `Input`, `Select`, `Checkbox`, `RadioButtons` gèrent l'association si `label` / `legend` est fourni : `G '<(Input|Select|SelectNext)\b' -A3 | grep -vE 'label='` · `legend` absent sur `Checkbox` / `RadioButtons` → 11.6.
- Combobox downshift / MUI Autocomplete : `getLabelProps` posé sur un vrai `<label>` ? `renderInput` avec `label` ou `aria-labelledby` ? `placeholder` seul = pas d'étiquette.
- Champ de recherche : `type="search"` sans `aria-label`.
Qualification : champ sans association explicite → Bloquant. `placeholder` seul → Bloquant. `label` visible mais `for`/`id` absents → Bloquant (RGAA), même si l'imbrication fonctionne.
Correction : `useId()` + `htmlFor` / `id` ; composant DSFR ; `slotProps.htmlInput["aria-labelledby"]` pour MUI Autocomplete.

### 11.2 Pertinence de l'étiquette (S)
Détection : `G '(label|aria-label|legend)="(Saisir|Saisissez|Champ|Valeur|Texte|Entrée|Input|Field)[^"]*"'` · `aria-label` sur champ ≠ label visible. → Majeur.

### 11.3 Cohérence des étiquettes (S)
Détection : `G 'label="[^"]*"' -oh | sort | uniq -c` puis repérer les variantes pour un même champ (« Email », « E-mail », « Votre email », « Adresse e-mail »). Variantes pour la même donnée → Mineur.

### 11.4 Étiquette accolée (S+R)
Détection : `label` et champ séparés par d'autres éléments dans le JSX, ou disposés en grille (`Grid`, `display: grid`) où l'étiquette n'est pas adjacente visuellement. → Majeur, confirmer au runtime.

### 11.5 / 11.6 / 11.7 Regroupements et légendes (S)
Détection : `G '<(Checkbox|Radio|RadioGroup|FormGroup|RadioButtons)\b' -B4 | grep -vE 'fieldset|legend|role="(group|radiogroup)"|aria-labelledby|aria-label'` · groupes d'adresse ou de dates (rue, code postal, ville ; jour, mois, année) hors `fieldset` · `aria-labelledby` vers un `id` dont l'élément est vide ou absent · react-dsfr `Checkbox` / `RadioButtons` sans `legend` (`G '<(Checkbox|RadioButtons)\b' -A3 | grep -v legend`).
Qualification : groupe de cases ou radios sans `fieldset`/`legend` ni `role="group"`/`radiogroup` + nom → Majeur (11.5) ; regroupement sans légende ou légende vide → Majeur (11.6) ; légende non pertinente → Majeur (11.7).

### 11.8 Options regroupées (S)
Détection : `G '<option\b' -c` par `select` : plus de 15 options de catégories distinctes sans `<optgroup>` / `ListSubheader` → Mineur.

### 11.9 Intitulé des boutons (S)
Détection : `G '<(button|Button)\b[^>]*>\s*(OK|Ok|Valider|Envoyer|Go|\+|-|×|x|X|>|<)\s*<'` · boutons icône sans nom (sonde 7.1) · `aria-label` sur bouton ≠ texte visible · `type="submit"` sans texte.
Qualification : intitulé qui ne décrit pas l'action dans son contexte → Majeur ; sans nom → Bloquant.

### 11.10 Contrôle de saisie (S+R)
Quatre sous-tests, chacun une sonde :
1. Mention des champs obligatoires **avant** le formulaire : `G 'obligatoire' -i` par formulaire ; `required` ou `aria-required` sur les champs : `G '<(input|Input|TextField|select|Select|textarea)\b' | grep -vE 'required|aria-required'` (candidats, croiser avec le schéma Yup/Zod `.required(`).
2. Format attendu avant la saisie : champs `type="(tel|email|date|number)"`, `pattern=`, `maxLength=`, SIRET, code postal, fichier (`accept=`) sans `hintText` / `helperText` / `info` / `aria-describedby` → Majeur.
3. Erreur associée : messages d'erreur (`fr-error-text`, `fr-message--error`, `FormHelperText error`, `stateRelatedMessage`, `helperText` + `error`) → le champ porte `aria-invalid` et `aria-describedby` vers le message ? MUI `TextField` avec `id` et react-dsfr `Input` le font ; `Box` / `Typography` maison non → Bloquant si aucune association.
4. Focus sur le premier champ en erreur à la soumission : `G 'onSubmit|handleSubmit' -A8 | grep -E '\.focus\(|scrollIntoView|focusOnError|setTouched'`. Absent → Majeur (aussi 12.8).
Messages nommant le champ : `G '"(champ obligatoire|Champ obligatoire|Ce champ est requis|Requis|Obligatoire|Invalide|Erreur)"'` répétés sans nom du champ → Mineur.

### 11.11 Suggestions de correction (S)
Détection : messages d'erreur de format sans exemple ni format attendu : `G '(invalide|incorrect|non valide|format)' -i` dans les schémas et messages. → Majeur.

### 11.12 Actions à conséquence (S)
Détection : `G 'delete|supprim|désactiv|résili|annul|payer|paiement|commande' -i` sur des mutations → confirmation (`Modal`, `confirm`, case à cocher) ou annulation possible ? Absent → Bloquant.

### 11.13 Autocomplete (S)
Détection : `G 'name="?(nom|prenom|prénom|last_?name|first_?name|name|email|mail|telephone|téléphone|phone|tel|adresse|address|street|cp|code_?postal|postal_?code|ville|city|organization|entreprise|company|birth|naissance|username|password)' -i | grep -viE 'autoComplete|autocomplete='` · `G 'type="(email|tel)"' | grep -viE 'autoComplete'`.
Qualification : champ de donnée personnelle sans `autoComplete` normalisé → Majeur (échelle de l'audit ; Mineur en WCAG). Valeurs : `given-name`, `family-name`, `name`, `email`, `tel`, `tel-national`, `organization`, `street-address`, `postal-code`, `address-level2`, `bday`, `username`, `current-password`, `new-password`.

## Thème 12 — Navigation

### 12.1 Deux systèmes de navigation (S)
Détection : menu : sonde 9.2 `nav` ; plan du site : `G 'plan-du-site|plan du site|sitemap' -i` (route et lien dans le footer) ; moteur de recherche : `G 'role="search"|type="search"|<search\b'`. Moins de deux systèmes atteignables depuis toutes les pages → Majeur. Pages sans header ni footer (processus) : compter à part, voir 12.2.

### 12.2 Position constante du menu et des barres (S+R)
Détection : layouts qui ne rendent pas le header/footer : pour chaque `layout.tsx`, `grep -LE 'Header|Footer'`. Pages de processus (tunnel, widget) acceptées si la sortie renvoie vers une page complète ; sinon Majeur. Header rendu à des positions différentes selon les gabarits → Majeur.

### 12.3 / 12.4 / 12.5 Plan du site et moteur (S)
Détection : le plan du site liste toutes les routes publiques de l'inventaire ? `diff` entre les routes `page.tsx` publiques et les `href` du plan → pages manquantes → Mineur (12.3). Lien vers le plan et moteur présents dans le même gabarit sur toutes les pages (12.4, 12.5).

### 12.6 Zones de regroupement identifiables (S+R)
Détection : sonde 9.2 + `aria-label` distincts sur les `nav` multiples : `G '<nav\b' | grep -v aria-label` · `role="search"` sur le formulaire de recherche · rôles explicites (`role="banner"`, `"main"`, `"contentinfo"`, `"navigation"`) attendus par les auditeurs en plus des balises.
Qualification : `nav` multiples sans `aria-label` → Majeur ; zone principale sans landmark → Majeur.

### 12.7 Lien d'évitement (S+R)
Détection : `G 'SkipLinks|skip-link|skiplink|Aller au contenu|Accès rapide'` par layout ; ancres ciblées existantes (`id="main"`, `id="content"`, `#header-links`, `#footer-links`) : `G 'id="(main|content|contenu|header-links|footer-links|search-form[a-z-]*)"'`. Absent → Bloquant ; ancre cible absente ou non rendue (widget, mobile) → Bloquant ; deux arbres desktop/mobile → un jeu de liens par arbre.

### 12.8 Ordre de tabulation (S+R)
Détection : `G 'tabIndex=\{?"?[1-9]'` (positif) → Majeur · imbrications `a`/`button` (sonde 8.2) → Majeur · focus après action sans rechargement : `G 'router\.push|setCurrentStep|setStep|setActiveTab|setOpen\(true\)|onOpen\(\)' -A6 | grep -vE '\.focus\(|autoFocus|focusRef'` (candidats : panneaux, étapes, onglets, side-menus, modales maison sans retour du focus) · combobox : options atteignables aux flèches (`aria-activedescendant`, `highlightedIndex`) · `autoFocus` sur un champ en milieu de page.
Qualification : focus perdu (`body`) après un changement d'étape ou d'onglet → Majeur ; modale sans retour du focus au déclencheur → Majeur ; `tabIndex` positif → Majeur.

### 12.9 Piège au clavier (R, S pour les causes)
Détection : `G 'onKeyDown=\{[^}]*preventDefault' -A4 | grep -E 'Tab'` (Tab intercepté) · modales maison sans gestion Échap : `G 'role="dialog"|<Modal\b' -A10 | grep -vE 'Escape|onClose|createModal|<Dialog'`. Piège confirmé au runtime → Bloquant.

### 12.10 Raccourcis mono-touche (S)
Détection : `G 'addEventListener\("keydown"|onKeyDown' -A4 | grep -E 'key === "[a-zA-Z0-9]"|e\.key\.length === 1'` sans modificateur (`ctrlKey`, `metaKey`, `altKey`) et hors champ de saisie → Majeur. Absent → NA.

### 12.11 Contenus additionnels au clavier (S+R)
Détection : sous-menus et menus déroulants : `G 'MenuItem|Menu\b|Dropdown|submenu|sous-menu' -i` → ouverture au focus ou par bouton, navigation aux flèches, Échap. Menu au survol seul → Bloquant.

## Thème 13 — Consultation

### 13.1 Limite de temps (S)
Détection : `G 'setTimeout|setInterval' -A3 | grep -E 'logout|signOut|redirect|router\.push|reset|clear|hide|close|setOpen\(false\)|toast'` · expiration de session côté client : `G 'expires|maxAge|session.*(timeout|expire)|inactivity' -i` · toasts à disparition automatique : `G 'autoHideDuration|duration:|timeout:' -B2 -A2 | grep -iE 'toast|snackbar|notification'` · redirection après délai (`setTimeout(() => router.push`).
Qualification : session ou contenu qui expire sans avertissement ni prolongation, et durée < 20 h → Bloquant ; toast informatif qui disparaît seul sans possibilité de le relire → Majeur (Mineur si le contenu est purement confirmatif et réaffiché ailleurs) ; redirection automatique après succès : acceptable si annoncée et courte, sinon Majeur.

### 13.2 Nouvelle fenêtre (S)
Détection : `G 'window\.open\(' -B3` (déclenché par une action utilisateur ?) · `G 'target="_blank"' | grep -viE 'nouvelle fenêtre|nouvel onglet|title='`. Ouverture sans action → Majeur ; nouvelle fenêtre non annoncée → Mineur (compter aussi 6.1 si l'intitulé en dépend).

### 13.3 / 13.4 Documents bureautiques (S)
Détection : `G 'href="[^"]*\.(pdf|docx?|xlsx?|pptx?|odt|ods)"|download='`. Présents : version accessible ou alternative HTML ? Format et poids dans le libellé (`fr-link--download`, `fr-link__detail`) ? Absent → Majeur (13.3) ; libellé sans format → Mineur.

### 13.5 / 13.6 Contenus cryptiques (S)
Détection : émojis (sonde 1.2), art ASCII, `:-)`, flèches textuelles `→ ← ↑ ↓ ✓ ✗` porteurs de sens : `G '[→←↑↓✓✔✗✘★☆]'`. Sans alternative (`aria-label`, `role="img"`, texte adjacent) → Mineur.

### 13.7 Flash (R)
Détection : `G 'animation|@keyframes|blink|flash|strobe' -i "--include=*.css --include=*.scss"` et `G 'animation:|keyframes'` dans `sx`. Fréquence > 3 Hz sur une grande zone → Bloquant. Absent → NA.

### 13.8 Contenu en mouvement (S+R)
Détection : `G 'Carousel|Slider|Swiper|autoplay|autoPlay|marquee|animation:.*infinite|setInterval' -i` · `G 'prefers-reduced-motion' "--include=*.css --include=*.scss"` (présence de la règle).
Qualification : mouvement > 5 s sans bouton pause / stop ni respect de `prefers-reduced-motion` → Majeur. Absent → NA.

### 13.9 Orientation (S+R)
Détection : `G 'orientation:\s*(portrait|landscape)|screen\.orientation|lock\(' `. Verrouillage sans justification → Majeur. Absent → conforme après runtime portrait/paysage sur l'échantillon.

### 13.10 Gestes complexes (S)
Détection : `G 'useSwipeable|onSwipe|onPinch|gesture|hammer' -i` → alternative par boutons ou clic simple présente ? Absent → Majeur.

### 13.11 Annulation de l'action au pointeur (S)
Détection : `G 'onMouseDown|onPointerDown|onTouchStart' -A3` déclenchant une action (pas seulement un `preventDefault` ou un focus) sans annulation → Majeur.

### 13.12 Mouvement de l'appareil (S)
Détection : `G 'devicemotion|deviceorientation|DeviceMotionEvent|shake' -i`. Présent sans alternative UI → Majeur. Absent → NA.

---

## Contrôles runtime transverses (`javascript_tool`)

```js
// Titres et hiérarchie
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ' ' + h.textContent.trim().slice(0, 70))
// Landmarks et rôles
[...document.querySelectorAll('header,nav,main,footer,[role]')].map(e => e.tagName + ' role=' + (e.getAttribute('role') || '(implicite)') + ' label=' + (e.getAttribute('aria-label') || ''))
// Titre, langue
[document.title, document.documentElement.lang]
// Références ARIA cassées
[...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(e => ['aria-labelledby','aria-describedby','aria-controls'].flatMap(a => (e.getAttribute(a) || '').split(' ').filter(Boolean).filter(id => !document.getElementById(id)).map(id => a + '→#' + id + ' manquant')))
// ids dupliqués
Object.entries([...document.querySelectorAll('[id]')].reduce((m, e) => (m[e.id] = (m[e.id] || 0) + 1, m), {})).filter(([, n]) => n > 1)
// Champs sans nom accessible
[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(el => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.title).map(el => el.outerHTML.slice(0, 120))
// Images sans alt
[...document.querySelectorAll('img:not([alt])')].map(i => i.src)
// Contraste : ratio WCAG entre couleur et fond calculés
(() => { const L = c => { const [r,g,b] = c.match(/\d+/g).map(Number).map(v => v/255).map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055) ** 2.4); return 0.2126*r + 0.7152*g + 0.0722*b }; const bg = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !c.startsWith('rgba(0, 0, 0, 0')) return c } return 'rgb(255, 255, 255)' }; return [...document.querySelectorAll('p,span,a,li,td,th,label,button,h1,h2,h3,h4,h5,h6')].filter(e => e.textContent.trim()).map(e => { const cs = getComputedStyle(e); const l1 = L(cs.color), l2 = L(bg(e)); const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.5 && parseInt(cs.fontWeight) >= 700); return { t: e.textContent.trim().slice(0,40), ratio: +ratio.toFixed(2), min: big ? 3 : 4.5 } }).filter(x => x.ratio < x.min) })()
// Reflow : défilement horizontal à la largeur courante (resize_window mobile avant)
document.documentElement.scrollWidth > window.innerWidth
// Éléments focusables dans l'ordre du DOM (12.8) — comparer à l'ordre visuel
[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => !e.disabled && e.offsetParent).map(e => (e.getAttribute('aria-label') || e.textContent.trim() || e.tagName).slice(0, 40))
```
