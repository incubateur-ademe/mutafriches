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
  SourceUtilisation,
  APP_CONFIG,
} from "@mutafriches/shared-types";
import { Request } from "express";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { CalculerMutabiliteSwaggerDto } from "./dto/input/calculer-mutabilite.dto";
import { MutabiliteSwaggerDto } from "./dto/output/mutabilite.dto";
import { MetadataSwaggerDto } from "./dto/output/metadata.dto";
import { EvaluationSwaggerDto } from "./dto/output/evaluation.dto";
import { Evaluation } from "./entities/evaluation.entity";

@ApiTags("evaluation")
@Controller("evaluation")
export class EvaluationController {
  private readonly logger = new Logger(EvaluationController.name);

  constructor(private readonly orchestrateurService: OrchestrateurService) {}

  @Post("calculer")
  @ApiOperation({
    summary: "Calculer les indices de mutabilité",
    description: "Calcule les indices de mutabilité pour 7 usages différents d'une friche urbaine.",
  })
  @ApiBody({ type: CalculerMutabiliteSwaggerDto })
  @ApiQuery({ name: "modeDetaille", required: false, type: Boolean })
  @ApiQuery({ name: "sansEnrichissement", required: false, type: Boolean })
  @ApiResponse({ status: 201, description: "Calcul réussi", type: MutabiliteSwaggerDto })
  @ApiBadRequestResponse({ description: "Données incomplètes" })
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

      if (!input || !input.donneesEnrichies) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: "Données requises manquantes" },
          HttpStatus.BAD_REQUEST,
        );
      }

      let origine: OrigineUtilisation;
      const iframeMode = String(isIframe) === "true";

      if (iframeMode) {
        origine = {
          source: SourceUtilisation.IFRAME_INTEGREE,
          integrateur: integrateur || "unknown",
        };
      } else {
        origine = this.detecterOrigine(req);
      }

      return await this.orchestrateurService.calculerMutabilite(input, {
        modeDetaille: modeDetaille || false,
        sansEnrichissement: sansEnrichissement || false,
        origine,
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
      version: { api: APP_CONFIG.version, algorithme: APP_CONFIG.versionAlgo },
    };
  }

  private mapEvaluationToDto(evaluation: Evaluation): EvaluationSwaggerDto {
    if (!evaluation.id) throw new Error("Evaluation ID is missing");

    return {
      id: evaluation.id,
      identifiantParcelle: evaluation.parcelleId,
      dateCreation: evaluation.dateCalcul,
      dateModification: evaluation.dateCalcul,
      enrichissement: evaluation.donneesEnrichissement,
      donneesComplementaires: evaluation.donneesComplementaires,
      mutabilite: evaluation.resultats,
      metadata: { versionAlgorithme: evaluation.versionAlgorithme, source: "api" },
    };
  }

  private detecterOrigine(req?: Request): OrigineUtilisation {
    if (!req) return { source: SourceUtilisation.API_DIRECTE };

    const referrer =
      req.headers["referer"] || req.headers["referrer"] || req.headers["origin"] || "";

    if (!referrer && req.headers["origin"]) {
      const origin = req.headers["origin"] as string;
      const domainesStandalone = ["localhost", "127.0.0.1", "mutafriches.beta.gouv.fr"];
      const isStandalone = domainesStandalone.some((domain) => origin.includes(domain));

      return isStandalone
        ? { source: SourceUtilisation.SITE_STANDALONE }
        : {
            source: SourceUtilisation.IFRAME_INTEGREE,
            integrateur: this.extraireIntegrateur(origin),
          };
    }

    if (referrer.includes("/api") || (typeof referrer === "string" && referrer.endsWith("/api"))) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    const domainesStandalone = ["localhost", "127.0.0.1", "mutafriches.beta.gouv.fr"];
    const isStandalone = domainesStandalone.some((domain) => referrer.includes(domain));

    if (isStandalone && !referrer.includes("/api")) {
      return { source: SourceUtilisation.SITE_STANDALONE };
    }

    if (referrer) {
      return {
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: this.extraireIntegrateur(referrer as string),
      };
    }

    return { source: SourceUtilisation.API_DIRECTE };
  }

  private extraireIntegrateur(referrer: string): string | undefined {
    if (!referrer) return undefined;
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return undefined;
    }
  }
}
