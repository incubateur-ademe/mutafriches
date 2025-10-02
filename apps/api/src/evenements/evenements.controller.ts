import { Controller, Post, Body, Query, Req } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request } from "express";
import { EvenementInputDto, EvenementOutputDto } from "@mutafriches/shared-types";
import { EvenementService } from "./evenement.service";

@ApiExcludeController()
@Controller("evenements")
export class EvenementsController {
  constructor(private readonly evenementService: EvenementService) {}

  @Post()
  async enregistrerEvenement(
    @Body() input: EvenementInputDto,
    @Query("iframe") isIframe?: boolean,
    @Query("integrateur") integrateur?: string,
    @Req() req?: Request,
  ): Promise<EvenementOutputDto> {
    const iframeMode = String(isIframe) === "true";
    const userAgent = req?.headers["user-agent"] as string | undefined;

    return await this.evenementService.enregistrerEvenement(input, {
      sourceUtilisation: iframeMode ? "iframe" : "standalone",
      integrateur: integrateur || undefined,
      userAgent,
    });
  }
}
