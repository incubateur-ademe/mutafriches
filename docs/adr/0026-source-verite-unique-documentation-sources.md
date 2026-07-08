# ADR-0026 : Source de vérité unique pour la documentation des sources de données

**Date** : 2026-07-08
**Statut** : Accepté

## Contexte

La documentation « quelle base est utilisée, quels champs sont récupérés, comment ils sont traités
dans l'algorithme » n'existait que dans `docs/enrichissement.md` : une doc développeur de près de
1 000 lignes, verbeuse et partiellement obsolète, non montrable à un partenaire (DDT, intégrateurs,
ADEME).

Le besoin : exposer cette information sous **trois formes** — une page UI DSFR, un export PDF
partageable par e-mail, et un document Markdown de référence. Ces trois formes décrivent le même
contenu et doivent rester cohérentes, y compris quand l'algorithme évolue (ajout de source, changement
de poids ou de critère). Une saisie triplée dériverait mécaniquement à la première évolution.

## Décision

> Nous centralisons la description des sources dans un **module de données TypeScript unique**
> (`SOURCES_DONNEES`, dans `packages/shared-types`), consommé tel quel par la page React, l'export PDF
> et le script de génération du Markdown.

Les critères d'évaluation alimentés et leurs poids ne sont pas re-saisis dans ce module : ils sont
**dérivés** du registre autoritaire `CRITERES_METADATA` (jointure par `source`), lui-même aligné sur
`POIDS_CRITERES` (source de vérité de l'algorithme) via un test garde-fou côté API. Le champ `poids`
a été ajouté à `CritereMetadata` pour être disponible côté UI/doc sans déplacer la source de vérité.

## Options envisagées

### Option A — Donnée TS unique dérivant page + PDF + MD (retenue)

- Avantages : zéro divergence entre l'écran et le PDF ; critères/poids dérivés du registre autoritaire
  (pas de re-saisie) ; le Markdown est généré, donc toujours synchronisé ; aucune dépendance nouvelle.
- Inconvénients : le contenu descriptif (champs, prose de traitement) reste rédigé à la main dans le
  module ; le Markdown doit être régénéré après modification (commande dédiée).

### Option B — Markdown comme source, recopié à la main en JSX et en PDF

- Avantages : démarrage plus rapide, mental model linéaire.
- Inconvénients : trois copies à maintenir manuellement ; dérive garantie à chaque évolution de
  l'algorithme ; poids ressaisis, incohérents avec `POIDS_CRITERES`.

### Option C — Rendu Markdown live côté UI (react-markdown)

- Avantages : une seule source Markdown affichée directement.
- Inconvénients : nouvelle dépendance ; rendu non conforme DSFR ; PDF et données structurées toujours
  à produire séparément ; poids non exploitables programmatiquement.

## Conséquences

### Positives

- La page `/documentation-donnees` et l'export PDF affichent strictement le même contenu.
- L'ajout ou la modification d'une source se fait en un seul endroit (`SOURCES_DONNEES`).
- Toute divergence critères/poids avec l'algorithme casse un test (garde-fou `CRITERES_METADATA` ↔
  `POIDS_CRITERES`).

### Négatives / Risques

- La cohérence du Markdown dépend de la régénération : `pnpm docs:sources:gen` doit être relancé après
  toute évolution (le contenu du fichier indique qu'il est généré et ne doit pas être édité à la main).
- Le script de génération importe le `dist` compilé de `shared-types` : un `dist` périmé produit une
  doc périmée (rebuild `shared-types` au préalable).

### Migration

Aucune migration de données. Le module réutilise le pattern d'export PDF existant (ADR-0023) et le
registre `CRITERES_METADATA` existant.

## Liens

- Données : `packages/shared-types/src/documentation/sources-donnees.data.ts`
- Registre critères : `packages/shared-types/src/recapitulatif/criteres.metadata.ts`
- Garde-fou poids : `apps/api/src/evaluation/services/algorithme/criteres-metadata.guard.spec.ts`
- Page UI : `apps/ui/src/features/documentation-sources/pages/DocumentationSourcesPage.tsx`
- Export PDF : `apps/ui/src/features/documentation-sources/export/SourcesPdfDocument.tsx`
- Génération Markdown : `scripts/generate-sources-doc.cjs` (`pnpm docs:sources:gen`)
- Doc générée : `docs/sources-donnees-externes.md`
- ADR lié : ADR-0023 (export PDF via @react-pdf/renderer)
