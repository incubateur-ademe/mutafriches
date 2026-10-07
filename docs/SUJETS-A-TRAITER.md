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

- **Origine** : #189 (`db:qpv:import` puis pré-chauffe), #213 (`db:zones-contrainte-enr:import`), #208 (`db:partenaires:seed` puis pré-chauffe), #217 (origines Bénéfriches dans `ALLOWED_INTEGRATOR_ORIGINS`)
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

### Maquettes Figma « Locaux d'activité »

- **Origine** : #226
- **Écarté parce que** : hors code ; la carte de la page d'accueil a été retouchée en attendant
- **Préalable** : export Figma à jour

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

### Configuration CORS

- **Origine** : TODO dans `apps/api/src/main.ts` (`app.enableCors()` sans restriction)
- **Écarté parce que** : en production l'API et l'UI partagent le domaine ; jamais repris
- **Préalable** : lister les intégrateurs appelant l'API depuis un navigateur avant de restreindre

### Alertes CodeQL ouvertes

- **Origine** : onglet Security du dépôt
- **Écarté parce que** : jamais triées
- **Préalable** : trier chaque alerte (corriger ou rejeter avec justification) :
  - #36 `js/http-to-file-access`, `reconcilier-cadastre-partenaire.ts` (introduite par #208) ;
  - #31 `actions/unpinned-tag`, `partenaires-prefetch.yml` ;
  - #30 `js/insecure-randomness`, `api.evenements.service.ts` ;
  - #26 `js/client-side-unvalidated-url-redirection`, `ResultatsPage.tsx` ;
  - #24 `js/incomplete-multi-character-sanitization`, `evenement.service.ts` ;
  - #15 `js/tainted-format-string`, `IframeProvider.tsx`.

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
