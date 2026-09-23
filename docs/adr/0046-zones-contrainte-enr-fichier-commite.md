# ADR-0046 : Zones de contrainte réseau EnR — fichier commité, téléchargé à la main

**Date** : 2026-09-23
**Statut** : Accepté

## Contexte

L'algorithme gagne un 31e critère en v1.15, `saturationReseauEnr` (poids 1) : le site est-il dans
une zone où le réseau électrique ne peut plus raccorder de nouveaux projets de production EnR sans
travaux lourds ? En zone saturée, le critère est très négatif pour le photovoltaïque et neutre pour
les six autres usages. Hors zone saturée, il est neutre sur les sept usages.

La donnée vient de la carte Enedis (en lien avec RTE) des zones en contrainte pour les projets
HTA/BT, publiée sur openservices.enedis.fr. Constats du 2026-09-23 :

- **Aucune API ni jeu open data.** Rien sur `opendata.enedis.fr` (data-fair, déjà utilisé par
  l'adapter Enedis) ni sur data.gouv. La carte charge un fichier unique,
  `observatoire.enedis.fr/sites/enedis_ote/files/processed_json/capca.json` (~27 Mo, WGS84),
  régénéré chaque jour.
- **Téléchargement automatisé refusé.** Le fichier est protégé par un challenge Cloudflare
  anti-robots : une requête serveur reçoit un 403, quel que soit le user-agent. Nous ne
  contournons pas cette protection.
- **Cinq statuts, pas deux.** Les 2 302 zones (une par poste source) se répartissent en
  `TRES_FAVORABLE` (1 568), `FAVORABLE` (258), `EN_TENSION` (237), `SATUREE` (238) et `ELD` (1,
  territoire d'une entreprise locale de distribution). Enedis ne compte comme « saturées » que les
  238 `SATUREE`.

## Décision

> Nous téléchargeons la carte à la main dans un navigateur, la réduisons en un GeoJSON compressé
> commité, l'importons dans une table PostGIS locale (`raw_zones_contrainte_enr`), et testons le
> centroïde du site contre ces zones.

- **Correspondance des statuts** : `SATUREE` → `true` ; `TRES_FAVORABLE`, `FAVORABLE` et
  `EN_TENSION` → `false` (une zone en tension reste raccordable, choix métier du 2026-09-23) ;
  `ELD`, point hors de toute zone, référentiel vide ou illisible → `undefined` (donnée
  indisponible, non comptée dans la fiabilité). Affirmer « non saturé » hors du périmètre Enedis
  serait un faux négatif plausible, donc indétectable.
- **Centroïde** : même règle que pour le QPV (ADR-0039). Les zones font plusieurs km², un site
  n'en chevauche une seconde qu'exceptionnellement.
- **Fichier commité, comme le QPV et l'ICU** : `preparer-zones-contrainte-enr.ts` ne garde que
  l'identifiant et le statut des zones et arrondit les coordonnées à 5 décimales (~1 m, pour des
  zones de plusieurs km²). Le résultat, compressé en gzip par `zlib` (natif, sans dépendance),
  est commité dans `apps/api/src/scripts/data/zones-contrainte-enr.geojson.gz` : 4,3 Mo contre
  27 Mo bruts (8,5 Mo en gzip seul). L'import le lit sans argument, comme les autres
  référentiels commités.
- **Pas de commit sans changement** : le script de préparation est déterministe (zones triées par
  identifiant) et liste les changements de statut par rapport à la version commitée. Une
  régénération identique ne réécrit pas le fichier ; sans changement de statut, on ne committe pas.
- **Rafraîchissement mensuel** : un workflow GitHub planifié ouvre le 1er de chaque mois une issue
  de rappel décrivant la procédure. Il ne télécharge rien lui-même.
- **Géométries vides** : trois zones non saturées du fichier source (72700, 74039, 74468) ont une
  géométrie vide ; elles sont importées telles quelles et ne contiennent aucun site.

## Options envisagées

### Option A — Fichier réduit commité, import depuis le repo, rappel mensuel (retenue)

- Avantages : critère enrichi automatiquement, sans saisie utilisateur ; test spatial local, sans
  latence ni dépendance à un service tiers pendant l'enrichissement ; respecte la protection mise
  en place par Enedis.
- Inconvénients : donnée jusqu'à un mois en retard sur la carte ; étape manuelle qui peut être
  oubliée (atténuée par l'issue de rappel et l'alerte en log quand la table est vide).

### Option A bis — Fichier brut non commité, transmis par `scalingo run --file`

- Avantages : aucun poids dans le repo, aucune rediffusion de la donnée.
- Inconvénients : fonctionnement différent des autres référentiels ; aucune trace versionnée de la
  donnée importée ; import non rejouable sans retrouver le fichier. Écartée.

### Option B — Saisie utilisateur Oui / Non / Ne sait pas, avec un lien vers la carte

- Avantages : aucun import ni maintenance.
- Inconvénients : la plupart des utilisateurs ne savent pas lire la carte, ce qui dégrade
  fiabilité et exactitude ; ajoute une question au parcours.

### Option C — Téléchargement automatisé (cron serveur ou GitHub Actions)

- Avantages : toujours à jour.
- Inconvénients : impossible sans contourner la protection anti-robots d'Enedis, ce qui est
  exclu.

## Conséquences

### Positives

- La contrainte de raccordement, déterminante pour un projet photovoltaïque, est prise en compte
  sans effort pour l'utilisateur.
- Un import raté ne dégrade jamais les résultats en silence : validation complète avant écriture,
  plancher de 2 000 zones et remplacement dans une transaction.

### Négatives / Risques

- Retard d'au plus un mois, acceptable pour une donnée qu'Enedis qualifie d'indicative et sans
  valeur contractuelle, mention reprise dans l'infobulle.
- Les sites desservis par une régie locale (ELD) n'ont pas de donnée et perdent 1 point de poids
  en fiabilité.
- « Neutre » n'est pas sans effet : hors zone saturée (environ 90 % des sites), le score 0,5
  s'ajoute aux avantages et aux contraintes et rapproche les sept indices de 50 %.
- **Croissance du repo** : git compresse mal les différences entre deux fichiers gzip, chaque
  version ajoute environ 4 Mo à l'historique (au plus ~50 Mo par an). Repli possible : 4 décimales
  (3,4 Mo).
- **Rediffusion** : le repo est public, committer le fichier revient à rediffuser la donnée
  Enedis, qui n'a pas de licence explicite. Confirmer auprès d'Enedis les conditions de
  réutilisation, et demander une diffusion en open data qui permettrait d'automatiser l'import.
- Si Enedis change le format ou les statuts du fichier, l'import échoue sans rien écrire (statut
  inconnu refusé) : c'est voulu.

### Migration

1. `pnpm db:migrate` (migration `0036_raw_zones_contrainte_enr`, jouée par le `postdeploy`).
2. Sur chaque environnement : `scalingo --app <app> run "pnpm db:zones-contrainte-enr:import"`.
3. Tant que l'import n'a pas eu lieu, le critère est indisponible pour tous les sites (erreur
   loguée une fois par processus).

## Liens

- Source : https://openservices.enedis.fr/service/carte-zones-contrainte-projets-enr/
- Scripts : `apps/api/src/scripts/preparer-zones-contrainte-enr.ts`,
  `apps/api/src/scripts/import-zones-contrainte-enr.ts`
- Données : `apps/api/src/scripts/data/zones-contrainte-enr.geojson.gz`
- Repository : `apps/api/src/enrichissement/repositories/zones-contrainte-enr.repository.ts`
- Service : `apps/api/src/enrichissement/services/reseau-electrique-enr/saturation-reseau-enr-enrichissement.service.ts`
- Algorithme : `apps/api/src/evaluation/services/algorithme/versions/v1.15.ts`
- Rappel : `.github/workflows/zones-contrainte-enr-rappel.yml`
- ADR liés : ADR-0039 (centroïde, référentiel local QPV), ADR-0026 (documentation des sources)
