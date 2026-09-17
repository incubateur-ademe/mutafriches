import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiProduces, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type {
  AjouterSitePartenaireOutputDto,
  PartenaireOutputDto,
  PartenaireSiteOutputDto,
} from "@mutafriches/shared-types";
import { IntegrateurOriginGuard } from "../shared/guards";
import { ParseSlugPipe } from "../shared/pipes";
import { PartenairesService } from "./partenaires.service";
import { CnigExportService } from "./export/cnig-export.service";
import { RenommerSiteDto } from "./dto/input/renommer-site.dto";
import { AjouterSiteDto } from "./dto/input/ajouter-site.dto";
import { ExportCnigDto } from "./dto/input/export-cnig.dto";

@ApiTags("Partenaires")
@Controller("api/partenaires")
export class PartenairesController {
  constructor(
    private readonly partenairesService: PartenairesService,
    private readonly cnigExportService: CnigExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Liste tous les partenaires et leurs sites" })
  async listPartenaires(): Promise<PartenaireOutputDto[]> {
    return this.partenairesService.listPartenaires();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Récupère un partenaire et ses sites" })
  @ApiParam({ name: "slug", example: "aura" })
  async getPartenaire(@Param("slug", ParseSlugPipe) slug: string): Promise<PartenaireOutputDto> {
    return this.partenairesService.getPartenaire(slug);
  }

  @Post(":slug/sites")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "Ajoute un site (enrichit, dérive le nom par défaut, persiste)" })
  @ApiParam({ name: "slug", example: "aura" })
  async ajouterSite(
    @Param("slug", ParseSlugPipe) slug: string,
    @Body() body: AjouterSiteDto,
  ): Promise<AjouterSitePartenaireOutputDto> {
    return this.partenairesService.ajouterSite(slug, body.parcelles);
  }

  @Post(":slug/export")
  @HttpCode(HttpStatus.OK)
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({
    summary: "Exporte tous les sites d'un partenaire au standard CNIG Friches",
    description: `
    Produit un fichier unique (CSV conforme au TableSchema CNIG, ou GeoJSON) décrivant tous
    les sites du partenaire.

    La connaissance terrain saisie par l'utilisateur vit dans son navigateur : elle est
    transmise dans le corps de la requête, utilisée le temps de construire le fichier, et
    n'est pas persistée.

    Un site dont la commune ou le centroïde est inconnu est écarté : le standard les rend
    obligatoires. Le détail des sites écartés est renvoyé dans l'en-tête \`X-Export-Rapport\`
    (JSON encodé en base64, pour rester compatible avec l'encodage des en-têtes HTTP).
    `,
  })
  @ApiParam({ name: "slug", example: "cci-92" })
  @ApiProduces("text/csv", "application/geo+json")
  async exporterCnig(
    @Param("slug", ParseSlugPipe) slug: string,
    @Body() body: ExportCnigDto,
    @Res() res: Response,
  ): Promise<void> {
    const fichier = await this.cnigExportService.exporter(slug, body);

    res.setHeader("Content-Type", fichier.typeMime);
    res.setHeader("Content-Disposition", `attachment; filename="${fichier.nomFichier}"`);
    res.setHeader(
      "X-Export-Rapport",
      Buffer.from(JSON.stringify(fichier.rapport), "utf-8").toString("base64"),
    );
    // Sans cette exposition, le navigateur masque les deux en-têtes au code appelant dès que
    // l'UI et l'API ne partagent pas la même origine (développement, intégrateurs).
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Export-Rapport");
    res.status(HttpStatus.OK).send(fichier.contenu);
  }

  @Patch(":slug/sites/:id")
  @UseGuards(IntegrateurOriginGuard)
  @ApiOperation({ summary: "Renomme un site (dernier nom à jour fait foi)" })
  @ApiParam({ name: "slug", example: "aura" })
  @ApiParam({ name: "id", example: "f267a350-84ab-45e4-a289-79a6a122237b" })
  async renommerSite(
    @Param("slug", ParseSlugPipe) slug: string,
    @Param("id") id: string,
    @Body() body: RenommerSiteDto,
  ): Promise<PartenaireSiteOutputDto> {
    return this.partenairesService.renommerSite(slug, id, body.nom);
  }
}
