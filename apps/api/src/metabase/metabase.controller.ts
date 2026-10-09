import { BadRequestException, Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";
import { isVueStatistiques, type VueStatistiques } from "@mutafriches/shared-types";
import { MetabaseService } from "./metabase.service";

@ApiExcludeController()
@Controller("api/metabase")
export class MetabaseController {
  constructor(private readonly metabaseService: MetabaseService) {}

  @Get("embed-url")
  getEmbedUrl(@Query("vue") vueParam: string | undefined, @Res() res: Response): void {
    const vue: VueStatistiques = vueParam === undefined ? "usage" : this.validerVue(vueParam);

    if (!this.metabaseService.isConfigured()) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: 503,
        message: "Metabase non configuré sur cet environnement",
      });
      return;
    }

    const iframeUrl = this.metabaseService.generateEmbedUrl(vue);

    // Cache 8 minutes (sous les 10 min d'expiration JWT)
    res.setHeader("Cache-Control", "public, max-age=480");

    res.status(HttpStatus.OK).json({ iframeUrl });
  }

  private validerVue(vue: string): VueStatistiques {
    if (!isVueStatistiques(vue)) {
      throw new BadRequestException("Vue statistiques invalide");
    }
    return vue;
  }
}
