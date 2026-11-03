import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AVERTISSEMENT_SAISIE_DECLARATIVE,
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  UsageType,
  type CriteresSaisis,
  type MutabiliteAttributaire,
  type SiteAttributaireDto,
  type TableAttributaireOutputDto,
} from "@mutafriches/shared-types";

// Classes dupliquées depuis @mutafriches/shared-types pour porter les décorateurs Swagger

export class MutabiliteAttributaireSwaggerDto implements MutabiliteAttributaire {
  @ApiProperty({
    description:
      "Indice de mutabilité (0-100) par usage, recalculé avec la version courante de l'algorithme.",
    type: "object",
    properties: Object.fromEntries(
      Object.values(UsageType).map((usage) => [usage, { type: "number" }]),
    ),
    example: {
      residentiel: 72.3,
      equipements: 68,
      culture: 67.8,
      tertiaire: 66.2,
      renaturation: 55.9,
      industrie: 47,
      photovoltaique: 42.3,
    },
  })
  indices: Partial<Record<UsageType, number>>;

  @ApiPropertyOptional({
    description: "Premier usage du classement ; un usage exclu n'y figure que si tous le sont.",
    enum: UsageType,
    example: UsageType.RESIDENTIEL,
  })
  usagePrioritaire?: UsageType;

  @ApiProperty({
    description:
      "Usages rendus impossibles par une règle d'exclusion : leur indice reste calculé mais n'est pas comparable.",
    enum: UsageType,
    isArray: true,
    example: [],
  })
  usagesExclus: UsageType[];

  @ApiProperty({
    description: "Fiabilité du calcul : note sur 10 et niveau.",
    example: { note: 9, niveau: "Très fiable" },
  })
  fiabilite: { note: number; niveau: string };
}

export class SiteAttributaireSwaggerDto implements SiteAttributaireDto {
  @ApiProperty({
    description:
      "Identifiant du site : parcelles normalisées, triées et jointes par des virgules. Deux ensembles qui se recoupent sont deux sites.",
    example: "77305000AV0499,77305000AV0500",
  })
  cleSite: string;

  @ApiProperty({ type: [String], example: ["77305000AV0499", "77305000AV0500"] })
  parcelles: string[];

  @ApiProperty({ example: 2 })
  nombreParcelles: number;

  @ApiPropertyOptional({
    description: "Plus grande parcelle du site, qui porte les zonages et les risques.",
    example: "77305000AV0500",
  })
  parcellePredominante?: string;

  @ApiProperty({
    description: "Commune prédominante : un site à cheval n'apparaît que dans une commune.",
    example: "77305",
  })
  codeInsee: string;

  @ApiPropertyOptional({ example: "Montereau-Fault-Yonne" })
  commune?: string;

  @ApiPropertyOptional({
    description: "Nom du site, pour un site d'inventaire partenaire.",
    example: "Ex-bâtiment ORANGE",
  })
  nom?: string;

  @ApiPropertyOptional({
    description: "Slug du partenaire dont l'inventaire contient ce site.",
    example: "scet",
  })
  partenaire?: string;

  @ApiPropertyOptional({
    description: "Centroïde du site (WGS84).",
    example: { latitude: 48.3895, longitude: 2.9555 },
  })
  centroide?: { latitude: number; longitude: number };

  @ApiProperty({
    description:
      "Critères enrichis automatiquement, avec les clés et valeurs de `POST /enrichissement` (distances en mètres), plus `raccordementEau` déduit de la surface bâtie. Un critère absent était indisponible ; `null` signifie que la recherche n'a rien trouvé.",
    type: "object",
    additionalProperties: true,
    example: {
      surfaceSite: 3415,
      surfaceBati: 2512,
      siteEnCentreVille: true,
      distanceTransportCommun: 128,
      zonageReglementaire: "zone-urbaine-u-habitat",
      zonageAbcLogement: null,
      raccordementEau: "oui",
    },
  })
  criteresAutomatiques: Record<string, unknown>;

  @ApiProperty({ description: "Date de l'enrichissement retenu (ISO 8601)." })
  dateEnrichissement: string;

  @ApiProperty({
    description:
      "Vrai quand `criteresSaisis` vient d'une saisie utilisateur. Cette saisie n'est pas vérifiée.",
    example: true,
  })
  saisieDeclarative: boolean;

  @ApiProperty({
    description:
      "Les 9 critères manuels de la dernière évaluation de ce site, ou `null` s'il n'a jamais été qualifié : la mutabilité est alors calculée avec « ne-sait-pas » partout.",
    type: "object",
    nullable: true,
    properties: Object.fromEntries(
      CHAMPS_COMPLEMENTAIRES_REQUIS.map((champ) => [champ, { type: "string" }]),
    ),
    example: {
      typeProprietaire: "prive",
      etatBatiInfrastructure: "degradation-inexistante",
      presencePollution: "non",
      valeurArchitecturaleHistorique: "sans-interet",
      qualitePaysage: "ordinaire",
      qualiteVoieDesserte: "peu-accessible",
      trameVerteEtBleue: "hors-trame",
      presenceEspecesProtegees: "non",
      presenceZoneHumide: "non",
    },
  })
  criteresSaisis: CriteresSaisis | null;

  @ApiPropertyOptional({ description: "Date de la saisie retenue (ISO 8601)." })
  dateSaisie?: string;

  @ApiProperty({
    description:
      "Évaluations enregistrées pour ce même ensemble de parcelles, hors réutilisations du cache et démonstrations.",
    example: 2,
  })
  nombreEvaluations: number;

  @ApiProperty({ type: MutabiliteAttributaireSwaggerDto })
  mutabilite: MutabiliteAttributaire;

  @ApiProperty({
    description: "Version de l'algorithme qui a produit les indices.",
    example: "v1.19",
  })
  versionAlgorithme: string;

  @ApiProperty({ description: "Dernier recalcul de la ligne (ISO 8601)." })
  dateMiseAJour: string;
}

export class TableAttributaireSwaggerDto implements TableAttributaireOutputDto {
  @ApiProperty({ example: "77305" })
  codeInsee: string;

  @ApiPropertyOptional({ example: "Montereau-Fault-Yonne" })
  commune?: string;

  @ApiProperty({ description: "Date de la réponse (ISO 8601)." })
  dateGeneration: string;

  @ApiProperty({ example: AVERTISSEMENT_SAISIE_DECLARATIVE })
  avertissement: string;

  @ApiProperty({ example: 27 })
  nombreSites: number;

  @ApiProperty({ type: [SiteAttributaireSwaggerDto] })
  sites: SiteAttributaireDto[];
}
