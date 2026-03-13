# Patterns d'enrichissement

> Guide pour ajouter un nouveau domaine ou une nouvelle API externe au module d'enrichissement.

## Architecture du module

```
apps/api/src/enrichissement/
├── adapters/                    # Clients APIs externes
│   ├── shared/
│   │   └── api-response.types.ts  # Type ApiResponse<T> standard
│   ├── enedis/                  # Exemple : adapter simple
│   ├── georisques/              # Exemple : adapter complexe (13 sous-services)
│   └── {mon-api}/               # Nouveau adapter
├── services/                    # Logique métier par domaine
│   ├── shared/
│   │   └── enrichissement.types.ts  # Type EnrichmentResult standard
│   ├── energie/                 # Exemple : domaine simple (1 adapter)
│   ├── transport/               # Exemple : domaine complexe (3 adapters)
│   └── {mon-domaine}/           # Nouveau domaine
│       ├── {mon-domaine}-enrichissement.service.ts
│       ├── {mon-domaine}-enrichissement.service.spec.ts
│       └── {mon-domaine}-enrichissement.calculator.ts  # Optionnel
├── __test-helpers__/
│   └── enrichissement.mocks.ts  # Factories de mocks partagées
├── enrichissement.module.ts     # Câblage NestJS (providers)
└── enrichissement.service.ts    # Orchestrateur principal (appelle tous les domaines)
```

---

## Pattern 1 : Adapter (client API externe)

Chaque adapter encapsule les appels HTTP vers une API externe et retourne un `ApiResponse<T>` standardisé.

### Structure type

