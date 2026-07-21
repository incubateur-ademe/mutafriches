import { Controller, Get, All, Query, Req, Res, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiExcludeEndpoint } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { Periodicity, StatOutput } from "@mutafriches/shared-types";
import { StatsService } from "./stats.service";
import { ApiStandardErrors } from "../shared/swagger";
import { isValidPeriodicity, computeSinceDate, computeCacheTtl } from "./utils/period.utils";

const CORS_ALLOWED_ORIGINS = [
  "https://stats.incubateur.ademe.fr",
  "https://stats.incubateur.ademe.dev",
];

@ApiTags("stats")
@Controller("api/stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({
    summary: "KPI public principal Mutafriches",
    description:
      "Retourne l'indicateur d'impact principal (analyses de mutabilité abouties) au format attendu par le dashboard incubateur : un objet `StatOutput` unique (`{ description, stats: [] }`). La réponse est cacheable via un header `Cache-Control` dynamique (TTL adapté à la périodicité). CORS restreint aux dashboards ADEME (`stats.incubateur.ademe.*`).",
  })
  @ApiQuery({
    name: "periodicity",
    required: false,
    enum: ["day", "week", "month", "year"],
    description: "Périodicité de regroupement (défaut : `month`).",
  })
  @ApiQuery({
    name: "since",
    required: false,
    type: Number,
    description:
      "Nombre de périodes à remonter depuis aujourd'hui (défaut : toutes les périodes disponibles).",
  })
  @ApiResponse({ status: 200, description: "Indicateur principal (objet StatOutput unique)" })
  @ApiStandardErrors()
  async getStats(
    @Query("periodicity") periodicityParam: string | undefined,
    @Query("since") sinceParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { periodicity, since } = this.parseParams(periodicityParam, sinceParam);

    const stat: StatOutput = await this.statsService.getStatPrincipale(since, periodicity);

    this.appliquerHeaders(req, res, periodicity);
    res.status(HttpStatus.OK).json(stat);
  }

  @Get("all")
  @ApiOperation({
    summary: "Tous les KPI publics Mutafriches",
    description:
      "Retourne l'ensemble des indicateurs (tableau de `StatOutput`) pour un affichage dashboard interne. À la différence de `GET /api/stats`, cet endpoint ne suit pas le contrat incubateur (objet unique).",
  })
  @ApiQuery({ name: "periodicity", required: false, enum: ["day", "week", "month", "year"] })
  @ApiQuery({ name: "since", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Tableau de tous les indicateurs" })
  @ApiStandardErrors()
  async getAllStats(
    @Query("periodicity") periodicityParam: string | undefined,
    @Query("since") sinceParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { periodicity, since } = this.parseParams(periodicityParam, sinceParam);

    const stats: StatOutput[] = await this.statsService.getAllStats(since, periodicity);

    this.appliquerHeaders(req, res, periodicity);
    res.status(HttpStatus.OK).json(stats);
  }

  @All()
  @ApiExcludeEndpoint()
  handleMethodNotAllowed(@Res() res: Response): void {
    res.setHeader("Allow", "GET, OPTIONS");
    res
      .status(HttpStatus.METHOD_NOT_ALLOWED)
      .json({ statusCode: 405, message: "Method Not Allowed" });
  }

  /** Valide la périodicité et calcule la date "since" (partagé par les endpoints stats). */
  private parseParams(
    periodicityParam: string | undefined,
    sinceParam: string | undefined,
  ): { periodicity: Periodicity; since: Date | null } {
    const periodicity: Periodicity =
      periodicityParam && isValidPeriodicity(periodicityParam) ? periodicityParam : "month";

    let since: Date | null = null;
    const sinceNumber = sinceParam ? parseInt(sinceParam, 10) : NaN;
    if (!isNaN(sinceNumber) && sinceNumber > 0) {
      since = computeSinceDate(sinceNumber, periodicity);
    }

    return { periodicity, since };
  }

  /** Applique les headers CORS whitelistés et le Cache-Control borné à la fin de période. */
  private appliquerHeaders(req: Request, res: Response, periodicity: Periodicity): void {
    const origin = req.headers.origin;
    if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    const cacheTtl = computeCacheTtl(periodicity);
    res.setHeader("Cache-Control", `public, max-age=${cacheTtl}`);
  }
}
