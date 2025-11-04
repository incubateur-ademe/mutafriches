import { Controller, Post, Body, Logger, HttpException, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { EnrichirParcelleInputDto, EnrichissementOutputDto } from "@mutafriches/shared-types";
import { EnrichissementService } from "./services/enrichissement.service";
import { EnrichirParcelleSwaggerDto } from "./dto/input/enrichir-parcelle.dto";
import { EnrichissementSwaggerDto } from "./dto/output/enrichissement.dto";

@ApiTags("enrichissement")
@Controller("enrichissement")
export class EnrichissementController {
  private readonly logger = new Logger(EnrichissementController.name);

  constructor(private readonly enrichissementService: EnrichissementService) {}

  @Post()
  @ApiOperation({
    summary: "Enrichir les données d'une parcelle",
    description: `
    Enrichit automatiquement les données d'une parcelle à partir de son identifiant cadastral 
    en interrogeant plusieurs sources de données externes.
    `,
  })
  @ApiBody({ type: EnrichirParcelleSwaggerDto })
  @ApiResponse({
    status: 201,
    description: "Enrichissement réussi",
    type: EnrichissementSwaggerDto,
  })
  @ApiBadRequestResponse({ description: "Format d'identifiant invalide" })
  @ApiNotFoundResponse({ description: "Parcelle introuvable" })
  async enrichirParcelle(
    @Body() input: EnrichirParcelleInputDto,
  ): Promise<EnrichissementOutputDto> {
    try {
      this.logger.log(`Enrichissement parcelle: ${input.identifiant}`);
      return await this.enrichissementService.enrichir(input.identifiant);
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
