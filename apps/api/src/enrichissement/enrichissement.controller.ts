import {
  Controller,
  Post,
  Body,
  Query,
  Req,
  Logger,
  HttpException,
  HttpStatus,
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
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { EnrichissementService } from "./services/enrichissement.service";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { EnrichirParcelleSwaggerDto } from "./dto/input/enrichir-parcelle.dto";
import { EnrichissementSwaggerDto } from "./dto/output/enrichissement.dto";

@ApiTags("enrichissement")
@Controller("enrichissement")
export class EnrichissementController {
  private readonly logger = new Logger(EnrichissementController.name);

  constructor(
    private readonly enrichissementService: EnrichissementService,
    private readonly origineDetectionService: OrigineDetectionService,
  ) {}

  @Post()
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({
    summary: "Enrichir les donnees d'une parcelle",
    description: `
    Enrichit automatiquement les donnees d'une parcelle a partir de son identifiant cadastral
    en interrogeant plusieurs sources de donnees externes.
    `,
  })
  @ApiBody({ type: EnrichirParcelleSwaggerDto })
  @ApiQuery({ name: "iframe", required: false, type: Boolean, description: "Mode iframe" })
  @ApiQuery({
    name: "integrateur",
    required: false,
    type: String,
    description: "Nom de l'integrateur",
  })
  @ApiResponse({
    status: 201,
    description: "Enrichissement reussi",
    type: EnrichissementSwaggerDto,
  })
  @ApiBadRequestResponse({ description: "Format d'identifiant invalide" })
  @ApiNotFoundResponse({ description: "Parcelle introuvable" })
  @ApiForbiddenResponse({ description: "Origine non autorisee" })
  async enrichirParcelle(
    @Body() input: EnrichirParcelleSwaggerDto,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
  ): Promise<EnrichissementOutputDto> {
    try {
      this.logger.log(`Enrichissement parcelle: ${input.identifiant}`);

      const origine = this.origineDetectionService.detecterOrigine(req, isIframe, integrateur);

      return await this.enrichissementService.enrichir(
        input.identifiant,
        origine.source,
        origine.integrateur,
      );
    } catch (error) {
      this.logger.error(`Erreur enrichissement: ${error}`);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: errorMessage },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
