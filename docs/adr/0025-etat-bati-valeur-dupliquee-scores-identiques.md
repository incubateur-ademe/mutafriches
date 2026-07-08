# ADR-0025 : Split du critère « État du bâti » via une valeur d'enum à scores identiques

**Date** : 2026-07-08
**Statut** : Accepté

## Contexte

Le critère complémentaire `etatBatiInfrastructure` (poids 2) proposait un seul niveau bas de dégradation : `DEGRADATION_INEXISTANTE`, libellé « Dégradation inexistante ou faible ». L'équipe métier a fait évoluer le wording de la qualification manuelle et souhaite désormais distinguer deux situations dans ce niveau bas :

- « Bâti intact »
- « Bâti faiblement dégradé »

Le reste du critère est simplement relibellé (moyennement / très dégradé / dégradé de manière hétérogène) et réordonné, sans changement de sémantique.

La difficulté : ce niveau bas était porté par une **seule** valeur d'enum. Afficher deux libellés distincts qui pointeraient sur la même valeur stockée rendait la distinction invisible en aval (récapitulatif, résultats, rechargement de formulaire) et forçait, côté `Record<EtatBatiInfrastructure, string>`, un libellé unique et donc un affichage inexact pour l'un des deux choix. Par ailleurs, la valeur `"degradation-faible"` était déjà référencée dans un exemple Swagger (`calculer-mutabilite.examples.ts`) sans exister dans l'enum : ce critère y était silencieusement ignoré au scoring.

L'équipe ne souhaite pas modifier le comportement de scoring existant (aucune revalidation Excel, pas de rupture de reproductibilité des évaluations passées).

## Décision

> Nous ajoutons une nouvelle valeur d'enum `DEGRADATION_FAIBLE = "degradation-faible"` (« Bâti faiblement dégradé »), avec une ligne de matrice de scoring **strictement identique** à `DEGRADATION_INEXISTANTE` (« Bâti intact »).

Conséquences directes :

- La distinction « intact » / « faiblement dégradé » est réelle et persistée : libellés distincts partout (dropdown, récapitulatif, résultats), round-trip correct au rechargement.
- Le scoring est inchangé : les deux valeurs produisent exactement le même résultat sur les 7 usages. Le poids (2) et le poids total (29,5) ne bougent pas.
- Aucune nouvelle version d'algorithme n'est publiée : les évaluations passées (qui ne contiennent que les valeurs préexistantes) restent reproductibles à l'identique.
- L'exemple Swagger `"degradation-faible"` devient valide et cesse d'être ignoré.

La règle CLAUDE.md impose de répercuter toute modification de la matrice sur `docs/evaluation-mutabilite.md` et `.claude/context/evaluation-patterns.md` : fait dans le même commit (passage de 6 à 7 valeurs pour ce critère).

## Options envisagées

### Option A — Nouvelle valeur d'enum à scores identiques (retenue)

- Avantages : distinction réelle et persistée ; affichage correct partout et round-trip fiable ; scoring inchangé donc aucune revalidation Excel ni nouvelle version d'algo ; corrige au passage l'exemple Swagger orphelin ; l'exhaustivité TypeScript (`Record<EtatBatiInfrastructure, string>`) force la mise à jour de tous les points d'affichage.
- Inconvénients : touche plusieurs couches (enum partagé, matrice, labels, UI, docs) ; deux valeurs sémantiquement voisines à scores identiques peuvent surprendre un lecteur de la matrice (commentaire explicatif ajouté).

### Option B — Une seule valeur partagée par les deux libellés

- Avantages : modification minimale (uniquement le wording des options UI).
- Inconvénients : deux options de `<select>` avec la même valeur (clés React dupliquées) ; le `<select>` natif ré-affiche toujours la première option au rechargement ; le récapitulatif ne peut montrer qu'un libellé figé, inexact pour l'autre choix. Distinction non fiable : rejetée.

### Option C — Nouvelle version d'algorithme (vX.Y) avec scores propres

- Avantages : formalise le changement dans le système de versionnage.
- Inconvénients : impose de définir et valider des scores distincts contre l'Excel de référence, alors que le métier veut justement un comportement identique ; lourdeur (source datée, entrée `versions/index.ts`, exemples Swagger) injustifiée pour un changement scoring-neutre.

## Conséquences

### Positives

- Wording métier fidèle avec distinction persistée entre bâti intact et faiblement dégradé.
- Reproductibilité préservée : scores et poids total (29,5) inchangés.
- Exemple Swagger `"degradation-faible"` désormais cohérent.
- Filet de sécurité : tout futur `Record<EtatBatiInfrastructure, …>` non exhaustif échouera au typecheck.

### Négatives / Risques

- Deux valeurs d'enum à scores identiques : redondance assumée. Si le métier veut plus tard différencier réellement les scores, il faudra alors publier une vraie nouvelle version d'algorithme (Option C).
- Les libellés courts des tags de résultats (`dynamicTags/labels.ts`) ne distinguent pas la nouvelle valeur (fallback « bâti dégradé ») : choix assumé, ces tags restent inchangés.

### Migration

Aucune migration de données. Les évaluations existantes portant `"degradation-inexistante"` s'affichent désormais « Bâti intact » et conservent leur score. La nouvelle valeur n'apparaît que sur les saisies postérieures.

## Liens

- Enum : `packages/shared-types/src/evaluation/enums/etat-bati.enum.ts`
- Matrice : `apps/api/src/evaluation/services/algorithme/algorithme.config.ts`
- Labels récap : `packages/shared-types/src/recapitulatif/valeurs.labels.ts`
- UI : `apps/ui/src/features/qualification/config/fields/site.fields.ts`
- Exemple Swagger : `apps/api/src/evaluation/dto/input/calculer-mutabilite.examples.ts`
- Documentation : `docs/evaluation-mutabilite.md`, `.claude/context/evaluation-patterns.md`
- Branche : `feat/wording-qualification-manuelle`
