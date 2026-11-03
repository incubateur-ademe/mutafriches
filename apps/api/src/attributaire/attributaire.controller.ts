import { BadRequestException, Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  FORMATS_TABLE_ATTRIBUTAIRE,
  sanitizeCodeInsee,
  type FormatTableAttributaire,
} from "@mutafriches/shared-types";
import { ApiStandardErrors } from "../shared/swagger";
import { AttributaireService } from "./attributaire.service";
import { versGeoJsonAttributaire, versTableAttributaire } from "./attributaire.serializer";
import { TableAttributaireSwaggerDto } from "./dto/output/table-attributaire.dto";

// La table bouge à chaque évaluation : un cache court suffit à absorber les rechargements
const CACHE_CONTROL = "public, max-age=300";

@ApiTags("Table attributaire")
@Controller("api/attributaire")
export class AttributaireController {
  constructor(private readonly attributaireService: AttributaireService) {}

  @Get("sites")
  @ApiOperation({
    summary: "Lister les sites qualifiés ou évalués d'une commune",
    description: `
    Table attributaire d'une commune : un site par ensemble de parcelles évalué dans Mutafriches
    ou inventorié par un partenaire, avec ses critères et ses indices de mutabilité.

    - Les indices sont recalculés avec la version courante de l'algorithme.
    - Les critères manuels sont ceux de la dernière évaluation du site ; sans saisie,
      \`criteresSaisis\` vaut \`null\` et la mutabilité est calculée avec « ne-sait-pas » partout.
    - La saisie est **déclarative** (\`saisieDeclarative\`) : elle n'a pas été vérifiée.
    - Un site appartient à sa commune prédominante.

    \`format=geojson\` renvoie une FeatureCollection (\`application/geo+json\`) : emprise du site
    (centroïde à défaut) et attributs à plat, les mêmes pour chaque entité (\`cle_site\`,
    \`parcelles\` séparées par \`|\`, un critère par colonne, \`indice_<usage>\` pour les 7 usages,
    \`usage_prioritaire\`, \`usages_exclus\`, \`fiabilite\`, \`saisie_declarative\`…).

    Lecture ouverte, sans en-tête \`Origin\`. Réponse cacheable 5 minutes.
    `,
  })
  @ApiQuery({
    name: "codeInsee",
    required: true,
    type: String,
    description: "Code INSEE de la commune (5 caractères, `2A`/`2B` pour la Corse).",
    example: "77305",
  })
  @ApiQuery({
    name: "format",
    required: false,
    enum: FORMATS_TABLE_ATTRIBUTAIRE,
    description: "`json` (défaut) ou `geojson`.",
  })
  @ApiProduces("application/json", "application/geo+json")
  @ApiOkResponse({
    description: "Sites de la commune, liste vide si aucun (schéma du format JSON)",
    type: TableAttributaireSwaggerDto,
  })
  @ApiStandardErrors({
    badRequestDescription: "Code INSEE absent ou invalide, ou format inconnu.",
    badRequestExample: {
      statusCode: 400,
      message: "Code INSEE invalide : 5 caractères attendus (ex. 77305, 2A004)",
      error: "Bad Request",
    },
  })
  async listerSites(
    @Res() res: Response,
    @Query("codeInsee") codeInseeBrut?: string,
    @Query("format") formatBrut?: string,
  ): Promise<void> {
    const codeInsee = sanitizeCodeInsee(codeInseeBrut?.trim().toUpperCase());
    if (!codeInsee) {
      throw new BadRequestException(
        "Code INSEE invalide : 5 caractères attendus (ex. 77305, 2A004)",
      );
    }

    const format = (formatBrut ?? "json") as FormatTableAttributaire;
    if (!FORMATS_TABLE_ATTRIBUTAIRE.includes(format)) {
      throw new BadRequestException(
        `Format inconnu : valeurs acceptées ${FORMATS_TABLE_ATTRIBUTAIRE.join(", ")}`,
      );
    }

    const resultat = await this.attributaireService.listerParCommune(codeInsee);
    const maintenant = new Date();

    res.setHeader("Cache-Control", CACHE_CONTROL);
    if (format === "geojson") {
      res.setHeader("Content-Type", "application/geo+json; charset=utf-8");
      res.status(HttpStatus.OK).send(JSON.stringify(versGeoJsonAttributaire(resultat, maintenant)));
      return;
    }
    res.status(HttpStatus.OK).json(versTableAttributaire(resultat, maintenant));
  }
}
