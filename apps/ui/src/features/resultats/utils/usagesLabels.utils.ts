import { UsageResultat, UsageType } from "@mutafriches/shared-types";

/** Configuration complète d'un usage pour l'affichage */
interface UsageConfig {
  label: string;
  image: string;
  tags: string[];
}

const USAGE_CONFIG: Record<UsageType, UsageConfig> = {
  [UsageType.RESIDENTIEL]: {
    label: "Habitat & commerce de proximité",
    image: "/illustrations/podium/habitats.png",
    tags: [
      "taille de la parcelle",
      "présence de pollution",
      "distance du centre ville",
      "proximité des commerces et services",
      "risques naturels",
      "zonage réglementaire",
    ],
  },
  [UsageType.EQUIPEMENTS]: {
    label: "Équipement public",
    image: "/illustrations/podium/equipement-public.png",
    tags: [
      "taille de la parcelle",
      "présence de pollution",
      "distance du centre ville",
      "proximité des commerces et services",
      "risques naturels",
      "risques technologiques",
    ],
  },
  [UsageType.CULTURE]: {
    label: "Équipement culturel & touristique",
    image: "/illustrations/podium/equipement-culturel.png",
    tags: [
      "état du bâti",
      "présence de pollution",
      "desserte par les réseaux (eau et élec)",
      "distance des transports en commun",
      "zonage patrimonial",
      "qualité du paysage environnant",
    ],
  },
  [UsageType.TERTIAIRE]: {
    label: "Bureaux",
    image: "/illustrations/podium/bureaux.png",
    tags: [
      "présence de pollution",
      "distance du centre ville",
      "desserte par les réseaux (eau et élec)",
      "distance des transports en commun",
      "proximité des commerces et services",
      "zonage réglementaire",
    ],
  },
  [UsageType.INDUSTRIE]: {
    label: "Industrie",
    image: "/illustrations/podium/industrie.png",
    tags: [
      "taille de la parcelle",
      "desserte par les réseaux (eau et élec)",
      "qualité de la voie de desserte",
      "zonage réglementaire",
      "zonage environnemental",
      "zonage patrimonial",
    ],
  },
  [UsageType.RENATURATION]: {
    label: "Espace renaturé",
    image: "/illustrations/podium/espace-renature.png",
    tags: [
      "type de propriétaire",
      "emprise au sol du bâti",
      "état du bâti",
      "zonage environnemental",
      "continuité écologique",
      "risques naturels",
    ],
  },
  [UsageType.PHOTOVOLTAIQUE]: {
    label: "Centrale photovoltaïque au sol",
    image: "/illustrations/podium/centrale-photovoltaique.png",
    tags: [
      "taille de la parcelle",
      "emprise au sol du bâti",
      "desserte par les réseaux",
      "risques naturels",
      "valeur architecturale/patrimoniale du bâti",
      "continuité écologique",
    ],
  },
};

/** Configuration des badges selon le score */
export interface BadgeConfig {
  label: string;
  textColor: string;
  backgroundColor: string;
}

export const getBadgeConfig = (score: number): BadgeConfig => {
  if (score >= 70) {
    return {
      label: "EXCELLENT",
      textColor: "#18753C",
      backgroundColor: "#B8FEC9",
    };
  }
  if (score >= 60) {
    return {
      label: "TRÈS BON",
      textColor: "#208D49",
      backgroundColor: "#C9FCAC",
    };
  }
  if (score >= 50) {
    return {
      label: "BON",
      textColor: "#716043",
      backgroundColor: "#FEECC2",
    };
  }
  if (score >= 40) {
    return {
      label: "MOYEN",
      textColor: "#716043",
      backgroundColor: "#FEDED9",
    };
  }
  // Score < 40 : Faible
  return {
    label: "FAIBLE",
    textColor: "#8D533E",
    backgroundColor: "#FFBDBE",
  };
};

// Usage exclu par une règle de l'algorithme (v1.16) : aucun indice n'est affiché (ADR-0048)
export const MESSAGE_USAGE_EXCLU =
  "Certaines caractéristiques du site peuvent bloquer sa mutabilité vers cet usage";

// Couleurs du badge DSFR orange-terre-battue, aussi reprises par l'export PDF
export const BADGE_EXCLU: BadgeConfig = {
  label: "EXCLU",
  textColor: "#755348",
  backgroundColor: "#FEE9E5",
};

export const getResultBadgeConfig = (
  result: Pick<UsageResultat, "indiceMutabilite" | "exclu">,
): BadgeConfig => (result.exclu ? BADGE_EXCLU : getBadgeConfig(result.indiceMutabilite));

// Le podium ne propose jamais un usage exclu, même si une règle future en excluait plus de 4
export const getUsagesPodium = <T extends UsageResultat>(resultats: T[]): T[] =>
  resultats.filter((r) => !r.exclu).slice(0, 3);

export const getUsageInfo = (usage: string): UsageConfig => {
  const usageType = usage as UsageType;
  const config = USAGE_CONFIG[usageType];

  if (!config) {
    return {
      label: usage,
      image: "/illustrations/podium/habitats.png",
      tags: [],
    };
  }

  return config;
};
