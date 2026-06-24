# ADR-0018 : Identifiant visiteur anonyme persistant pour la récurrence cross-visite

**Date** : 2026-06-17
**Statut** : Accepté

## Contexte

Le besoin analytique « part des utilisateurs récurrents (>= 3 simulations abouties) et leur provenance standalone vs Bénéfriches » n'était pas mesurable avec le modèle de données existant :

- `evaluations.utilisateur_id` existe en base mais n'a jamais été alimenté par `EvaluationRepository.save()` (toujours `NULL`).
- Le `session_id` des événements (`evenements_utilisateur`) est généré côté UI par `generateSessionId()` (`session-${Date.now()}-${random}`) à l'instanciation du service, **non persisté** : il identifie un chargement d'application (une visite), pas une personne dans la durée.
- L'événement `resultats_mutabilite` (la « simulation aboutie ») était émis au montage sans `evaluationId` (colonne `evaluation_id` à `NULL` sur 100 % des événements observés), ce qui empêchait de dédoublonner les simulations.

Mutafriches n'a aucune authentification : il faut un proxy anonyme et stable d'un visiteur pour mesurer la récurrence réelle entre visites.

## Décision

> Nous introduisons un identifiant visiteur anonyme (UUID) persisté en `localStorage` côté UI, propagé aux événements et aux évaluations, pour mesurer la récurrence cross-visite sans authentification.

- **UI** : `getOrCreateVisitorId()` génère un UUID (`crypto.randomUUID`, avec repli) stocké sous la clé `mutafriches_visitor_id` ; repli en mémoire si `localStorage` est indisponible (navigation privée, storage tiers bloqué en iframe).
- **Événements** : nouvelle colonne `evenements_utilisateur.visitor_id` (+ index `idx_visitor_id`), alimentée à chaque événement.
- **Évaluations** : le `visitorId` transite dans `CalculerMutabiliteInputDto` et est écrit dans la colonne **existante** `evaluations.utilisateur_id` (réutilisation, donc aucune migration sur `evaluations`).
- **Volet associé** : l'événement `resultats_mutabilite` porte désormais `evaluationId`, pour dédoublonner les simulations en analytics.

## Options envisagées

### Option A — UUID anonyme en localStorage + réutilisation de `utilisateur_id` (retenue)

- Avantages : sans authentification, anonyme (pas de PII), stable entre visites ; aucune migration sur `evaluations` (colonne déjà présente) ; une seule nouvelle colonne (`visitor_id` sur les événements).
- Inconvénients : `localStorage` effacé ou bloqué => nouvel identifiant (sous-estimation possible de la récurrence) ; détourne sémantiquement `utilisateur_id` (qui n'est pas un compte authentifié).

### Option B — Authentification utilisateur complète

- Avantages : identité fiable, récurrence exacte, ouvre d'autres fonctionnalités (espace personnel).
- Inconvénients : très lourd (login, sessions, RGPD renforcé) ; hors périmètre d'un outil public sans compte ; surdimensionné pour un simple besoin de mesure.

### Option C — Colonne `visitor_id` dédiée sur `evaluations`, en gardant `utilisateur_id` pour une future auth

- Avantages : séparation claire entre identité anonyme et future authentification.
- Inconvénients : migration supplémentaire sur `evaluations` ; `utilisateur_id` reste mort à court terme ; complexité non justifiée tant qu'aucune auth n'est planifiée.

## Conséquences

### Positives

- La récurrence cross-visite et la ventilation provenance (standalone / Bénéfriches) deviennent mesurables en SQL/Metabase via `visitor_id`.
- `evaluation_id` désormais présent sur `resultats_mutabilite` => dédoublonnage fiable des simulations.
- Coût base de données minimal (une colonne + un index), aucune migration sur `evaluations`.

### Négatives / Risques

- Identifiant lié au navigateur : effacement du storage, multi-appareils ou navigation privée fragmentent la mesure.
- RGPD : identifiant anonyme sans PII, sans usage publicitaire ni cross-site ; durée de conservation à documenter et mention à valider dans la politique de confidentialité.
- Les statistiques de récurrence ne sont exploitables qu'après accumulation de données post-déploiement (les évaluations/événements antérieurs n'ont pas de `visitor_id`).

### Migration (si applicable)

- Migration `0024_strong_wolfpack.sql` : `ALTER TABLE evenements_utilisateur ADD COLUMN visitor_id` + `CREATE INDEX idx_visitor_id` (idempotent `IF NOT EXISTS`, le snapshot Drizzle ayant divergé des migrations 0021-0023 écrites à la main).
- Aucune migration sur `evaluations` (réutilisation de `utilisateur_id`).
- Requête Metabase cible : grouper par `visitor_id` au lieu de `session_id`, décompte par `COUNT(DISTINCT evaluation_id)`.

## Liens

- Schémas : `apps/api/src/shared/database/schemas/evenements.schema.ts`, `apps/api/src/shared/database/schemas/evaluations.schema.ts`
- API : `apps/api/src/evaluation/repositories/evaluation.repository.ts`, `apps/api/src/evaluation/services/orchestrateur.service.ts`, `apps/api/src/evenements/services/evenement.service.ts`
- UI : `apps/ui/src/shared/services/api/api.utils.ts`, `apps/ui/src/shared/services/api/api.evenements.service.ts`, `apps/ui/src/shared/services/api/api.evaluation.service.ts`, `apps/ui/src/features/resultats/pages/ResultatsPage.tsx`
- Types : `packages/shared-types/src/evenements/dto/evenement-input.dto.ts`, `packages/shared-types/src/evaluation/dto/calculer-mutabilite-input.dto.ts`
- ADR liés : ADR-0012 (tracking source vs intégrateur), ADR-0008 (intégration iframe postMessage)
- Migration : `apps/api/src/shared/database/migrations/0024_strong_wolfpack.sql`
