# Audit RGAA 4.1.2 — La bonne alternance — grille du 21/10/2026

Sources :
- **Grille de référence** : « Grille-RGAA-DGEFP-20261021.xlsx » (onglets Échantillon, Synthèse, BaseDeCalcul, Critères, P01–P27), non versionnée ; à demander à la mission apprentissage. Elle donne le statut C / NC / NA de chaque critère par page, **sans commentaire ni ticket**. L'en-tête de l'onglet Échantillon porte encore « Date : 25/11/2025 · Visite initiale » : la date retenue est celle du nom de fichier.
- **Détail des tickets** : rapport « Audit RGAA 4.1 – DGEFP – 25/11/2025 » (Audit-Web, 147 p.), non versionné. Seuls les tickets dont le critère est **encore NC sur la page** dans la grille 10/2026 sont repris (§ 4 et § 5). Leur description date de 2025 : **toujours confronter un ticket au code actuel avant de le reporter comme ouvert.**

## 1. Score

| Indicateur | 11/2025 | 10/2026 |
|---|---|---|
| Taux de conformité global (critères C / (C + NC)) | 48,33 % (29 / 60) | **81,97 %** (50 / 61) |
| Critères conformes / non conformes / non applicables | 29 / 31 / 46 | 50 / 11 / 45 |
| Taux moyen de conformité par page (moyenne des 27 pages) | 74,21 % | **89,81 %** |

Critères NC au 21/10/2026 (11) : **5.6, 7.1, 7.3, 9.1, 9.3, 10.2, 10.3, 10.13, 12.1, 12.2, 13.1**.

## 2. Calcul du score et des points à gagner

