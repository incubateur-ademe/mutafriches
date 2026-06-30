import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { PartenaireOutputDto } from "@mutafriches/shared-types";
import { PartenairesService } from "./partenaires.service";

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
}
