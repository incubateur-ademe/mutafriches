// apps/api/src/friches/dto/enrichment-result.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import {
  EnrichmentResultDto as IEnrichmentResultDto,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

/**
 * DTO pour le résultat de l'enrichissement automatique des données de parcelle
 * Contient uniquement les données extraites automatiquement depuis des sources externes
 */
export class EnrichmentResultDto implements IEnrichmentResultDto {
  @ApiProperty({
    description: "Identifiant cadastral unique de la parcelle",
    example: "25056000HZ0346",
  })
  identifiantParcelle: string;

  @ApiProperty({
    description: "Nom de la commune où se situe la parcelle",
    example: "Trélazé",
  })
  commune: string;

  @ApiProperty({
    description: "Surface totale du site en mètres carrés",
    example: 42780,
  })
  surfaceSite: number;

  @ApiProperty({
    description: "Surface au sol occupée par les bâtiments en mètres carrés",
    example: 6600,
    required: false,
  })
  surfaceBati?: number;

  @ApiProperty({
    description: "Site connecté au réseau électrique",
    example: true,
  })
  connectionReseauElectricite: boolean;

  @ApiProperty({
    description: "Description de l'ancienne activité du site",
    example: "Manufacture textile - Les Allumettes",
    required: false,
  })
  ancienneActivite?: string;

  @ApiProperty({
    description: "Site situé en centre-ville ou centre-bourg",
    example: true,
  })
  siteEnCentreVille: boolean;

  @ApiProperty({
    description: "Distance à l'entrée d'autoroute la plus proche en kilomètres",
    example: 1.5,
  })
  distanceAutoroute: number;

  @ApiProperty({
    description: "Distance à l'arrêt de transport en commun le plus proche en mètres",
    example: 250,
  })
  distanceTransportCommun: number;

  @ApiProperty({
    description: "Présence de commerces et services à proximité",
    example: true,
  })
  proximiteCommercesServices: boolean;

  @ApiProperty({
    description: "Distance au point de raccordement électrique le plus proche en kilomètres",
    example: 0.3,
  })
  distanceRaccordementElectrique: number;

  @ApiProperty({
    description: "Taux de logements vacants dans la commune en pourcentage",
    example: 4.9,
  })
  tauxLogementsVacants: number;

  @ApiProperty({
    description: "Présence de risques technologiques",
    example: false,
  })
  presenceRisquesTechnologiques: boolean;

  @ApiProperty({
    description: "Niveau de risques naturels",
    enum: RisqueNaturel,
    example: RisqueNaturel.FAIBLE,
    required: false,
  })
  presenceRisquesNaturels?: string;

  @ApiProperty({
    description: "Type de zonage environnemental applicable",
    enum: ZonageEnvironnemental,
    example: ZonageEnvironnemental.HORS_ZONE,
    required: false,
  })
  zonageEnvironnemental?: string;

  @ApiProperty({
    description: "Zonage réglementaire selon le PLU/PLUi",
    example: "Zone urbaine - U",
    required: false,
  })
  zonageReglementaire?: string;

  @ApiProperty({
    description: "Type de protection patrimoniale",
    enum: ZonagePatrimonial,
    example: ZonagePatrimonial.NON_CONCERNE,
    required: false,
  })
  zonagePatrimonial?: string;

  @ApiProperty({
    description: "Position par rapport à la trame verte et bleue",
    enum: TrameVerteEtBleue,
    example: TrameVerteEtBleue.HORS_TRAME,
    required: false,
  })
  trameVerteEtBleue?: string;

  @ApiProperty({
    description: "Coordonnées géographiques de la parcelle",
    example: { latitude: 47.4514, longitude: -0.4619 },
    required: false,
  })
  coordonnees?: { latitude: number; longitude: number };

  @ApiProperty({
    description: "Liste des sources de données utilisées pour l'enrichissement",
    type: [String],
    example: ["DVF", "Cadastre", "SIRENE", "Base ICPE", "INPN"],
  })
  sourcesUtilisees: string[];

  @ApiProperty({
    description: "Liste des champs qui n'ont pas pu être enrichis automatiquement",
    type: [String],
    example: ["presencePollution", "valeurArchitecturaleHistorique"],
  })
  champsManquants: string[];

  @ApiProperty({
    description: "Indice de fiabilité des données enrichies sur une échelle de 0 à 10",
    type: "number",
    minimum: 0,
    maximum: 10,
    example: 8.5,
  })
  fiabilite: number;
}
