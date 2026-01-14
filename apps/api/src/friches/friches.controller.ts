import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  Param,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiForbiddenResponse } from "@nestjs/swagger";
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
  SourceUtilisation,
} from "@mutafriches/shared-types";
import { EnrichissementService } from "../enrichissement/services/enrichissement.service";
import { OrchestrateurService } from "../evaluation/services/orchestrateur.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { EvaluationSwaggerDto } from "../evaluation/dto/output/evaluation.dto";
import { MetadataSwaggerDto } from "../evaluation/dto/output/metadata.dto";
import { Evaluation } from "../evaluation/entities/evaluation.entity";

@ApiTags("friches (deprecated)")
@Controller("friches")
export class FrichesController {
  constructor(
    private readonly enrichissementService: EnrichissementService,
    private readonly orchestrateurService: OrchestrateurService,
  ) {}

  @Post("enrichir")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "DEPRECATED - utilisez POST /enrichissement", deprecated: true })
  @ApiForbiddenResponse({ description: "Origine non autorisee" })
  async enrichirParcelle(
    @Body() input: EnrichirParcelleInputDto,
  ): Promise<EnrichissementOutputDto> {
    return this.enrichissementService.enrichir(input.identifiant);
  }

  @Post("calculer")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "DEPRECATED - utilisez POST /evaluation/calculer", deprecated: true })
  @ApiForbiddenResponse({ description: "Origine non autorisee" })
  async calculerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("modeDetaille") modeDetaille?: boolean,
    @Query("sansEnrichissement") sansEnrichissement?: boolean,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
  ): Promise<MutabiliteOutputDto> {
    const iframeMode = String(isIframe) === "true";
    const origine: OrigineUtilisation = iframeMode
      ? { source: SourceUtilisation.IFRAME_INTEGREE, integrateur: integrateur || "unknown" }
      : { source: SourceUtilisation.API_DIRECTE };

    return this.orchestrateurService.calculerMutabilite(input, {
      modeDetaille: modeDetaille || false,
      sansEnrichissement: sansEnrichissement || false,
      origine,
    });
  }

  @Get("evaluations/:id")
  @ApiOperation({ summary: "DEPRECATED - utilisez GET /evaluation/:id", deprecated: true })
  async recupererEvaluation(@Param("id") id: string): Promise<EvaluationSwaggerDto> {
    const evaluation = await this.orchestrateurService.recupererEvaluation(id);
    if (!evaluation) throw new NotFoundException();
    return this.mapEvaluationToDto(evaluation);
  }

  @Get("metadata")
  @ApiOperation({ summary: "DEPRECATED - utilisez GET /evaluation/metadata", deprecated: true })
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
      version: { api: "1.0.0", algorithme: "1.1.0" },
    };
  }

  private mapEvaluationToDto(evaluation: Evaluation): EvaluationSwaggerDto {
    if (!evaluation.id) throw new Error("Evaluation ID missing");
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
}
