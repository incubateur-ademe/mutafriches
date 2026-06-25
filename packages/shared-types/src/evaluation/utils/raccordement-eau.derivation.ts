import { RaccordementEau } from "../enums";

/**
 * Seuil de surface bâtie (m²) au-delà duquel un site est considéré raccordé aux réseaux d'eau.
 * La présence d'un bâtiment significatif implique un raccordement existant.
 */
export const SEUIL_BATI_RACCORDEMENT_EAU_M2 = 20;

/**
 * Dérive automatiquement le raccordement eau à partir de la surface bâtie enrichie (BDNB).
 * Règle métier : du bâti de plus de 20 m² sur le site => raccordement supposé.
 *
 * - surfaceBati > 20      => OUI
 * - surfaceBati <= 20 (0) => NON (terrain nu ou bâti négligeable)
 * - surfaceBati undefined  => NE_SAIT_PAS (donnée BDNB indisponible)
 */
export function deriverRaccordementEau(surfaceBati?: number): RaccordementEau {
  if (surfaceBati === undefined) {
    return RaccordementEau.NE_SAIT_PAS;
  }
  return surfaceBati > SEUIL_BATI_RACCORDEMENT_EAU_M2 ? RaccordementEau.OUI : RaccordementEau.NON;
}
