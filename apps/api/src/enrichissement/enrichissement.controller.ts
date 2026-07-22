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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import {
  EnrichissementOutputDto,
  isValidParcelId,
  normalizeParcelId,
} from "@mutafriches/shared-types";
import { EnrichissementService } from "./services/enrichissement.service";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { ApiOriginAuth, ApiStandardErrors } from "../shared/swagger";
import { EnrichirSiteSwaggerDto, ENRICHIR_SITE_BODY_EXAMPLES } from "./dto/input/enrichir-site.dto";
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
  @ApiBody({ type: EnrichirSiteSwaggerDto, examples: ENRICHIR_SITE_BODY_EXAMPLES })
  @ApiQuery({
    name: "iframe",
    required: false,
    type: Boolean,
    description: "Mode iframe (utilisé pour le tracking d'origine).",
  })
  @ApiQuery({
    name: "integrateur",
    required: false,
    type: String,
    description: "Nom de l'intégrateur (ex : `benefriches`). Utilisé pour le tracking d'origine.",
  })
  @ApiQuery({
    name: "acceptDegradedCache",
    required: false,
    type: Boolean,
    description:
      "Si `true`, accepte un résultat depuis le cache même si certaines sources ont échoué lors du précédent enrichissement (résultat partiel). Par défaut `false`.",
  })
  @ApiQuery({
    name: "partenaire",
    required: false,
    type: String,
    description:
      "Slug de la page partenaire d'origine (ex : `scet`). Enregistre `integrateur = partenaire:<slug>` pour le suivi par canal.",
  })
  @ApiResponse({
    status: 201,
    description: "Enrichissement réussi",
    type: EnrichissementSwaggerDto,
  })
  @ApiOriginAuth("integrateur")
  @ApiStandardErrors({ notFound: true })
  async enrichirParcelle(
    @Body() input: EnrichirSiteSwaggerDto,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Query("acceptDegradedCache") acceptDegradedCacheRaw?: string,
    @Req() req?: Request,
    @Query("partenaire") partenaire?: string,
  ): Promise<EnrichissementOutputDto> {
    const acceptDegradedCache = acceptDegradedCacheRaw === "true";
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

      // Normaliser sous forme canonique : la clé de cache doit être identique quel que
      // soit le client (UI, intégrateurs, prefetch), qu'il envoie la section brute "0X"
      // ou normalisée "X". Sans ça, le prefetch chauffe le cache sous une clé qui ne
      // correspond jamais aux requêtes de l'UI (cache miss systématique).
      const identifiantsNormalises = identifiants.map((id) => normalizeParcelId(id));

      const origine = this.origineDetectionService.detecterOrigine(
        req,
        isIframe,
        integrateur,
        partenaire,
      );

      this.logger.log(
        `Enrichissement ${identifiantsNormalises.length > 1 ? "site" : "parcelle"} : ${identifiantsNormalises.join(", ")}`,
      );

      // Mono-parcelle : utiliser le flux existant
      if (identifiantsNormalises.length === 1) {
        return await this.enrichissementService.enrichir(
          identifiantsNormalises[0],
          origine.source,
          origine.integrateur,
          acceptDegradedCache,
        );
      }

      // Multi-parcelle : utiliser le nouveau flux site
      return await this.enrichissementService.enrichirSite(
        identifiantsNormalises,
        origine.source,
        origine.integrateur,
        acceptDegradedCache,
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
