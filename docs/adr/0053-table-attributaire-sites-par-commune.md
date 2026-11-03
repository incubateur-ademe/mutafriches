# ADR-0053 : Table attributaire des sites, alimentée en continu et exposée par commune

**Date** : 2026-11-03
**Statut** : Accepté

## Contexte

Les partenaires et les collectivités demandent une vue territoriale : tous les sites déjà
analysés dans une commune, avec leurs critères et leur mutabilité, dans un format exploitable
par un SIG. Les données existent mais sont éclatées :

- **Les réponses aux critères manuels** ne sont enregistrées qu'au calcul de mutabilité
  (`evaluations.donnees_complementaires`). Les événements `qualification_*` ne portent que la
  page, et la page partenaire garde sa saisie dans le navigateur (ADR-0021).
- **L'enrichissement** est en cache dans `sites` (plusieurs parcelles) et `enrichissements`
  (une parcelle), y compris la pré-chauffe quotidienne des sites partenaires.
- **Les inventaires partenaires** sont dans `partenaire_sites`, mais leur `code_insee` n'est
  renseigné pour aucun des 415 sites.

Lire ces tables telles quelles pour une commune pose trois problèmes, mesurés sur
Montereau-Fault-Yonne (77305) :

- un même site apparaît sous plusieurs `site_id` : l'ordre des parcelles varie, et la section
  est tantôt brute (« 0B »), tantôt normalisée (« B ») ;
- les indices viennent de versions d'algorithme différentes (1.8, v1.11), donc ne se comparent
  pas ;
- 5 des 19 sites SCET de la commune n'ont aucune évaluation sur le même ensemble de parcelles.

## Décision

> Nous maintenons une table `attributaire_sites`, une ligne par ensemble de parcelles évalué
> ou d'inventaire partenaire, recalculée sans appel externe et exposée par
> `GET /api/attributaire/sites?codeInsee=`.

- **Clé** : parcelles normalisées (`normalizeParcelId`), triées, jointes par des virgules.
  Correspondance exacte : un ensemble qui recoupe un autre est un autre site.
- **Mutabilité** : une seule, calculée avec la version courante de l'algorithme sur la saisie
  de la dernière évaluation, ou « ne sait pas » pour les 9 critères manuels si le site n'a
  jamais été qualifié.
- **Enrichissement retenu** : le plus récent des complets, à défaut le plus récent des
  partiels, parmi le cache et l'instantané de la dernière évaluation. Une panne de source ne
  remplace pas une donnée complète par une donnée dégradée.
- **Saisie déclarative** : exposée telle quelle, marquée `saisieDeclarative` et accompagnée
  d'un avertissement, car elle n'est pas vérifiée.
- **Alimentation** :
  - après chaque évaluation, y compris quand le résultat vient du cache ;
  - après chaque enrichissement réussi, qui met à jour une ligne existante et n'en crée une
    que pour un site partenaire ;
  - dans les deux cas sans bloquer l'appelant (`rafraichirEnArrierePlan`).
- **Remplissage à date** : `pnpm attributaire:peupler`, lancé par le `postdeploy` en mode
  `--si-necessaire` (tout si la table est vide, sinon les lignes d'une ancienne version
  d'algorithme).
- **Câblage** : un `AttributaireCoreModule` qui ne dépend que de la base, importé par
  l'évaluation et l'enrichissement, et qui déclare son propre `CalculService` (sans état).

## Options envisagées

### Option A — Table projetée, alimentée par appel direct (retenue)

- Avantages :
  - une lecture par commune se fait sur un index, sans recalcul ;
  - le dédoublonnage et le choix de l'enrichissement sont faits une fois ;
  - aucune nouvelle dépendance.
- Inconvénients :
  - une donnée dérivée de plus à garder cohérente ;
  - les écritures en arrière-plan peuvent se perdre si la base est indisponible, ce que
    rattrape le script.

### Option B — Vue SQL ou calcul à la volée sur `evaluations`

- Avantages : aucune donnée dupliquée.
- Inconvénients :
  - la mutabilité « ne sait pas partout » et le recalcul avec la version courante exigent
    l'algorithme TypeScript, pas exprimable en SQL ;
  - un calcul à chaque requête publique, avec dédoublonnage et normalisation des parcelles.

### Option C — Événements internes (`@nestjs/event-emitter`)

- Avantages : découplage complet entre les modules émetteurs et la table.
- Inconvénients :
  - une dépendance et un audit de plus pour deux points d'appel ;
  - le cycle de modules se règle aussi bien avec un module dédié.

### Option D — Recopier les indices calculés à l'époque

- Avantages : reflète exactement ce que l'utilisateur a vu.
- Inconvénients :
  - mélange plusieurs versions d'algorithme dans une même commune ;
  - laisse sans indice les sites partenaires jamais évalués.

## Conséquences

### Positives

- **Une vue homogène par commune :** même version d'algorithme pour tous les sites, et une
  mutabilité même pour les sites jamais qualifiés.
- **Utilisable directement dans un SIG :** `format=geojson` donne une FeatureCollection à
  colonnes fixes (un critère et un usage par colonne).
- **Peu coûteux :** sur la copie locale de la prod, le remplissage complet traite 1 680 sites
  en une dizaine de secondes, sans appel externe.

### Négatives / Risques

- **Exposition publique d'une saisie non vérifiée** (pollution, type de propriétaire), y
  compris celle des partenaires. Cela nuance l'ADR-0021 : la saisie partenaire est déjà en
  base à chaque calcul, elle devient désormais publique. Le champ `saisieDeclarative` et
  l'avertissement le disent ; les partenaires doivent en être informés.
- **Dernière saisie retenue** : deux utilisateurs qui qualifient différemment un même site
  ne voient que la dernière réponse.
- **Commune prédominante** : un site à cheval n'apparaît que dans une commune.
- **Sites qui se recoupent** : deux ensembles proches (AD0004+AD0005 et
  AD0004+AD0005+AD0212) donnent deux lignes pour un même site physique.
- **Sites sans enrichissement en base** : ils sont signalés par le script, pas enrichis (62
  sur 1 680 en local), pour ne pas consommer le quota BDNB.
- **CORS inchangé** : la route s'appelle depuis curl, un SIG ou un serveur, pas depuis le
  JavaScript d'un site tiers.

### Migration

- Migration `0040_attributaire_sites` (création de table seule).
- Premier déploiement : le `postdeploy` remplit la table. En cas d'échec, relancer
  `scalingo --app <app> run "pnpm attributaire:peupler"`.

## Liens

- Table : `apps/api/src/shared/database/schemas/attributaire-sites.schema.ts`
- Module : `apps/api/src/attributaire/`
- Script : `apps/api/src/scripts/peupler-attributaire.ts`
- Contrat partagé : `packages/shared-types/src/attributaire/`
- Documentation : `docs/table-attributaire.md`
- ADR liés : ADR-0021 (saisie partenaire locale), ADR-0045 (recalcul avec la version
  courante), ADR-0050 (étapes du `postdeploy`), ADR-0052 (quota BDNB)
