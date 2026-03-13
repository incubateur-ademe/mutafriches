---
name: verif
description: Vérification post-implémentation (format + lint + typecheck + tests)
---

# Vérification complète

Pipeline de vérification à lancer après chaque implémentation.

## Étape 1 — Formatage

Lance `pnpm format` pour corriger le formatage Prettier.
Si des fichiers sont modifiés, note-les.

## Étape 2 — Lint

Lance `pnpm lint`.
Si des erreurs ESLint apparaissent, corrige-les directement dans le code.
Relance `pnpm lint` après correction pour confirmer que tout est propre.

## Étape 3 — TypeScript

Lance `pnpm typecheck`.
Si des erreurs de typage apparaissent, corrige-les (casts explicites, imports manquants, types).
Relance `pnpm typecheck` après correction.

## Étape 4 — Tests

Lance `pnpm test`.
Si des tests échouent, analyse les erreurs et corrige le code ou les tests.
Relance `pnpm test` après correction.

## Étape 5 — Résumé

Affiche un résumé concis :

```
Vérification terminée :
- Format : OK / X fichiers corrigés
- Lint : OK / X erreurs corrigées
- TypeScript : OK / X erreurs corrigées
- Tests : OK / X tests corrigés
```

Si tout est OK dès le départ, affiche simplement : `Vérification OK — aucune correction nécessaire.`
