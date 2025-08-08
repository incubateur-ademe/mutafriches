import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EnedisService } from '../friches/services/external-apis/enedis/enedis.service';
import {
  EnedisRaccordement,
  EnedisConnexionStatus,
  EnedisAnalyseComplete,
} from '../friches/services/external-apis/enedis/enedis.interface';
import { parcelIdRegex } from 'src/friches/lib/friches.utils';

@ApiTags('🧪 Tests - Enedis')
@Controller('test/enedis')
export class EnedisTestController {
  constructor(private readonly enedisService: EnedisService) {}

  /**
   * Test de distance de raccordement
   * GET /test/enedis/distance?lat=47.478419&lng=-0.563166
   */
  @Get('distance')
  @ApiExcludeEndpoint()
  async testDistanceRaccordement(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const startTime = Date.now();

    console.log(`Test Enedis - Distance raccordement: ${lat}, ${lng}`);

    const result = await this.enedisService.getDistanceRaccordement(lat, lng);

    const response = {
      timestamp: new Date().toISOString(),
      coordonneesTestes: { latitude: lat, longitude: lng },
      dureeMs: Date.now() - startTime,
      resultat: result,
      debug: {
        coordonneesValides: !isNaN(lat) && !isNaN(lng),
        zoneFrance: lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10,
      },
    };

    console.log(`Résultat distance:`, JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Test de vérification de connexion
   * GET /test/enedis/connexion?parcelle=490007000ZE0153&lat=47.478419&lng=-0.563166
   */
  @Get('connexion')
  @ApiExcludeEndpoint()
  async testConnexion(
    @Query('parcelle') identifiantParcelle: string,
    @Query('lat') latitude?: string,
    @Query('lng') longitude?: string,
  ) {
    const startTime = Date.now();

    console.log(`Test Enedis - Connexion parcelle: ${identifiantParcelle}`);

    // Parse des coordonnées si fournies
    const coordonnees =
      latitude && longitude
        ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          }
        : undefined;

    const result = await this.enedisService.checkConnection(
      identifiantParcelle,
      coordonnees,
    );

    const response = {
      timestamp: new Date().toISOString(),
      parcelleTeste: identifiantParcelle,
      coordonneesUtilisees: coordonnees,
      dureeMs: Date.now() - startTime,
      resultat: result,
      debug: {
        formatParcelleValide: parcelIdRegex.test(identifiantParcelle),
        coordonneesFournies: !!coordonnees,
        coordonneesValides: coordonnees
          ? !isNaN(coordonnees.latitude) && !isNaN(coordonnees.longitude)
          : false,
      },
    };

    console.log(`Résultat connexion:`, JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Test d'analyse complète
   * GET /test/enedis/analyse?lat=47.478419&lng=-0.563166
   */
  @Get('analyse')
  @ApiOperation({
    summary:
      "Test de l'analyse complète Enedis (raccordement + connexion + recommandations)",
    description: `
Endpoint de test pour l'analyse complète des possibilités de raccordement électrique.

**Fonctionnalités testées :**
- Distance de raccordement (postes, lignes BT, poteaux)
- Statut de connexion avec niveau de confiance
- Génération de recommandations contextuelles
- Estimation des coûts de raccordement

**Sources de données :**
- Postes électriques HTA/BT (data.enedis.fr)
- Lignes BT aériennes et souterraines
- Poteaux électriques HTA et BT
    `,
  })
  @ApiQuery({
    name: 'lat',
    description: "Latitude WGS84 (exemple: coordonnées d'une friche)",
    example: '47.478419',
    type: Number,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude WGS84',
    example: '-0.563166',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Analyse complète des possibilités de raccordement électrique',
    schema: {
      type: 'object',
      properties: {
        coordonnees: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        resultatAnalyse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                raccordement: {
                  type: 'object',
                  properties: {
                    distance: { type: 'number', description: 'Distance en km' },
                    type: { type: 'string', enum: ['BT', 'HTA'] },
                    capaciteDisponible: { type: 'boolean' },
                  },
                },
                connexion: {
                  type: 'object',
                  properties: {
                    isConnected: { type: 'boolean' },
                    confidence: {
                      type: 'string',
                      enum: ['high', 'medium', 'low'],
                    },
                  },
                },
                recommandations: {
                  type: 'array',
                  items: { type: 'string' },
                },
                coutEstime: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' },
                    devise: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async testAnalyseComplete(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const startTime = Date.now();

    console.log(`Test Enedis - Analyse complète: ${lat}, ${lng}`);

    const result = await this.enedisService.analyseComplete(lat, lng);

    const response = {
      timestamp: new Date().toISOString(),
      coordonnees: { latitude: lat, longitude: lng },
      dureeMs: Date.now() - startTime,
      resultatAnalyse: result,
      interpretation: result.success
        ? this.interpreterResultat(result.data as EnedisAnalyseComplete)
        : null,
    };

    console.log(
      `Résultat analyse complète:`,
      JSON.stringify(response, null, 2),
    );
    return response;
  }

  /**
   * Test de recherche d'infrastructures
   * GET /test/enedis/infrastructures?lat=47.478419&lng=-0.563166&rayon=1000
   */
  @Get('infrastructures')
  @ApiExcludeEndpoint()
  async testRechercherInfrastructures(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
    @Query('rayon') rayon?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rayonMetres = rayon ? parseInt(rayon) : 1000;
    const startTime = Date.now();

    console.log(
      `Test Enedis - Infrastructures: ${lat}, ${lng}, rayon ${rayonMetres}m`,
    );

    const result = await this.enedisService.rechercherInfrastructures(
      lat,
      lng,
      rayonMetres,
    );

    const response = {
      timestamp: new Date().toISOString(),
      parametres: {
        latitude: lat,
        longitude: lng,
        rayonMetres,
      },
      dureeMs: Date.now() - startTime,
      resultat: result,
      statistiques: result.success
        ? {
            nombrePostes: result.data?.postes.length || 0,
            nombreLignesBT: result.data?.lignesBT.length || 0,
            nombrePoteaux: result.data?.poteaux.length || 0,
            infrastructurePlusProche: this.trouverInfrastructurePlusProche(
              result.data,
            ),
          }
        : null,
    };

    console.log(`Résultat infrastructures:`, JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Test avec POST (coordonnées dans le body)
   * POST /test/enedis/analyse-post
   * Body: { "latitude": 47.478419, "longitude": -0.563166 }
   */
  @Post('analyse-post')
  @ApiExcludeEndpoint()
  async testAnalysePost(
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.testAnalyseComplete(latitude.toString(), longitude.toString());
  }

  /**
   * Comparaison avec URLs API Enedis directes
   * GET /test/enedis/compare?lat=47.478419&lng=-0.563166
   */
  @Get('compare')
  @ApiOperation({
    summary:
      'Compare les données Mutafriches avec les URLs API Enedis directes',
    description: `
Fournit les URLs pour interroger directement l'API Enedis Open Data et compare avec les résultats Mutafriches.

**APIs Enedis utilisées :**
- Postes électriques de distribution (postes HTA/BT)
- Lignes BT aériennes et souterraines  
- Position géographique des poteaux

**Utilité :**
- Validation des transformations de données
- Vérification des calculs de distance
- Débogage des appels API
    `,
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude WGS84',
    example: '47.478419',
    type: Number,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude WGS84',
    example: '-0.563166',
    type: Number,
  })
  async compareWithEnedisAPI(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rayon = 2000; // 2km par défaut

    return {
      coordonnees: { latitude: lat, longitude: lng },
      urlsEnedisDirectes: {
        postesElectriques: `https://data.enedis.fr/api/explore/v2.1/catalog/datasets/poste-electrique/records?geofilter.distance=${lat}%2C${lng}%2C${rayon}&limit=20`,
        reseauBT: `https://data.enedis.fr/api/explore/v2.1/catalog/datasets/reseau-bt/records?geofilter.distance=${lat}%2C${lng}%2C500&limit=50`,
        poteaux: `https://data.enedis.fr/api/explore/v2.1/catalog/datasets/position-geographique-des-poteaux-hta-et-bt/records?geofilter.distance=${lat}%2C${lng}%2C200&limit=30`,
      },
      mutafrichesResult: await this.enedisService.analyseComplete(lat, lng),
      parametresRecherche: {
        rayonPostes: `${rayon}m`,
        rayonLignesBT: '500m',
        rayonPoteaux: '200m',
      },
    };
  }

  /**
   * Coordonnées de test disponibles
   * GET /test/enedis/samples
   */
  @Get('samples')
  @ApiExcludeEndpoint()
  getSampleCoordinates() {
    return {
      description: 'Coordonnées de test pour le service Enedis',
      coordonnees: [
        {
          nom: 'Angers - Centre-ville',
          latitude: 47.478419,
          longitude: -0.563166,
          description: 'Zone urbaine dense avec infrastructures',
        },
        {
          nom: 'Paris - La Défense',
          latitude: 48.8905,
          longitude: 2.2385,
          description: 'Zone très dense, nombreuses infrastructures',
        },
        {
          nom: 'Lyon - Part-Dieu',
          latitude: 45.7596,
          longitude: 4.859,
          description: "Centre d'affaires, raccordements HTA",
        },
        {
          nom: 'Marseille - Vieux-Port',
          latitude: 43.2956,
          longitude: 5.3708,
          description: 'Zone historique, mix BT/HTA',
        },
        {
          nom: 'Zone rurale - Mayenne',
          latitude: 48.1234,
          longitude: -0.789,
          description: 'Zone peu dense, infrastructures limitées',
        },
      ],
      coordonneesLimites: [
        {
          nom: 'Hors zone France métropolitaine',
          latitude: 55.0,
          longitude: 10.0,
          description: 'Test hors couverture',
        },
        {
          nom: 'Coordonnées invalides',
          latitude: 999,
          longitude: 999,
          description: "Test gestion d'erreur",
        },
      ],
    };
  }

  private interpreterResultat(data: EnedisAnalyseComplete): object {
    const raccordement = data.raccordement;
    const connexion = data.connexion;

    return {
      synthese: this.genererSynthese(raccordement),
      categorieRaccordement: this.categoriserRaccordement(
        raccordement.distance,
      ),
      niveauComplexite: this.evaluerComplexite(raccordement, connexion),
      prochainEtape: this.suggererProchainEtape(raccordement, connexion),
    };
  }

  private genererSynthese(raccordement: EnedisRaccordement): string {
    if (raccordement.distance < 0.1) {
      return 'Raccordement très favorable - Infrastructure immédiate';
    } else if (raccordement.distance < 0.5) {
      return 'Raccordement favorable - Extension courte';
    } else if (raccordement.distance < 2) {
      return 'Raccordement modéré - Extension moyenne nécessaire';
    } else {
      return 'Raccordement complexe - Extension importante requise';
    }
  }

  private categoriserRaccordement(distance: number): string {
    if (distance < 0.05) return 'IMMEDIAT';
    if (distance < 0.2) return 'PROCHE';
    if (distance < 1) return 'MOYEN';
    return 'ELOIGNE';
  }

  private evaluerComplexite(
    raccordement: EnedisRaccordement,
    connexion: EnedisConnexionStatus,
  ): string {
    if (raccordement.type === 'BT' && connexion.confidence === 'high') {
      return 'SIMPLE';
    } else if (raccordement.type === 'HTA' || connexion.confidence === 'low') {
      return 'COMPLEXE';
    }
    return 'MOYEN';
  }

  private suggererProchainEtape(
    raccordement: EnedisRaccordement,
    connexion: EnedisConnexionStatus,
  ): string {
    if (connexion.confidence === 'low') {
      return 'Contacter Enedis pour pré-étude officielle';
    } else if (raccordement.distance > 1) {
      return 'Étude de faisabilité technique et financière recommandée';
    } else {
      return 'Demander un devis de raccordement à Enedis';
    }
  }

  private trouverInfrastructurePlusProche(
    data:
      | {
          postes: Array<{ distance: number; nom: string; commune: string }>;
          lignesBT: Array<{ distance: number; type: string; tension: string }>;
          poteaux: Array<{ distance: number; tension: string }>;
        }
      | undefined,
  ): { type: string; distance: number; details: unknown } | null {
    if (!data) return null;

    interface InfrastructureAvecType {
      distance: number;
      type: string;
      [key: string]: unknown;
    }

    const infrastructures: InfrastructureAvecType[] = [
      ...data.postes.map((p) => ({ ...p, type: 'poste' })),
      ...data.lignesBT.map((l) => ({ ...l, type: 'ligneBT' })),
      ...data.poteaux.map((p) => ({ ...p, type: 'poteau' })),
    ];

    if (infrastructures.length === 0) return null;

    const plusProche = infrastructures.reduce((min, current) =>
      current.distance < min.distance ? current : min,
    );

    return {
      type: plusProche.type,
      distance: plusProche.distance,
      details: plusProche,
    };
  }
}
