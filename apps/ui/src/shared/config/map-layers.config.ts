/**
 * Configuration des fonds de carte IGN Géoportail
 * Utilise les flux WMTS de la Géoplateforme : https://data.geopf.fr/wmts
 */

/** Type pour les couches de tuiles individuelles */
export type TileLayerType = "plan" | "orthophotos" | "cadastre";

/** Type pour le sélecteur de fond de carte (inclut l'option combinée) */
export type MapLayerType = TileLayerType | "tous";

export interface MapLayerConfig {
  id: TileLayerType;
  label: string;
  description: string;
  layerName: string;
  format: string;
  attribution: string;
  maxZoom: number;
  minZoom?: number;
  style?: string;
}

/**
 * Génère l'URL WMTS pour un fond de carte IGN Géoportail
 */
export function getGeoportalWMTSUrl(layerName: string, format = "image/png"): string {
  let url = "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile";
  url += "&LAYER=" + layerName;
  url += "&STYLE=normal&FORMAT=" + format;
  url += "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
  return url;
}

/**
 * Configuration des fonds de carte disponibles
 */
export const MAP_LAYERS: Record<TileLayerType, MapLayerConfig> = {
  plan: {
    id: "plan",
    label: "Plan IGN",
    description: "Carte topographique standard de l'IGN",
    layerName: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
    format: "image/png",
    attribution: '© <a href="https://www.ign.fr/">IGN</a>',
    maxZoom: 19,
    minZoom: 6,
    style: "normal",
  },
  orthophotos: {
    id: "orthophotos",
    label: "Photographies aériennes",
    description: "Orthophotographies IGN (vue satellite)",
    layerName: "ORTHOIMAGERY.ORTHOPHOTOS",
    format: "image/jpeg",
    attribution: '© <a href="https://www.ign.fr/">IGN</a>',
    maxZoom: 19,
    minZoom: 6,
  },
  cadastre: {
    id: "cadastre",
    label: "Parcelles cadastrales",
    description: "Plan cadastral avec limites des parcelles",
    layerName: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
    format: "image/png",
    attribution: '© <a href="https://www.ign.fr/">IGN</a> - Parcellaire Express',
    maxZoom: 20,
    minZoom: 13,
  },
};

/**
 * Fond de carte par défaut
 */
export const DEFAULT_MAP_LAYER: MapLayerType = "tous";

/**
 * Clés de stockage localStorage pour la persistance des choix
 */
export const MAP_LAYER_STORAGE_KEY = "mutafriches:map-layer";

/** Liste ordonnée des couches de tuiles (pour le mode "tous") */
export const TILE_LAYERS: TileLayerType[] = ["orthophotos", "plan", "cadastre"];
