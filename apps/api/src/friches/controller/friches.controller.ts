import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  Param,
  NotFoundException,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import {
  EnrichirParcelleInputDto,
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  UsageType,
  ZonageReglementaire,
  OrigineUtilisation,
} from "@mutafriches/shared-types";
import { Request } from "express";

import { OrchestrateurService } from "../services/orchestrateur.service";
import { CalculerMutabiliteSwaggerDto, EnrichirParcelleSwaggerDto } from "../dto/swagger/input";
import { EnrichissementSwaggerDto, MutabiliteSwaggerDto } from "../dto/swagger/output";
import { MetadataSwaggerDto } from "../dto/swagger/output/metadata.dto";
import { EvaluationSwaggerDto } from "../dto/swagger/output/evaluation.dto";
import { Evaluation } from "../domain/entities/evaluation.entity";
import { SourceUtilisation } from "@mutafriches/shared-types/dist/enums/usage.enums";
import { isValidParcelId } from "../utils/validation.utils";

@ApiTags("friches")
@Controller("friches")
export class FrichesController {
  private readonly logger = new Logger(FrichesController.name);

  constructor(private readonly orchestrateurService: OrchestrateurService) {}

  @Post("enrichir")
  @ApiOperation({
    summary: "Enrichir les données d'une parcelle",
    description: `
    Enrichit automatiquement les données d'une parcelle à partir de son identifiant cadastral 
    en interrogeant plusieurs sources de données externes.
    
    **Sources utilisées :**
    - API IGN Cadastre : coordonnées, commune, géométrie, surface
    - API BDNB : surface bâtie, risques naturels
    - API Enedis : raccordement électrique, distance réseau
    - API Transport : distance aux transports en commun
    - API Overpass : commerces et services à proximité
    - API Lovac : taux de logements vacants

    Retourne une parcelle enrichie avec un indice de fiabilité selon la complétude des données.
    `,
  })
  @ApiBody({
    type: EnrichirParcelleSwaggerDto,
    examples: {
      trelaze: {
        summary: "Parcelle Trélazé (cas de test)",
        description: "Ancienne manufacture Les Allumettes",
        value: {
          identifiant: "25056000HZ0346",
        },
      },
      renaison: {
        summary: "Parcelle Renaison (cas de test)",
        description: "Site industriel",
        value: {
          identifiant: "42182000AB0123",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Enrichissement réussi",
    type: EnrichissementSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: "Format d'identifiant invalide",
  })
  @ApiNotFoundResponse({
    description: "Parcelle introuvable dans les sources de données",
  })
  async enrichirParcelle(
    @Body() input: EnrichirParcelleInputDto,
  ): Promise<EnrichissementOutputDto> {
    try {
      this.logger.log(`Enrichissement parcelle: ${input.identifiant}`);

      // Validation de l'input
      if (!input.identifiant) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "L'identifiant de parcelle est requis",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validation du format de l'identifiant
      if (!isValidParcelId(input.identifiant)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message:
              "Format d'identifiant invalide. Format attendu : code commune (5-6 caractères) + préfixe (0-3 caractères) + section (1-2 lettres majuscules) + numéro (4 chiffres). Exemples : 25056000IK0102 ou 972090000O0498",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.orchestrateurService.enrichirParcelle(input);
      return result;
    } catch (error) {
      this.logger.error(`Erreur enrichissement parcelle ${input.identifiant}:`, error);

      // Si c'est déjà une HttpException, on la propage
      if (error instanceof HttpException) {
        throw error;
      }

      // Extraire le message d'erreur
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";

      // Déterminer le code HTTP approprié selon le type d'erreur
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errorType = "Internal Server Error";

      if (
        errorMessage.toLowerCase().includes("introuvable") ||
        errorMessage.toLowerCase().includes("pas trouvé") ||
        errorMessage.toLowerCase().includes("non trouvé")
      ) {
        statusCode = HttpStatus.NOT_FOUND;
        errorType = "Not Found";
      } else if (
        errorMessage.toLowerCase().includes("invalide") ||
        errorMessage.toLowerCase().includes("incorrect") ||
        errorMessage.toLowerCase().includes("format")
      ) {
        statusCode = HttpStatus.BAD_REQUEST;
        errorType = "Bad Request";
      } else if (
        errorMessage.toLowerCase().includes("timeout") ||
        errorMessage.toLowerCase().includes("connexion")
      ) {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorType = "Service Unavailable";
      }

      throw new HttpException(
        {
          statusCode,
          message: errorMessage,
          error: errorType,
        },
        statusCode,
      );
    }
  }

  @Post("calculer")
  @ApiOperation({
    summary: "Calculer les indices de mutabilité",
    description: `
    Calcule les indices de mutabilité pour 7 usages différents d'une friche urbaine.
    
    **Algorithme :**
    - Analyse de 25+ critères techniques, réglementaires et contextuels
    - Pondération spécifique par usage
    - Calcul d'un indice de 0 à 100% pour chaque usage
    - Classement des usages par potentiel (rang 1 à 7, 7 étant le meilleur)
    - Évaluation de la fiabilité globale selon la complétude des données
    
    **7 usages analysés :**
    - ${UsageType.RESIDENTIEL} : Résidentiel ou mixte
    - ${UsageType.EQUIPEMENTS} : Équipements publics  
    - ${UsageType.CULTURE} : Culture, tourisme
    - ${UsageType.TERTIAIRE} : Tertiaire
    - ${UsageType.INDUSTRIE} : Industrie
    - ${UsageType.RENATURATION} : Renaturation
    - ${UsageType.PHOTOVOLTAIQUE} : Photovoltaïque au sol
    `,
  })
  @ApiBody({
    type: CalculerMutabiliteSwaggerDto,
    description: "Données enrichies + données complémentaires",
    examples: {
      exempleComplet: {
        summary: "Exemple avec toutes les données",
        value: {
          donneesEnrichies: {
            identifiantParcelle: "25056000HZ0346",
            codeInsee: "49349",
            commune: "Trélazé",
            surfaceSite: 42780,
            surfaceBati: 6600,
            siteEnCentreVille: true,
            distanceAutoroute: 1.5,
            distanceTransportCommun: 250,
            proximiteCommercesServices: true,
            distanceRaccordementElectrique: 0.3,
            tauxLogementsVacants: 4.9,
            presenceRisquesTechnologiques: false,
            presenceRisquesNaturels: RisqueNaturel.FAIBLE,
            zonageEnvironnemental: ZonageEnvironnemental.HORS_ZONE,
            zonageReglementaire: "Zone urbaine - U",
            zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE,
            trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,
            coordonnees: { latitude: 47.4514, longitude: -0.4619 },
            sourcesUtilisees: ["Cadastre", "BDNB", "Enedis"],
            champsManquants: [],
            fiabilite: 9.5,
          },
          donneesComplementaires: {
            typeProprietaire: TypeProprietaire.PRIVE,
            raccordementEau: RaccordementEau.OUI,
            etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
            presencePollution: PresencePollution.NE_SAIT_PAS,
            valeurArchitecturaleHistorique: ValeurArchitecturale.INTERET_REMARQUABLE,
            qualitePaysage: QualitePaysage.INTERET_REMARQUABLE,
            qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
          },
        },
      },
    },
  })
  @ApiQuery({
    name: "modeDetaille",
    required: false,
    type: Boolean,
    description: "Active le mode détaillé avec le détail des calculs",
  })
  @ApiQuery({
    name: "sansEnrichissement",
    required: false,
    type: Boolean,
    description: "Active le mode sans enrichissement (utilise seulement les données fournies)",
  })
  @ApiResponse({
    status: 201,
    description: "Calcul réussi",
    type: MutabiliteSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: "Données incomplètes",
  })
  async calculerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("modeDetaille") modeDetaille?: boolean,
    @Query("sansEnrichissement") sansEnrichissement?: boolean,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
  ): Promise<MutabiliteOutputDto> {
    try {
      this.logger.log("Calcul de mutabilité demandé");

      // Validation de l'input
      if (!input) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Les données d'entrée sont requises pour le calcul de mutabilité",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validation des données enrichies
      if (!input.donneesEnrichies) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Les données enrichies sont requises pour le calcul",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validation des données complémentaires si pas en mode sansEnrichissement
      if (!sansEnrichissement && !input.donneesComplementaires) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Les données complémentaires sont requises pour le calcul complet",
            error: "Bad Request",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      let origine: OrigineUtilisation;
      const iframeMode = String(isIframe) === "true";

      // Priorité aux paramètres explicites iframe
      if (iframeMode) {
        origine = {
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: integrateur || "unknown",
        };
      } else {
        // Fallback sur la détection
        origine = this.detecterOrigine(req);
      }

      const result = await this.orchestrateurService.calculerMutabilite(input, {
        modeDetaille: modeDetaille || false,
        sansEnrichissement: sansEnrichissement || false,
        origine,
      });

      return result;
    } catch (error) {
      this.logger.error("Erreur calcul mutabilité:", error);

      // Si c'est déjà une HttpException, on la propage
      if (error instanceof HttpException) {
        throw error;
      }

      // Extraire le message d'erreur
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue lors du calcul";

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: "Internal Server Error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("evaluations/:id")
  @ApiOperation({
    summary: "Récupérer une évaluation complète",
    description: `...`,
  })
  @ApiParam({
    name: "id",
    description: "Identifiant unique de l'évaluation",
    example: "eval-550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Évaluation trouvée",
    type: EvaluationSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: "Évaluation non trouvée",
  })
  async recupererEvaluation(@Param("id") id: string): Promise<EvaluationSwaggerDto> {
    try {
      const evaluation = await this.orchestrateurService.recupererEvaluation(id);

      if (!evaluation) {
        throw new NotFoundException(`Évaluation ${id} non trouvée`);
      }

      return this.mapEvaluationToDto(evaluation);
    } catch (error) {
      this.logger.error(`Erreur récupération évaluation ${id}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Erreur lors de la récupération de l'évaluation",
          error: "Internal Server Error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mappe l'entité Evaluation vers le DTO Swagger
   */
  private mapEvaluationToDto(evaluation: Evaluation): EvaluationSwaggerDto {
    if (!evaluation.id) {
      throw new Error("Evaluation Identifier is missing");
    }

    return {
      id: evaluation.id,
      identifiantParcelle: evaluation.parcelleId,
      dateCreation: evaluation.dateCalcul,
      dateModification: evaluation.dateCalcul,
      enrichissement: evaluation.donneesEnrichissement,
      donneesComplementaires: evaluation.donneesComplementaires,
      mutabilite: evaluation.resultats,
      metadata: {
        versionAlgorithme: evaluation.versionAlgorithme,
        source: "api",
      },
    };
  }

  @Get("metadata")
  @ApiOperation({
    summary: "Récupérer les métadonnées",
    description: "Retourne tous les enums et labels disponibles",
  })
  @ApiResponse({
    status: 200,
    description: "Métadonnées récupérées avec succès",
    type: MetadataSwaggerDto,
  })
  getMetadata(): MetadataSwaggerDto {
    return {
      enums: {
        enrichissement: {
          risqueNaturel: Object.values(RisqueNaturel),
          zonageEnvironnemental: Object.values(ZonageEnvironnemental),
          zonageReglementaire: Object.values(ZonageReglementaire),
          zonagePatrimonial: Object.values(ZonagePatrimonial),
          trameVerteEtBleue: Object.values(TrameVerteEtBleue),
        },
        saisie: {
          typeProprietaire: Object.values(TypeProprietaire),
          raccordementEau: Object.values(RaccordementEau),
          etatBatiInfrastructure: Object.values(EtatBatiInfrastructure),
          presencePollution: Object.values(PresencePollution),
          valeurArchitecturaleHistorique: Object.values(ValeurArchitecturale),
          qualitePaysage: Object.values(QualitePaysage),
          qualiteVoieDesserte: Object.values(QualiteVoieDesserte),
        },
        usages: Object.values(UsageType),
      },
      version: {
        api: "1.0.0",
        algorithme: "1.0.0",
      },
    };
  }

  /**
   * Helper pour détecter l'origine de l'utilisation de l'API
   * @param req
   * @returns
   */
  private detecterOrigine(req?: Request): OrigineUtilisation {
    if (!req) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // Essayer plusieurs headers pour la détection
    const referrer =
      req.headers["referer"] || req.headers["referrer"] || req.headers["origin"] || "";

    // Si pas de referrer mais qu'on a un origin header
    if (!referrer && req.headers["origin"]) {
      const origin = req.headers["origin"] as string;

      // Vérifier si c'est un domaine standalone
      const domainesStandalone = [
        "localhost",
        "127.0.0.1",
        "mutafriches.beta.gouv.fr",
        "mutafriches.osc-secnum-fr1.scalingo.io",
        "mutafriches.incubateur.ademe.dev",
        "mutafriches-preprod.osc-fr1.scalingo.io",
      ];

      const isStandalone = domainesStandalone.some((domain) => origin.includes(domain));

      if (isStandalone) {
        return { source: SourceUtilisation.SITE_STANDALONE };
      } else {
        return {
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: this.extraireIntegrateur(origin),
        };
      }
    }

    // Swagger UI -> referrer qui pointe vers /api
    if (referrer.includes("/api") || (referrer as string).endsWith("/api")) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // Liste des domaines du site standalone
    const domainesStandalone = [
      "localhost",
      "127.0.0.1",
      "mutafriches.beta.gouv.fr",
      "mutafriches.osc-secnum-fr1.scalingo.io",
      "mutafriches.incubateur.ademe.dev",
      "mutafriches-preprod.osc-fr1.scalingo.io",
    ];

    // Vérifier si le referrer vient d'un domaine standalone
    const isStandalone = domainesStandalone.some((domain) => referrer.includes(domain));

    if (isStandalone && !referrer.includes("/api")) {
      return { source: SourceUtilisation.SITE_STANDALONE };
    }

    // Si on a un referrer qui n'est pas un domaine standalone -> iframe
    if (referrer) {
      const integrateur = this.extraireIntegrateur(referrer as string);
      return {
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur,
      };
    }

    // Par défaut pour les appels sans referrer
    return { source: SourceUtilisation.API_DIRECTE };
  }

  /**
   * Helper pour extraire le nom de domaine intégrateur depuis le referrer
   * @param referrer
   * @returns
   */
  private extraireIntegrateur(referrer: string): string | undefined {
    if (!referrer) return undefined;
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch (error) {
      console.error("DEBUG: Erreur parsing URL:", error);
      return undefined;
    }
  }
}
