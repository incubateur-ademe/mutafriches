import { ZonageAbcLogement } from "@mutafriches/shared-types";

/**
 * Ligne brute retournée par l'API tabulaire data.gouv.fr pour le zonage ABC
 *
 * La colonne portant la valeur du zonage contient le millésime dans son nom
 * (« Zonage en vigueur depuis le 5 septembre 2025 », puis « Zonage ABC en vigueur
 * depuis le 26 juin 2026 »…) : elle est résolue au runtime, pas déclarée ici.
 */
export interface ZonageAbcCommuneRow {
  CODGEO: string;
  DEP: string;
  LIBGEO: string;
  [colonne: string]: string | number | undefined;
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
