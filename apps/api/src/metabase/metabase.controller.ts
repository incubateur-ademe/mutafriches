import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";
import { MetabaseService } from "./metabase.service";

@ApiExcludeController()
@Controller("api/metabase")
export class MetabaseController {
  constructor(private readonly metabaseService: MetabaseService) {}

  @Get("embed-url")
  getEmbedUrl(@Res() res: Response): void {
    if (!this.metabaseService.isConfigured()) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: 503,
        message: "Metabase non configuré sur cet environnement",
      });
      return;
    }

    const iframeUrl = this.metabaseService.generateEmbedUrl();

    // Cache 8 minutes (sous les 10 min d'expiration JWT)
    res.setHeader("Cache-Control", "public, max-age=480");

    res.status(HttpStatus.OK).json({ iframeUrl });
  }
}
