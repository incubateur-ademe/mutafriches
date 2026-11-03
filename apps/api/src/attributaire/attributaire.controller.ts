import { BadRequestException, Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  AVERTISSEMENT_SAISIE_DECLARATIVE,
  FORMATS_TABLE_ATTRIBUTAIRE,
  sanitizeCodeInsee,
  type FormatTableAttributaire,
} from "@mutafriches/shared-types";
import { ApiStandardErrors } from "../shared/swagger";
import { AttributaireService } from "./attributaire.service";
import { versGeoJsonAttributaire, versTableAttributaire } from "./attributaire.serializer";

// La table bouge à chaque évaluation : un cache court suffit à absorber les rechargements
const CACHE_CONTROL = "public, max-age=300";

const EXEMPLE_REPONSE = {
  codeInsee: "77305",
  commune: "Montereau-Fault-Yonne",
  dateGeneration: "2026-11-03T10:00:00.000Z",
  avertissement: AVERTISSEMENT_SAISIE_DECLARATIVE,
  nombreSites: 1,
  sites: [
    {
      cleSite: "77305000AN0114,77305000AN0446,77305000AN0447",
      parcelles: ["77305000AN0114", "77305000AN0446", "77305000AN0447"],
      nombreParcelles: 3,
      parcellePredominante: "77305000AN0114",
      codeInsee: "77305",
      commune: "Montereau-Fault-Yonne",
      centroide: { latitude: 48.3836, longitude: 2.9575 },
      criteresAutomatiques: { surfaceSite: 12450, surfaceBati: 3200, siteEnCentreVille: true },
      dateEnrichissement: "2026-09-17T08:12:00.000Z",
      saisieDeclarative: true,
      criteresSaisis: { typeProprietaire: "public", presencePollution: "ne-sait-pas" },
      dateSaisie: "2026-09-17T08:15:00.000Z",
      nombreEvaluations: 2,
      mutabilite: {
        indices: { residentiel: 68.2, tertiaire: 61.4 },
        usagePrioritaire: "residentiel",
        usagesExclus: [],
        fiabilite: { note: 9, niveau: "Très fiable" },
      },
      versionAlgorithme: "v1.19",
      dateMiseAJour: "2026-11-03T09:58:00.000Z",
    },
  ],
};

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

    Les indices sont recalculés avec la version courante de l'algorithme. Les critères manuels
    sont ceux de la dernière évaluation du site ; sans saisie, ils valent « ne-sait-pas ».
    La saisie est **déclarative** (\`saisieDeclarative\`) : elle n'a pas été vérifiée.

    Un site appartient à sa commune prédominante. \`format=geojson\` renvoie une
    FeatureCollection aux attributs à plat, chargeable telle quelle dans un SIG.
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
    description: "Sites de la commune (liste vide si aucun)",
    schema: { example: EXEMPLE_REPONSE },
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
