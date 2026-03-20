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
  UseGuards,
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
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import {
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  UsageType,
  ZonageReglementaire,
} from "@mutafriches/shared-types";
import { Request } from "express";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { ALGORITHME_VERSIONS } from "./services/algorithme/versions";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { CalculerMutabiliteSwaggerDto } from "./dto/input/calculer-mutabilite.dto";
import { MutabiliteSwaggerDto } from "./dto/output/mutabilite.dto";
import { MetadataSwaggerDto } from "./dto/output/metadata.dto";
import { EvaluationSwaggerDto } from "./dto/output/evaluation.dto";
import { Evaluation } from "./entities/evaluation.entity";

@ApiTags("evaluation")
@Controller("evaluation")
export class EvaluationController {
  private readonly logger = new Logger(EvaluationController.name);

  constructor(
    private readonly orchestrateurService: OrchestrateurService,
    private readonly origineDetectionService: OrigineDetectionService,
  ) {}

  @Post("calculer")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({
    summary: "Calculer les indices de mutabilité",
    description: "Calcule les indices de mutabilité pour 7 usages différents d'une friche urbaine.",
  })
  @ApiBody({ type: CalculerMutabiliteSwaggerDto })
  @ApiQuery({ name: "modeDetaille", required: false, type: Boolean })
  @ApiQuery({ name: "sansEnrichissement", required: false, type: Boolean })
  @ApiQuery({
    name: "versionAlgorithme",
    required: false,
    type: String,
    description: "Version de l'algorithme (ex: v1.0, v1.1, v1.2)",
  })
  @ApiResponse({ status: 201, description: "Calcul réussi", type: MutabiliteSwaggerDto })
  @ApiBadRequestResponse({ description: "Données incomplètes" })
  @ApiForbiddenResponse({ description: "Origine non autorisee" })
  async calculerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("modeDetaille") modeDetaille?: boolean,
    @Query("sansEnrichissement") sansEnrichissement?: boolean,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
    @Query("versionAlgorithme") versionAlgorithme?: string,
  ): Promise<MutabiliteOutputDto> {
    try {
      this.logger.log("Calcul de mutabilite demande");

      if (!input || !input.donneesEnrichies) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: "Donnees requises manquantes" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const origine = this.origineDetectionService.detecterOrigine(req, isIframe, integrateur);

      return await this.orchestrateurService.calculerMutabilite(input, {
        modeDetaille: modeDetaille || false,
        sansEnrichissement: sansEnrichissement || false,
        origine,
        versionAlgorithme,
      });
    } catch (error) {
      this.logger.error("Erreur calcul mutabilité:", error);
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Erreur lors du calcul" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("metadata")
  @ApiOperation({
    summary: "Récupérer les métadonnées",
    description: "Retourne tous les enums disponibles",
  })
  @ApiResponse({ status: 200, description: "Métadonnées récupérées", type: MetadataSwaggerDto })
  getMetadata(): MetadataSwaggerDto {
    return {
      enums: {
        enrichissement: {
          risqueRetraitGonflementArgile: Object.values(RisqueRetraitGonflementArgile),
          risqueCavitesSouterraines: Object.values(RisqueCavitesSouterraines),
          risqueInondation: Object.values(RisqueInondation),
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
      version: { api: "1.0.0", algorithme: "1.1.0" },
    };
  }

  @Get("algorithme/versions")
  @ApiOperation({
    summary: "Liste des versions de l'algorithme",
    description: "Retourne les versions disponibles de l'algorithme de mutabilité",
  })
  @ApiResponse({ status: 200, description: "Versions récupérées" })
  getAlgorithmeVersions(): { version: string; label: string; date: string }[] {
    return ALGORITHME_VERSIONS.map((v) => ({
      version: v.version,
      label: v.label,
      date: v.date,
    }));
  }

  @Post("comparer")
  @ApiOperation({
    summary: "Comparer les résultats entre plusieurs versions de l'algorithme",
    description:
      "Calcule la mutabilité pour plusieurs versions de l'algorithme et retourne les résultats côte à côte",
  })
  @ApiBody({ type: CalculerMutabiliteSwaggerDto })
  @ApiQuery({
    name: "versions",
    required: true,
    type: String,
    description: "Versions séparées par des virgules (ex: v1.0,v1.1,v1.2)",
  })
  @ApiResponse({ status: 201, description: "Comparaison réussie" })
  @ApiBadRequestResponse({ description: "Données incomplètes ou versions invalides" })
  async comparerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("versions") versionsStr: string,
  ): Promise<Record<string, MutabiliteOutputDto>> {
    try {
      if (!input || !input.donneesEnrichies) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: "Données requises manquantes" },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!versionsStr) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: "Paramètre versions requis" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const versions = versionsStr.split(",").map((v) => v.trim());
      const versionsValides = ALGORITHME_VERSIONS.map((v) => v.version);
      const versionsInvalides = versions.filter((v) => !versionsValides.includes(v));

      if (versionsInvalides.length > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Versions invalides : ${versionsInvalides.join(", ")}. Versions disponibles : ${versionsValides.join(", ")}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.orchestrateurService.comparerMutabilite(input, versions);
    } catch (error) {
      this.logger.error("Erreur comparaison mutabilité:", error);
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Erreur lors de la comparaison" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer une évaluation complète" })
  @ApiParam({ name: "id", description: "Identifiant unique de l'évaluation" })
  @ApiResponse({ status: 200, description: "Évaluation trouvée", type: EvaluationSwaggerDto })
  @ApiNotFoundResponse({ description: "Évaluation non trouvée" })
  async recupererEvaluation(@Param("id") id: string): Promise<EvaluationSwaggerDto> {
    try {
      const evaluation = await this.orchestrateurService.recupererEvaluation(id);
      if (!evaluation) {
        throw new NotFoundException(`Évaluation ${id} non trouvée`);
      }
      return this.mapEvaluationToDto(evaluation);
    } catch (error) {
      this.logger.error(`Erreur récupération évaluation ${id}:`, error);
      if (error instanceof NotFoundException) throw error;

      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Erreur lors de la récupération" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private mapEvaluationToDto(evaluation: Evaluation): EvaluationSwaggerDto {
    if (!evaluation.id) throw new Error("Evaluation ID is missing");

    // identifiantParcelle du contrat API public = siteId interne
    const dto: EvaluationSwaggerDto = {
      id: evaluation.id,
      identifiantParcelle: evaluation.siteId,
      dateCreation: evaluation.dateCalcul,
      dateModification: evaluation.dateCalcul,
      enrichissement: evaluation.donneesEnrichissement,
      donneesComplementaires: evaluation.donneesComplementaires,
      mutabilite: evaluation.resultats,
      metadata: { versionAlgorithme: evaluation.versionAlgorithme, source: "api" },
    };

    // Ajouter les informations multi-parcelle si disponibles
    const enrichissement = evaluation.donneesEnrichissement;
    if (enrichissement.identifiantsParcelles) {
      (dto as unknown as Record<string, unknown>).identifiantsParcelles =
        enrichissement.identifiantsParcelles;
    }
    if (evaluation.nombreParcelles != null) {
      (dto as unknown as Record<string, unknown>).nombreParcelles = evaluation.nombreParcelles;
    }

    return dto;
  }
}
