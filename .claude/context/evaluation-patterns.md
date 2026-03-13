# Patterns d'évaluation de mutabilité

> Guide pour comprendre et modifier le module d'évaluation, l'algorithme de scoring et le calcul de fiabilité.

## Architecture du module

```
apps/api/src/evaluation/
├── dto/
│   ├── input/
│   │   ├── calculer-mutabilite.dto.ts       # Entrée : données enrichies + complémentaires
│   │   └── donnees-complementaires.dto.ts   # 8 champs manuels saisis par l'utilisateur
│   └── output/
│       ├── evaluation.dto.ts                # Évaluation complète (GET /evaluation/:id)
│       ├── metadata.dto.ts                  # Enums et versions (GET /evaluation/metadata)
│       └── mutabilite.dto.ts                # Résultats de calcul (POST /evaluation/calculer)
├── entities/
│   ├── site.entity.ts                       # Objet métier central (24 critères)
│   └── evaluation.entity.ts                 # Évaluation persistée (snapshots + résultats)
├── repositories/
│   └── evaluation.repository.ts             # Persistance + cache (Drizzle ORM)
├── services/
│   ├── algorithme/
│   │   ├── algorithme.config.ts             # Matrice 24×7 (critères × usages)
│   │   ├── algorithme.constants.ts          # Seuils, poids, niveaux
│   │   ├── algorithme.types.ts              # Types internes algorithme
│   │   ├── fiabilite.calculator.ts          # Calcul fiabilité (0-10)
│   │   └── fiabilite.calculator.spec.ts
│   ├── calcul.service.ts                    # Calcul des scores par usage
│   ├── orchestrateur.service.ts             # Orchestrateur principal
│   └── orchestrateur.service.spec.ts
├── utils/
│   ├── cache-validator.ts                   # Validation du cache 24h
│   └── cache-validator.spec.ts
├── __test-helpers__/                        # Fixtures et builders de test
├── evaluation.controller.ts
├── evaluation.controller.spec.ts
└── evaluation.module.ts
```

---

## Flux d'orchestration

### Parcours principal : `POST /evaluation/calculer`

```
Requête (donneesEnrichies + donneesComplementaires)
  │
  ▼
OrchestrateurService.calculerMutabilite()
  │
  ├─ 1. Vérifier le cache (24h, mêmes données complémentaires)
  │     → Si cache valide : retourner le résultat en cache
  │
  ├─ 2. Créer le Site
  │     → Site.fromEnrichissement(données, complémentaires)
  │     → ou Site.fromInput(données) si mode sansEnrichissement
  │
  ├─ 3. Calculer la mutabilité
  │     → CalculService.calculer(site, options)
  │       → Pour chaque usage (7) : calculerScorePourUsage()
  │       → FiabiliteCalculator.calculer(critères)
  │
  ├─ 4. Persister l'évaluation
  │     → EvaluationRepository.save(evaluation)
  │
  └─ 5. Retourner MutabiliteOutputDto
        → { fiabilite, resultats[], evaluationId }
```

### Modes de calcul

| Mode | Query param | Description |
|------|-------------|-------------|
| Standard | — | Enrichissement + calcul + cache |
| Détaillé | `modeDetaille=true` | Inclut avantages/contraintes/détails par critère |
| Sans enrichissement | `sansEnrichissement=true` | Utilise les données en entrée directement |

---

## Algorithme de scoring

### Matrice 24 critères × 7 usages

L'algorithme évalue 24 critères pour chacun des 7 usages possibles d'une friche.

#### Les 7 usages

1. Résidentiel
2. Équipements
3. Culture
4. Tertiaire
5. Industrie
6. Renaturation
7. Photovoltaïque

#### Niveaux d'impact (ScoreImpact)

```typescript
TRES_NEGATIF = -2
NEGATIF      = -1
NEUTRE       = 0.5    // Compte dans avantages ET contraintes
POSITIF      = 1
TRES_POSITIF = 2
```

#### Les 24 critères (14 enrichis + 8 complémentaires + 2 dérivés)

**Enrichis automatiquement** (poids total : 18) :

