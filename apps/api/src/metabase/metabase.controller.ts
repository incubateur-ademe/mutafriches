import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { MetabaseService } from "./metabase.service";

@ApiTags("metabase")
@Controller("api/metabase")
export class MetabaseController {
  constructor(private readonly metabaseService: MetabaseService) {}

  @Get("embed-url")
  @ApiOperation({
    summary: "URL d'embedding du dashboard Metabase",
    description:
      "Retourne une URL signee par JWT pour afficher le dashboard statistiques dans une iframe",
  })
  @ApiResponse({ status: 200, description: "URL d'embedding generee" })
  @ApiResponse({ status: 503, description: "Metabase non configure" })
  getEmbedUrl(@Res() res: Response): void {
    if (!this.metabaseService.isConfigured()) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: 503,
        message: "Metabase non configure sur cet environnement",
      });
      return;
    }

    const iframeUrl = this.metabaseService.generateEmbedUrl();

    // Cache 8 minutes (sous les 10 min d'expiration JWT)
    res.setHeader("Cache-Control", "public, max-age=480");

    res.status(HttpStatus.OK).json({ iframeUrl });
  }
}
