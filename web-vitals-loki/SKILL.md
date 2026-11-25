---
name: web-vitals-loki
description: "Contrôle des web-vitals terrain de La bonne alternance dans Loki (MCP Grafana) : santé de la chaîne de mesure, 75e centile par type de page et par appareil comparé aux seuils Google, attribution (éléments, scripts, découpage INP) et régressions par version. Lecture seule. Déclenche sur : 'contrôle web vitals', 'INP terrain', 'CLS terrain', 'mesures Loki web-vitals', 'p75 web-vitals', 'étape 0 de #5904'."
argument-hint: "[période, ex. 7j (défaut) | 14j | 2026-11-18..2026-11-25] [métriques, ex. INP,CLS (défaut) | INP,CLS,LCP,TTFB,FCP] [env : production (défaut) | recette]"
---

# web-vitals-loki : contrôle des mesures terrain

Rapport en lecture seule sur les rapports `web-vital` journalisés par `POST /_private/web-vitals` (#5902, 10 % des chargements, hors widget). Aucune écriture Grafana, aucun message, aucun commentaire GitHub. Réponds en français.

## Paramètres

- **Période** : défaut, les 7 derniers jours pleins, heure de Paris. `END` = aujourd'hui `T00:00:00+01:00` en hiver, `+02:00` en été (vérifier avec `date +%z`). `N` = nombre de jours.
- **Métriques** (`METRICS`) : défaut `INP,CLS`. `LCP`, `TTFB`, `FCP` dès que #5904 est livré (cf. « Nouvelles métriques »).
- **Environnement** (`ENV`) : `production` par défaut, `recette` pour valider une évolution.
- **Seuil de significativité** (`MIN`) : 100 échantillons. Hypothèse de travail, à ajuster avec l'usage : sous 100 mesures, le p75 d'un groupe bouge de plusieurs tranches d'un jour à l'autre.

## Règles d'exécution (vérifiées le 25/11/2026)

- Prérequis : le MCP Grafana de `monitoring.apprentissage.beta.gouv.fr` (outil `query_loki_logs`, nommé `mcp__grafana__query_loki_logs` quand le serveur s'appelle `grafana`) et `node`. Sans MCP Grafana, s'arrêter et le dire : aucune donnée ne s'invente.
- Outil : `mcp__grafana__query_loki_logs`, datasource `P8E80F9AEF21F6940`, `queryType: "instant"` avec `endRfc3339: END`, sauf la requête S1 (range).
- **Une requête à la fois.** Trois requêtes de 7 jours lancées en parallèle expirent toutes (timeout du client MCP), et Loki reste chargé quelques minutes après.
- **Pas de `quantile_over_time` au-delà de 24 h** : un quantile ne se découpe pas, la requête de 7 jours expire. Le p75 vient d'un histogramme (`count_over_time` par tranche, que Loki découpe) traité par `p75.mjs`. Les seuils Google sont des bornes de tranche : le verdict est exact pour les métriques en ms, à l'arrondi près pour le CLS (cf. V2). La valeur du p75 est interpolée dans sa tranche ; écart au quantile exact mesuré sur le 24/11 : 1 à 7 ms pour l'INP, 0,002 pour le CLS.
- **Fenêtres `[W]` de 7 jours au plus.** `W` = `<N>d` si `N ≤ 7`. Sinon, découper en fenêtres `[7d]` successives (la plus ancienne plus courte), `endRfc3339` de chaque fenêtre = début de la suivante, et lancer chaque requête instantanée une fois par fenêtre. Les comptages s'additionnent ; ne jamais moyenner deux p75 ni deux moyennes (additionner sommes et n).
- **Toujours un `by (...)` explicite** : un `quantile_over_time` sans `by` rend une série par flux et par label extrait (129 séries pour une journée).
- Champs JSON imbriqués : `| json x="log_web_vital.champ"`. Un champ `null` sort en label vide (`""`), une série sans le label dans le résultat.
- Limite de 500 séries par requête, comptées avant `topk` : d'où le regroupement des routes en types de page et une requête d'histogramme par métrique.
- Si une requête expire ou renvoie une erreur, la relancer seule une fois, puis réduire la fenêtre (deux moitiés additionnées). Le signaler dans le rapport.

## Fragments

`SEL` : `{product="lba", service="server", env="<ENV>"} |= `"log_msg":"web-vital"``

`DEVICE` (mobile = largeur < 768 px, comme la requête de la PR #5903) :
```
device=`{{ if lt (int .vw) 768 }}mobile{{ else }}desktop{{ end }}`
```

`PAGE` (45 gabarits de route observés, regroupés) :
```
page=`{{ $r := .landing_route }}{{ if eq $r "/" }}accueil{{ else if eq $r "/recherche" }}recherche{{ else if hasPrefix "/emploi/offres_emploi_lba/" $r }}offre lba{{ else if hasPrefix "/emploi/offres_emploi_partenaires/" $r }}offre partenaire{{ else if hasPrefix "/emploi/recruteurs_lba/" $r }}recruteur lba{{ else if hasPrefix "/formation/" $r }}formation{{ else if hasPrefix "/alternance/" $r }}landing alternance{{ else if hasPrefix "/metiers" $r }}metiers{{ else if hasPrefix "/1jeune1solution" $r }}1j1s{{ else if hasPrefix "/espace-pro" $r }}espace pro{{ else }}autre{{ end }}`
```

`LE` (tranches ; bornes incluses, comme les seuils Google) :
```
le=`{{ $v := float64 .value }}{{ if eq .metric "CLS" }}{{ if le $v 0.01 }}0.01{{ else if le $v 0.025 }}0.025{{ else if le $v 0.05 }}0.05{{ else if le $v 0.075 }}0.075{{ else if le $v 0.1 }}0.1{{ else if le $v 0.15 }}0.15{{ else if le $v 0.2 }}0.2{{ else if le $v 0.25 }}0.25{{ else if le $v 0.3 }}0.3{{ else if le $v 0.5 }}0.5{{ else }}+Inf{{ end }}{{ else if le $v 50.0 }}50{{ else if le $v 100.0 }}100{{ else if le $v 150.0 }}150{{ else if le $v 200.0 }}200{{ else if le $v 250.0 }}250{{ else if le $v 300.0 }}300{{ else if le $v 400.0 }}400{{ else if le $v 500.0 }}500{{ else if le $v 600.0 }}600{{ else if le $v 800.0 }}800{{ else if le $v 1000.0 }}1000{{ else if le $v 1500.0 }}1500{{ else if le $v 1800.0 }}1800{{ else if le $v 2500.0 }}2500{{ else if le $v 3000.0 }}3000{{ else if le $v 4000.0 }}4000{{ else if le $v 6000.0 }}6000{{ else }}+Inf{{ end }}`
```

`NORM` (ids générés par `useId` de React, `_R_6l9j…_` ou `_r_k_`, qui fragmenteraient le classement) :
```
regexReplaceAll "_[rR]_[0-9a-zA-Z]+_" .target "_R_"
```

## 1. Santé de la chaîne

**S0 — témoin, avant tout le reste** : `sum by (metric) (count_over_time(SEL | json metric="log_web_vital.metric" [W]))`.
Pour chaque métrique de `METRICS` absente ou à 0, relancer sous une autre forme, sans parseur : `sum(count_over_time(SEL |= `"metric":"<M>"` [W]))`. Un `data: []` vaut 0. Toujours 0 : un dernier filtre plus large, `sum(count_over_time(SEL |= `<M>` [W]))`, distingue le cas d'une ligne qui mentionne la métrique sous un autre format (tableau de métriques de #5904, par exemple : adapter les fragments). Encore 0 : cette métrique est en **ÉCHEC** (non journalisée, livraison à vérifier, ou mauvais `ENV`) ; la retirer de `METRICS` pour la suite et l'écrire en tête du rapport. Toutes les métriques en échec : arrêter là, le rapport se limite au titre, au verdict ÉCHEC et aux requêtes lancées avec leur résultat. Ne jamais produire de valeurs sur un résultat vide.
Repère 7 j (18-25/11/2026) : CLS 10 485, INP 11 234. Sous 5 000 par métrique et par 7 jours : ⚠️ volume, même si aucun jour n'est anormal par rapport aux autres.

**S1 — volume par jour** (range, `stepSeconds: 86400`, bornes à minuit UTC quel que soit l'heure d'été : `startRfc3339` = `<premier jour>T00:00:00Z`, `endRfc3339` = `<jour de END>T00:00:00Z`) : `sum by (metric) (count_over_time(SEL | json metric="log_web_vital.metric" [1d]))`.
Loki aligne les pas sur minuit UTC et le point de timestamp T compte les 24 h avant T. Le premier point (T = start) couvre la veille : l'ignorer. Il reste exactement N points, chacun daté du jour UTC qui finit à T (« jours UTC » dans le rapport). Leur somme diffère de S0 de quelques unités (décalage d'une ou deux heures avec Paris) : S0 fait foi pour les totaux.
Repères (production, 18-24/11/2026, par métrique et par jour) : 1 500 à 2 400 en semaine, 700 à 860 le week-end.

**S2 — réponses de l'API** : `sum by (status) (count_over_time({product="lba", service="server", env="<ENV>"} |= `"url":"/api/_private/web-vitals"` |= `"log_msg":"request completed"` | json status="log_res.statusCode" [W]))`.
Repère 7 j : 29 254 × 200, 8 × 400, 3 × 404, 2 × 429. Le navigateur passe par `/bff/_private/web-vitals` (nginx), relayé au serveur sous `/api/_private/web-vitals` : ces lignes `request completed` couvrent les deux.

**S3 — rapports journalisés / acceptés** : total S0 ÷ 200 de S2. Une requête porte un seul rapport (une métrique) depuis #5902 ; si #5904 regroupe les métriques en un envoi, ce ratio change de sens, le redéfinir. Le contrôleur répond 200 sans journaliser aux robots (`isbot`). Repère : 74 %. Constat ponctuel du 24/11 (agrégat nginx par user-agent, hors skill pour ne pas lire les lignes nginx) : l'écart venait surtout de `HeadlessChrome`, ≈ 1 080 envois ce jour-là.

**S4 — attribution manquante** : `sum by (metric, attr) (count_over_time(SEL | json metric="log_web_vital.metric", value="log_web_vital.value", target="log_web_vital.target", script="log_web_vital.longest_script_url" | label_format attr=`{{ $v := float64 .value }}{{ if eq .metric "CLS" }}{{ if le $v 0.0 }}CLS nul{{ else if eq .target "" }}cible non{{ else }}cible oui{{ end }}{{ else if eq .metric "INP" }}{{ if le $v 200.0 }}INP ≤ 200{{ else }}lent cible {{ if eq .target "" }}non{{ else }}oui{{ end }} script {{ if eq .script "" }}non{{ else }}oui{{ end }}{{ end }}{{ else if eq .target "" }}cible non{{ else }}cible oui{{ end }}` [W]))`.
Dénominateurs : CLS non nuls (un CLS nul n'a pas de cible) ; INP > 200 ms (toutes les lignes « lent »). Repères 7 j : CLS non nul sans cible 2,4 % (174 / 7 166) ; INP lent sans cible 9,6 % (157 / 1 641), sans script 48,2 % (791 / 1 641, cible ou non). Les scripts viennent de l'API Long Animation Frames, implémentée dans Chromium seulement : Safari et Firefox n'en envoient jamais, d'où cette part élevée.

**Alertes santé ⚠️** : S0 sous 5 000 par métrique et par 7 jours ; un jour de semaine sous 1 000 ou de week-end sous 300 par métrique ; un jour sous 50 % de la médiane des jours de même type de la période (semaine ; week-end : moyenne des jours de week-end) ; 400 ou 429 > 1 % des requêtes ; S3 < 60 % ; CLS non nul sans cible > 10 % ; INP lent sans cible > 20 %.

## 2. Valeurs

**V1 — part sous les seuils** (exacte, additive, **fait foi**) : `sum by (metric, device, rating) (count_over_time(SEL | json metric="log_web_vital.metric", rating="log_web_vital.rating", vw="log_web_vital.viewport_width" | label_format DEVICE [W]))`. `rating` est calculé par `web-vitals` sur la valeur brute avec les seuils Google : p75 ≤ seuil « bon » ⇔ au moins 75 % de `good`.

**V2 — histogramme par type de page**, une requête par métrique `M` de `METRICS` :
```
sum by (device, page, le) (count_over_time(SEL |= `"metric":"<M>"` | json metric="log_web_vital.metric", value="log_web_vital.value", landing_route="log_web_vital.landing_route", vw="log_web_vital.viewport_width" | metric="<M>" | label_format DEVICE, PAGE, LE [W]))
```
Le résultat compte 100 à 270 séries (le `maxLinesAllowed` des métadonnées ne s'applique pas aux requêtes métriques). Le recopier en TSV dans le scratchpad (`device<TAB>page<TAB>le<TAB>count`, en-tête compris, une ligne par série), un fichier par fenêtre, puis :
```bash
node ~/.claude/skills/web-vitals-loki/scripts/p75.mjs --metric <M> --min <MIN> <fenêtre1>.tsv [<fenêtre2>.tsv ...]
```
Si le script n'est pas sous `~/.claude/skills/`, le prendre dans `<repo mna-skills>/web-vitals-loki/scripts/p75.mjs`. Introuvable : ne pas calculer de p75 à la main, s'en tenir à V1 et le dire en tête du rapport.

Le script additionne les fenêtres, sort un tableau Markdown (n, p75, part ≤ seuil « bon », part > seuil « mauvais », verdict) et marque « non significatif » sous `MIN`. Il sort en erreur sur une entrée vide ou mal formée : ne pas contourner, corriger le TSV.

Contrôles de recopie, obligatoires : « lignes lues » (stderr) = somme des `linesReturned` des fenêtres ; par appareil, n = n de V1 et nombre de `poor` = part > seuil « mauvais » × n. Pour l'INP, la part ≤ seuil doit aussi égaler `good` de V1. Pour le CLS, la valeur journalisée est arrondie à 4 décimales (`buildClsReport`) : quelques CLS à `0.1` sont notés `needs-improvement` (10 sur 7 651 du 18 au 25/11), un écart de cet ordre est normal et V1 fait foi. Un verdict suivi de « (limite) » est à moins de 0,5 point de la frontière : ne pas le commenter comme un franchissement.

Seuils Google (bon ≤, mauvais >) : INP 200 / 500 ms, CLS 0,1 / 0,25, LCP 2 500 / 4 000 ms, FCP 1 800 / 3 000 ms, TTFB 800 / 1 800 ms.

## 3. Attribution et versions

Au-delà de 7 jours, les `topk` (A1, A3, A4) s'additionnent fenêtre par fenêtre : approximation, une cible absente du top d'une fenêtre manque à son total. Le dire dans le rapport.

Les cibles et scripts absents sont exclus des `topk` (`| target != ""`, `| script != ""`) : leur nombre vient de S4. Parts de A1 et A3 rapportées aux INP > 200 ms, de A4 aux CLS > 0,1.

**A1 — INP, éléments des interactions lentes** : `topk(15, sum by (target) (count_over_time(SEL |= `"metric":"INP"` | json metric="log_web_vital.metric", value="log_web_vital.value", target="log_web_vital.target" | metric="INP" | value > 200 | target != "" | label_format target=`{{ NORM }}` [W])))`.
Les classes `mui-xxxx` changent à chaque build : rapprocher par la structure, pas par le hash.

**A1 bis — détail des ids générés, obligatoire** dès que `#_R_` ou `#fr-button-_R_` dépasse 5 % des INP lents : `topk(10, sum by (landing_route, target) (count_over_time(SEL |= `"metric":"INP"` | json metric="log_web_vital.metric", value="log_web_vital.value", target="log_web_vital.target", landing_route="log_web_vital.landing_route" | metric="INP" | value > 200 | target != "" | label_format target=`{{ NORM }}` | target=~"#(fr-button-)?_R_" [W])))`. Le gabarit de route situe l'élément (au 25/11 : `#_R_` surtout sur `/`, `#fr-button-_R_` sur les fiches emploi et `/recherche`).

**A2 — INP, découpage moyen** des interactions entre 200 ms et 2 s. Au-delà (jusqu'à 100 s observées, par exemple sur `#applicant_attachment_name`, le champ de pièce jointe qui ouvre le sélecteur de fichier), les valeurs écrasent la moyenne : n'en donner que le nombre, par `sum by (device) (count_over_time(<pipeline de la branche « 0 n » avec value > 2000 au lieu de value > 200 | value <= 2000> [W]))`. Les trois champs sont obligatoires dans `ZWebVitalINP` : le même n vaut pour les trois moyennes.
```
label_replace(sum by (device) (sum_over_time(SEL |= `"metric":"INP"` | json metric="log_web_vital.metric", value="log_web_vital.value", vw="log_web_vital.viewport_width", d="log_web_vital.input_delay" | metric="INP" | value > 200 | value <= 2000 | label_format DEVICE | unwrap d | __error__="" [W])), "part", "1 attente", "", "")
or label_replace(<idem avec d="log_web_vital.processing_duration">, "part", "2 JS", "", "")
or label_replace(<idem avec d="log_web_vital.presentation_delay">, "part", "3 affichage", "", "")
or label_replace(sum by (device) (count_over_time(<même pipeline sans unwrap> [W])), "part", "0 n", "", "")
```
Moyenne = somme ÷ n. Requête lourde (4 lectures de la fenêtre) : la lancer seule.

**A3 — INP, scripts les plus longs** : `topk(10, sum by (script, invoker) (count_over_time(SEL |= `"metric":"INP"` | json metric="log_web_vital.metric", value="log_web_vital.value", script="log_web_vital.longest_script_url", invoker="log_web_vital.longest_script_invoker" | metric="INP" | value > 200 | script != "" | label_format script=`{{ regexReplaceAll "^https://[^/]+" .script "" }}`, invoker=`{{ regexReplaceAll "_[rR]_[0-9a-zA-Z]+_" .invoker "_R_" | trunc 60 }}` [W])))`. Les chunks changent de nom à chaque build.

**A4 — CLS, éléments qui se décalent** : `topk(10, sum by (target) (count_over_time(SEL |= `"metric":"CLS"` | json metric="log_web_vital.metric", value="log_web_vital.value", target="log_web_vital.target" | metric="CLS" | value > 0.1 | target != "" | label_format target=`{{ NORM }}` [W])))`.

**A5 — p75 par version**, une requête par métrique : comme V2 avec `version="log_web_vital.version"` à la place de `landing_route` et `sum by (device, version, le)`, sans `PAGE`. TSV `device<TAB>version<TAB>le<TAB>count`, puis `p75.mjs --metric <M> --min <MIN> --sort key --hide-small` (ordre des versions, versions non significatives omises). « Précédente » = la version significative précédente. Une version qui dégrade le verdict, ou la part ≤ seuil « bon » ou ≤ seuil « mauvais » de plus de 3 points, est une régression possible (⚠️ version, compté à part des alertes santé). Le mix de pages change aussi d'une version à l'autre. Pour trancher, comparer les deux versions page par page, sur l'appareil concerné (`vw >= 768` desktop, `vw < 768` mobile) :
```
sum by (version, page, rating) (count_over_time(SEL |= `"metric":"<M>"` | json metric="log_web_vital.metric", rating="log_web_vital.rating", version="log_web_vital.version", landing_route="log_web_vital.landing_route", vw="log_web_vital.viewport_width" | metric="<M>" | version=~"<v précédente>|<v>" | vw >= 768 | label_format PAGE [W]))
```
Régression établie si une page dégrade sa part `poor` ou `good` à n comparable ; sinon, effet de mix (part de chaque page dans le total de la version). Exemple au 25/11 : CLS desktop en 1.970.0, la fiche recruteur passe de 15 % à 33 % de `poor` (n 156 → 498) puis 7 % en 1.971.0.

## Nouvelles métriques (LCP, TTFB, FCP)

S0, S1, S3, V1, V2 et A5 fonctionnent sans modification si #5904 garde **une ligne de log par métrique** avec `log_web_vital.metric` et `log_web_vital.value` (les tranches de `LE` couvrent déjà les seuils des trois métriques). Si #5904 journalise un tableau de métriques dans une seule ligne, toutes les requêtes cassent : le signaler et adapter les fragments. L'attribution propre à LCP, TTFB et FCP (élément, ressource, découpages) s'ajoute ici une fois les champs connus, chaque requête exécutée d'abord sur la recette.

## Confidentialité

Seules les lignes `web-vital` et `request completed` du serveur sont lues. Ne jamais lire les lignes `incoming request` (en-têtes, referer) ni les lignes brutes nginx (IP, user-agent) : aucune requête de ce skill n'en a besoin. Les champs `web-vital` sont déjà anonymisés (gabarits de route, URL sans query).

## Rendu

Rapport en Markdown, 120 lignes au plus, sans introduction ni conclusion ; chaque chiffre vient d'une requête exécutée, avec son n. Écrit dans un fichier du scratchpad quand il doit être joint à un ticket, sinon dans le message de fin. Pour tenir : un seul tableau par type de page (INP et CLS côte à côte, groupes significatifs seuls), attributions en ligne, versions en tableau croisé.
1. Titre (période, ENV, métriques) puis verdict : **ÉCHEC** (S0) en tête s'il y a lieu, sinon « chaîne saine » ou nombre d'alertes santé ⚠️, puis le nombre de ⚠️ version.
2. **Santé** : volume par jour UTC et par métrique, réponses de l'API, part journalisée, attribution manquante.
3. **Valeurs** : par métrique, tableau mobile / desktop (V1 + p75 du script), puis le tableau par type de page et appareil.
4. **Attribution** : A1, A1 bis, A2, A3, A4, avec la part de chaque ligne dans le total concerné.
5. **Versions** : sortie de `p75.mjs` sur A5.
6. **Points d'attention** numérotés, du plus grave au moins grave, en distinguant constat et hypothèse. Pour comparer à CrUX (Search Console), rappeler que CrUX couvre 28 jours de Chrome seul : un écart d'ordre de grandeur est à expliquer, une différence de quelques dizaines de ms non.
