import { UsageType } from "@mutafriches/shared-types";

/** Configuration complete d'un usage pour l'affichage */
interface UsageConfig {
  label: string;
  image: string;
  tags: string[];
}

const USAGE_CONFIG: Record<UsageType, UsageConfig> = {
  [UsageType.RESIDENTIEL]: {
    label: "Habitat & commerce de proximité",
    image: "/illustrations/podium/habitats.png",
    tags: ["centre-ville", "transports", "non pollué"],
  },
  [UsageType.EQUIPEMENTS]: {
    label: "Équipement public",
    image: "/illustrations/podium/equipement-public.png",
    tags: ["centre-ville", "transports", "non pollué"],
  },
  [UsageType.CULTURE]: {
    label: "Équipement culturel & touristique",
    image: "/illustrations/podium/equipement-culturel.png",
    tags: ["centre-ville", "transports", "non pollué"],
  },
  [UsageType.TERTIAIRE]: {
    label: "Bureaux",
    image: "/illustrations/podium/bureaux.png",
    tags: ["acces poids lourds", "grande surface", "non pollué"],
  },
  [UsageType.INDUSTRIE]: {
    label: "Industrie",
    image: "/illustrations/podium/industrie.png",
    tags: ["acces poids lourds", "grande surface", "non pollué"],
  },
  [UsageType.RENATURATION]: {
    label: "Espace renaturé",
    image: "/illustrations/podium/espace-renature.png",
    tags: ["centre-ville", "transports", "non pollué"],
  },
  [UsageType.PHOTOVOLTAIQUE]: {
    label: "Centrale photovoltaïque au sol",
    image: "/illustrations/podium/centrale-photovoltaique.png",
    tags: ["acces poids lourds", "grande surface", "non pollué"],
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
  if (score >= 45) {
    return {
      label: "BON",
      textColor: "#716043",
      backgroundColor: "#FEECC2",
    };
  }
  if (score >= 30) {
    return {
      label: "MOYEN",
      textColor: "#716043",
      backgroundColor: "#FEDED9",
    };
  }
  // Score < 30 : Faible
  return {
    label: "FAIBLE",
    textColor: "#8D533E",
    backgroundColor: "#FFBDBE",
  };
};

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

/**
 * Trie les tags pour l'affichage : 2 plus courts en premier, puis le plus long
 */
export const sortTagsForDisplay = (tags: string[]): string[] => {
  if (tags.length <= 2) return tags;

  const sorted = [...tags].sort((a, b) => a.length - b.length);
  // Les 2 plus courts en premier, puis le reste
  return sorted;
};
