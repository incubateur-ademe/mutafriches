/**
 * Mapping des arrondissements municipaux vers les codes communes officiels
 *
 * En France, 3 villes ont des codes INSEE par arrondissement qui doivent être
 * convertis en code commune unique pour interroger l'API Cadastre IGN.
 */
export const ARRONDISSEMENTS_MAP = {
  "751": { range: [101, 120] as const, codeCommune: "75056", ville: "Paris" },
  "132": { range: [201, 216] as const, codeCommune: "13055", ville: "Marseille" },
  "693": { range: [381, 389] as const, codeCommune: "69123", ville: "Lyon" },
} as const;

/**
 * Résout un code INSEE d'arrondissement en code commune officiel
 *
 * @param codeInsee Code INSEE brut (peut être un arrondissement)
 * @returns Objet avec le code résolu et les métadonnées de transformation
 */
export function resolveCodeInseeArrondissement(codeInsee: string): {
  resolved: string;
  wasTransformed: boolean;
  ville?: string;
} {
  if (!codeInsee || codeInsee.length < 5) {
    return { resolved: codeInsee, wasTransformed: false };
  }

  // Extraire le préfixe (3 premiers caractères)
  const prefix = codeInsee.substring(0, 3);

  // Chercher dans la map
  const config = ARRONDISSEMENTS_MAP[prefix as keyof typeof ARRONDISSEMENTS_MAP];

  if (!config) {
    return { resolved: codeInsee, wasTransformed: false };
  }

  // Extraire le numéro d'arrondissement
  const arrNum = parseInt(codeInsee.substring(2), 10);

  // Vérifier si dans la plage
  if (arrNum >= config.range[0] && arrNum <= config.range[1]) {
    return {
      resolved: config.codeCommune,
      wasTransformed: true,
      ville: config.ville,
    };
  }

  return { resolved: codeInsee, wasTransformed: false };
}
