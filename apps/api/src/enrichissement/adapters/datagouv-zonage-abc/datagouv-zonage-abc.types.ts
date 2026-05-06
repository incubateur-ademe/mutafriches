import { ZonageAbcLogement } from "@mutafriches/shared-types";

/**
 * Ligne brute retournée par l'API tabulaire data.gouv.fr pour le zonage ABC
 */
export interface ZonageAbcCommuneRow {
  CODGEO: string;
  DEP: string;
  LIBGEO: string;
  "Zonage en vigueur depuis le 5 septembre 2025": string;
  "Reclassement 5 septembre 2025": string;
}

/**
 * Réponse de l'API tabulaire data.gouv.fr
 */
export interface DatagouvZonageAbcResponse {
  data: ZonageAbcCommuneRow[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
  links: {
    profile: string;
    swagger: string;
    next: string | null;
    prev: string | null;
  };
}

/**
 * Données de zonage ABC transformées
 */
export interface ZonageAbcData {
  codeInsee: string;
  commune: string;
  zonage: ZonageAbcLogement;
}
