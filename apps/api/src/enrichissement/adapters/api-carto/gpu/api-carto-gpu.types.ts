import { ApiResponse } from "../../shared/api-response.types";

/**
 * Réponse brute de l'API Carto GPU (format GeoJSON)
 */
export interface ApiCartoGpuResponse {
  type: string;
  features: ApiCartoGpuFeature[];
  totalFeatures: number;
  numberMatched?: number;
  numberReturned?: number;
  timeStamp?: string;
}

/**
 * Feature GeoJSON de l'API Carto GPU
 */
export interface ApiCartoGpuFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

/**
 * Informations sur une commune (municipality)
 */
export interface MunicipalityInfo {
  gid: number;
  insee: string;
  name: string;
  is_rnu: boolean;
  is_deleted: boolean;
  bbox?: number[];
}

/**
 * Propriétés d'une zone d'urbanisme (zone-urba)
 */
export interface ZoneUrbaProperties {
  gid: number;
  partition: string;
  libelle: string;
  libelong: string;
  typezone: string;
  destdomi?: string;
  nomfic?: string;
  urlfic?: string;
  insee: string;
  datappro: string;
  datvalid?: string;
  idurba: string;
  bbox?: number[];
}

/**
 * Propriétés d'un secteur de carte communale (secteur-cc)
 */
export interface SecteurCCProperties {
  gid: number;
  partition: string;
  libelle: string;
  libelong: string;
  typesect: string;
  fermreco?: string;
  destdomi?: string;
  nomfic?: string;
  urlfic?: string;
  insee: string;
  datappro: string;
  datvalid?: string;
  idurba: string;
  bbox?: number[];
}

/**
 * Propriétés d'une assiette SUP (servitude d'utilité publique)
 */
export interface AssietteSUPProperties {
  gid: number;
  suptype: string;
  partition: string;
  fichier?: string;
  idass: string;
  idgen?: string;
  nomass?: string;
  typeass?: string;
  modegeoass?: string;
  paramcalc?: number;
  srcgeoass?: string;
  datesrcass?: string;
  bbox?: number[];
}

/**
 * Propriétés d'un générateur SUP
 */
export interface GenerateurSUPProperties {
  gid: number;
  suptype: string;
  partition: string;
  fichier?: string;
  idgen: string;
  idsup?: string;
  nomgen?: string;
  typegen?: string;
  modegenere?: string;
  srcgeogen?: string;
  datesrcgen?: string;
  refbdext?: string;
  idbdext?: string;
  bbox?: number[];
}

/**
 * Interface du service API Carto GPU
 */
export interface IApiCartoGpuService {
  getMunicipalityInfo(codeInsee: string): Promise<ApiResponse<MunicipalityInfo>>;
  getZoneUrba(geometry: any): Promise<ApiResponse<ApiCartoGpuResponse>>;
  getSecteurCC(geometry: any): Promise<ApiResponse<ApiCartoGpuResponse>>;
  getSupAC1(geometry: any): Promise<ApiResponse<ApiCartoGpuResponse>>;
  getSupAC2(geometry: any): Promise<ApiResponse<ApiCartoGpuResponse>>;
  getSupAC4(geometry: any): Promise<ApiResponse<ApiCartoGpuResponse>>;
}
