# Exemple : Ajouter une source d'enrichissement

> Parcours complet de l'ajout d'une nouvelle source de données au module d'enrichissement.
> Exemple fictif : intégration de l'API "Qualité des Sols" pour récupérer un indice de qualité.

---

## Vue d'ensemble des fichiers à créer/modifier

```
apps/api/src/enrichissement/
├── adapters/
│   └── qualite-sols/                          # CRÉER
│       ├── qualite-sols.service.ts            # Client HTTP
│       ├── qualite-sols.types.ts              # Types réponse API
│       └── qualite-sols.constants.ts          # URLs, seuils
├── services/
│   └── qualite-sols/                          # CRÉER
│       ├── qualite-sols-enrichissement.service.ts       # Logique métier
│       └── qualite-sols-enrichissement.service.spec.ts  # Tests
├── __test-helpers__/
│   └── enrichissement.mocks.ts                # MODIFIER (ajouter mock)
├── enrichissement.module.ts                   # MODIFIER (ajouter providers)
└── services/enrichissement.service.ts         # MODIFIER (intégrer dans l'orchestrateur)

packages/shared-types/src/
└── enrichissement/                            # MODIFIER (ajouter le champ au type)
```

---

## Étape 1 : Créer l'adapter (client API)

### `adapters/qualite-sols/qualite-sols.types.ts`

```typescript
export interface QualiteSolsApiResponse {
  indiceQualite: number; // 0 à 100
  categorie: string; // "bon" | "moyen" | "mauvais"
  dateAnalyse: string;
}
```

### `adapters/qualite-sols/qualite-sols.constants.ts`

```typescript
export const QUALITE_SOLS_BASE_URL = "https://api.qualite-sols.gouv.fr/v1";
export const QUALITE_SOLS_TIMEOUT_MS = 10000;
export const QUALITE_SOLS_RAYON_RECHERCHE_M = 500;
```

### `adapters/qualite-sols/qualite-sols.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../shared/api-response.types";
import { QualiteSolsApiResponse } from "./qualite-sols.types";
import { QUALITE_SOLS_BASE_URL, QUALITE_SOLS_TIMEOUT_MS } from "./qualite-sols.constants";

@Injectable()
export class QualiteSolsService {
  private readonly logger = new Logger(QualiteSolsService.name);

  constructor(private readonly httpService: HttpService) {}

