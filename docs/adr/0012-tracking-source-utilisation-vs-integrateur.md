# ADR-0012 : Clarifier la sémantique de `source_utilisation` entre `evenements_utilisateur` et `evaluations`

**Date** : 2026-04-15
**Statut** : Accepté

## Contexte

Lors de l'analyse du tracking des visites UrbanVitaliz en avril 2026 (lien partagé sur leur fiche ressource : `https://mutafriches.beta.gouv.fr/?source=urbanvitaliz&ref=ressource`), une ambiguïté sémantique a été constatée : la colonne `source_utilisation` existe dans deux tables avec le **même nom** mais des **rôles très différents**.

Sur `evenements_utilisateur` ([schema](../../apps/api/src/shared/database/schemas/evenements.schema.ts)), trois colonnes coexistent :

| Colonne | Rôle | Origine de la valeur |
|---|---|---|
| `source_utilisation` | Tag UTM libre — d'où vient le clic (campagne) | URL param `?source=xxx` (capté dans [useEventTracking.ts](../../apps/ui/src/shared/hooks/useEventTracking.ts)) |
| `mode_utilisation` | Canal technique (`standalone` / `iframe`) | Détection iframe côté UI + query `?iframe=true` |
| `integrateur` | Clé partenaire quand intégré en iframe | Query `?integrateur=xxx` (postMessage iframe) |

Sur `evaluations` ([schema](../../apps/api/src/shared/database/schemas/evaluations.schema.ts)) :

| Colonne | Rôle | Type |
|---|---|---|
| `source_utilisation` | Canal technique (`SITE_STANDALONE` / `IFRAME_INTEGREE` / `API_DIRECTE`) | Enum fermé `SourceUtilisation` ([usage.enum.ts](../../packages/shared-types/src/evaluation/enums/usage.enum.ts)) |
| `integrateur` | Clé partenaire | Chaîne libre |

Même nom, concepts différents :

- Côté événements, `source_utilisation` est un **tag UTM libre** (équivalent fonctionnel de `utm_source`).
- Côté évaluations, `source_utilisation` est un **enum technique** (équivalent fonctionnel de `mode_utilisation` côté événements).

Conséquences constatées :

- Dashboards Metabase piégeux : filtrer sur `source_utilisation = 'urbanvitaliz'` ne fonctionne que sur les événements (rien sur les évaluations).
- Jointures entre événements et évaluations difficiles à écrire correctement.
- Confusion récurrente lors des analyses de pilotage.

Le modèle des événements est en réalité **bien conçu** (trois colonnes séparées pour trois concepts). Le problème est purement un conflit de nommage entre les deux tables.

## Décision

> Nous renommons la colonne de campagne UTM côté événements pour lever l'ambiguïté : `evenements_utilisateur.source_utilisation` devient `evenements_utilisateur.source_campagne`. Le champ côté évaluations reste `source_utilisation` (enum technique) et désigne le canal d'accès, aligné sémantiquement avec `evenements_utilisateur.mode_utilisation`.

Convention finale :

| Concept | `evaluations` | `evenements_utilisateur` |
|---|---|---|
| Canal technique (enum) | `source_utilisation` | `mode_utilisation` |
| Clé partenaire (libre) | `integrateur` | `integrateur` |
| Tag UTM de campagne | — | `source_campagne` |

## Options envisagées

### Option A — Renommer côté événements en `source_campagne` (retenue)

- Avantages :
  - Nomme honnêtement le rôle réel (UTM / campagne d'acquisition).
  - Préserve l'enum technique `SourceUtilisation` déjà exposé dans l'API publique des évaluations.
  - Aucune confusion au moment d'écrire une query Metabase.
  - Code frontend et DTO d'entrée peu impactés (simple renommage de champ).
- Inconvénients :
  - Migration SQL (renommage de colonne).
  - Mise à jour des dashboards Metabase existants.

### Option B — Renommer côté évaluations en `mode_utilisation`

- Avantages :
  - Aligne le vocabulaire avec `evenements_utilisateur.mode_utilisation`.
- Inconvénients :
  - Impacte l'API publique (DTO d'entrée `MutabiliteInputDto` et de sortie).
  - Casse la compatibilité avec les intégrateurs existants (Benefriches, etc.).
  - L'enum `SourceUtilisation` devrait aussi être renommé, cascade plus large.

### Option C — Ne rien renommer, documenter

- Avantages :
  - Aucun coût immédiat.
- Inconvénients :
  - Dette sémantique permanente.
  - Piège reproduit à chaque nouvelle analyse ou nouveau dashboard.
  - Les nouveaux contributeurs tombent dans le même panneau.

## Conséquences

### Positives

- Levée de l'ambiguïté de nommage entre les deux tables.
- Dashboards Metabase plus lisibles : la distinction UTM / canal technique / partenaire est explicite.
- Analyses de funnel et de campagne simplifiées.

### Négatives / Risques

- Migration SQL nécessaire (renommage de colonne sur une table en production).
- Synchronisation requise entre déploiement backend, frontend et mise à jour des dashboards Metabase pour éviter une fenêtre de rupture.
- Les 16 visites UrbanVitaliz et autres lignes existantes sont migrées sans changement de valeur (juste la colonne renommée).

### Migration

1. Migration Drizzle : `ALTER TABLE evenements_utilisateur RENAME COLUMN source_utilisation TO source_campagne;`
2. Renommer le champ dans [evenements.schema.ts](../../apps/api/src/shared/database/schemas/evenements.schema.ts), [evenement.entity.ts](../../apps/api/src/evenements/entities/evenement.entity.ts), [evenement.dto.ts](../../apps/api/src/evenements/dto/input/evenement.dto.ts), [evenement.service.ts](../../apps/api/src/evenements/services/evenement.service.ts), [evenement.repository.ts](../../apps/api/src/evenements/repositories/evenement.repository.ts).
3. Renommer `sourceUtilisation` en `sourceCampagne` dans les types partagés ([packages/shared-types/src/evenements/](../../packages/shared-types/src/evenements/)).
4. Mettre à jour le frontend [useEventTracking.ts](../../apps/ui/src/shared/hooks/useEventTracking.ts) et [api.evenements.service.ts](../../apps/ui/src/shared/services/api/api.evenements.service.ts) pour envoyer `sourceCampagne` au lieu de `sourceUtilisation`.
5. Mettre à jour les queries Metabase du dashboard de pilotage (filtrer sur `source_campagne` pour les événements).
6. Vérification : `pnpm format && pnpm lint && pnpm typecheck && pnpm test`.

## Liens

- Enum technique : [packages/shared-types/src/evaluation/enums/usage.enum.ts](../../packages/shared-types/src/evaluation/enums/usage.enum.ts)
- Enum mode : [packages/shared-types/src/evenements/enums/evenements.enums.ts](../../packages/shared-types/src/evenements/enums/evenements.enums.ts)
- Schéma événements : [apps/api/src/shared/database/schemas/evenements.schema.ts](../../apps/api/src/shared/database/schemas/evenements.schema.ts)
- Schéma évaluations : [apps/api/src/shared/database/schemas/evaluations.schema.ts](../../apps/api/src/shared/database/schemas/evaluations.schema.ts)
- Hook UI capture UTM : [apps/ui/src/shared/hooks/useEventTracking.ts](../../apps/ui/src/shared/hooks/useEventTracking.ts)
- Controller événements : [apps/api/src/evenements/evenements.controller.ts](../../apps/api/src/evenements/evenements.controller.ts)
- ADR lié : [0008-integration-iframe-postmessage.md](0008-integration-iframe-postmessage.md)
