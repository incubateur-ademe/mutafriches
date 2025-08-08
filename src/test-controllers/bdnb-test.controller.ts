import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BdnbService } from '../friches/services/external-apis/bdnb/bdnb.service';
import { isValidParcelId } from 'src/friches/lib/friches.utils';

@ApiTags('🧪 Tests - BDNB')
@Controller('test/bdnb')
export class BdnbTestController {
  constructor(private readonly bdnbService: BdnbService) {}

  /**
   * Test surface bâtie uniquement
   * GET /test/bdnb/surface?parcelle=77085000YA0126
   */
  @Get('surface')
  @ApiExcludeEndpoint()
  async testSurfaceBatie(@Query('parcelle') identifiantParcelle: string) {
    const startTime = Date.now();

    console.log(`🧪 Test BDNB Surface - Parcelle: ${identifiantParcelle}`);

    const result = await this.bdnbService.getSurfaceBatie(identifiantParcelle);

    const response = {
      timestamp: new Date().toISOString(),
      parcelleTeste: identifiantParcelle,
      dureeMs: Date.now() - startTime,
      resultat: result,
      debug: {
        formatValide: isValidParcelId(identifiantParcelle),
      },
    };

    console.log(`✅ Résultat:`, JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Test données complètes bâtiments
   * GET /test/bdnb/batiments?parcelle=77085000YA0126
   */
  @Get('batiments')
  @ApiExcludeEndpoint()
  async testBatiments(@Query('parcelle') identifiantParcelle: string) {
    const startTime = Date.now();

    console.log(`🧪 Test BDNB Bâtiments - Parcelle: ${identifiantParcelle}`);

    const result = await this.bdnbService.getBatiments(identifiantParcelle);

    const response = {
      timestamp: new Date().toISOString(),
      parcelleTeste: identifiantParcelle,
      dureeMs: Date.now() - startTime,
      resultat: result,
      debug: {
        formatValide: isValidParcelId(identifiantParcelle),
        nbBatiments: result.success ? result.data?.batiments.length : 0,
        surfaceTotale: result.success ? result.data?.surfaceTotaleBatie : 0,
      },
    };

    console.log(`✅ Résultat:`, JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Test avec POST (comme l'UI)
   * POST /test/bdnb/surface-post
   * Body: { "identifiantParcelle": "77085000YA0126" }
   */
  @Post('surface-post')
  @ApiExcludeEndpoint()
  async testSurfacePost(
    @Body('identifiantParcelle') identifiantParcelle: string,
  ) {
    return this.testSurfaceBatie(identifiantParcelle);
  }

  /**
   * Test avec POST pour bâtiments
   * POST /test/bdnb/batiments-post
   * Body: { "identifiantParcelle": "77085000YA0126" }
   */
  @Post('batiments-post')
  @ApiExcludeEndpoint()
  async testBatimentsPost(
    @Body('identifiantParcelle') identifiantParcelle: string,
  ) {
    return this.testBatiments(identifiantParcelle);
  }

  /**
   * Test de comparaison détaillée
   * GET /test/bdnb/compare?parcelle=77085000YA0126
   */
  @Get('compare')
  @ApiOperation({
    summary: `Compare les données issues de l'API BDNB directes avec le service Mutafriches`,
    description: `
Endpoint de test pour comparer les appels directs à l'API BDNB avec le service d'enrichissement Mutafriches.

**Utilité :**
- Valide la cohérence entre API BDNB brute et service enrichi
- Fournit les URLs BDNB directes pour vérification manuelle
- Compare les performances et la transformation des données

**Données enrichies par Mutafriches :**
- parcelle: Identifiant de la parcelle
- batiments: Liste des bâtiments avec données enrichies
- surfaceTotaleBatie: Surface bâtie totale en m²
- surfaceEmpriseAuSol: Surface d'emprise au sol en m²
- risquesNaturels: Aléa argiles, radon, altitude
- localisation: Commune, adresse, quartier prioritaire
- patrimoine: Distance et nom bâtiment historique
- fiabilité: Score de qualité des données
  `,
  })
  @ApiQuery({
    name: 'parcelle',
    description: 'Identifiant de parcelle cadastrale (format: 14 caractères)',
    example: '77085000YA0126',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Comparaison détaillée des données BDNB vs Mutafriches',
    schema: {
      type: 'object',
      properties: {
        identifiant: {
          type: 'string',
          example: '77085000YA0126',
          description: 'Identifiant de la parcelle testée',
        },
        urlsBDNBDirectes: {
          type: 'object',
          properties: {
            batimentGroupe: {
              type: 'string',
              example:
                'https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.77085000YA0126&limit=10',
            },
            documentation: {
              type: 'string',
              example:
                'https://api-portail.bdnb.io/catalog/api/f4905edc-db58-3a3b-a8e5-c5dfc6692ee5',
            },
          },
          description: "URLs pour tester directement l'API BDNB",
        },
        mutafrichesResults: {
          type: 'object',
          properties: {
            surface: {
              type: 'object',
              description: 'Résultat getSurfaceBatie()',
            },
            batiments: {
              type: 'object',
              description: 'Résultat getBatiments()',
            },
          },
          description: 'Résultats des services Mutafriches',
        },
      },
    },
  })
  async compareWithBDNB(@Query('parcelle') identifiantParcelle: string) {
    const [surfaceResult, batimentsResult] = await Promise.all([
      this.bdnbService.getSurfaceBatie(identifiantParcelle),
      this.bdnbService.getBatiments(identifiantParcelle),
    ]);

    return {
      identifiant: identifiantParcelle,
      urlsBDNBDirectes: {
        batimentGroupe: `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.${identifiantParcelle}&limit=10`,
        documentation:
          'https://api-portail.bdnb.io/catalog/api/f4905edc-db58-3a3b-a8e5-c5dfc6692ee5',
      },
      mutafrichesResults: {
        surface: surfaceResult,
        batiments: batimentsResult,
      },
    };
  }

  /**
   * Liste des parcelles de test disponibles
   * GET /test/bdnb/samples
   */
  @Get('samples')
  @ApiExcludeEndpoint()
  getSampleParcels() {
    return {
      description: 'Identifiants de parcelles pour tester le service BDNB',
      parcelles: [
        {
          id: '77085000YA0126',
          description: 'Chanteloup-en-Brie - Exemple de la doc BDNB',
          commune: 'Chanteloup-en-Brie',
          details: 'Maison individuelle récente (2009), 91m² emprise',
        },
        {
          id: '751160001AB0001',
          description: 'Paris 16e - Test zone urbaine dense',
          commune: 'Paris',
        },
        {
          id: '691230001AC0001',
          description: 'Lyon - Test métropole',
          commune: 'Lyon',
        },
        {
          id: '130010001AA0001',
          description: 'Marseille - Test sud de la France',
          commune: 'Marseille',
        },
      ],
      invalidSamples: [
        {
          id: 'INVALID_FORMAT',
          description: 'Format invalide',
        },
        {
          id: '999990000XX9999',
          description: 'Parcelle inexistante',
        },
        {
          id: '000000000AA0000',
          description: 'Parcelle sans bâtiment',
        },
      ],
      notes: {
        formatAttendu: '14 caractères (ex: 77085000YA0126)',
        sourceAPI: 'https://api.bdnb.io/v1/bdnb',
        limitesAPI: 'API publique avec limites de taux (120 req/min)',
      },
    };
  }
}
