import { Controller, Get, All, Query, Req, Res, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiExcludeEndpoint } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { Periodicity, StatOutput } from "@mutafriches/shared-types";
import { StatsService } from "./stats.service";
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
    summary: "KPIs publiques Mutafriches",
    description: "Retourne les statistiques d'utilisation de Mutafriches par période",
  })
  @ApiQuery({
    name: "periodicity",
    required: false,
    enum: ["day", "week", "month", "year"],
    description: "Périodicité de regroupement (défaut: month)",
  })
  @ApiQuery({
    name: "since",
    required: false,
    type: Number,
    description: "Nombre de périodes à remonter (défaut: toutes)",
  })
  @ApiResponse({ status: 200, description: "Statistiques par période" })
  async getStats(
    @Query("periodicity") periodicityParam: string | undefined,
    @Query("since") sinceParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Validation de la périodicité
    const periodicity: Periodicity =
      periodicityParam && isValidPeriodicity(periodicityParam) ? periodicityParam : "month";

    // Calcul de la date "since"
    let since: Date | null = null;
    const sinceNumber = sinceParam ? parseInt(sinceParam, 10) : NaN;

    if (!isNaN(sinceNumber) && sinceNumber > 0) {
      since = computeSinceDate(sinceNumber, periodicity);
    }

    const stats: StatOutput[] = await this.statsService.getAllStats(since, periodicity);

    // Headers CORS
    const origin = req.headers.origin;
    if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    // Header Cache-Control dynamique
    const cacheTtl = computeCacheTtl(periodicity);
    res.setHeader("Cache-Control", `public, max-age=${cacheTtl}`);

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
}
