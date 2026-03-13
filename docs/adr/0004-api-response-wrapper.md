# ADR-0004 : Pattern ApiResponse<T> pour les adapters

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Le module d'enrichissement appelle 24 APIs gouvernementales externes (IGN, GéoRisques, Enedis, etc.). Ces APIs ont des taux de disponibilité variables et des formats de réponse différents. Un enrichissement doit réussir partiellement même si certaines APIs échouent.

## Décision

Tous les adapters retournent un **`ApiResponse<T>`** standardisé. Les adapters ne lèvent jamais d'exception — ils encapsulent les erreurs dans la réponse.

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  responseTimeMs?: number;
}
```

## Options envisagées

### Option A — ApiResponse<T> wrapper (retenue)

- Avantages : gestion d'erreur uniforme sur 24 APIs, mesure du temps de réponse intégrée, identification de la source pour le debug, pas de try/catch dans les services domaine
- Inconvénients : verbosité (chaque adapter doit construire l'objet réponse)

### Option B — Exceptions NestJS classiques

- Avantages : pattern standard NestJS, moins de boilerplate
- Inconvénients : un adapter qui throw bloque tout l'enrichissement, perte d'information sur la source et le temps de réponse, gestion try/catch dispersée

## Conséquences

### Positives

- Si 3/24 APIs échouent, l'enrichissement continue avec `statut=PARTIEL`
- Le monitoring peut tracer les temps de réponse par source
- Les services domaine traitent simplement `if (result.success && result.data)`

### Négatives / Risques

- Chaque nouvel adapter doit respecter le pattern (documenté dans `.claude/context/enrichissement-patterns.md`)

## Liens

- Type ApiResponse : `apps/api/src/enrichissement/adapters/shared/api-response.types.ts`
- Pattern documenté : `.claude/context/enrichissement-patterns.md` (Pattern 1)
