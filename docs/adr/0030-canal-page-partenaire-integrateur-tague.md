# ADR-0030 : Pilotage du canal « page partenaire » via `integrateur = partenaire:<slug>`

**Date** : 2026-07-22
**Statut** : Accepté

## Contexte

Les pages partenaires (`/partenaires/<slug>` : `ddt-vosges`, `scet`, `aura`, `cci-92`) tournent sur le domaine standalone Mutafriches et n'envoyaient **aucun signal de canal** lors d'une qualification ou d'une évaluation. Côté API, [`OrigineDetectionService`](../../apps/api/src/shared/services/origine-detection.service.ts) déduit l'origine des seuls en-têtes HTTP : une requête émise depuis `mutafriches.beta.gouv.fr` est classée `source_utilisation = SITE_STANDALONE`, `integrateur = NULL`.

Conséquence : une qualif/évaluation issue d'une page partenaire tombait dans le même seau que n'importe quelle visite du bac à sable, **indistinguable**. Les tableaux de bord Metabase de pilotage par canal (qualifications par mois, évaluations par mois) ne pouvaient pas isoler l'activité DDT Vosges ou SCET. La convention `integrateur LIKE 'partenaire:%'` utilisée dans les requêtes ne correspondait à aucune donnée réellement écrite.

Le suivi par canal s'appuie déjà sur la colonne `integrateur` (cf. [ADR-0012](./0012-clarifier-semantique-source-utilisation.md)), alimentée en mode iframe depuis `?integrateur=xxx`. Il manquait un mécanisme pour le trafic page-partenaire, qui n'est pas un embed iframe mais bien du standalone.

## Décision

> Une qualification/évaluation initiée depuis une page partenaire enregistre **`integrateur = 'partenaire:<slug>'`**, tout en conservant **`source_utilisation = SITE_STANDALONE`** (le trafic vient réellement du site standalone ; seul le canal est tagué).

Mécanisme retenu : un **query param dédié `?partenaire=<slug>`**, propagé de l'UI à l'API :

- L'UI ([`MultisitePage`](../../apps/ui/src/features/partenaires/core/pages/MultisitePage.tsx)) passe `config.slug` aux appels `enrichirSite` et `calculerMutabilite`.
- Les services UI ([enrichissement](../../apps/ui/src/shared/services/api/api.enrichissement.service.ts), [évaluation](../../apps/ui/src/shared/services/api/api.evaluation.service.ts)) ajoutent `?partenaire=<slug>`.
- Les controllers [`enrichissement`](../../apps/api/src/enrichissement/enrichissement.controller.ts) et [`evaluation`](../../apps/api/src/evaluation/evaluation.controller.ts) transmettent le param à `detecterOrigine`.
- `OrigineDetectionService` conserve la source auto-détectée et surcharge l'integrateur avec `partenaire:<slug>`. Le mode iframe reste prioritaire. Le slug est validé (`^[a-z0-9-]{1,40}$`) avant écriture pour prévenir toute injection dans la colonne `varchar(255)`.

Le tag atterrit dans `enrichissements` (mono-parcelle), `sites` (multi-parcelle) et `evaluations`, rendant la convention Metabase `integrateur LIKE 'partenaire:%'` opérante.

## Alternatives écartées

- **Surcharger le param `?integrateur=` existant** avec la valeur `partenaire:<slug>` : rejeté car `integrateur` n'est aujourd'hui honoré qu'en mode iframe (forcerait `IFRAME_INTEGREE`), et élargir sa sémantique risquerait de reclasser du trafic API. Le param dédié garde `source_utilisation` exact et n'a aucun effet de bord.
- **Attribuer par jointure sur les parcelles** (table `partenaire_sites`) uniquement : conservé pour le **backfill de l'historique** (script temporaire), mais insuffisant en temps réel — il ne distingue pas une visite page-partenaire d'une qualif prefetch/API sur les mêmes parcelles.

## Conséquences

- Suivi par canal propre et rétro-compatible : seules les données postérieures au déploiement portent le tag.
- **Rétroactivité** : traitée par un script temporaire de backfill (`db:partenaires:backfill-canal`) qui réétiquette l'existant par jointure parcelle. Asymétrie à connaître : les `evaluations` sont un signal propre (le prefetch n'appelle jamais `/evaluation/calculer`), les `enrichissements`/`sites` incluent le trafic de réchauffe du cache.
- Aucun changement de whitelist d'origine : les pages partenaires sont déjà sur un domaine standalone autorisé, `IntegrateurOriginGuard` n'est pas impacté.
- Étend [ADR-0012](./0012-clarifier-semantique-source-utilisation.md) (rôle de la colonne `integrateur`).
