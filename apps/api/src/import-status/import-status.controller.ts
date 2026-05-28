import { All, Controller, Get, HttpStatus, Req, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { ImportStatusOutput } from "@mutafriches/shared-types";
import { ImportStatusService } from "./import-status.service";

const CORS_ALLOWED_ORIGINS = [
  "https://stats.incubateur.ademe.fr",
  "https://stats.incubateur.ademe.dev",
];

const CACHE_TTL_SECONDS = 300;

@ApiTags("import-status")
@Controller("api/import-status")
export class ImportStatusController {
  constructor(private readonly importStatusService: ImportStatusService) {}

  @Get()
  @ApiOperation({
    summary: "Statut des imports de référentiels",
    description:
      "Retourne pour chaque dataset de référence : statut du dernier import, " +
      "nombre de lignes en base, date du dernier import et chemin du fichier source.",
  })
  @ApiResponse({ status: 200, description: "Statut des imports" })
  async getImportStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
    const status: ImportStatusOutput = await this.importStatusService.getStatus();

    const origin = req.headers.origin;
    if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    res.status(HttpStatus.OK).json(status);
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
