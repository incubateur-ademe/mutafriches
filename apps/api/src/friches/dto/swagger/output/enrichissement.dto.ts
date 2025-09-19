import { ApiProperty } from "@nestjs/swagger";
import {
  EnrichissementOutputDto as IEnrichissementOutput,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

/**
 * DTO Swagger pour le résultat d'enrichissement
 * Dupliqué depuis @mutafriches/shared-types pour ajouter les décorateurs Swagger
 */
export class EnrichissementSwaggerDto implements IEnrichissementOutput {
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
    description: "Coordonnées géographiques de la parcelle",
    example: { latitude: 47.4514, longitude: -0.4619 },
    required: false,
    type: Object,
  })
  coordonnees?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: "Surface totale du site en mètres carrés",
    example: 42780,
    minimum: 0,
  })
  surfaceSite: number;

  @ApiProperty({
    description: "Surface au sol occupée par les bâtiments en mètres carrés",
    required: false,
    example: 6600,
    minimum: 0,
  })
  surfaceBati?: number;

  @ApiProperty({
    description: "Site situé en centre-ville ou centre-bourg",
    example: true,
  })
  siteEnCentreVille: boolean;

  @ApiProperty({
    description: "Distance à l'entrée d'autoroute la plus proche en kilomètres",
    example: 1.5,
    minimum: 0,
  })
  distanceAutoroute: number;

  @ApiProperty({
    description: "Distance à l'arrêt de transport en commun le plus proche en mètres",
    example: 250,
    minimum: 0,
  })
  distanceTransportCommun: number;

  @ApiProperty({
    description: "Présence de commerces et services à proximité",
    example: true,
  })
  proximiteCommercesServices: boolean;

  @ApiProperty({
    description: "Site connecté au réseau électrique",
    example: true,
  })
  connectionReseauElectricite: boolean;

  @ApiProperty({
    description: "Distance au point de raccordement électrique le plus proche en kilomètres",
    example: 0.3,
    minimum: 0,
  })
  distanceRaccordementElectrique: number;

  @ApiProperty({
    description: "Taux de logements vacants dans la commune en pourcentage",
    example: 4.9,
    minimum: 0,
    maximum: 100,
  })
  tauxLogementsVacants: number;

  @ApiProperty({
    description: "Présence de risques technologiques",
    example: false,
  })
  presenceRisquesTechnologiques: boolean;

  @ApiProperty({
    description: "Niveau de risques naturels",
    required: false,
    example: RisqueNaturel.FAIBLE,
    enum: RisqueNaturel,
  })
  presenceRisquesNaturels?: string;

  @ApiProperty({
    description: "Zonage réglementaire selon le PLU/PLUi",
    required: false,
    example: "Zone urbaine - U",
  })
  zonageReglementaire?: string;

  @ApiProperty({
    description: "Type de zonage environnemental applicable",
    required: false,
    example: ZonageEnvironnemental.HORS_ZONE,
    enum: ZonageEnvironnemental,
  })
  zonageEnvironnemental?: string;

  @ApiProperty({
    description: "Type de protection patrimoniale",
    required: false,
    example: ZonagePatrimonial.NON_CONCERNE,
    enum: ZonagePatrimonial,
  })
  zonagePatrimonial?: string;

  @ApiProperty({
    description: "Position par rapport à la trame verte et bleue",
    required: false,
    example: TrameVerteEtBleue.HORS_TRAME,
    enum: TrameVerteEtBleue,
  })
  trameVerteEtBleue?: string;

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
    description: "Indice de fiabilité des données enrichies (0-10)",
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  fiabilite: number;
}
