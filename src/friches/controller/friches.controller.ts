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
import { ParcelleEnrichmentService } from '../services/parcelle-enrichment.service';
import { ParcelleInputDto } from '../dto/parcelle-input.dto';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { MutabilityCalculationService } from '../services/mutability-calculation.service';
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
    - DVF (Demandes de Valeurs Foncières) : prix, transactions
    - Cadastre : surface, géométrie, zonage PLU  
    - SIRENE : activités économiques, établissements
    - Base ICPE : installations classées, risques industriels
    - INPN : zones environnementales protégées, espèces
    - IGN : topographie, occupation du sol
    
    Retourne une parcelle enrichie avec un indice de fiabilité selon la complétude des données.
    `,
  })
  @ApiBody({
    type: ParcelleInputDto,
    examples: {
      trelazeManufacture: {
        summary: 'Ancienne manufacture Les Allumettes - Trélazé',
        description:
          "Parcelle emblématique de l'exemple Excel fourni, située en centre-ville avec patrimoine industriel",
        value: {
          identifiantParcelle: '25056000HZ0346',
        },
      },
      angersEntrepot: {
        summary: 'Entrepôt logistique - Angers',
        description:
          'Parcelle industrielle en périphérie avec risques technologiques',
        value: {
          identifiantParcelle: '490007000AB0001',
        },
      },
      saumurAgricole: {
        summary: 'Exploitation agricole - Saumur',
        description: 'Ancienne exploitation en zone naturelle protégée',
        value: {
          identifiantParcelle: '490007000CD0042',
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
    - Caractéristiques : typeProprietaire, etatBatiInfrastructure, presencePollution, qualiteVoieDesserte, qualitePaysage, valeurArchitecturaleHistorique, reseauEaux
    - Optionnel : coordonnees, sessionId, fiabilite
    `,
    examples: {
      manufactureComplete: {
        summary: 'Ancienne manufacture Les Allumettes - Données complètes',
        description:
          'Exemple complet basé sur le fichier Excel original avec tous les critères renseignés',
        value: {
          identifiantParcelle: '490007000ZE0153',
          commune: 'Trélazé',
          surfaceSite: 42780,
          surfaceBati: 6600,
          connectionReseauElectricite: true,
          distanceRaccordementElectrique: 0.3,
          siteEnCentreVille: true,
          distanceAutoroute: 1.5,
          distanceTransportCommun: 250,
          proximiteCommercesServices: true,
          tauxLogementsVacants: 4.9,
          ancienneActivite: 'Manufacture textile - Les Allumettes',
          presenceRisquesTechnologiques: false,
          presenceRisquesNaturels: 'FAIBLE',
          zonageEnvironnemental: 'HORS_ZONE',
          zonageReglementaire: 'Zone urbaine - U',
          zonagePatrimonial: 'NON_CONCERNE',
          trameVerteEtBleue: 'HORS_TRAME',
          typeProprietaire: 'PRIVE',
          etatBatiInfrastructure: 'BATIMENTS_HETEROGENES',
          presencePollution: 'NE_SAIT_PAS',
          qualiteVoieDesserte: 'ACCESSIBLE',
          qualitePaysage: 'BANAL_INFRA_ORDINAIRE',
          valeurArchitecturaleHistorique: 'EXCEPTIONNEL',
          reseauEaux: 'CONNECTE',
          coordonnees: {
            latitude: 47.4514,
            longitude: -0.4619,
          },
          fiabilite: 9.5,
        },
      },
      siteIndustriel: {
        summary: 'Site industriel - Données partielles',
        description:
          'Exemple avec certaines données manquantes, impactant la fiabilité',
        value: {
          identifiantParcelle: '490007000AB0001',
          commune: 'Angers',
          surfaceSite: 15000,
          surfaceBati: 2500,
          connectionReseauElectricite: true,
          distanceRaccordementElectrique: 0.8,
          siteEnCentreVille: false,
          distanceAutoroute: 0.5,
          distanceTransportCommun: 800,
          proximiteCommercesServices: false,
          tauxLogementsVacants: 7.2,
          ancienneActivite: 'Entrepôt logistique',
          presenceRisquesTechnologiques: true,
          presenceRisquesNaturels: 'MOYEN',
          zonageEnvironnemental: 'ZNIEFF_TYPE_2',
          zonageReglementaire: "Zone d'activité - AUi",
          zonagePatrimonial: 'NON_CONCERNE',
          trameVerteEtBleue: 'CORRIDOR_ECOLOGIQUE',
          typeProprietaire: 'PRIVE',
          fiabilite: 6.8,
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
