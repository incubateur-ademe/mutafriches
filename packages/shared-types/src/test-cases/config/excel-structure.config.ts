import * as enumMappings from "./excel-to-enum-values.config";

// Structure et mapping des champs du fichier Excel
export interface ExcelStructure {
  sheet: string;
  nameColumn: string;
  valueColumn: string;
  inputStartRow: number;
  inputEndRow: number;
  resultRow: number;
  rankingRow: number;
  usagesColumns: {
    residentiel: string;
    equipements: string;
    culture: string;
    tertiaire: string;
    industrie: string;
    renaturation: string;
    photovoltaique: string;
    ponderation: string;
  };
}

export interface FieldMapping {
  excelName: string;
  jsonField: string;
  type: "string" | "number" | "boolean";
  transform?: Record<string, string>;
}

// Structure du fichier Excel
export const EXCEL_STRUCTURE: ExcelStructure = {
  sheet: "Outil", // Nom de l'onglet
  nameColumn: "B", // Colonne contenant les noms de champs
  valueColumn: "C", // Colonne contenant les valeurs
  inputStartRow: 12, // Ligne de début des inputs
  inputEndRow: 37, // Ligne de fin des inputs
  resultRow: 41, // Ligne des résultats de mutabilité
  rankingRow: 42, // Ligne des classements
  usagesColumns: {
    residentiel: "F",
    equipements: "G",
    culture: "H",
    tertiaire: "I",
    industrie: "J",
    renaturation: "K",
    photovoltaique: "L",
    ponderation: "M",
  },
};

// Mapping des champs Excel vers les champs JSON
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Champs informatifs (optionnels)
  {
    excelName: "Nom du site (pour info)",
    jsonField: "nomSite",
    type: "string",
  },
  {
    excelName: "Identifiants parcellaires (pour info)",
    jsonField: "identifiantsParcellaires",
    type: "string",
  },
  {
    excelName: "Nom du propriétaire (pour info)",
    jsonField: "nomProprietaire",
    type: "string",
  },
  {
    excelName: "Commune (pour info)",
    jsonField: "commune",
    type: "string",
  },
  {
    excelName: "Nombre de bâtiments (pour info)",
    jsonField: "nombreBatiments",
    type: "number",
  },

  // Propriété et surfaces (2 champs)
  {
    excelName: "Surface de la parcelle (m²)",
    jsonField: "surfaceSite",
    type: "number",
  },
  {
    excelName: "Emprise au sol du bâti (m²)",
    jsonField: "surfaceBati",
    type: "number",
  },

  // Localisation et accessibilité
  {
    excelName: "En centre-ville ou centre-bourg",
    jsonField: "siteEnCentreVille",
    type: "boolean",
  },
  {
    excelName: "Distance d'une entrée d'autoroute (km)",
    jsonField: "distanceAutoroute",
    type: "string",
    transform: enumMappings.DISTANCE_AUTOROUTE_MAPPING,
  },
  {
    excelName: "Distance d'une gare/arrêt de transport en commun (m)",
    jsonField: "distanceTransportCommun",
    type: "string",
    transform: enumMappings.DISTANCE_TRANSPORT_MAPPING,
  },
  {
    excelName: "Commerces / services à proximité",
    jsonField: "proximiteCommercesServices",
    type: "boolean",
  },
  {
    excelName: "Distance d'un point de raccordement BT/HT (km)",
    jsonField: "distanceRaccordementElectrique",
    type: "string",
    transform: enumMappings.DISTANCE_ELECTRIQUE_MAPPING,
  },
  {
    excelName: "Taux de logements vacants (%)",
    jsonField: "tauxLogementsVacants",
    type: "number",
  },

  // Zonages et contraintes
  {
    excelName: "Risque naturel (innondations et/ou argiles)",
    jsonField: "presenceRisquesNaturels",
    type: "string",
    transform: enumMappings.RISQUE_NATUREL_MAPPING,
  },
  {
    excelName: "Risque technologique",
    jsonField: "presenceRisquesTechnologiques",
    type: "boolean",
  },
  {
    excelName: "Zonage environnemental",
    jsonField: "zonageEnvironnemental",
    type: "string",
    transform: enumMappings.ZONAGE_ENVIRONNEMENTAL_MAPPING,
  },
  {
    excelName: "Zonage du PLU(I) ou de la carte communale",
    jsonField: "zonageReglementaire",
    type: "string",
    transform: enumMappings.ZONAGE_REGLEMENTAIRE_MAPPING,
  },
  {
    excelName: "Monument historique",
    jsonField: "zonagePatrimonial",
    type: "string",
    transform: enumMappings.ZONAGE_PATRIMONIAL_MAPPING,
  },
  {
    excelName: "Trame verte et bleu",
    jsonField: "trameVerteEtBleu",
    type: "string",
    transform: enumMappings.TRAME_VERTE_BLEUE_MAPPING,
  },

  // Propriétaire et état
  {
    excelName: "Propriétaire",
    jsonField: "typeProprietaire",
    type: "string",
    transform: enumMappings.TYPE_PROPRIETAIRE_MAPPING,
  },
  {
    excelName: "Terrain viabilisé",
    jsonField: "terrainViabilise",
    type: "boolean",
  },
  {
    excelName: "État du bâti et infrastructure",
    jsonField: "etatBatiInfrastructure",
    type: "string",
    transform: enumMappings.ETAT_BATI_MAPPING,
  },
  {
    excelName: "Présence de pollution",
    jsonField: "presencePollution",
    type: "string",
    transform: enumMappings.PRESENCE_POLLUTION_MAPPING,
  },

  // Qualités paysagères et architecturales
  {
    excelName: "Valeur architecturale et/ou histoire sociale",
    jsonField: "valeurArchitecturaleHistorique",
    type: "string",
    transform: enumMappings.VALEUR_ARCHITECTURALE_MAPPING,
  },
  {
    excelName: "Paysage",
    jsonField: "qualitePaysage",
    type: "string",
    transform: enumMappings.QUALITE_PAYSAGE_MAPPING,
  },
  {
    excelName: "Qualité de la voie de desserte",
    jsonField: "qualiteVoieDesserte",
    type: "string",
    transform: enumMappings.QUALITE_VOIE_DESSERTE_MAPPING,
  },
];

// Mapping des noms d'usages
export const USAGE_MAPPING: Record<string, string> = {
  residentiel: "residentiel",
  equipements: "equipements",
  culture: "culture",
  tertiaire: "tertiaire",
  industrie: "industrie",
  renaturation: "renaturation",
  photovoltaique: "photovoltaique",
};

// Helper pour obtenir le mapping par nom Excel
export function getFieldByExcelName(excelName: string): FieldMapping | undefined {
  return FIELD_MAPPINGS.find((f) => f.excelName === excelName);
}

// Helper pour obtenir le mapping par nom JSON
export function getFieldByJsonName(jsonName: string): FieldMapping | undefined {
  return FIELD_MAPPINGS.find((f) => f.jsonField === jsonName);
}
