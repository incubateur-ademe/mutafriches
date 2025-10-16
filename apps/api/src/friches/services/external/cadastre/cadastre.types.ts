import { ApiResponse } from "../shared/api-response.types";
import { GeometrieParcelle, Coordonnees } from "@mutafriches/shared-types";

export interface CadastreServiceResponse {
  identifiant: string;
  codeInsee: string;
  commune: string;
  surface: number; // m²
  coordonnees: Coordonnees;
  geometrie?: GeometrieParcelle;
}

export interface ICadastreService {
  getParcelleInfo(identifiant: string): Promise<ApiResponse<CadastreServiceResponse>>;
}

export interface IGNParcelleFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "MultiPolygon" | "Polygon";
    coordinates: number[][][] | number[][][][]; // Support MultiPolygon
  };
  properties: {
    gid: number;
    numero: string;
    feuille: number;
    section: string;
    code_dep: string;
    nom_com: string;
    code_com: string;
    com_abs: string;
    code_arr: string;
    idu: string;
    contenance: number;
    code_insee: string;
  };
}

export interface IGNParcelleResponse {
  type: "FeatureCollection";
  features: IGNParcelleFeature[];
  totalFeatures: number;
}

export interface IGNLocalisantFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "MultiPoint";
    coordinates: [[number, number]];
  };
  properties: {
    gid: number;
    numero: string;
    feuille: number;
    section: string;
    code_dep: string;
    nom_com: string;
    code_com: string;
    com_abs: string;
    code_arr: string;
    idu: string;
    code_insee: string;
  };
}

export interface IGNLocalisantResponse {
  type: "FeatureCollection";
  features: IGNLocalisantFeature[];
  totalFeatures: number;
}
