/**
 * Types spécifiques pour l'API RGA (Retrait-Gonflement des Argiles)
 */

/**
 * Réponse brute de l'API GeoRisques RGA
 */
export interface RgaApiResponse {
  codeExposition: string; // "0", "1", "2", "3"
  exposition: string; // "Exposition nulle", "Exposition faible", etc.
}

/**
 * Code d'exposition RGA normalisé
 */
export type RgaCodeExposition = "0" | "1" | "2" | "3";

/**
 * Niveau d'aléa RGA normalisé (pour Mutafriches)
 */
export type RgaAleaNiveau = "Nul" | "Faible" | "Moyen" | "Fort";

/**
 * Mapping des codes RGA vers les niveaux d'aléa
 */
export const RGA_CODE_TO_ALEA: Record<RgaCodeExposition, RgaAleaNiveau> = {
  "0": "Nul",
  "1": "Faible",
  "2": "Moyen",
  "3": "Fort",
};

/**
 * Résultat RGA normalisé pour Mutafriches
 */
export interface RgaResultNormalized {
  alea: RgaAleaNiveau;
  codeExposition: RgaCodeExposition;
  libelle: string; // "Exposition nulle", "Exposition faible", etc.
  exposition: boolean; // true si aléa > Nul
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche RGA
 */
export interface RgaSearchParams {
  latitude: number;
  longitude: number;
}
