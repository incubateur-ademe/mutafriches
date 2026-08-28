# ADR-0032 : Zonage ABC en référentiel local plutôt qu'appel API live

**Date** : 2026-08-28
**Statut** : Accepté

## Contexte

L'enrichissement du zonage ABC (critère `zonageAbcLogement`, poids 0,5) interrogeait en direct
l'API tabulaire `tabular-api.data.gouv.fr` — une requête par commune, à chaque enrichissement —
via l'adapter `DatagouvZonageAbcService`.

Le 28 août 2026, sur staging, des enrichissements réels échouent sur ce seul critère :

```
ERROR [DatagouvZonageAbcService] Erreur lors de la récupération du Zonage ABC pour 49353:
timeout of 10000ms exceeded code=ECONNABORTED
url=https://tabular-api.data.gouv.fr/api/resources/13f7282b-.../data/?CODGEO__exact=49353...
DEBUG [EnrichissementService] Champs manquants uniques (1): zonageAbcLogement
LOG   [EnrichissementService] Enrichissement termine: 49353000AV0200 (statut: partiel)
```

Au même moment, une requête isolée sur la même URL répond en 70-250 ms (constaté depuis un poste
de dev et depuis la production). Le throttling ne renvoie pas de 429 : **la connexion est tenue
sans réponse jusqu'au timeout de 10 s**, ce qui rend le symptôme difficile à rattacher à sa cause.

C'est le même hôte et le même mode de défaillance que l'incident LOVAC de juin-juillet 2026
(cf. [ADR-0024](0024-lovac-referentiel-local.md)), qui concluait déjà : « L'API n'était pas
"morte" : elle rate-limite / throttle sous le volume réel, alors qu'une requête isolée passe. »

Le health-check quotidien n'est pas un instrument de détection fiable ici, pour la raison
déjà documentée dans l'ADR-0024 : il sonde une seule commune, une fois par jour. Il a d'ailleurs
affiché « Erreur réseau inattendue » sur staging le 27/08 tout en gardant la production `up`,
sans permettre de conclure.

Le zonage ABC est par ailleurs un **référentiel communal** (34 875 communes, mis à jour à chaque
arrêté, soit environ une fois par an) : l'appeler en live à chaque enrichissement est à la fois
fragile et sans contrepartie.

## Décision

> Nous importons le zonage ABC dans une table locale `raw_zonage_abc` (script
> `pnpm db:zonage-abc:import`) et lisons la zone depuis cette table, plutôt que d'appeler
> l'API tabulaire data.gouv.fr.

Ce choix aligne le zonage ABC sur le pattern déjà en place pour LOVAC, BPE, ADEME, les arrêts de
transport, l'ITE fret et EPCI/communes. L'adapter live `DatagouvZonageAbcService` et l'entrée de
monitoring `zonage-abc` sont **supprimés** : il ne reste plus aucune dépendance runtime à
`tabular-api.data.gouv.fr`.

### Schéma de la table `raw_zonage_abc`

Migration `0030_raw_zonage_abc.sql` :

| Colonne | Type | Note |
|---------|------|------|
| `code_insee` | `varchar(5)` PK | Clé naturelle (gère Corse `2A`/`2B`, DOM 3 chiffres) |
| `nom` | `varchar(255)` | Nom de la commune |
| `departement` | `varchar(3)` | Code département |
| `zonage` | `varchar(4)` NOT NULL | Zone normalisée : `abis` \| `a` \| `b1` \| `b2` \| `c` |
| `millesime` | `varchar(100)` | Date d'entrée en vigueur, extraite du nom de colonne du CSV |
| `imported_at` | `timestamp` | Date d'import |

Pas d'index sur `nom` : contrairement à LOVAC, l'enrichissement exige déjà le code INSEE et n'a
pas de fallback par nom de commune.

### Nom de colonne porteur du millésime

