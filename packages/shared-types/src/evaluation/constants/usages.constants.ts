import { UsageType } from "../enums/usage.enum";

// Libellés affichés à l'utilisateur : seule nomenclature à employer dans l'UI, la doc et Metabase
export const USAGE_LABELS: Record<UsageType, string> = {
  [UsageType.RESIDENTIEL]: "Habitat & commerce de proximité",
  [UsageType.EQUIPEMENTS]: "Équipement public",
  [UsageType.CULTURE]: "Équipement culturel & touristique",
  [UsageType.TERTIAIRE]: "Locaux d'activité",
  [UsageType.INDUSTRIE]: "Industrie",
  [UsageType.RENATURATION]: "Espace renaturé",
  [UsageType.PHOTOVOLTAIQUE]: "Centrale photovoltaïque au sol",
};
