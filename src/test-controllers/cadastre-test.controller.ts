import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { CadastreService } from '../friches/services/external-apis/cadastre/cadastre.service';

@ApiExcludeController()
@ApiTags('🧪 Tests - Cadastre')
@Controller('test/cadastre')
export class CadastreTestController {
  constructor(private readonly cadastreService: CadastreService) {}

  /**
   * Test direct du service cadastre
   * GET /test/cadastre/parcelle?id=490007000ZE0153
   */
  @Get('parcelle')
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
        formatValide: /^\d{8}[A-Z]{2}\d{4}$/.test(identifiant),
        composants: this.parseParcelIdForDebug(identifiant),
      },
    };

    console.log(`✅ Résultat:`, JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Test avec POST (comme l'UI)
   * POST /test/cadastre/parcelle-post
   * Body: { "identifiantParcelle": "490007000ZE0153" }
   */
  @Post('parcelle-post')
  async testParcellePost(@Body('identifiantParcelle') identifiant: string) {
    return this.testParcelle(identifiant);
  }

  /**
   * Test de comparaison détaillée
   * GET /test/cadastre/compare?id=490007000ZE0153
   */
  @Get('compare')
  async compareWithIGN(@Query('id') identifiant: string) {
    const components = this.parseParcelIdForDebug(identifiant);

    return {
      identifiant,
      components,
      urlsIGNDirectes: {
        parcelle: `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${components?.codeInsee}&section=${components?.section}&numero=${components?.numero}&source_ign=PCI`,
        commune: `https://apicarto.ign.fr/api/cadastre/commune?code_insee=${components?.codeInsee}&source_ign=PCI`,
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
  getSampleParcels() {
    return {
      description: 'Identifiants de parcelles pour tester le service',
      parcelles: [
        {
          id: '490007000ZE0153',
          description: 'Angers - Parcelle de test standard',
          commune: 'Angers',
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
