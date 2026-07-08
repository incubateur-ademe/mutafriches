# ADR-0024 : LOVAC en référentiel local plutôt qu'appel API live

**Date** : 2026-07-08
**Statut** : Accepté

## Contexte

L'enrichissement du taux de logements vacants (critère `tauxLogementsVacants`, poids 1) interrogeait
en direct l'API tabulaire `tabular-api.data.gouv.fr` (une requête par commune, à chaque enrichissement),
via l'adapter `DatagouvLovacService`.

Un incident a révélé la fragilité de ce couplage : du ~28 juin au 7 juillet 2026, le taux d'échec
réel de LOVAC (source `"Lovac"` dans `enrichissements.sources_echouees`, hors cache) est monté à
**90-100 % en journée**, avec de brefs répits en heures creuses. L'API n'était pas « morte » : elle
rate-limite / throttle sous le volume réel (48 à 108 appels/heure), alors qu'une requête isolée passe.

Ce comportement n'a **jamais été détecté** par le health-check quotidien (`api_health_snapshots`) :
il sonde une seule commune, une fois par jour, à ~07-08h (heure creuse), et a donc enregistré LOVAC
`up` 30 jours sur 30. Un probe synthétique mono-requête est structurellement incapable de détecter
un rate-limit qui ne se déclenche que sous charge.

LOVAC est par ailleurs un **référentiel communal annuel** (~35 000 communes, mise à jour ~1×/an) :
l'appeler en live à chaque enrichissement est à la fois fragile et inutile.

## Décision

> Nous importons LOVAC dans une table locale `raw_lovac` (script `pnpm db:lovac:import`) et lisons
> le taux de logements vacants depuis cette table, plutôt que d'appeler l'API tabulaire data.gouv.fr.

Ce choix aligne LOVAC sur le pattern déjà en place pour les autres référentiels (BPE, ADEME,
arrêts de transport, EPCI/communes). L'adapter live `DatagouvLovacService` et l'entrée de monitoring
`lovac` sont **supprimés** (plus de dépendance runtime à l'API).

### Schéma de la table `raw_lovac`

Table simple clé/valeur par commune (non spatiale), migration `0029_famous_blur.sql` :

| Colonne | Type | Note |
|---------|------|------|
| `code_insee` | `varchar(5)` PK | Clé naturelle (gère Corse `2A`/`2B`, DOM 3 chiffres) |
| `nom` | `varchar(255)` | Indexé (`idx_raw_lovac_nom`) pour le fallback par nom de commune |
| `nombre_logements_total` | `integer` (nullable) | NULL si secrétisé |
| `nombre_logements_vacants` | `integer` (nullable) | NULL si secrétisé |
| `nombre_logements_vacants_plus_2ans` | `integer` (nullable) | NULL si secrétisé |
| `millesime` | `integer` NOT NULL | Année des vacants retenue pour la commune |
| `imported_at` | `timestamp` | Date d'import |

### Évolution du schéma source (data.gouv) et sélection du millésime

Le schéma du CSV data.gouv change chaque année : en 2026 les colonnes sont `CODGEO_26`/`LIBGEO_26`,
le total est `ff_pp_total_25` (préfixe `ff_`, plus de `pp_total_24`), les vacants vont jusqu'à
`pp_vacant_26`. L'ancien adapter, hardcodé sur `pp_total_24`/`CODGEO_25`, était donc **déjà cassé
sur les totaux** contre la donnée courante. Le script d'import :

- **détecte dynamiquement** les colonnes de millésime par expression régulière (robuste au renommage
  annuel) ;
- retient, **par commune**, la valeur la plus récente non-secrétisée (fallback sur les années
  antérieures), ce qui maximise la couverture sans modifier les valeurs des communes déjà couvertes ;
- décode le CSV en **Latin-1** (encodage de la source) et traite `"s"` (secrétisé) comme NULL.

Couverture constatée à l'import (2026) : ~48 % des ~34 900 communes ont un total ET des vacants
exploitables. Ce plafond est **inhérent au dataset** (le parc privé des petites communes est
secrétisé par le Cerema) et non une régression : le comportement live donnait les mêmes non-réponses
sur ces communes.

## Options envisagées

### Option A — Import en référentiel local (retenue)

- Avantages : supprime la dépendance runtime fragile ; élimine le rate-limit ; enrichissement quasi
  instantané (lecture DB indexée par code INSEE) ; suit un pattern éprouvé du projet ; robuste au
  changement annuel de schéma du dataset (détection dynamique des colonnes de millésime à l'import).
- Inconvénients : nécessite un import à rejouer une fois par an et par environnement ; fraîcheur des
  données dépendante de l'exécution du script (suivie via `raw_imports_log`).

### Option B — Conserver l'appel live avec timeout + retry/backoff + fallback local

- Avantages : données toujours « fraîches » ; changement plus léger.
- Inconvénients : ne supprime pas le rate-limit (le déplace sous forte charge) ; conserve un point de
  défaillance externe en plein parcours utilisateur ; complexité (fallback = deux chemins à maintenir).

### Option C — Statu quo (appel live nu)

- Avantages : aucun travail.
- Inconvénients : l'incident se reproduira ; aucune détection fiable ; dégrade la fiabilité perçue
  par les intégrateurs.

## Conséquences

### Positives

- Enrichissement LOVAC déterministe et résilient (plus de dépendance réseau au moment de l'appel).
- Le script d'import détecte dynamiquement les colonnes de millésime (`CODGEO_26`, `ff_pp_total_25`,
  `pp_vacant_26`…), corrigeant au passage le hardcode de l'ancien adapter (`pp_total_24` / `CODGEO_25`),
  déjà désaligné avec le schéma 2026 du dataset.
- LOVAC apparaît désormais dans le panneau « imports » de la page Données externes (via `raw_imports_log`).

### Négatives / Risques

- Données figées entre deux imports : acceptable pour un référentiel annuel, mais impose de rejouer
  l'import à chaque nouveau millésime (documenté dans `CLAUDE.md`).
- La logique de sélection du millésime le plus récent (total et vacants indépendamment) reproduit le
  comportement de l'ancien adapter ; un contrôle est nécessaire à chaque nouveau schéma de dataset.

### Migration

1. Migration `0029_famous_blur.sql` : création de la table `raw_lovac`.
2. `pnpm db:migrate` puis `pnpm db:lovac:import` en local.
3. En production/staging (cf gotcha Scalingo, script = `node dist/...`) : après déploiement,
   `scalingo --app <app> run "pnpm db:lovac:import"` une fois par environnement (hors `postdeploy`).

## Liens

- Décision liée : référentiels locaux existants (BPE, ADEME, transport, EPCI/communes)
- Fichiers :
  - `apps/api/src/shared/database/schemas/raw-lovac.schema.ts`
  - `apps/api/src/scripts/import-lovac.ts`
  - `apps/api/src/enrichissement/repositories/lovac.repository.ts`
  - `apps/api/src/enrichissement/services/urbanisme/urbanisme-enrichissement.service.ts`
  - `apps/api/src/donnees-externes/imports.registry.ts` (suivi import)
  - `apps/api/src/donnees-externes/api-monitoring.config.ts` (entrée `lovac` retirée)
- Documentation : `docs/enrichissement.md`
