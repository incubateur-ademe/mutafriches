import { Controller, Post, Body, Query, Get, Param, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  EnrichirParcelleInputDto,
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { Request } from "express";
import { EnrichissementController } from "../enrichissement/enrichissement.controller";
import { EvaluationController } from "../evaluation/evaluation.controller";
import { EvaluationSwaggerDto } from "../evaluation/dto/output/evaluation.dto";
import { MetadataSwaggerDto } from "../evaluation/dto/output/metadata.dto";

@ApiTags("friches (deprecated - utilisez /enrichissement et /evaluation)")
@Controller("friches")
export class FrichesController {
  constructor(
    private readonly enrichissementController: EnrichissementController,
    private readonly evaluationController: EvaluationController,
  ) {}

  @Post("enrichir")
  @ApiOperation({
    summary: "Enrichir une parcelle (DEPRECATED - utilisez POST /enrichissement)",
    deprecated: true,
  })
  @ApiResponse({ status: 201, description: "Redirigé vers /enrichissement" })
  async enrichirParcelle(
    @Body() input: EnrichirParcelleInputDto,
  ): Promise<EnrichissementOutputDto> {
    return this.enrichissementController.enrichirParcelle(input);
  }

  @Post("calculer")
  @ApiOperation({
    summary: "Calculer mutabilité (DEPRECATED - utilisez POST /evaluation/calculer)",
    deprecated: true,
  })
  @ApiResponse({ status: 201, description: "Redirigé vers /evaluation/calculer" })
  async calculerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("modeDetaille") modeDetaille?: boolean,
    @Query("sansEnrichissement") sansEnrichissement?: boolean,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
  ): Promise<MutabiliteOutputDto> {
    return this.evaluationController.calculerMutabilite(
      input,
      modeDetaille,
      sansEnrichissement,
      isIframe,
      integrateur,
      req,
    );
  }

  @Get("evaluations/:id")
  @ApiOperation({
    summary: "Récupérer une évaluation (DEPRECATED - utilisez GET /evaluation/:id)",
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: "Redirigé vers /evaluation/:id" })
  async recupererEvaluation(@Param("id") id: string): Promise<EvaluationSwaggerDto> {
    return this.evaluationController.recupererEvaluation(id);
  }

  @Get("metadata")
  @ApiOperation({
    summary: "Récupérer métadonnées (DEPRECATED - utilisez GET /evaluation/metadata)",
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: "Redirigé vers /evaluation/metadata" })
  getMetadata(): MetadataSwaggerDto {
    return this.evaluationController.getMetadata();
  }
}
