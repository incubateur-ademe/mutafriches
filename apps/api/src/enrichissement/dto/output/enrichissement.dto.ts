import { ApiProperty } from "@nestjs/swagger";
import {
  EnrichissementOutputDto as IEnrichissementOutput,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageReglementaire,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZoneAccelerationEnr,
  TrameVerteEtBleue,
  Coordonnees,
  GeometrieParcelle,
  GeometrieParcelleIdentifiee,
  ZaerEnrichissement,
  DistanceIte,
  ZonageAbcLogement,
  IlotChaleurUrbain,
} from "@mutafriches/shared-types";

/**
 * DTO Swagger pour le résultat d'enrichissement
 */
export class EnrichissementSwaggerDto implements IEnrichissementOutput {
  @ApiProperty({
    description: "Identifiant cadastral unique de la parcelle",
    example: "25056000HZ0346",
  })
  identifiantParcelle: string;

  @ApiProperty({
    description: "Code INSEE de la commune où se situe la parcelle (5 caractères).",
    example: "25056",
  })
  codeInsee: string;

  @ApiProperty({
    description: "Nom de la commune où se situe la parcelle.",
    example: "Besançon",
  })
  commune: string;

  @ApiProperty({
    description: "Coordonnées GPS du point d'entrée de la parcelle",
    example: { latitude: 47.4514, longitude: -0.4619 },
    required: false,
    type: Object,
  })
  coordonnees?: Coordonnees;

  @ApiProperty({
    description: "Géométrie complète de la parcelle (polygone GeoJSON)",
    required: false,
    type: Object,
    example: {
      type: "Polygon",
      coordinates: [
        [
          [2.3609, 48.855],
          [2.3619, 48.855],
          [2.3619, 48.8554],
          [2.3609, 48.8554],
          [2.3609, 48.855],
        ],
      ],
    },
  })
  geometrie?: GeometrieParcelle;

  @ApiProperty({
    description: "Liste des identifiants cadastraux (présent en mode multi-parcelle)",
    required: false,
    type: [String],
    example: ["25056000HZ0346", "25056000HZ0347"],
  })
  identifiantsParcelles?: string[];

  @ApiProperty({
    description: "Nombre de parcelles du site (présent en mode multi-parcelle)",
    required: false,
    example: 2,
  })
  nombreParcelles?: number;

  @ApiProperty({
    description: "Identifiant de la parcelle prédominante (plus grande surface)",
    required: false,
    example: "25056000HZ0346",
  })
  parcellePredominante?: string;

  @ApiProperty({
    description: "Nom de la commune prédominante (plus grande surface cumulée)",
    required: false,
    example: "Besançon",
  })
  communePredominante?: string;

  @ApiProperty({
    description: "Géométrie union du site (polygone agrégé de toutes les parcelles)",
    required: false,
    type: Object,
  })
  geometrieSite?: GeometrieParcelle;