| Critère | Poids | Type |
|---------|-------|------|
| `surfaceSite` | 2 | Numérique (4 seuils) |
| `surfaceBati` | 2 | Numérique (3 seuils) |
| `siteEnCentreVille` | 1 | Booléen |
| `distanceAutoroute` | 0.5 | Numérique (4 seuils) |
| `distanceTransportCommun` | 1 | Numérique (2 seuils : <500m / >=500m) |
| `proximiteCommercesServices` | 1 | Booléen |
| `distanceRaccordementElectrique` | 1 | Numérique (3 seuils) |
| `tauxLogementsVacants` | 1 | Numérique (4 seuils) |
| `risqueRetraitGonflementArgile` | 0.5 | Enum (3 valeurs) |
| `risqueCavitesSouterraines` | 0.5 | Enum (2 valeurs) |
| `risqueInondation` | 1 | Enum (2 valeurs) |
| `presenceRisquesTechnologiques` | 1 | Booléen |
| `zonageReglementaire` | 2 | Enum (11 sous-zones) |
| `zonageEnvironnemental` | 1 | Enum (5 valeurs) |
| `zonagePatrimonial` | 1 | Enum (3 valeurs) |
| `zoneAccelerationEnr` | 1 | Enum (3 valeurs) |

**Complémentaires manuels** (poids total : 10) :

| Critère | Poids | Type |
|---------|-------|------|
| `typeProprietaire` | 1 | Enum (5 valeurs dont NE_SAIT_PAS) |
| `raccordementEau` | 1 | Enum (3 valeurs dont NE_SAIT_PAS) |
| `etatBatiInfrastructure` | 2 | Enum (6 valeurs) |
| `presencePollution` | 2 | Enum (6 valeurs) |
| `valeurArchitecturaleHistorique` | 1 | Enum (6 valeurs) |
| `qualitePaysage` | 1 | Enum (4 valeurs) |
| `qualiteVoieDesserte` | 0.5 | Enum (4 valeurs) |
| `trameVerteEtBleue` | 1 | Enum (5 valeurs) |

**Poids total : 28**

### Formule de calcul

Pour chaque usage, l'indice de mutabilité est calculé ainsi :

```
indiceMutabilite = (avantages / (avantages + contraintes)) × 100
```

Arrondi à 1 décimale.

#### Traitement spécial du score NEUTRE (0.5)

Le score NEUTRE est ajouté **simultanément** aux avantages ET aux contraintes. Cela reproduit le comportement du fichier Excel original et empêche la division par zéro :

```typescript
if (score === 0.5) {
  avantages += Math.abs(pointsPonderes);
  contraintes += Math.abs(pointsPonderes);
} else if (pointsPonderes > 0) {
  avantages += pointsPonderes;
} else {
  contraintes += Math.abs(pointsPonderes);
}
```

#### Critères ignorés

Un critère est **ignoré** (ne contribue ni aux avantages ni aux contraintes) si sa valeur est :
- `undefined` — donnée indisponible (erreur technique, API en panne)
- `null` — recherche effectuée mais aucun résultat trouvé
- `"ne-sait-pas"` — l'utilisateur a explicitement répondu "Je ne sais pas"

#### Niveaux de potentiel

| Indice | Potentiel |
|--------|-----------|
| >= 70% | Excellent |
| >= 60% | Favorable |
| >= 50% | Modéré |
| >= 40% | Peu favorable |
| < 40% | Défavorable |

---

## Calcul de fiabilité

### Sémantique `null` vs `undefined` vs `"ne-sait-pas"`

**Distinction critique** pour le calcul de fiabilité :

| Valeur | Signification | Fiabilité |
|--------|---------------|-----------|
| `null` | Recherche effectuée, aucun résultat | **Renseigné** (contribue) |
| `undefined` | Donnée indisponible (erreur technique) | **Non renseigné** |
| `"ne-sait-pas"` | L'utilisateur ne sait pas | **Non renseigné** |
| Toute autre valeur | Donnée présente | **Renseigné** (contribue) |

```typescript
// Un critère est "renseigné" s'il n'est ni undefined ni "ne-sait-pas"
// null EST considéré comme renseigné (la recherche a été faite)
private estRenseigne(valeur: unknown): boolean {
  return valeur !== undefined && valeur !== "ne-sait-pas";
}
```

### Formule

```
pourcentage = (poidsRenseignes / poidsTotal) × 100
note = pourcentage / 10                          // Ramené sur 10
noteArrondie = Math.round(note × 2) / 2          // Arrondi au 0.5
```

### Niveaux de fiabilité

| Note | Niveau |
|------|--------|
| >= 9 | Très fiable |
| >= 7 | Fiable |
| >= 5 | Moyennement fiable |
| >= 3 | Peu fiable |
| < 3 | Très peu fiable |

