import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ParcelleEnrichmentService } from '../services/parcelle-enrichment/parcelle-enrichment.service';
import { ParcelleInputDto } from '../dto/parcelle-input.dto';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { MutabilityCalculationService } from '../services/mutability/mutability-calculation.service';
import { MutabilityInputDto } from '../dto/mutability-input.dto';
import { MutabilityResultDto } from '../dto/mutability-result.dto';

@ApiTags('friches')
@Controller('friches')
export class FrichesController {
  constructor(
    private readonly parcelleEnrichmentService: ParcelleEnrichmentService,
    private readonly mutabilityCalculationService: MutabilityCalculationService,
  ) {}

  @Post('parcelle/enrichir')
  @ApiOperation({
    summary: "Enrichir les données d'une parcelle",
    description: `
    Enrichit automatiquement les données d'une parcelle à partir de son identifiant cadastral 
    en interrogeant plusieurs sources de données externes :
    
    **Sources utilisées :**
    - API IGN Cadastre : coordonnées, commune, géométrie, zonage PLU  
    - API BDNB : surface, risqus, bâtiments
    - API Enedis : raccordement électrique, distance réseau
    - API Transports : accessibilité transports en commun

    Retourne une parcelle enrichie avec un indice de fiabilité selon la complétude des données.
    `,
  })
  @ApiBody({
    type: ParcelleInputDto,
    examples: {
      atelierCoutances: {
        summary: 'Atelier de conception - Coutances',
        description:
          'Parcelle exemple du fichier Excel original, avec données complètes',
        value: {
          identifiantParcelle: '50147000AR0010',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Enrichissement réussi avec données complètes',
    type: EnrichmentResultDto,
  })
  @ApiBadRequestResponse({
    description: "Format d'identifiant parcelle invalide",
    examples: {
      invalidFormat: {
        summary: 'Format invalide',
        value: {
          statusCode: 400,
          message: [
            "Format d'identifiant parcelle invalide (attendu: 25056000HZ0346)",
          ],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcelle introuvable dans les sources de données',
  })
  @ApiInternalServerErrorResponse({
    description: "Erreur lors de l'accès aux sources de données externes",
  })
  async enrichParcelle(
    @Body() input: ParcelleInputDto,
  ): Promise<EnrichmentResultDto> {
    console.log(`API: Enrichissement parcelle ${input.identifiantParcelle}`);
    return await this.parcelleEnrichmentService.enrichFromDataSources(
      input.identifiantParcelle,
    );
  }

  @Post('parcelle/mutabilite')
  @ApiOperation({
    summary: "Calculer les indices de mutabilité d'une friche",
    description: `
    Calcule les indices de mutabilité pour 7 usages différents d'une friche urbaine 
    selon la méthodologie développée pour remplacer le fichier Excel original.
    
    **Algorithme :**
    - Analyse de 25+ critères techniques, réglementaires et contextuels
    - Pondération spécifique par usage (résidentiel, industrie, renaturation, etc.)
    - Calcul d'un indice de 0 à 100% pour chaque usage
    - Classement des usages par potentiel (rang 1 à 7)
    - Évaluation de la fiabilité globale selon la complétude des données
    
    **7 usages analysés :**
    1. Résidentiel ou mixte
    2. Équipements publics  
    3. Culture, tourisme
    4. Tertiaire
    5. Industrie
    6. Renaturation
    7. Photovoltaïque au sol
    `,
  })
  @ApiBody({
    type: MutabilityInputDto,
    description: `
    Données complètes de la parcelle pour le calcul de mutabilité. 
    Peut être obtenu via l'endpoint /parcelle/enrichir ou saisi manuellement.
    
    **Structure complète attendue :**
    - identifiantParcelle, commune, surfaceSite (obligatoires)
    - Données physiques : surfaceBati, connectionReseauElectricite, distanceRaccordementElectrique
    - Localisation : siteEnCentreVille, distanceAutoroute, distanceTransportCommun, proximiteCommercesServices
    - Contexte : tauxLogementsVacants, ancienneActivite
    - Risques : presenceRisquesTechnologiques, presenceRisquesNaturels
    - Zonages : zonageEnvironnemental, zonageReglementaire, zonagePatrimonial, trameVerteEtBleue
    - Caractéristiques : typeProprietaire, etatBatiInfrastructure, presencePollution, qualiteVoieDesserte, qualitePaysage, valeurArchitecturaleHistorique, terrainViabilise
    - Optionnel : coordonnees, sessionId, fiabilite
    `,
    examples: {
      atelierCoutances: {
        summary: 'Atelier de conception - Coutances',
        description:
          'Parcelle exemple du fichier Excel original, avec données complètes',
        value: {
          identifiantParcelle: '50147000AR0010',
          commune: 'Coutances',
          surfaceSite: 1782,
          surfaceBati: 1214,
          connectionReseauElectricite: true,
          distanceRaccordementElectrique: 140.50478998604967,
          siteEnCentreVille: false,
          distanceAutoroute: 0,
          distanceTransportCommun: 800,
          proximiteCommercesServices: false,
          tauxLogementsVacants: 0,
          presenceRisquesTechnologiques: false,
          presenceRisquesNaturels: 'faible',
          zonageEnvironnemental: 'hors_zone',
          zonageReglementaire: '',
          zonagePatrimonial: 'non_concerne',
          trameVerteEtBleue: 'hors_trame',
          coordonnees: {
            latitude: 49.0421992,
            longitude: -1.45017951,
          },
          etatBatiInfrastructure: 'BATIMENTS_HETEROGENES',
          presencePollution: 'NE_SAIT_PAS',
          qualiteVoieDesserte: 'ACCESSIBLE',
          qualitePaysage: 'BANAL_INFRA_ORDINAIRE',
          valeurArchitecturaleHistorique: 'EXCEPTIONNEL',
          terrainViabilise: true,
          fiabilite: 9.5,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Calcul de mutabilité réussi avec indices détaillés',
    type: MutabilityResultDto,
  })
  @ApiBadRequestResponse({
    description: "Données d'entrée invalides ou incomplètes",
    examples: {
      donneesManquantes: {
        summary: 'Champs obligatoires manquants',
        value: {
          statusCode: 400,
          message: [
            'identifiantParcelle should not be empty',
            'commune should not be empty',
            'surfaceSite must be a positive number',
          ],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du calcul des indices de mutabilité',
  })
  calculateMutability(@Body() input: MutabilityInputDto): MutabilityResultDto {
    console.log(`API: Calcul mutabilité ${input.identifiantParcelle}`);
    return this.mutabilityCalculationService.calculateMutability(input);
  }
}
