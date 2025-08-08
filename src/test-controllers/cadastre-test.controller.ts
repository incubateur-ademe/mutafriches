import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CadastreService } from '../friches/services/external-apis/cadastre/cadastre.service';
import { parcelIdRegex } from 'src/friches/lib/friches.utils';

@ApiTags('🧪 Tests - Cadastre')
@Controller('test/cadastre')
export class CadastreTestController {
  constructor(private readonly cadastreService: CadastreService) {}

  /**
   * Test direct du service cadastre
   * GET /test/cadastre/parcelle?id=25056000HZ0346
   */
  @Get('parcelle')
  @ApiExcludeEndpoint()
  async testParcelle(@Query('id') identifiant: string) {
    const startTime = Date.now();

    console.log(`🧪 Test Cadastre - ID: ${identifiant}`);

    const result = await this.cadastreService.getParcelleInfo(identifiant);

    const response = {
      timestamp: new Date().toISOString(),
      identifiantTeste: identifiant,
      dureeMs: Date.now() - startTime,
      resultat: result,
      // Informations de debug
      debug: {
        formatValide: parcelIdRegex.test(identifiant),
        composants: this.parseParcelIdForDebug(identifiant),
      },
    };

    console.log(`✅ Résultat:`, JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Test avec POST (comme l'UI)
   * POST /test/cadastre/parcelle-post
   * Body: { "identifiantParcelle": "25056000HZ0346" }
   */
  @Post('parcelle-post')
  @ApiExcludeEndpoint()
  async testParcellePost(@Body('identifiantParcelle') identifiant: string) {
    return this.testParcelle(identifiant);
  }

  /**
   * Test de comparaison détaillée
   * GET /test/cadastre/compare?idu=25056000HZ0346
   */
  @Get('compare')
  @ApiOperation({
    summary: `Compare les données issues de l'API IGN directes avec le service Mutafriches`,
    description: `
Endpoint de test pour comparer les appels directs à l'API IGN Cadastre avec le service d'enrichissement Mutafriches.

**Utilité :**
- Valide la cohérence entre API IGN brute et service enrichi
- Fournit les URLs IGN directes pour vérification manuelle
- Compare les performances et la transformation des données

**Données enrichies par Mutafriches :**
- identifiant: IDU de la parcelle
- commune: Nom officiel de la commune
- surface: Surface en m² (depuis contenance IGN)
- coordonnees: Centroïde lat/lng (depuis localisant IGN)
  `,
  })
  @ApiQuery({
    name: 'idu',
    description:
      'Identifiant de parcelle cadastrale (14 caractères : 5 chiffres INSEE + 3 chiffres + 2 caractères section + 4 chiffres numéro)',
    example: '25056000HZ0346',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Comparaison détaillée des données IGN vs Mutafriches',
    schema: {
      type: 'object',
      properties: {
        identifiant: {
          type: 'string',
          example: '25056000HZ0346',
          description: 'IDU de la parcelle testée',
        },
        components: {
          type: 'object',
          properties: {
            codeInsee: { type: 'string', example: '49007' },
            codeComp: { type: 'string', example: '000' },
            section: { type: 'string', example: 'ZE' },
            numero: { type: 'string', example: '0153' },
          },
          description: "Composants extraits de l'IDU",
        },
        urlsIGNDirectes: {
          type: 'object',
          properties: {
            parcelle: {
              type: 'string',
              example: 'https://apicarto.ign.fr/api/cadastre/parcelle?...',
            },
            localisant: {
              type: 'string',
              example: 'https://apicarto.ign.fr/api/cadastre/localisant?...',
            },
          },
          description: "URLs pour tester directement l'API IGN",
        },
        mutafrichesResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                identifiant: { type: 'string', example: '25056000HZ0346' },
                commune: { type: 'string', example: 'Angers' },
                surface: { type: 'number', example: 28320 },
                coordonnees: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', example: 47.478419 },
                    longitude: { type: 'number', example: -0.563166 },
                  },
                },
              },
            },
            source: { type: 'string', example: 'IGN Cadastre' },
            responseTimeMs: { type: 'number', example: 1250 },
          },
          description: 'Résultat du service Mutafriches',
        },
      },
    },
  })
  async compareWithIGN(@Query('idu') identifiant: string) {
    const components = this.parseParcelIdForDebug(identifiant);

    return {
      identifiant,
      components,
      urlsIGNDirectes: {
        parcelle: `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${components?.codeInsee}&section=${components?.section}&numero=${components?.numero}&source_ign=PCI`,
        localisant: `https://apicarto.ign.fr/api/cadastre/localisant?code_insee=${components?.codeInsee}&section=${components?.section}&numero=${components?.numero}&source_ign=PCI`,
      },
      mutafrichesResult:
        await this.cadastreService.getParcelleInfo(identifiant),
    };
  }

  /**
   * Liste des parcelles de test disponibles
   * GET /test/cadastre/samples
   */
  @Get('samples')
  @ApiExcludeEndpoint()
  getSampleParcels() {
    return {
      description: 'Identifiants de parcelles pour tester le service',
      parcelles: [
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
      ],
    };
  }

  /**
   * Parse pour debug
   */
  private parseParcelIdForDebug(identifiant: string) {
    if (!identifiant || identifiant.length !== 14) {
      return null;
    }

    return {
      codeInsee: identifiant.substring(0, 5),
      codeComp: identifiant.substring(5, 8),
      section: identifiant.substring(8, 10),
      numero: identifiant.substring(10, 14),
    };
  }
}
