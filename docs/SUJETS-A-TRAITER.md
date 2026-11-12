# Sujets à traiter

> Sujets écartés d'une PR (retour de revue hors périmètre, arbitrage en attente, rattrapage à
> mesurer d'abord), chacun avec son préalable. L'entrée est retirée par la PR qui le traite
> (cf. `CLAUDE.md`, « Découpage et livraison d'une feature »).

Format d'une entrée :

```markdown
### Titre court
- **Origine** : PR, ADR ou revue d'où vient le sujet
- **Écarté parce que** : raison du report
- **Préalable** : ce qui doit être vrai avant de s'y attaquer
```

---

## Dépendances et outillage

### Passage à NestJS 12

- **Origine** : #227 (anciennes #199, #201–#203, #206, #207), PR groupée #231
- **Écarté parce que** : majeure à passer d'un bloc sur les 8 paquets `@nestjs/*`
- **Préalable** : groupe Dependabot `nestjs` (fait, #229) ; reprendre #231

### Passage à Vitest 5

- **Origine** : #227 (anciennes #200, #205), PR groupée #232
- **Écarté parce que** : majeure à passer d'un bloc (`vitest` + `@vitest/*`)
- **Préalable** : groupe Dependabot `vitest` (fait, #229) ; reprendre #232

### `@types/node` 26

- **Origine** : #191 (ancienne #166), revient en #234
- **Écarté parce que** : le runtime cible reste Node 24 (`engines`, `.node-version`)
- **Préalable** : décision de passer le runtime à Node 26

### Migration `moduleResolution` vers `nodenext`

- **Origine** : ADR-0022 (bump TypeScript 6)
- **Écarté parce que** : bump minimal retenu, dépréciations silencées par `ignoreDeprecations: "6.0"`
- **Préalable** : avant TypeScript 7.0 ; PR dédiée + ADR. Côté `apps/ui`, seul `baseUrl` est à retirer

### Bornes hautes des overrides `piscina` et `diff`

- **Origine** : audit du 2026-09-11 (`docs/security/vulnerabilites-acceptees.md`)
- **Écarté parce que** : planchers nus qui résolvent en `piscina` 5.2.0 et `diff` 9.0.0, sans incident depuis juin 2026 ; rétrograder était plus risqué
- **Préalable** : prochaine intervention sur ces paquets (`pnpm-workspace.yaml`)

## Exploitation et mesures

### Temps de réponse d'un site de 55 parcelles

- **Origine** : #220, #221
- **Écarté parce que** : le test préprod (site Setec) a d'abord buté sur une 413, corrigée par #221 ; le temps de réponse n'a jamais été mesuré
- **Préalable** : rejouer le calcul en préprod et vérifier qu'il reste sous le délai du routeur Scalingo

### Slash final dans `ALLOWED_INTEGRATOR_ORIGINS`

- **Origine** : #195, ADR-0043
- **Écarté parce que** : la normalisation des origines le rend inoffensif ; nettoyage d'hygiène seulement
- **Préalable** : aucun ; corriger la variable sur chaque app Scalingo

### Imports et seeds manuels à confirmer par environnement

- **Origine** : #189 (`db:qpv:import` puis pré-chauffe), #213 (`db:zones-contrainte-enr:import`), ZAE (`db:zae:import`), #208 (`db:partenaires:seed` puis pré-chauffe), #217 (origines Bénéfriches dans `ALLOWED_INTEGRATOR_ORIGINS`)
- **Écarté parce que** : non lancés par le `postdeploy`, à exécuter à la main
- **Préalable** : vérifier en base préprod et prod que chaque référentiel est présent

## Intégrateurs et statistiques

### Prévenir Bénéfriches du changement de dénominateur de fiabilité

- **Origine** : #189, puis #213 (poids total passé à 33 en v1.15)
- **Écarté parce que** : communication hors code, aucune trace d'envoi
- **Préalable** : aucun ; annoncer le poids total courant (33)

### Statistiques Metabase sur `rang` à ventiler par `version_algorithme`

- **Origine** : #223 (critères excluants, v1.16)
- **Écarté parce que** : le classement change de sens avec les exclusions ; adaptation des questions Metabase hors PR
- **Préalable** : recenser les questions qui lisent `rang`

### Aligner `/statistiques` sur les définitions Metabase V2

- **Origine** : refonte du dashboard Metabase « Statistiques publiques - V2 » (septembre 2026)
- **Écarté parce que** : refonte faite côté Metabase seulement ; `apps/api/src/stats/stats.service.ts` garde les anciennes définitions (ni filtre cache, ni filtre démo, parcelles multi-sites non dépliées)
- **Préalable** : reprendre le périmètre commun du dashboard (`evaluation_source_id IS NULL`, hors `demo`/`mutafriches`, `unnest` des `site_id`)

## Algorithme et enrichissement

### Réactivation de `distanceIte`

- **Origine** : v1.9 (`apps/api/src/evaluation/services/algorithme/versions/v1.9.ts`)
- **Écarté parce que** : critère désactivé temporairement (poids 0,5)
- **Préalable** : validation du Cerema

### Résultat dégradé qui remplace un résultat complet en cache

- **Origine** : ADR-0045
- **Écarté parce que** : noté comme « un chantier distinct » ; une panne de source reste en cache 24 h
- **Préalable** : choisir la règle de remplacement (ne pas écraser un enrichissement plus complet)

### Réutilisation du fichier Enedis des zones de contrainte EnR

- **Origine** : ADR-0046
- **Écarté parce que** : fichier téléchargé à la main et commité sur un dépôt public, conditions de réutilisation non confirmées
- **Préalable** : contact Enedis ; demander aussi une diffusion en open data pour automatiser l'import

### ZAE en outre-mer

- **Origine** : ADR-0049
- **Écarté parce que** : les 431 zones d'activité des départements 97x sont stockées dans Fusac avec des coordonnées hors Lambert-93 malgré le SRID déclaré ; le critère reste indisponible (donc hors fiabilité) pour ces sites
- **Préalable** : identifier la projection réelle de chaque territoire dans le GeoPackage, reprojeter, vérifier sur un site connu, puis retirer le filtre `NOT LIKE '97%'` et la garde du service

### Maquettes Figma « Locaux d'activité »

- **Origine** : #226
- **Écarté parce que** : hors code ; la carte de la page d'accueil a été retouchée en attendant
- **Préalable** : export Figma à jour

### Surface bâtie BDNB comptée deux fois sur les groupes à cheval sur plusieurs parcelles

- **Origine** : analyse des pannes BDNB d'octobre 2026
- **Écarté parce que** : défaut d'exactitude distinct de la disponibilité de l'API ; la vue `batiment_groupe_complet/parcelle` renvoie le groupe entier pour chaque parcelle qu'il touche (`l_parcelle_id` > 1), donc un site multi-parcelle additionne sa surface plusieurs fois (ex. groupe `bdnb-bg-MHVH-E6JW-Y93A`, 596 m², présent sur `490200000A0773` et `490200000A1088`)
- **Mesure du 2026-11-03** (table attributaire, prod) : 244 sites sur 3 004 ont une surface bâtie supérieure à leur surface, dont 130 de plus de 50 % (Ex-Schulmann à Montereau : 27 473 m² bâtis pour 8 466 m²). 73 de ces sites sont **mono-parcelles** : le groupe entier est aussi attribué à une parcelle qu'il ne fait que toucher. L'écart est désormais public, via `GET /api/attributaire/sites` et la question Metabase 245
- **Préalable** : mesurer l'écart sur les sites multi-parcelles enrichis, puis dédoublonner par `batiment_groupe_id` dans `enrichirMulti` (le détail par groupe est déjà conservé dans `cache_bdnb_parcelles.groupes`, aucun appel BDNB supplémentaire à prévoir ; le surplus change les indices : valider avec l'équipe métier, éventuellement via une version d'algorithme). Le cas mono-parcelle demande en plus de répartir l'emprise d'un groupe entre les parcelles qu'il touche, ou de plafonner à la surface du site : à arbitrer

### Clé API BDNB ou import local si les parcelles neuves dépassent le quota

- **Origine** : ADR-0052 (cache par parcelle et appels groupés)
- **Écarté parce que** : le cache de 30 jours et le groupement des appels ramènent la consommation à ~1 800 appels par mois pour les parcelles partenaires, mais ne protègent pas d'un afflux de parcelles neuves (premier passage = un appel pour ~10 groupes de bâtiments)
- **Préalable** : surveiller `x-quota-remaining` (`scalingo --region osc-secnum-fr1 --app mutafriches run "curl -si …"`) ; si le volume de parcelles neuves approche 10 000 appels dans la fenêtre, demander une clé API sur `api-portail.bdnb.io` ou évaluer un import local `raw_*`

### Valeurs de zonage sans score dans la matrice

- **Origine** : peuplement de la table attributaire (ADR-0053)
- **Écarté parce que** : défaut de l'algorithme, antérieur à la table : l'enrichissement produit `zonagePatrimonial` = `monument-historique`, `spr`, `zppaup`, `avap` et `zonageEnvironnemental` = `parc-naturel-regional`, que `MATRICE_SCORING` ne score pas ; le critère est alors ignoré au calcul (sur la copie locale de la prod, environ 1 100 occurrences pour 1 680 sites)
- **Préalable** : décider avec l'équipe métier si ces valeurs se ramènent à une valeur scorée (`perimetre-abf`, `site-inscrit-classe`…) ou reçoivent un score, puis publier une version d'algorithme

## Table attributaire

### Échelles EPCI et département

- **Origine** : ADR-0053 (route par code commune)
- **Écarté parce que** : la commune suffit au premier besoin (Montereau-Fault-Yonne)
- **Préalable** : un besoin exprimé ; `communes.epci_siren` et `communes.departement` permettent d'ajouter `?epci=` ou `?departement=` sans changer la table

### Export CSV ou CNIG par commune

- **Origine** : ADR-0053
- **Écarté parce que** : JSON et GeoJSON couvrent l'usage SIG ; le CSV CNIG existe déjà par partenaire (ADR-0042)
- **Préalable** : demande d'une collectivité ; réutiliser `construireFricheCnig` et `versCsv` (`apps/api/src/partenaires/export/`)

### Sites partenaires sans enrichissement en base

- **Origine** : premier peuplement de la table attributaire (62 sites sur 1 680 en local)
- **Écarté parce que** : le script n'appelle aucune API externe, pour ménager le quota BDNB
- **Préalable** : vérifier en production combien restent après une semaine de pré-chauffe ; au besoin, un mode `--enrichir-manquants` borné en nombre d'appels

### Sites qui se recoupent

- **Origine** : ADR-0053 (correspondance exacte des ensembles de parcelles)
- **Écarté parce que** : rattacher un ensemble proche à un site partenaire demande une règle métier (part de surface commune, parcelle prédominante identique)
- **Préalable** : mesurer les recoupements par commune, puis décider de la règle avec l'équipe

### Distance de raccordement électrique de 999 000 m dans d'anciens enrichissements

- **Origine** : question Metabase 245 « Table attributaire — critères des sites » (2026-11-03)
- **Écarté parce que** : sans effet sur les indices, seul l'affichage est faux. Ancienne valeur sentinelle de l'adapter Enedis, supprimée par #182 (11/09/2026) : 999 km et `null` tombent dans la même tranche « au-delà de 5 km » (`raccordement-electrique-scoring.spec.ts`). Elle n'est plus produite (dernière occurrence en octobre 2026), mais 118 sites sur 3 004 la portent encore, parce que leur enrichissement retenu date de janvier à septembre 2026, souvent l'instantané de leur évaluation. La route publique et Metabase affichent donc 999 000 m.
- **Préalable** : choisir entre ramener une distance de 999 000 m à `null` dans `criteresAutomatiques` (`apps/api/src/attributaire/attributaire.builder.ts`) puis relancer `pnpm attributaire:peupler`, ou attendre que ces sites soient réenrichis. Les autres distances ne portent pas de sentinelle (aucune au-delà de 100 km au 2026-11-03)

### Renseigner `partenaire_sites.code_insee`

- **Origine** : ADR-0053 (vide pour les 415 sites des 4 partenaires)
- **Écarté parce que** : la table attributaire lit le code INSEE de l'enrichissement ; seul le filtre `--commune` du script s'en passe en lisant le préfixe des parcelles
- **Préalable** : migration de données depuis le préfixe des parcelles, ou depuis la commune prédominante du cache d'enrichissement

## Extension QGIS

> Contexte : l'extension (dépôt `mutafriches-qgis`) appelle l'API existante sans changement de
> code, site par site (`POST /enrichissement` puis `POST /evaluation/calculer`), avec une origine
> conventionnelle déclarée dans `ALLOWED_INTEGRATOR_ORIGINS`. Plan complet :
> `mutafriches-qgis/docs/plan-implementation-reelle.md`.

### Déclarer l'origine de l'extension QGIS

- **Origine** : passage du prototype QGIS au réel sans modifier l'API (2026-11-11)
- **Écarté parce que** : réglage d'exploitation, pas de code ; à faire en staging
  (`mutafriches.incubateur.ademe.dev`) et en production : fait le 2026-11-11, reste le canal
  Metabase
- **Préalable** : suivre `docs/acces-api-integrateur.md` avec l'origine
  `https://qgis.mutafriches.beta.gouv.fr` (l'extension pose elle-même l'en-tête `Origin`), puis
  ajouter le canal « Plugin QGIS » au bloc `CASE` Metabase (`integrateur = 'qgis.mutafriches.beta.gouv.fr'`)

### Publier une release de l'extension QGIS

- **Origine** : tutoriel `/integrer-mutafriches/extension-qgis`
- **Écarté parce que** : le bouton « Télécharger l'extension » pointe sur
  `github.com/incubateur-ademe/mutafriches-qgis/releases/latest`, qui n'existe pas tant
  qu'aucune release n'est publiée
- **Préalable** : fusionner le mode réel de l'extension, puis publier une release portant le
  ZIP ; ne pas mettre le tutoriel en production avant

### Suivi de consultation du tutoriel QGIS

- **Origine** : tutoriel `/integrer-mutafriches/extension-qgis`
- **Écarté parce que** : un nouvel événement demande une migration de `type_evenement_enum`,
  à grouper avec celle des événements de l'extension pour éviter deux migrations concurrentes
- **Préalable** : sujet « Événements de l'extension QGIS »

### Identification des utilisateurs de l'extension (structure, e-mail, consentement)

- **Origine** : plan d'implémentation QGIS, chantier M1
- **Écarté parce que** : aucune table ni route ne peut recevoir ces données ; en attendant,
  l'extension les garde en local et peut les envoyer à un formulaire externe
- **Préalable** : ADR sur la donnée personnelle (finalité, conservation, purge) et sur la clé
  d'API par client (`X-API-Key`, piste de l'ADR-0011) ; tous les utilisateurs partagent d'ici là
  la même origine et ne se distinguent pas dans les statistiques

### Événements de l'extension QGIS

- **Origine** : plan d'implémentation QGIS, chantier M2
- **Écarté parce que** : `POST /evenements` n'accepte que les origines Mutafriches et ignore
  `integrateur` dans le corps ; seuls les enrichissements et les évaluations sont mesurés
- **Préalable** : clé d'API par client (sujet précédent), puis nouveaux `TypeEvenement` et
  migration de l'enum

### Import d'inventaire CNIG et traitement par lot

- **Origine** : plan d'implémentation QGIS, chantier M3
- **Écarté parce que** : l'extension contrôle le fichier CNIG elle-même et enchaîne les appels
  site par site, ce qui suffit sous 100 requêtes par minute pour quelques dizaines de sites
- **Préalable** : mesurer les volumes réels (précédent EPFGE : 1 300 sites) ; au-delà d'une
  cinquantaine de sites par inventaire, route d'import, suivi d'avancement et file de tâches

### Erreur 500 quand aucune parcelle du site n'existe

- **Origine** : test de l'extension QGIS avec son fichier exemple (2026-11-11)
- **Écarté parce que** : `POST /enrichissement` répond `500 Erreur lors de l'enrichissement`
  pour un site dont aucune parcelle n'est au cadastre (ex. `99999000ZZ0010`), en production comme
  en staging ; l'extension traduit ce 500 en message clair, mais un client ne peut pas le
  distinguer d'une vraie panne
- **Préalable** : répondre 404 ou 422 avec les parcelles introuvables (ADR-0044 les écarte déjà
  sans erreur quand il en reste au moins une)

### Contrôles de cohérence d'un site côté API

- **Origine** : analyse du dépôt pour l'extension QGIS
- **Écarté parce que** : contiguïté, surface d'un seul tenant et commune unique ne sont
  vérifiées que dans l'interface web ; l'API accepte un ensemble de parcelles disjointes
- **Préalable** : règle métier commune au web, à l'API et à l'extension (tolérance, statut
  bloquant ou « à vérifier »)

### Synthèse territoriale calculée par l'API

- **Origine** : plan d'implémentation QGIS, chantier M4
- **Écarté parce que** : l'extension agrège elle-même (usages prioritaires, niveaux de
  fiabilité, profils d'écart, forte compatibilité) ; les seuils d'affichage y sont recopiés
- **Préalable** : valider la grille des profils de sites et le seuil de forte compatibilité,
  puis les exposer une fois côté API

### Inventaires envoyés par l'extension et table attributaire publique

- **Origine** : analyse du dépôt pour l'extension QGIS
- **Écarté parce que** : tout site évalué entre dans `attributaire_sites` et devient lisible par
  `GET /api/attributaire/sites` ; aucun inventaire n'est privé à son émetteur
- **Préalable** : arbitrage produit (public par défaut ou non), à rapprocher du sujet « Sites
  qui se recoupent »

### Partenaire par structure pilote plutôt qu'un partenaire « qgis »

- **Origine** : question posée lors du passage au réel de l'extension
- **Écarté parce que** : un partenaire unique mélangerait les sites de tous les utilisateurs
  sur une page publique ; la création passe par le seed et l'ajout est limité à 20 parcelles
- **Préalable** : pour deux ou trois collectivités testeuses, créer leur partenaire comme pour
  le SCET (pré-chauffe nocturne et export CNIG) ; `?partenaire=` n'est lu que depuis le site

### Quota BDNB et inventaires de masse

- **Origine** : analyse du dépôt pour l'extension QGIS
- **Écarté parce que** : un inventaire de plusieurs centaines de sites neufs entame le quota
  d'environ 10 000 appels par mois
- **Préalable** : sujet « Clé API BDNB ou import local si les parcelles neuves dépassent le quota »

## Contrat API et dépréciations

### Retrait des champs et alias dépréciés

- **Origine** : ADR-0033, DTO d'enrichissement, enums d'événements
- **Écarté parce que** : délai d'une version laissé aux intégrateurs
- **Préalable** : vérifier qu'aucun intégrateur ne les lit, puis retirer :
  - `risquesGeorisques` (encore lu par `DiagnosticRisquesSection` et `SiteDetail.tsx`) ;
  - `trameVerteEtBleue` dans `enums.enrichi` et `raccordementEau` dans `enums.saisie` (`metadata.enums.ts`) ;
  - l'alias `ContexteEvenement.STEP1_TOGGLE` ;
  - `DONNEES_COMPLEMENTAIRES_SAISIES` et `EVALUATION_TERMINEE`, que l'UI émet encore.

## Sécurité

### Alertes CodeQL ouvertes

- **Origine** : onglet Security du dépôt
- **Écarté parce que** : jamais triées ; #30, #26, #24 et #15 corrigées par la PR de durcissement (ADR-0051)
- **Préalable** : trier les deux restantes (corriger ou rejeter avec justification) :
  - #36 `js/http-to-file-access`, `reconcilier-cadastre-partenaire.ts` (introduite par #208) : script
    local qui écrit un fichier de rapport à partir d'une réponse apicarto, à rejeter avec justification
    ou à borner (chemin fixe, contenu JSON sérialisé) ;
  - #31 `actions/unpinned-tag`, `partenaires-prefetch.yml` : épingler les actions sur un SHA, dans
    les quatre workflows pour rester cohérent.

### Content-Security-Policy

- **Origine** : la CSP posée par `helmet` se limite à `frame-ancestors` (ADR-0051)
- **Écarté parce que** : l'UI charge des tiers (DSFR, tuiles IGN, Metabase, ZCal, apicarto) : les
  autres directives écrites à l'aveugle cassent la carte ou les statistiques
- **Préalable** : relever les origines chargées en production (onglet réseau sur `/analyser`,
  `/statistiques`, `/iframe`), passer d'abord par `Content-Security-Policy-Report-Only`

### `ValidationPipe` sans `whitelist`

- **Origine** : `main.ts` (`new ValidationPipe()` sans option)
- **Écarté parce que** : `CalculerMutabiliteSwaggerDto` ne porte aucun décorateur `class-validator` ;
  `whitelist: true` viderait le corps du calcul
- **Préalable** : décorer les DTO d'entrée (`donneesEnrichies`, `donneesComplementaires`), puis activer
  `whitelist` et `forbidNonWhitelisted`

### Certificat PostgreSQL non vérifié

- **Origine** : `app.config.ts` (`ssl: { rejectUnauthorized: false }` sur l'URL Scalingo)
- **Écarté parce que** : Scalingo fournit un certificat auto-signé sur le réseau interne
- **Préalable** : vérifier si l'addon expose une CA (`SCALINGO_POSTGRESQL_URL` + `sslrootcert`) et
  épingler le certificat

### Purge des données au-delà de la durée de conservation

- **Origine** : ADR-0018, politique de confidentialité
- **Écarté parce que** : durée de 36 mois annoncée « provisoire », aucune purge implémentée
- **Préalable** : arbitrer la durée de conservation

## Ménage

### Code mort dans l'UI

- **Origine** : relevé du 2026-10-06
- **Écarté parce que** : sans impact fonctionnel
- **Préalable** : aucun ; retirer `ROUTES.DEBUG`, `getStepRoute` et `enrichirParcelle` (marqués `@deprecated`, plus aucun appelant)

### Documentation périmée

- **Origine** : relevé du 2026-10-06
- **Écarté parce que** : sans impact fonctionnel
- **Préalable** : aucun ; corriger :
  - les routes `/friches/*` « DEPRECATED » du `README.md`, alors qu'aucun module `friches` n'existe ;
  - l'ADR-0021 noté « à venir » dans `docs/ajout-partenaire.md` ;
  - les numéros d'ADR en double (0015, 0021, 0028, 0037), à renuméroter en mettant à jour les liens.
