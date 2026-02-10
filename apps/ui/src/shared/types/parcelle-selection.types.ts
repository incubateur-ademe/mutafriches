import type { Geometry } from "geojson";
import type { ParcelleProperties } from "../services/cadastre/api.cadastre.types";

/**
 * Parcelle sélectionnée et ajoutée au site
 */
export interface SelectedParcelle {
  /** Identifiant cadastral normalisé */
  idu: string;
  /** Géométrie GeoJSON de la parcelle */
  geometry: Geometry;
  /** Propriétés brutes retournées par l'API Carto */
  properties: ParcelleProperties;
  /** Surface en m² (issue de la contenance) */
  contenance: number;
}

/**
 * Parcelle en prévisualisation (cliquée mais pas encore ajoutée)
 */
export interface PreviewParcelle {
  idu: string;
  geometry: Geometry;
  properties: ParcelleProperties;
  contenance: number;
  /** Position du clic pour placer le bouton d'action [lng, lat] */
  clickCoords: [number, number];
}

/**
 * État de la sélection multi-parcelle
 *
 * - idle : aucune interaction en cours
 * - previewing : une parcelle est cliquée, bouton (+) affiché
 * - already-added : une parcelle déjà ajoutée est cliquée, bouton poubelle affiché
 * - non-adjacent : tentative d'ajout d'une parcelle non adjacente
 * - max-size : la taille maximale du site est atteinte (10 hectares, uniquement en multi-parcelles)
 */
export type SelectionState = "idle" | "previewing" | "already-added" | "non-adjacent" | "max-size";

/** Seuil maximal de surface cumulée en m² (10 hectares) */
export const MAX_SITE_AREA_M2 = 100_000;
