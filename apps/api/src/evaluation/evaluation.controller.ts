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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
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
  DistanceIte,
} from "@mutafriches/shared-types";
import { Request } from "express";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { ALGORITHME_VERSIONS, VERSION_COURANTE } from "./services/algorithme/versions";
import { OrigineDetectionService } from "../shared/services/origine-detection.service";
import { IntegrateurOriginGuard } from "../shared/guards";
import { ApiOriginAuth, ApiStandardErrors } from "../shared/swagger";
import { APP_VERSION } from "../shared/utils/version.utils";
import { CalculerMutabiliteSwaggerDto } from "./dto/input/calculer-mutabilite.dto";
import { CALCULER_MUTABILITE_BODY_EXAMPLES } from "./dto/input/calculer-mutabilite.examples";
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
  @ApiBody({ type: CalculerMutabiliteSwaggerDto, examples: CALCULER_MUTABILITE_BODY_EXAMPLES })
  @ApiQuery({
    name: "modeDetaille",
    required: false,
    type: Boolean,
    description:
      "Si `true`, inclut le détail par critère (avantages, contraintes, score brut) dans la réponse.",
  })
  @ApiQuery({
    name: "sansEnrichissement",
    required: false,
    type: Boolean,
    description:
      "Si `true`, calcule directement sur les données fournies sans étape d'enrichissement préalable.",
  })
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
    name: "versionAlgorithme",
    required: false,
    type: String,
    description:
      "Version de l'algorithme à utiliser (ex : `v1.9`). Si omis, la version courante est appliquée. Voir `GET /evaluation/algorithme/versions` pour la liste.",
  })
  @ApiQuery({
    name: "partenaire",
    required: false,
    type: String,
    description:
      "Slug de la page partenaire d'origine (ex : `scet`). Enregistre `integrateur = partenaire:<slug>` pour le suivi par canal.",
  })
  @ApiResponse({ status: 201, description: "Calcul réussi", type: MutabiliteSwaggerDto })
  @ApiOriginAuth("integrateur")
  @ApiStandardErrors()
  async calculerMutabilite(
    @Body() input: CalculerMutabiliteInputDto,
    @Query("modeDetaille") modeDetaille?: boolean,
    @Query("sansEnrichissement") sansEnrichissement?: boolean,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
    @Query("versionAlgorithme") versionAlgorithme?: string,
    @Query("partenaire") partenaire?: string,
  ): Promise<MutabiliteOutputDto> {
    try {
      this.logger.log("Calcul de mutabilite demande");

      if (!input || !input.donneesEnrichies) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: "Donnees requises manquantes" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const origine = this.origineDetectionService.detecterOrigine(
        req,
        isIframe,
        integrateur,
        partenaire,
      );

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
    description:
      "Retourne les enums utilisés par l'API (valeurs autorisées pour chaque critère), la liste des 7 usages et la version courante de l'algorithme. Source de vérité pour construire les formulaires côté intégrateur.",
  })
  @ApiResponse({ status: 200, description: "Métadonnées récupérées", type: MetadataSwaggerDto })
  @ApiStandardErrors()
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
          distanceIte: Object.values(DistanceIte),
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
      version: { api: APP_VERSION, algorithme: VERSION_COURANTE },
    };
  }

  @Get("algorithme/versions")
  @ApiOperation({
    summary: "Liste des versions de l'algorithme",
    description:
      "Retourne toutes les versions disponibles de l'algorithme de mutabilité, avec leur date d'effet et leur libellé. Une version peut être ciblée via `?versionAlgorithme=vX.Y` sur `POST /evaluation/calculer`.",
  })
  @ApiResponse({ status: 200, description: "Versions récupérées" })
  @ApiStandardErrors()
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
  @ApiBody({ type: CalculerMutabiliteSwaggerDto, examples: CALCULER_MUTABILITE_BODY_EXAMPLES })
  @ApiQuery({
    name: "versions",
    required: true,
    type: String,
    description: "Versions séparées par des virgules (ex: v1.0,v1.1,v1.2)",
  })
  @ApiResponse({ status: 201, description: "Comparaison réussie" })
  @ApiStandardErrors()
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
  @ApiOperation({
    summary: "Récupérer une évaluation complète",
    description:
      "Retourne le détail complet d'une évaluation persistée : données d'enrichissement, données complémentaires saisies, résultats de mutabilité et métadonnées (version d'algorithme, source, intégrateur).",
  })
  @ApiParam({
    name: "id",
    description: "Identifiant unique de l'évaluation (préfixé `eval-`).",
    example: "eval-550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({ status: 200, description: "Évaluation trouvée", type: EvaluationSwaggerDto })
  @ApiStandardErrors({ notFound: true })
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