  @ApiProperty({
    description:
      "Géométrie de chaque parcelle trouvée au cadastre (présent en mode multi-parcelle)",
    required: false,
    type: Object,
    isArray: true,
  })
  geometriesParcelles?: GeometrieParcelleIdentifiee[];

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
    description:
      "Distance par la route (m) jusqu'à l'entrée d'autoroute ou de voie express la plus proche. " +
      "null = aucun accès dans un rayon de 50 km",
    example: 1500,
    minimum: 0,
    nullable: true,
  })
  distanceAutoroute: number | null;

  @ApiProperty({
    description:
      "Distance à l'arrêt de transport en commun le plus proche en mètres. null si aucun arrêt trouvé dans le rayon de recherche (2km)",
    example: 250,
    minimum: 0,
    nullable: true,
  })
  distanceTransportCommun: number | null;

  @ApiProperty({
    description: "Présence de commerces et services à proximité",
    example: true,
  })
  proximiteCommercesServices: boolean;

  @ApiProperty({
    description:
      "Distance à l'installation terminale embranchée fret (ITE) la plus proche, en catégorie. Absent si le référentiel est indisponible",
    required: false,
    example: DistanceIte.PLUS_1KM,
    enum: DistanceIte,
  })
  distanceIte?: DistanceIte;

  @ApiProperty({
    description:
      "Distance réelle en mètres à l'ITE fret la plus proche. Absent si aucune ITE dans le rayon de recherche",
    required: false,
    example: 2350,
    minimum: 0,
  })
  distanceIteMetres?: number;

  @ApiProperty({
    description:
      "Distance au point de raccordement électrique le plus proche en mètres. null si aucune infrastructure trouvée dans les rayons de recherche (5 km postes, 500 m lignes BT)",
    example: 300,
    minimum: 0,
    nullable: true,
  })
  distanceRaccordementElectrique: number | null;

  @ApiProperty({
    description:
      "Distance au réseau de chaleur urbain le plus proche en mètres. null si aucune distance exploitable (aucun réseau à proximité, ou réseau connu dont le tracé est indisponible)",
    required: false,
    example: 320,
    minimum: 0,
    nullable: true,
  })
  distanceReseauChaleur?: number | null;

  @ApiProperty({
    description: "Taux de logements vacants dans la commune en pourcentage",
    example: 4.9,
    minimum: 0,
    maximum: 100,
  })
  tauxLogementsVacants: number;

  @ApiProperty({
    description:
      "Zonage ABC de la commune (tension du marché du logement). null = commune absente du référentiel",
    required: false,
    example: ZonageAbcLogement.B1,
    enum: ZonageAbcLogement,
    nullable: true,
  })
  zonageAbcLogement?: ZonageAbcLogement | null;

  @ApiProperty({
    description: "Présence de risques technologiques",
    example: false,
  })
  presenceRisquesTechnologiques: boolean;

  @ApiProperty({
    description: "Risque retrait gonflement argile (RGA)",
    required: false,
    example: RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
    enum: RisqueRetraitGonflementArgile,
  })
  risqueRetraitGonflementArgile?: RisqueRetraitGonflementArgile;

  @ApiProperty({
    description: "Risque cavités souterraines",
    required: false,
    example: RisqueCavitesSouterraines.NON,
    enum: RisqueCavitesSouterraines,
  })
  risqueCavitesSouterraines?: RisqueCavitesSouterraines;

  @ApiProperty({
    description: "Risque inondation (TRI/AZI/PAPI/PPR)",
    required: false,
    example: RisqueInondation.NON,
    enum: RisqueInondation,
  })
  risqueInondation?: RisqueInondation;

  @ApiProperty({
    description: "Zonage réglementaire selon le PLU/PLUi",
    required: false,
    example: ZonageReglementaire.ZONE_URBAINE_U,
    enum: ZonageReglementaire,
  })
  zonageReglementaire?: ZonageReglementaire;

  @ApiProperty({
    description: "Type de zonage environnemental applicable",
    required: false,
    example: ZonageEnvironnemental.HORS_ZONE,
    enum: ZonageEnvironnemental,
  })
  zonageEnvironnemental?: ZonageEnvironnemental;

  @ApiProperty({
    description: "Type de protection patrimoniale",
    required: false,
    example: ZonagePatrimonial.NON_CONCERNE,
    enum: ZonagePatrimonial,
  })
  zonagePatrimonial?: ZonagePatrimonial;

  @ApiProperty({
    description:
      "Site situé dans un quartier prioritaire de la politique de la ville (QPV). false = recherche spatiale effectuée, site hors de tout périmètre",
    required: false,
    example: false,
  })
  siteEnQpv?: boolean;

  @ApiProperty({
    description:
      "Site situé dans une zone où le réseau électrique est saturé pour raccorder de nouveaux projets EnR (carte Enedis/RTE). Absent hors périmètre Enedis",
    required: false,
    example: false,
  })
  saturationReseauEnr?: boolean;

  @ApiProperty({
    description:
      "Site situé dans une zone d'activité économique (Cerema, Fusac). false = recherche spatiale effectuée, site hors de toute zone",
    required: false,
    example: false,
  })
  siteEnZae?: boolean;

  @ApiProperty({
    description:
      "Site situé dans un îlot de chaleur urbain (CSTB). Donnée informative, hors algorithme. non-couvert = commune hors périmètre d'étude",
    required: false,
    example: IlotChaleurUrbain.NON_COUVERT,
    enum: IlotChaleurUrbain,
  })
  ilotChaleurUrbain?: IlotChaleurUrbain;

  @ApiProperty({
    description:
      "Intensité maximale de l'îlot de chaleur urbain en °C (informatif). null = site hors périmètre d'étude",
    required: false,
    example: null,
    nullable: true,
  })
  intensiteIlotChaleurC?: number | null;

  @ApiProperty({
    description: "Position par rapport à la trame verte et bleue",
    required: false,
    example: TrameVerteEtBleue.HORS_TRAME,
    enum: TrameVerteEtBleue,
  })
  trameVerteEtBleue?: TrameVerteEtBleue;

  @ApiProperty({
    description: "Zone d'accélération des énergies renouvelables",
    required: false,
    example: ZoneAccelerationEnr.NON,
    enum: ZoneAccelerationEnr,
  })
  zoneAccelerationEnr?: ZoneAccelerationEnr;

  @ApiProperty({
    description: "Liste des sources de données utilisées pour l'enrichissement",
    type: [String],
    example: ["Cadastre", "BDNB-SurfaceBatie", "Enedis-Raccordement", "Lovac", "QPV-ANCT"],
  })
  sourcesUtilisees: string[];

  @ApiProperty({
    description: "Liste des champs du site qui n'ont pas pu être enrichis automatiquement",
    type: [String],
    example: ["surfaceBati"],
  })
  champsManquants: string[];

  @ApiProperty({
    description: "Liste des sources de données qui ont échoué lors de l'enrichissement",
    type: [String],
    example: ["BDNB-SurfaceBatie"],
  })
  sourcesEchouees: string[];

  @ApiProperty({
    description: "Zones d'Accélération des Énergies Renouvelables (ZAER)",
    required: false,
    type: Object,
    example: {
      enZoneZaer: true,
      enZoneExclusion: false,
      nombreZones: 2,
      filieres: ["SOLAIRE_PV", "EOLIEN"],
      zones: [
        { nom: "Zone solaire sud", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
        { nom: "Zone éolien nord", filiere: "EOLIEN", detailFiliere: null },
      ],
    },
  })
  zaer?: ZaerEnrichissement;

  /** @deprecated Données brutes Géorisques, sera supprimé dans une version future */
  @ApiProperty({
    description: "Données brutes Géorisques (deprecated, sera supprimé)",
    required: false,
    deprecated: true,
  })
  risquesGeorisques?: any;

  @ApiProperty({
    description: "Indique si le site présente des risques de pollution",
    example: false,
  })
  siteReferencePollue: boolean;
}