---

## Système de cache

### Règles de validité

- **TTL** : 24 heures
- **Clé** : `siteId` (identifiant cadastral)
- **Invalidation** : si les données complémentaires contiennent `"ne-sait-pas"` → pas de cache
- **Comparaison** : les 8 champs complémentaires sont comparés un par un

```typescript
// Les 8 champs comparés pour la validité du cache
typeProprietaire, raccordementEau, etatBatiInfrastructure,
presencePollution, valeurArchitecturaleHistorique,
qualitePaysage, qualiteVoieDesserte, trameVerteEtBleue
```

### Logique

1. Si l'entrée contient `"ne-sait-pas"` → **pas de cache** (résultat partiel)
2. Si une évaluation en cache existe pour le même `siteId` + mêmes complémentaires + < 24h → **cache hit**
3. Sinon → **cache miss** → calcul complet

---

## Entité Site

L'objet `Site` est le **conteneur central** qui traverse tout le pipeline :

```
Enrichissement → Site → Évaluation
```

### Méthodes factory

- `Site.fromEnrichissement(enrichissement, complémentaires?)` — construction à partir des données enrichies
- `Site.fromInput(input)` — construction directe (mode sansEnrichissement)

### Vérification de complétude

```typescript
// Vérifie que les 8 champs complémentaires obligatoires sont renseignés
site.estComplete(): boolean

// Calcule le taux de complétude (0 à 1)
site.calculerTauxCompletude(): number
```

---

## Endpoints

| Méthode | Route | Guard | Description |
|---------|-------|-------|-------------|
| POST | `/evaluation/calculer` | IntegrateurOriginGuard | Calcul de mutabilité (cache + scoring) |
| GET | `/evaluation/metadata` | — | Enums, versions, options disponibles |
| GET | `/evaluation/:id` | — | Récupérer une évaluation complète |

---

## Règles pour modifier l'algorithme

### Ajouter un critère

1. Ajouter le champ dans `Site` (`entities/site.entity.ts`)
2. Ajouter la ligne dans `MATRICE_SCORING` (`algorithme.config.ts`) avec les 7 scores
3. Ajouter le poids dans `POIDS_CRITERES` (`algorithme.constants.ts`)
4. Ajouter l'extraction dans `CalculService.extraireCriteres()`
5. Ajouter la condition dans `FiabiliteCalculator` si c'est un critère complémentaire
6. Mettre à jour les types partagés dans `packages/shared-types/`
7. Mettre à jour les tests

### Modifier les seuils d'un critère numérique

Les critères numériques utilisent des fonctions de scoring dans `algorithme.config.ts` :

```typescript
// Exemple : surfaceSite
(valeur: number) => {
  if (valeur < 5000) return ScoreImpact.NEGATIF;
  if (valeur < 10000) return ScoreImpact.POSITIF;
  if (valeur < 50000) return ScoreImpact.TRES_POSITIF;
  return ScoreImpact.NEUTRE;
}
```

Modifier uniquement les seuils dans la fonction. Ne pas changer la structure.

### Modifier les poids

Les poids sont dans `POIDS_CRITERES` (`algorithme.constants.ts`). Le poids total (28) est recalculé automatiquement par le `FiabiliteCalculator`.

---

## Checklist de validation

### Algorithme

- [ ] Matrice 24×7 cohérente (chaque critère a un score pour chaque usage)
- [ ] Poids déclarés dans `POIDS_CRITERES` pour chaque critère
- [ ] Score NEUTRE (0.5) géré dans les deux sens (avantages + contraintes)
- [ ] Critères ignorés si `undefined`, `null`, ou `"ne-sait-pas"`

### Fiabilité

- [ ] `null` considéré comme renseigné (recherche faite, pas de résultat)
- [ ] `undefined` considéré comme non renseigné (donnée indisponible)
- [ ] `"ne-sait-pas"` considéré comme non renseigné
- [ ] Note arrondie au 0.5 le plus proche sur une échelle de 0 à 10

### Cache

- [ ] Invalidation si `"ne-sait-pas"` présent dans les complémentaires
- [ ] Comparaison des 8 champs complémentaires pour la clé de cache
- [ ] TTL de 24 heures respecté

### Tests

- [ ] Test du calcul pour chaque usage
- [ ] Test de la fiabilité avec `null`, `undefined`, `"ne-sait-pas"`
- [ ] Test du cache (hit, miss, invalidation)
- [ ] Test du mode détaillé
