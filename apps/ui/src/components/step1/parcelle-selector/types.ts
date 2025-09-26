import type { Geometry } from "geojson";

export interface ParcelleFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    id: string;
    numero: string;
    feuille: string;
    section: string;
    code_dep: string;
    code_com: string;
    nom_com: string;
    code_arr?: string;
    idu: string;
    [key: string]: unknown;
  };
}

export interface ParcelleFeatureCollection {
  type: "FeatureCollection";
  features: ParcelleFeature[];
  totalFeatures: number;
  numberMatched: number;
  numberReturned: number;
  timeStamp: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
}

export interface ParcelleSelectorProps {
  onParcelleSelect: (parcelleId: string, parcelle: ParcelleFeature) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export interface GeoportalWfsClient {
  getFeatures: (
    typeName: string,
    params: {
      geom?: Geometry;
      bbox?: number[];
      code_insee?: string;
      section?: string;
      _limit?: number;
      [key: string]: unknown;
    },
    method?: "get" | "post",
  ) => Promise<ParcelleFeatureCollection>;
}

declare global {
  interface Window {
    GeoportalWfsClient: new (options?: { headers?: { Referer?: string } }) => GeoportalWfsClient;
  }
}