- **Statut global d'un critère** : NC si au moins une page de l'échantillon est NC ; C si aucune page NC et au moins une C ; NA si NA partout. Le dénominateur est le nombre de critères C + NC (61 aujourd'hui).
- **Faire basculer un critère NC → C = +1,64 pt** sur le taux global (100 / 61). Il faut corriger **toutes** les pages NC de ce critère. Une correction partielle vaut 0 pt sur le taux global.
- **Taux par page** = C / (C + NC) de la page. Corriger un critère sur une page vaut +100 / (C + NC) sur cette page (voir tableau § 3, colonne « Gain / critère ») et 1/27 de cela sur le taux moyen (≈ +0,08 pt).
- **Régression** : un critère C qui devient NC sur une seule page fait perdre 1,64 pt (49 / 61 = 80,33 %). Les 50 critères C, dont les 20 corrigés depuis 2025 (§ 6), sont autant de régressions possibles.
- **Nouvelle applicabilité** : un critère NA qui devient applicable (vidéo, iframe, CAPTCHA…) entre au dénominateur ; s'il est C, le taux devient 51 / 62 = 82,26 % (+0,29) ; s'il est NC, 50 / 62 = 80,65 % (−1,32).
- Objectif 100 % = 11 bascules. Les 3 critères transverses (9.1 et 10.2 sur les 27 pages, 12.1 sur 26) valent à eux seuls **+4,92 pts** et se corrigent surtout dans Header, Footer et layouts.

### Priorisation par rendement (pages à corriger pour basculer)

| Critère | Pages NC | Bascule | Où corriger principalement |
|---|---|---|---|
| 5.6 | P26 | 1 page | `Table*.tsx` espace pro : `<th>` Actions en `fr-sr-only` |
| 10.3 | P22, P23 | 2 pages | ordre DOM bloc OPCO, formulaire offre |
| 10.13 | P22, P23, P27 | 3 pages | tooltip → `Tooltip` DSFR |
| 7.3 | P22, P23, P26, P27 | 4 pages | tooltips, tri de tableau |
| 9.3 | P05, P15, P16, P17 | 4 pages | listes `<ul>/<ol>` (FAQ Notion + ItemDetail) |
| 13.1 | P22, P23, P24, P26, P27 | 5 pages | expiration de session espace pro |
| 12.2 | P13–P20, P25 | 9 pages | navigation des pages de processus |
| 7.1 | P01, P05, P06, P13, P14, P15, P16, P17, P22, P23, P26, P27 | 12 pages | rôles, intitulés de boutons icône, `aria-label` ≠ visible |
| 12.1 | toutes sauf P22 | 26 pages | second système de navigation (plan du site atteignable partout) |
| 9.1, 10.2 | 27 pages | transverse | titres (footer, titres simulés), liens externes et icônes CSS |

## 3. Échantillon audité → routes et composants du repo

C / NC et gain : grille du 21/10/2026.

| Page | Nom | Route auditée | Code (`ui/`) | C / NC | Taux | Gain / critère | Critères NC |
|---|---|---|---|---|---|---|---|
| P01 | Accueil | `/` | `app/(home)`, `app/_components/RechercheForm`, `components/SearchForTrainingsAndJobs` | 43 / 4 | 91,49 % | +2,13 | 7.1, 9.1, 10.2, 12.1 |
| P02 | Contact | `/contact` | `app/(editorial)/contact` | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P03 | Mentions légales | `/mentions-legales` | `app/(editorial-with-notion)/mentions-legales` (rendu Notion, `public/styles/notion.css`) | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P04 | Accessibilité | `/accessibilite` | `app/(editorial-with-notion)/accessibilite` | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P05 | FAQ | `/faq` | `app/(editorial-with-notion)/faq` (side-menu + `<details>` Notion) | 37 / 5 | 88,10 % | +2,38 | 7.1, 9.1, 9.3, 10.2, 12.1 |
| P06 | Ressources | `/ressources` | route disparue ; contenu réparti dans `app/(editorial)/guide-*` — à confirmer | 38 / 4 | 90,48 % | +2,38 | 7.1, 9.1, 10.2, 12.1 |
| P07 | Statistiques | `/statistiques` | `app/(editorial)/statistiques` (`StatistiquesClient.tsx`, onglets) | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P08 | Espace développeurs | `/espace-developpeurs` | `app/(editorial)/espace-developpeurs` | 35 / 3 | 92,11 % | +2,63 | 9.1, 10.2, 12.1 |
| P09 | Métiers | `/metiers` | `app/(editorial)/metiers` | 35 / 3 | 92,11 % | +2,63 | 9.1, 10.2, 12.1 |
| P10 | A propos | `/a-propos` | `app/(editorial)/a-propos` | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P11 | Politique de confidentialité | `/politique-de-confidentialite` | `app/(editorial-with-notion)/politique-de-confidentialite` (+ case opt-out Matomo) | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P12 | CGU | `/conditions-generales-utilisation` | `app/(editorial-with-notion)/conditions-generales-utilisation` | 37 / 3 | 92,50 % | +2,50 | 9.1, 10.2, 12.1 |
| P13 | Résultats de recherche | `/recherche?romes=…` | `app/(candidat)/(recherche)/recherche` (`SearchBar.tsx`, `SearchFilterChip.tsx`, `RechercheLayoutClient.tsx`) | 34 / 5 | 87,18 % | +2,56 | 7.1, 9.1, 10.2, 12.1, 12.2 |
| P14 | Détail d'une formation | `/formation/[id]/…` | `app/(candidat)/formation`, `components/ItemDetail`, `components/RDV` (formulaire de contact CFA) | 44 / 5 | 89,80 % | +2,04 | 7.1, 9.1, 10.2, 12.1, 12.2 |
| P15 | Détail offre LBA | `/emploi/offres_emploi_lba/…` | `app/(candidat)/emploi`, `components/ItemDetail/CandidatureLba` (modale) | 43 / 6 | 87,76 % | +2,04 | 7.1, 9.1, 9.3, 10.2, 12.1, 12.2 |
| P16 | Détail offre partenaire | `/emploi/offres_emploi_partenaires/…` | `components/ItemDetail/PartnerJobComponents` | 35 / 6 | 85,37 % | +2,44 | 7.1, 9.1, 9.3, 10.2, 12.1, 12.2 |
| P17 | Candidature spontanée | `/emploi/recruteurs_lba/…` | `components/ItemDetail` (accordéon « Comment candidater ? »), `CandidatureLba` | 44 / 6 | 88,00 % | +2,00 | 7.1, 9.1, 9.3, 10.2, 12.1, 12.2 |
| P18 | Réponse négative recruteur | lien mail | `app/(candidat)/formulaire-intention`, `components/IntentionPage`, `components/MailCard.tsx` | 37 / 4 | 90,24 % | +2,44 | 9.1, 10.2, 12.1, 12.2 |
| P19 | Réponse positive recruteur | lien mail | idem P18 | 37 / 4 | 90,24 % | +2,44 | 9.1, 10.2, 12.1, 12.2 |
| P20 | Réponse CFA | lien mail (`/detail-rendez-vous/[id]`) | `app/(espace-pro)/(from-mail)/…` ou `components/RDV` — à confirmer | 35 / 4 | 89,74 % | +2,56 | 9.1, 10.2, 12.1, 12.2 |
| P21 | Connexion | `/espace-pro/authentification` | `app/(espace-pro)/espace-pro/authentification`, `components/espace_pro/Authentification` | 40 / 3 | 93,02 % | +2,33 | 9.1, 10.2, 12.1 |
| P22 | Création de compte | `/espace-pro/creation/entreprise` | `app/(espace-pro-creation-compte)`, `components/espace_pro/CreationRecruteur`, `Authentification/CreationCompte.tsx`, `SiretAutocomplete.tsx`, `InformationLegaleEntreprise.tsx`, `InfoToolTip.tsx` | 41 / 7 | 85,42 % | +2,08 | 7.1, 7.3, 9.1, 10.2, 10.3, 10.13, 13.1 |
| P23 | Création / édition d'offre | `/espace-pro/entreprise/offre/[id]` | `app/(espace-pro)/…/entreprise/creation-offre`, `offre/[job_id]`, `components/DepotOffre`, `DropdownCombobox.tsx` | 41 / 8 | 83,67 % | +2,04 | 7.1, 7.3, 9.1, 10.2, 10.3, 10.13, 12.1, 13.1 |
| P24 | Création d'entreprise partenaire | `/espace-pro/cfa/creation-entreprise` | `app/(espace-pro)/…/cfa/creation-entreprise/CreationEntreprisePage.tsx`, `AutocompleteAsync.tsx` | 38 / 4 | 90,48 % | +2,38 | 9.1, 10.2, 12.1, 13.1 |
| P25 | Écrans de confirmation | `/espace-pro/entreprise/offre/[id]/mise-en-relation` | `app/(espace-pro)/…/entreprise/offre/[job_id]/mise-en-relation` | 37 / 4 | 90,24 % | +2,44 | 9.1, 10.2, 12.1, 12.2 |
| P26 | Mes entreprises | `/espace-pro/cfa` | `app/(espace-pro)/…/cfa/page.tsx`, `app/(espace-pro)/_components/Table*.tsx`, `VirtualTable.tsx`, menu actions | 38 / 7 | 84,44 % | +2,22 | 5.6, 7.1, 7.3, 9.1, 10.2, 12.1, 13.1 |
| P27 | Mes informations de compte | `/espace-pro/entreprise/compte` | `app/(espace-pro)/…/entreprise/compte`, `cfa/compte`, `InformationLegaleEntreprise.tsx`, `FieldWithValue.tsx` | 42 / 6 | 87,50 % | +2,08 | 7.1, 7.3, 9.1, 10.2, 10.13, 13.1 |

Composants transverses (toutes les pages) : `app/layout.tsx`, `app/_components/Header.tsx`, `HeaderNavigation.tsx`, `PublicHeader.tsx`, `Footer.tsx`, `Breadcrumb.tsx`, `components/dsfr/DsfrLink.tsx`, `public/styles/application.css`, `notion.css`.

## 4. Tickets transverses encore ouverts (rapport 2025 § 7 à 12, filtrés sur la grille 10/2026)

| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 13.1 | Bloquant | Espace pro (P22, P23, P24, P26, P27) | Session expirant sans contrôle → supprimer / prolonger / ≥ 20 h |
| 12.1 | Majeur | Toutes sauf P22 | Un seul système de navigation → plan du site ou moteur. Le plan du site existe (`(editorial)/plan-du-site`, lié dans `Footer.tsx`) mais la grille 10/2026 reste NC sur 26 pages : vérifier qu'il est atteignable depuis chacune, y compris les pages sans footer |
| 12.2 | Majeur | P13–P20, P25 (recherche, détails, pages arrivées par mail, confirmation) | Ni menu ni footer ; fermeture renvoie vers une page sans navigation → renvoyer vers une page complète |
| 7.1 | Bloquant | Navigation SPA globale | Rôle lien / bouton incohérent → lien = rechargement de page ; bouton = action sur la page. (Le volet focus / titre, 12.8, est conforme en 10/2026.) |
| 9.1 | Majeur | Footer (27 pages) | `fr-footer__top-cat` en `<h3>` → `<h2>` (un `<h2 class="fr-sr-only">` existe désormais dans `Footer.tsx` : vérifier la hiérarchie résultante) |
| 10.2 | Bloquant | Footer liens externes (Blog, Code source) | Icône « nouvelle fenêtre » en CSS seule → `title="Blog - Nouvelle fenêtre"` |

## 5. Tickets par page encore ouverts (rapport 2025 § 13 à 38, filtrés sur la grille 10/2026)

Une ligne par problème, uniquement pour les critères encore NC sur la page. « Sév. » = sévérité de l'audit 2025. Les tickets marqués ★ concernent un composant partagé entre plusieurs pages. Une page dont le seul NC est transverse (9.1, 10.2, 12.1 : voir § 4) n'a pas de section : P02, P03, P04, P07, P09, P10, P11, P12, P21, P24, P25. Quand la grille est NC sans ticket correspondant dans le rapport 2025, la ligne le dit : le défaut est à identifier sur la page.

### P01 Accueil — NC : 7.1, 9.1, 10.2, 12.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | Titre « Se former et travailler en alternance » (`p.MuiTypography-body1`) | Titre simulé → `<h1>` |
| 9.1 | Majeur | « Vous révéler le marché caché de l'emploi » (`h1#home-content-container`) | Niveau incohérent → `<h2>` |
| 7.1 | Majeur | Liste `role="listbox"` avec `<li>` de groupe sans rôle ★ | → `role="option"` sur les `<li>` |
| 9.1 | Majeur | « Métiers » / « Formations » dans la liste (`p.fr-text--bold`) ★ | Titres simulés → `<h2>` |
| 9.1 | Majeur | « La bonne alternance recense une liste d'outils… » (`p`) | Titre simulé → `<h2>` |
| 10.2, 12.1 | — | transverses | voir § 4 |

### P05 FAQ (Notion + side-menu) — NC : 7.1, 9.1, 9.3, 10.2, 12.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.1 | Majeur | `<details>/<summary>` (`notion-toggle`) | → `role="button"` sur `summary` (ou `Accordion` DSFR) |
| 7.1 | Majeur | Side-menu `a.fr-sidemenu__link` qui change le contenu | → `<button>` ou `role="button"` + Entrée/Espace |
| 9.3 | Majeur | Listes imbriquées `notion-list` ; liste à tirets en `span` | → imbriquer dans le `<li>` parent ; `<ul><li>` |

### P06 Ressources (route à confirmer) — NC : 7.1, 9.1, 10.2, 12.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | Titres de cartes (`p.MuiTypography-body1`), encart « Diffusez simplement… » | → `<h3>` |
| 7.1 | Majeur | `fr-sidemenu__link` avec `aria-current="page"` | → bouton, `aria-current="true"` |

### P08 Espace développeurs — NC : 9.1, 10.2, 12.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 10.2 | Bloquant | « Explorer l'API », « Voir la documentation » (`<a target=_blank>`) | → `title="xxx - nouvelle fenêtre"` |
| 9.1 | Majeur | « API » (`p.MuiTypography-body1`) | → titre (niveau selon hiérarchie réelle) |

### P13 Résultats de recherche — NC : 7.1, 9.1, 10.2, 12.1, 12.2
Tickets relevés sur l'ancien moteur ; le nouveau (`#5146`, août 2026) a été livré depuis : re-vérifier chaque ligne.
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.1 | Bloquant | Bouton loupe (`fr-icon-search`, submit) et « retour en haut » (`fr-icon-arrow-up-line`) | Sans intitulé → texte sr-only |
| 9.1 | Majeur | Bandeau « Psst, nous avons une info pour vous ! » (`p.fr-text--lead`) | → `<h2>` |
| 10.2 | Bloquant | « En savoir plus » nouvelle fenêtre (`fr-icon-map-pin-2-fill`) | → `title="xxx - Nouvelle fenêtre"` |
| 10.2 | Bloquant | Bouton tooltip « Employeur handi-engagé » (`#recherche-elligible-handicap-tooltip-button`) | Icône CSS seule → texte sr-only |
| 12.2 | Majeur | Layout sans navigation | voir § 4 |

### P14 Détail d'une formation ★ (ItemDetail + formulaire RDV) — NC : 7.1, 9.1, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 10.2 | Majeur | Boutons précédent / suivant / fermer (`title="previous|next|close"`) ★ | Icône CSS → texte sr-only |
| 9.1 | Majeur | « Description de la formation », « Objectifs », « Sessions » (`p`/`span`) | → titres (selon hiérarchie) |
| 7.1 | Majeur | Bouton « Je prends rendez-vous » (`data-testid="prdvButton"`, `aria-label`) | → `aria-label` reprend le visible |

### P15 Détail offre LBA ★ (ItemDetail + modale CandidatureLba) — NC : 7.1, 9.1, 9.3, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 10.2 | Bloquant | Bouton fermer (`ri-close-line`, `title="close"`, `data-testid="close-detail-button"`) ★ aussi P16, P17 | → texte sr-only (en français) |
| 9.1 | Majeur | « Description du métier » (`p`) | → titre |
| 9.3 | Majeur | « Qualités souhaitées » (puces « • » dans `span`) | → `<ul><li>` |
| 7.1, 10.2 | Bloquant | Bouton `?` tooltip (`question-line`, `title="label"`) ★ | → intitulé sr-only |
| 7.1 | Majeur | Bouton « J'envoie ma candidature » (`aria-label="Ouvrir le formulaire d'envoi de candidature"`) ★ | → `aria-label` commence par le visible, ou le retirer |
| 9.1 | Majeur | Titre de la modale (`p.MuiTypography-body1`) | → `<h2>` (ou `title` de `createModal`) |

### P16 Détail offre partenaire ★ — NC : 7.1, 9.1, 9.3, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 10.2, 7.1 | — | Bouton fermer, bouton `?` ★ | voir P15 |
| 9.3 | — | sans ticket 2025 | défaut de liste à identifier (bloc « Nature du contrat / Niveau visé », descriptif d'offre) |

### P17 Candidature spontanée ★ — NC : 7.1, 9.1, 9.3, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | Accordéon « Comment candidater ? » : `h3.fr-accordion__title` sous un `h4` ; « Vous ne recevez pas de réponse ? », « Vous avez une proposition d'entretien ? » en gras | → `titleAs` cohérent ; titres |
| 10.2 | Bloquant | Liens externes Diagoriente, clicnjob, cvdesignr, canva (icône CSS) | → `title="xxx - Nouvelle fenêtre"` |
| 7.1 | — | Bouton candidature ★ | voir P15 |
| 9.3 | — | sans ticket 2025 | défaut de liste à identifier (accordéon « Comment candidater ? ») |

### P18 / P19 Réponse recruteur (MailCard / IntentionPage) — NC : 9.1, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | « Objet : Réponse … de l'entreprise X » (`div.mail-card-title`) | → `<h2>` |

### P20 Réponse CFA — NC : 9.1, 10.2, 12.1, 12.2
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 9.1 | Majeur | « Un candidat souhaite être contacté… » (`p`), « Voici les coordonnées du contact : » (`span.MuiTypography-h6`) | → `<h1>`, `<h2>` |

### P22 Création de compte (CreationCompte, SiretAutocomplete, InformationLegaleEntreprise, InfoToolTip) — NC : 7.1, 7.3, 9.1, 10.2, 10.3, 10.13, 13.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.3 | Bloquant | Tooltip SIRET / Enseigne (`fr-icon-information-line` sur `span`) ★ aussi P27 | Non focusable → `<button type="button">` |
| 7.1 ×3 | Majeur | idem ★ | Sans intitulé ; sans `role="tooltip"` ; non lié → sr-only + `role="tooltip"` + `aria-describedby` (`Tooltip` DSFR) |
| 10.13 | Majeur | idem ★ | Non fermable à Échap |
| 10.3 | Majeur | Bloc « Votre OPCO » | Ordre DOM ≠ visuel → déplacer avant Annuler / Suivant |
| 9.1 | Majeur | « Votre OPCO » (`p.MuiTypography-body1`) | → `<h2>` |
| 7.1 | Majeur | Bouton « Modifier » à côté de « Votre OPCO » | → `aria-describedby` vers le titre ou sr-only « Modifier votre OPCO » |
| 13.1 | Bloquant | Session | voir § 4 |

### P23 Création / édition d'offre (DepotOffre, DropdownCombobox) — NC : 7.1, 7.3, 9.1, 10.2, 10.3, 10.13, 12.1, 13.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.1 | Bloquant | Bouton `+` (nombre de postes) | Sans intitulé → sr-only « Ajouter un poste » |
| 7.3, 10.13 | — | sans ticket 2025 détaillé | probablement les tooltips ★ (voir P22) : à vérifier |
| 10.3 | Majeur | Formulaire « Votre offre » | Ordre DOM ≠ visuel : à identifier |
| 13.1 | Bloquant | Session | voir § 4 |

### P26 Mes entreprises (Table*.tsx, menu actions) — NC : 5.6, 7.1, 7.3, 9.1, 10.2, 12.1, 13.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 10.2 | Majeur | Bouton loupe (`fr-icon-search-line`, `title="Lancer la recherche"`) | Icône CSS → texte sr-only |
| 5.6 | Majeur | En-tête colonne Actions vide (`th role="hack"`) | → « Actions » en sr-only |
| 7.1 | Majeur | `role="hack"` | → supprimer |
| 7.1, 7.3, 10.2 | Bloquant | Tri « Entreprise » (icône cliquable, sans bouton, sans nom) | → `<button type="button">` + sr-only + `aria-sort` |
| 10.2, 7.1 | Majeur | Bouton `#composition-button` (`fr-icon-settings-5-line`, `title="Actions sur l'entreprise"`, `aria-haspopup`) | → sr-only « Actions » ; nom incluant l'entreprise |
| 13.1 | Bloquant | Session | voir § 4 |

### P27 Mes informations de compte (InformationLegaleEntreprise, FieldWithValue, InfoToolTip) — NC : 7.1, 7.3, 9.1, 10.2, 10.13, 13.1
| Critère | Sév. | Composant | Problème → solution |
|---|---|---|---|
| 7.3, 7.1 ×3, 10.13 | Bloquant | Tooltip SIRET / Enseigne ★ | voir P22 |
| 13.1 | Bloquant | Session | voir § 4 |

## 6. Critères passés NC → C entre 11/2025 et 10/2026

Vingt critères ont basculé : **1.1, 1.2, 1.3, 3.2, 3.3, 6.1, 7.5, 8.6, 8.7, 8.9, 9.2, 10.7, 11.1, 11.4, 11.5, 11.6, 11.10, 11.13, 12.6, 12.8**. 11.11 (NA en 2025) est devenu applicable et conforme ; 8.8 et 11.7 restent NA.

Ce sont les zones de régression les plus probables : un diff qui touche un composant corrigé (formulaires espace pro, autocomplétions, ItemDetail, pages Notion, layouts) doit être vérifié sur ces critères, une rechute sur une seule page coûtant 1,64 pt. Les tickets 2025 correspondants ne sont plus listés ; leurs patterns restent décrits dans `criteres.md` et `patterns-stack.md`.

Indices dans le code (antérieurs à la grille, à garder en tête) :
- Plan du site : `ui/app/(editorial)/plan-du-site/page.tsx`, lié dans `Footer.tsx` (12.1, encore NC sur 26 pages).
- `Footer.tsx` : `<h2 className="fr-sr-only">Informations et liens du site</h2>` (9.1 footer).
- Nouveau moteur de recherche (`#5146`, août 2026) : `SkipLinks` desktop / mobile, `aria-labelledby` / `aria-describedby` / `aria-invalid` sur les champs de `SearchBar.tsx`.
- Commits antérieurs à l'audit 2025 : `<nav>` et rôles (#2556), `<title>` distincts (#2542), tableaux (#2585), alternatives images (#2546), liens d'évitement (#2331).
