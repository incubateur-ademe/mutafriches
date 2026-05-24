import { Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiSecurity } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { ApiMonitoringSnapshot, ImportStatusOutput } from "@mutafriches/shared-types";
import { ImportsService } from "./imports.service";
import { ApiMonitoringService } from "./api-monitoring.service";
import { ApiRefreshTokenGuard } from "./api-refresh-token.guard";
import { ApiStandardErrors } from "../shared/swagger";

const CORS_ALLOWED_ORIGINS = [
  "https://stats.incubateur.ademe.fr",
  "https://stats.incubateur.ademe.dev",
];

const CACHE_TTL_SECONDS = 300;

function applyCors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

@ApiTags("donnees-externes")
@Controller("api/donnees-externes")
export class DonneesExternesController {
  constructor(
    private readonly importsService: ImportsService,
    private readonly apiMonitoringService: ApiMonitoringService,
  ) {}

  @Get("imports")
  @ApiOperation({
    summary: "Statut des imports de référentiels",
    description:
      "Pour chaque dataset de référence : statut du dernier import, nombre de lignes en base, date du dernier import et chemin du fichier source. Réponse cacheable (TTL 300s).",
  })
  @ApiResponse({ status: 200, description: "Statut des imports" })
  @ApiStandardErrors()
  async getImports(@Req() req: Request, @Res() res: Response): Promise<void> {
    const status: ImportStatusOutput = await this.importsService.getStatus();
    applyCors(req, res);
    res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    res.status(HttpStatus.OK).json(status);
  }

  @Get("apis")
  @ApiOperation({
    summary: "Dernier snapshot du monitoring des APIs externes",
    description:
      "Renvoie le résultat du dernier cycle de health-check enregistré en base (table `api_health_snapshots`). Le cycle est déclenché quotidiennement par le workflow GitHub Actions `api-monitoring.yml`. Réponse cacheable (TTL 300s).",
  })
  @ApiResponse({ status: 200, description: "Snapshot des APIs externes" })
  @ApiStandardErrors()
  async getApis(@Req() req: Request, @Res() res: Response): Promise<void> {
    const snapshot: ApiMonitoringSnapshot = await this.apiMonitoringService.getLatestSnapshot();
    applyCors(req, res);
    res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    res.status(HttpStatus.OK).json(snapshot);
  }

  @Post("apis/refresh")
  @UseGuards(ApiRefreshTokenGuard)
  @ApiSecurity("X-Refresh-Token")
  @ApiOperation({
    summary: "Déclenche un nouveau cycle de health-check des APIs externes",
    description:
      "Endpoint protégé par le header `X-Refresh-Token`. Appelé par le workflow " +
      "GitHub Actions `api-monitoring.yml` (cron quotidien à 5h UTC ou déclenchement " +
      "manuel via workflow_dispatch). Ping toutes les APIs en parallèle (timeout 5s) " +
      "et persiste un nouveau snapshot.",
  })
  @ApiResponse({ status: 200, description: "Nouveau snapshot" })
  @ApiResponse({ status: 401, description: "Token manquant ou invalide" })
  @ApiStandardErrors()
  async refreshApis(@Res() res: Response): Promise<void> {
    const snapshot = await this.apiMonitoringService.runHealthCheck();
    res.status(HttpStatus.OK).json(snapshot);
  }
}
