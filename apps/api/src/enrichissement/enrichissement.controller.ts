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
import { EnrichissementOutputDto, isValidParcelId } from "@mutafriches/shared-types";
import { EnrichissementService } from "./services/enrichissement.service";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { EnrichirSiteSwaggerDto } from "./dto/input/enrichir-site.dto";
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
    summary: "Enrichir les données d'un site (mono ou multi-parcelle)",
    description: `
    Enrichit automatiquement les données d'un site à partir d'un ou plusieurs identifiants cadastraux
    en interrogeant plusieurs sources de données externes.

    Rétro-compatible : accepte \`identifiant\` (mono-parcelle) ou \`identifiants\` (multi-parcelle).
    Si les deux sont fournis, \`identifiants\` est prioritaire.
    `,
  })
  @ApiBody({ type: EnrichirSiteSwaggerDto })
  @ApiQuery({ name: "iframe", required: false, type: Boolean, description: "Mode iframe" })
  @ApiQuery({
    name: "integrateur",
    required: false,
    type: String,
    description: "Nom de l'intégrateur",
  })
  @ApiResponse({
    status: 201,
    description: "Enrichissement réussi",
    type: EnrichissementSwaggerDto,
  })
  @ApiBadRequestResponse({ description: "Format d'identifiant invalide" })
  @ApiNotFoundResponse({ description: "Parcelle introuvable" })
  @ApiForbiddenResponse({ description: "Origine non autorisée" })
  async enrichirParcelle(
    @Body() input: EnrichirSiteSwaggerDto,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
  ): Promise<EnrichissementOutputDto> {
    try {
      // Normaliser : identifiants[] est prioritaire sur identifiant
      const identifiants: string[] =
        input.identifiants ?? (input.identifiant ? [input.identifiant] : []);

      if (identifiants.length === 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Au moins un identifiant cadastral est requis (identifiant ou identifiants)",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Valider chaque identifiant
      for (const id of identifiants) {
        if (!isValidParcelId(id)) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: `Format d'identifiant cadastral invalide : ${id}`,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const origine = this.origineDetectionService.detecterOrigine(req, isIframe, integrateur);

      this.logger.log(
        `Enrichissement ${identifiants.length > 1 ? "site" : "parcelle"} : ${identifiants.join(", ")}`,
      );

      // Mono-parcelle : utiliser le flux existant
      if (identifiants.length === 1) {
        return await this.enrichissementService.enrichir(
          identifiants[0],
          origine.source,
          origine.integrateur,
        );
      }

      // Multi-parcelle : utiliser le nouveau flux site
      return await this.enrichissementService.enrichirSite(
        identifiants,
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
