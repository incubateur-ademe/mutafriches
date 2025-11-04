/**
 * Types généraux pour l'API GeoRisques
 */

import { AziResultNormalized } from "./azi/azi.types";
import { CatnatResultNormalized } from "./catnat/catnat.types";
import { CavitesResultNormalized } from "./cavites/cavites.types";
import { IcpeResultNormalized } from "./icpe/icpe.types";
import { MvtResultNormalized } from "./mvt/mvt.types";
import { OldResultNormalized } from "./old/old.types";
import { PapiResultNormalized } from "./papi/papi.types";
import { PprResultNormalized } from "./ppr/ppr.types";
import { RgaResultNormalized } from "./rga/rga.types";
import { SisResultNormalized } from "./sis/sis.types";
import { TriZonageResultNormalized } from "./tri-zonage/tri-zonage.types";
import { TriResultNormalized } from "./tri/tri.types";
import { ZonageSismiqueResultNormalized } from "./zonage-sismique/zonage-sismique.types";

/**
 * Paramètres de recherche géographique communs
 */
export interface GeoRisquesSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres
  codeInsee?: string;
}

/**
 * Réponse générique de l'API GeoRisques
 */
export interface GeoRisquesApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

/**
 * Métadonnées d'appel API
 */
export interface GeoRisquesMetadata {
  source: string;
  dateAppel: string;
  success: boolean;
  responseTimeMs?: number;
}

/**
 * Résultat agrégé de tous les risques GeoRisques
 * Sera enrichi progressivement avec les autres risques
 */
export interface GeoRisquesResult {
  azi?: AziResultNormalized;
  rga?: RgaResultNormalized;
  catnat?: CatnatResultNormalized;
  triZonage?: TriZonageResultNormalized;
  tri?: TriResultNormalized;
  mvt?: MvtResultNormalized;
  zonageSismique?: ZonageSismiqueResultNormalized;
  cavites?: CavitesResultNormalized;
  old?: OldResultNormalized;
  sis?: SisResultNormalized;
  icpe?: IcpeResultNormalized;
  papi?: PapiResultNormalized;
  ppr?: PprResultNormalized;

  metadata: {
    sourcesUtilisees: string[];
    sourcesEchouees: string[];
    fiabilite: number;
  };
}
