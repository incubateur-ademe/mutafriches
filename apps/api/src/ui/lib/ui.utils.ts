// Fonction helper pour convertir les valeurs en string sécurisé
export const safeString = (value: string | undefined): string => {
  return value || "";
};

// Fonction helper pour extraire les chiffres d'une chaîne avec surface
export const extractNumbers = (value: string | undefined): string => {
  if (!value) return "";
  return value.replace(/[^\d]/g, "") || "";
};

// Convertit une valeur en string de façon sécurisée
export const safeStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "Non renseigné";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Objet complexe]";
    }
  }

  // Pour tous les autres types (symbol, bigint, function, etc.)
  return "Non renseigné";
};
