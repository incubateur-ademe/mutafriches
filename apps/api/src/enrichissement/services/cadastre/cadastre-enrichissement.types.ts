/**
 * Types pour le sous-domaine cadastre
 */

import { GeometrieParcelle } from "@mutafriches/shared-types";

/**
 * Données initiales de la parcelle
 */
export interface ParcelleInitiale {
  identifiantParcelle: string;
  codeInsee: string;
  commune: string;
  surfaceSite: number;
  surfaceBati?: number;
  coordonnees?: {
    latitude: number;
    longitude: number;
  };
  geometrie?: GeometrieParcelle;
}