Le CSV source nomme sa colonne de valeur avec la date de l'arrêté en vigueur : « Zonage en vigueur
depuis le 5 septembre 2025 », puis « Zonage ABC en vigueur depuis le 26 juin 2026 ». Un nom figé
casse silencieusement à chaque publication — c'est exactement le bug corrigé quelques jours plus
tôt côté adapter. Le script d'import résout donc la colonne **par motif** (`/zonage.*en\s+vigueur/i`)
et stocke le millésime extrait, ce qui rend la version réellement en base visible.

### Garde-fou à l'import

Le fichier est intégralement parsé et validé **avant** le `TRUNCATE` : si la colonne de zonage est
introuvable, ou si moins de 30 000 communes sont exploitables (la France en compte ~34 900), l'import
échoue et la table existante est préservée. Un CSV tronqué ou au schéma modifié ne peut pas vider
le référentiel.

### Table vide = alerte explicite

Si l'import n'a jamais tourné sur un environnement, tous les sites tomberaient en « commune absente
du référentiel » et la fiabilité baisserait sans signal. `ZonageAbcRepository` détecte ce cas et
émet un `logger.error` explicite (une seule fois par instance) invitant à lancer l'import.

## Options envisagées

### Option A — Import en référentiel local (retenue)

- Avantages : supprime la dépendance runtime fragile ; élimine le throttling ; lecture instantanée
  indexée par code INSEE ; suit un pattern éprouvé du projet ; supprime le dernier appel runtime
  à data.gouv.fr.
- Inconvénients : un import à rejouer à chaque arrêté et par environnement ; fraîcheur dépendante de
  l'exécution du script (suivie via `raw_imports_log` et la page Données externes).

### Option B — Retry + timeout allongé sur l'appel live

- Avantages : changement minime.
- Inconvénients : ne supprime pas le throttling, le déplace sous charge ; conserve un point de
  défaillance externe en plein parcours utilisateur ; allonger le timeout dégrade le temps de
  réponse de l'enrichissement pour tous.

### Option C — Statu quo

- Avantages : aucun travail.
- Inconvénients : l'incident se reproduira, et restera invisible du health-check.

## Conséquences

### Positives

- Enrichissement du zonage ABC déterministe, sans dépendance réseau au moment de l'appel.
- Plus aucun appel runtime à `tabular-api.data.gouv.fr` dans l'application.
- Le zonage ABC apparaît dans le panneau « imports » de la page Données externes
  (`raw_imports_log` + `imports.registry.ts`), avec son millésime.
- Une entrée de moins à surveiller dans le health-check quotidien.

### Négatives / Risques

- Données figées entre deux imports : acceptable pour un référentiel annuel, mais impose de rejouer
  l'import à chaque nouvel arrêté (documenté dans `CLAUDE.md` et le README).
- Le test de contrat réseau introduit sur l'adapter disparaît avec lui ; la protection contre le
  renommage de colonne est reportée sur le script d'import, qui échoue bruyamment.

### Migration

1. Migration `0030_raw_zonage_abc.sql` : création de la table `raw_zonage_abc`.
2. `pnpm db:migrate` puis `pnpm db:zonage-abc:import` en local.
3. En staging/production (cf gotcha Scalingo, script = `node dist/...`) : après déploiement,
   `scalingo --app <app> run "pnpm db:zonage-abc:import"` une fois par environnement
   (hors `postdeploy`).

## Liens

- Décision fondatrice du pattern : [ADR-0024](0024-lovac-referentiel-local.md) (LOVAC, même hôte,
  même mode de défaillance)
- Fichiers :
  - `apps/api/src/shared/database/schemas/raw-zonage-abc.schema.ts`
  - `apps/api/src/scripts/import-zonage-abc.ts`
  - `apps/api/src/enrichissement/repositories/zonage-abc.repository.ts`
  - `apps/api/src/enrichissement/services/urbanisme/urbanisme-enrichissement.service.ts`
  - `apps/api/src/donnees-externes/imports.registry.ts` (suivi import)
