import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type {
  AjouterSitePartenaireOutputDto,
  PartenaireOutputDto,
  PartenaireSiteOutputDto,
} from "@mutafriches/shared-types";
import { IntegrateurOriginGuard } from "../shared/guards";
import { PartenairesService } from "./partenaires.service";
import { RenommerSiteDto } from "./dto/input/renommer-site.dto";
import { AjouterSiteDto } from "./dto/input/ajouter-site.dto";

@ApiTags("Partenaires")
@Controller("api/partenaires")
export class PartenairesController {
  constructor(private readonly partenairesService: PartenairesService) {}

  @Get()
  @ApiOperation({ summary: "Liste tous les partenaires et leurs sites" })
  async listPartenaires(): Promise<PartenaireOutputDto[]> {
    return this.partenairesService.listPartenaires();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Récupère un partenaire et ses sites" })
  @ApiParam({ name: "slug", example: "aura" })
  async getPartenaire(@Param("slug") slug: string): Promise<PartenaireOutputDto> {
    return this.partenairesService.getPartenaire(slug);
  }

  @Post(":slug/sites")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "Ajoute un site (enrichit, dérive le nom par défaut, persiste)" })
  @ApiParam({ name: "slug", example: "aura" })
  async ajouterSite(
    @Param("slug") slug: string,
    @Body() body: AjouterSiteDto,
  ): Promise<AjouterSitePartenaireOutputDto> {
    return this.partenairesService.ajouterSite(slug, body.parcelles);
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
