import { Controller, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { EvenementOutputDto, ModeUtilisation } from "@mutafriches/shared-types";
import { EvenementService } from "./services/evenement.service";
import { OriginGuard } from "./guards/origin.guard";
import { EvenementInputDto } from "./dto/input/evenement.dto";

@ApiExcludeController()
@UseGuards(OriginGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
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
      modeUtilisation: iframeMode ? ModeUtilisation.IFRAME : ModeUtilisation.STANDALONE,
      integrateur: integrateur || undefined,
      userAgent,
      ref: input.ref,
    });
  }
}
