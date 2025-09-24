// packages/shared-types/src/test-cases/config/excel-mapping.config.ts

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
    transform: {
      "Moins de 1km": "moins-de-1km",
      "Entre 1 et 2km": "entre-1-et-2km",
      "Entre 2 et 5km": "entre-2-et-5km",
      "Plus de 5km": "plus-de-5km",
    },
  },
  {
    excelName: "Distance d'une gare/arrêt de transport en commun (m)",
    jsonField: "distanceTransportCommun",
    type: "string",
    transform: {
      "Moins de 500m": "moins-de-500m",
      "Plus de 500m": "plus-de-500m",
    },
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
    transform: {
      "Moins de 1km": "moins-de-1km",
      "Entre 1 et 5km": "entre-1-et-5km",
      "Plus de 5km": "plus-de-5km",
    },
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
    transform: {
      Non: "non",
      Faible: "faible",
      Moyen: "moyen",
      Fort: "fort",
    },
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
    transform: {
      "Hors zone": "hors-zone",
      "ZNIEFF type 1": "znieff-type-1",
      "ZNIEFF type 2": "znieff-type-2",
      "ZNIEFF type 1 et 2": "znieff-type-1-2",
      "Natura 2000": "natura-2000",
      "Parc naturel": "parc-naturel",
    },
  },
  {
    excelName: "Zonage du PLU(I) ou de la carte communale",
    jsonField: "zonageReglementaire",
    type: "string",
    transform: {
      "Zone urbaine – U": "zone-urbaine",
      "Zone à urbaniser – AU": "zone-a-urbaniser",
      "Zone agricole – A": "zone-agricole",
      "Zone naturelle – N": "zone-naturelle",
    },
  },
  {
    excelName: "Monument historique",
    jsonField: "zonagePatrimonial",
    type: "string",
    transform: {
      "Non concerné": "non-concerne",
      "Périmètre de protection": "perimetre-protection",
      "Site classé/inscrit": "site-classe-inscrit",
    },
  },
  {
    excelName: "Trame verte et bleu",
    jsonField: "trameVerteEtBleu", // Sans 'e' à la fin
    type: "string",
    transform: {
      "Hors trame": "hors-trame",
      "Corridor écologique": "corridor-ecologique",
      "Réservoir de biodiversité": "reservoir-biodiversite",
      "Ne sait pas": "ne-sait-pas",
    },
  },

  // Propriétaire et état
  {
    excelName: "Propriétaire",
    jsonField: "typeProprietaire",
    type: "string",
    transform: {
      Privé: "prive",
      Public: "public",
      Mixte: "mixte",
    },
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
    transform: {
      "Bâtiments hétérogènes": "batiments-heterogenes",
      "Bon état": "bon-etat",
      "État dégradé": "etat-degrade",
      "En ruine": "en-ruine",
      "Aucun bâtiment": "aucun-batiment",
    },
  },
  {
    excelName: "Présence de pollution",
    jsonField: "presencePollution",
    type: "string",
    transform: {
      "Ne sait pas": "ne-sait-pas",
      Non: "non",
      Oui: "oui",
      "Oui (métaux lourds)": "oui-metaux-lourds",
      "Oui (hydrocarbures)": "oui-hydrocarbures",
      "Oui (autres composés)": "oui-autres-composes",
    },
  },

  // Qualités paysagères et architecturales
  {
    excelName: "Valeur architecturale et/ou histoire sociale",
    jsonField: "valeurArchitecturaleHistorique",
    type: "string",
    transform: {
      "Aucun intérêt": "aucun-interet",
      "Intérêt faible": "interet-faible",
      "Intérêt fort": "interet-fort",
      Exceptionnel: "exceptionnel",
    },
  },
  {
    excelName: "Paysage",
    jsonField: "qualitePaysage",
    type: "string",
    transform: {
      "Banal / infra-ordinaire": "banal",
      Intéressant: "interessant",
      Remarquable: "remarquable",
    },
  },
  {
    excelName: "Qualité de la voie de desserte",
    jsonField: "qualiteVoieDesserte",
    type: "string",
    transform: {
      Accessible: "accessible",
      "Peu accessible": "peu-accessible",
      "Très peu accessible": "tres-peu-accessible",
    },
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