  async getQualiteSol(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<QualiteSolsApiResponse>> {
    const startTime = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${QUALITE_SOLS_BASE_URL}/analyse`, {
          params: { lat: latitude, lon: longitude },
          timeout: QUALITE_SOLS_TIMEOUT_MS,
        }),
      );

      const data = response.data as QualiteSolsApiResponse;

      return {
        success: true,
        data,
        source: "API Qualité des Sols",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Erreur API Qualité des Sols : ${err.message}`);
      return {
        success: false,
        error: err.message,
        source: "API Qualité des Sols",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
```

---

## Étape 2 : Créer le service domaine

### `services/qualite-sols/qualite-sols-enrichissement.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { QualiteSolsService } from "../../adapters/qualite-sols/qualite-sols.service";
import { EnrichmentResult, SourceEnrichissement } from "../shared/enrichissement.types";
import { Site } from "@/evaluation/entities/site.entity";

@Injectable()
export class QualiteSolsEnrichissementService {
  private readonly logger = new Logger(QualiteSolsEnrichissementService.name);

  constructor(private readonly qualiteSolsService: QualiteSolsService) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Vérifier les prérequis
    if (!site.coordonnees) {
      this.logger.warn("Coordonnées manquantes, enrichissement qualité sols ignoré");
      sourcesEchouees.push(SourceEnrichissement.QUALITE_SOLS);
      champsManquants.push("indiceQualiteSol");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // 2. Appeler l'adapter
    const result = await this.qualiteSolsService.getQualiteSol(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // 3. Exploiter le résultat
    if (result.success && result.data) {
      site.indiceQualiteSol = result.data.indiceQualite;
      sourcesUtilisees.push(SourceEnrichissement.QUALITE_SOLS);
      this.logger.log(`Qualité sol enrichie : indice ${result.data.indiceQualite}`);
    } else {
      sourcesEchouees.push(SourceEnrichissement.QUALITE_SOLS);
      champsManquants.push("indiceQualiteSol");
    }

    return { success: sourcesUtilisees.length > 0, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
```

---

## Étape 3 : Écrire les tests

### `services/qualite-sols/qualite-sols-enrichissement.service.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { QualiteSolsEnrichissementService } from "./qualite-sols-enrichissement.service";
import { QualiteSolsService } from "../../adapters/qualite-sols/qualite-sols.service";
import { createMockQualiteSolsService } from "../../__test-helpers__/enrichissement.mocks";
import { Site } from "@/evaluation/entities/site.entity";
import { SourceEnrichissement } from "../shared/enrichissement.types";

describe("QualiteSolsEnrichissementService", () => {
  let service: QualiteSolsEnrichissementService;
  let qualiteSolsService: ReturnType<typeof createMockQualiteSolsService>;

  beforeEach(async () => {
    qualiteSolsService = createMockQualiteSolsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualiteSolsEnrichissementService,
        { provide: QualiteSolsService, useValue: qualiteSolsService },
      ],
    }).compile();

    service = module.get<QualiteSolsEnrichissementService>(QualiteSolsEnrichissementService);
  });

  it("devrait enrichir l'indice de qualité du sol", async () => {
    const site = new Site();
    site.coordonnees = { latitude: 47.25, longitude: 6.03 };

    qualiteSolsService.getQualiteSol.mockResolvedValue({
      success: true,
      data: { indiceQualite: 72, categorie: "bon", dateAnalyse: "2026-01-15" },
      source: "API Qualité des Sols",
    });

    const result = await service.enrichir(site);

    expect(site.indiceQualiteSol).toBe(72);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.QUALITE_SOLS);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("devrait gérer l'absence de coordonnées", async () => {
    const site = new Site();
    // Pas de coordonnées

    const result = await service.enrichir(site);

    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.QUALITE_SOLS);
    expect(result.champsManquants).toContain("indiceQualiteSol");
    expect(qualiteSolsService.getQualiteSol).not.toHaveBeenCalled();
  });

  it("devrait gérer l'échec de l'API", async () => {
    const site = new Site();
    site.coordonnees = { latitude: 47.25, longitude: 6.03 };

    qualiteSolsService.getQualiteSol.mockResolvedValue({
      success: false,
      error: "API indisponible",
      source: "API Qualité des Sols",
    });

    const result = await service.enrichir(site);

    expect(site.indiceQualiteSol).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.QUALITE_SOLS);
    expect(result.champsManquants).toContain("indiceQualiteSol");
  });
});
```

---

## Étape 4 : Câbler dans le module

### `enrichissement.module.ts` (modifications)

```typescript
import { QualiteSolsService } from "./adapters/qualite-sols/qualite-sols.service";
import { QualiteSolsEnrichissementService } from "./services/qualite-sols/qualite-sols-enrichissement.service";

@Module({
  providers: [
    // ... providers existants

    // Nouveau domaine : Qualité des sols
    QualiteSolsService,                    // Adapter
    QualiteSolsEnrichissementService,      // Domain service
  ],
})
export class EnrichissementModule {}
```

---

## Étape 5 : Intégrer dans l'orchestrateur

### `services/enrichissement.service.ts` (modifications)

```typescript
// 1. Ajouter l'injection dans le constructeur
constructor(
  // ... services existants
  private readonly qualiteSolsEnrichissement: QualiteSolsEnrichissementService,
) {}

// 2. Appeler dans la méthode enrichir(), après le cadastre
async enrichir(identifiants: string[]): Promise<EnrichissementOutputDto> {
  // ... code existant (cadastre, énergie, transport...)

  // Nouveau domaine
  const qualiteSolsResult = await this.qualiteSolsEnrichissement.enrichir(siteEval);
  this.mergeEnrichmentResult(qualiteSolsResult, sourcesUtilisees, champsManquants, sourcesEchouees);

  // 3. Ajouter le champ dans le DTO de sortie
  const result: EnrichissementOutputDto = {
    // ... champs existants
    indiceQualiteSol: siteEval.indiceQualiteSol,
  };
}
```

---

## Étape 6 : Ajouter le mock de test

### `__test-helpers__/enrichissement.mocks.ts` (modifications)

```typescript
export function createMockQualiteSolsService() {
  return {
    getQualiteSol: vi.fn(),
  };
}
```

---

## Étape 7 : Mettre à jour les types partagés

### `packages/shared-types/src/enrichissement/enrichissement.types.ts`

Ajouter le nouveau champ au type de sortie d'enrichissement :

```typescript
export interface EnrichissementOutput {
  // ... champs existants
  indiceQualiteSol?: number;
}
```

---

## Checklist finale

### Code

- [ ] Adapter retourne `ApiResponse<T>` avec timeout configuré
- [ ] Service domaine retourne `EnrichmentResult` avec 3 tableaux
- [ ] Prérequis vérifiés avant appel API
- [ ] Erreurs gérées (source échouée + champ manquant)
- [ ] Types castés explicitement
- [ ] Accents français dans les commentaires et logs
- [ ] Pas d'emoji dans le code

### Intégration

- [ ] Service câblé dans `enrichissement.module.ts`
- [ ] Service appelé dans l'orchestrateur
- [ ] Résultat fusionné via `mergeEnrichmentResult()`
- [ ] Champ ajouté au DTO de sortie
- [ ] Mock ajouté dans `__test-helpers__/`

### Tests

- [ ] Test succès : site enrichi, source utilisée
- [ ] Test prérequis manquants : source échouée, champ manquant, API non appelée
- [ ] Test échec API : source échouée, champ manquant

### Documentation

- [ ] Source ajoutée dans `docs/enrichissement.md`
- [ ] Type ajouté dans `packages/shared-types/`