```typescript
// adapters/mon-api/mon-api.service.ts
@Injectable()
export class MonApiService {
  private readonly logger = new Logger(MonApiService.name);
  private readonly baseUrl = "https://api.exemple.gouv.fr";

  constructor(private readonly httpService: HttpService) {}

  async getDonnees(param: string): Promise<ApiResponse<MonApiResponse>> {
    const startTime = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/endpoint`, { params: { q: param } }),
      );
      return {
        success: true,
        data: response.data as MonApiResponse,
        source: "Mon API",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Erreur Mon API : ${err.message}`);
      return {
        success: false,
        error: err.message,
        source: "Mon API",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
```

### Règles

- **TOUJOURS** retourner `ApiResponse<T>` (jamais throw)
- **TOUJOURS** mesurer le temps de réponse (`responseTimeMs`)
- **TOUJOURS** logger les erreurs avec `this.logger.warn()`
- **TOUJOURS** caster explicitement les réponses Axios (`as MonApiResponse`)
- **JAMAIS** de logique métier dans l'adapter (calculs de distance, catégorisation, etc.)
- **JAMAIS** de secrets en dur (utiliser `ConfigService` si besoin d'API key)

### Type standard `ApiResponse<T>`

```typescript
// adapters/shared/api-response.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  responseTimeMs?: number;
}
```

---

## Pattern 2 : Service domaine (logique métier)

Chaque domaine reçoit un objet `Site` mutable, l'enrichit via ses adapters, et retourne un `EnrichmentResult`.

### Structure type

```typescript
// services/mon-domaine/mon-domaine-enrichissement.service.ts
@Injectable()
export class MonDomaineEnrichissementService {
  private readonly logger = new Logger(MonDomaineEnrichissementService.name);

  constructor(private readonly monApiService: MonApiService) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Vérifier les prérequis
    if (!site.coordonnees) {
      sourcesEchouees.push(SourceEnrichissement.MON_API);
      champsManquants.push("monChamp");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // 2. Appeler l'adapter
    const result = await this.monApiService.getDonnees(site.codeInsee);

    // 3. Exploiter le résultat
    if (result.success && result.data) {
      site.monChamp = result.data.valeur;
      sourcesUtilisees.push(SourceEnrichissement.MON_API);
    } else {
      sourcesEchouees.push(SourceEnrichissement.MON_API);
      champsManquants.push("monChamp");
    }

    return { success: sourcesUtilisees.length > 0, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
```

### Règles

- **TOUJOURS** retourner `EnrichmentResult` avec les 3 tableaux (sources utilisées, échouées, champs manquants)
- **TOUJOURS** vérifier les prérequis avant d'appeler l'adapter
- **TOUJOURS** gérer le cas d'échec (source échouée + champ manquant)
- **MUTATION** : le service modifie directement l'objet `Site` (pattern partagé par tous les domaines)
- Pour un domaine complexe (plusieurs APIs), découper en méthodes privées `enrichirXxx()`

### Type standard `EnrichmentResult`

```typescript
// services/shared/enrichissement.types.ts
export interface EnrichmentResult {
  success: boolean;
  sourcesUtilisees: string[];
  sourcesEchouees: string[];
  champsManquants?: string[];
}
```

---

## Pattern 3 : Domaine complexe (plusieurs adapters)

Quand un domaine utilise plusieurs APIs, découper en méthodes privées :

```typescript
async enrichir(site: Site): Promise<EnrichmentResult> {
  const sourcesUtilisees: string[] = [];
  const sourcesEchouees: string[] = [];
  const champsManquants: string[] = [];

  // Chaque sous-enrichissement est indépendant
  await this.enrichirCentreVille(site, sourcesUtilisees, sourcesEchouees, champsManquants);
  await this.enrichirDistanceAutoroute(site, sourcesUtilisees, sourcesEchouees, champsManquants);
  await this.enrichirTransportCommun(site, sourcesUtilisees, sourcesEchouees, champsManquants);

  return { success: sourcesUtilisees.length > 0, sourcesUtilisees, sourcesEchouees, champsManquants };
}

private async enrichirCentreVille(
  site: Site,
  sourcesUtilisees: string[],
  sourcesEchouees: string[],
  champsManquants: string[],
): Promise<void> {
  // Logique isolée pour un sous-enrichissement
}
```

---

## Pattern 4 : Calculateur (logique pure)

Pour les calculs métier complexes (distances, catégorisation), extraire dans un calculateur :

```typescript
// services/mon-domaine/mon-domaine-enrichissement.calculator.ts
export class MonDomaineCalculator {
  static estProche(distanceMetres: number): boolean {
    return distanceMetres <= SEUIL_DISTANCE_M;
  }

  static categoriser(valeur: number): Categorie {
    if (valeur < 500) return Categorie.PROCHE;
    if (valeur < 1000) return Categorie.MOYEN;
    return Categorie.LOIN;
  }
}
```

- **Fonctions statiques pures** (pas de dépendance, pas d'injection)
- **Facilement testable** sans mock

---

## Étapes pour ajouter un nouveau domaine

### 1. Créer l'adapter

```
adapters/mon-api/
├── mon-api.service.ts       # Client HTTP → ApiResponse<T>
├── mon-api.types.ts         # Types de réponse API
└── mon-api.constants.ts     # URLs, seuils, rayons de recherche
```

### 2. Créer le service domaine

```
services/mon-domaine/
├── mon-domaine-enrichissement.service.ts       # Site → mutation + EnrichmentResult
├── mon-domaine-enrichissement.service.spec.ts  # Tests avec mocks
└── mon-domaine-enrichissement.calculator.ts    # Optionnel : logique pure
```

### 3. Ajouter la source dans l'enum

Dans `services/shared/enrichissement.types.ts`, ajouter la constante de source :

```typescript
export const SourceEnrichissement = {
  // ... sources existantes
  MON_API: "Mon API",
} as const;
```

### 4. Câbler dans le module

Dans `enrichissement.module.ts`, ajouter aux `providers` :

```typescript
providers: [
  // ... existants
  MonApiService,                        // Adapter
  MonDomaineEnrichissementService,      // Domain service
],
```

### 5. Intégrer dans l'orchestrateur

Dans `enrichissement.service.ts` :

```typescript
// 1. Ajouter l'injection
constructor(
  // ... existants
  private readonly monDomaineEnrichissement: MonDomaineEnrichissementService,
) {}

// 2. Appeler dans enrichir()
const monDomaineResult = await this.monDomaineEnrichissement.enrichir(siteEval);
this.mergeEnrichmentResult(monDomaineResult, sourcesUtilisees, champsManquants, sourcesEchouees);

// 3. Ajouter les champs dans le DTO de sortie
const result: EnrichissementOutputDto = {
  // ... existants
  monChamp: siteEval.monChamp,
};
```

### 6. Ajouter les mocks de test

Dans `__test-helpers__/enrichissement.mocks.ts` :

```typescript
export function createMockMonApiService(): MockMonApiService {
  return {
    getDonnees: vi.fn(),
  };
}
```

### 7. Mettre à jour les types partagés

Dans `packages/shared-types/`, ajouter le nouveau champ au type d'enrichissement si nécessaire.

---

## Checklist de validation

- [ ] L'adapter retourne `ApiResponse<T>` (jamais throw)
- [ ] Le service domaine retourne `EnrichmentResult` avec les 3 tableaux
- [ ] Les prérequis sont vérifiés avant l'appel API
- [ ] Les erreurs sont gérées (source échouée + champ manquant)
- [ ] Le service est câblé dans le module et l'orchestrateur
- [ ] Les tests unitaires couvrent : succès, échec API, prérequis manquants
- [ ] Les types sont correctement castés (`as Type`)
- [ ] Pas de secrets en dur
- [ ] Le logger utilise le bon nom de classe
