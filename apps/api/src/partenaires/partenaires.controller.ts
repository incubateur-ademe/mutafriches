import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { PartenaireOutputDto, PartenaireSiteOutputDto } from "@mutafriches/shared-types";
import { IntegrateurOriginGuard } from "../shared/guards";
import { PartenairesService } from "./partenaires.service";
import { RenommerSiteDto } from "./dto/input/renommer-site.dto";

@ApiTags("Partenaires")
@Controller("api/partenaires")
export class PartenairesController {
  constructor(private readonly partenairesService: PartenairesService) {}

  @Get(":slug")
  @ApiOperation({ summary: "Récupère un partenaire et ses sites" })
  @ApiParam({ name: "slug", example: "aura" })
  async getPartenaire(@Param("slug") slug: string): Promise<PartenaireOutputDto> {
    return this.partenairesService.getPartenaire(slug);
  }

  @Patch(":slug/sites/:id")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "Renomme un site (dernier nom à jour fait foi)" })
  @ApiParam({ name: "slug", example: "aura" })
  @ApiParam({ name: "id", example: "f267a350-84ab-45e4-a289-79a6a122237b" })
  async renommerSite(
    @Param("slug") slug: string,
    @Param("id") id: string,
    @Body() body: RenommerSiteDto,
  ): Promise<PartenaireSiteOutputDto> {
    return this.partenairesService.renommerSite(slug, id, body.nom);
  }
}
