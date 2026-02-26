// TODO: supprimer apres analyse

/**
 * Feature brute de l'API Carto (sans geometrie pour reduire le payload)
 */
export interface DiagnosticFeature {
  id: string;
  properties: Record<string, unknown>;
}

/**
 * Diagnostic du zonage reglementaire (donnees brutes API Carto GPU)
 */
export interface DiagnosticReglementaire {
  zoneUrba: { totalFeatures: number; features: DiagnosticFeature[] } | null;
  secteurCC: { totalFeatures: number; features: DiagnosticFeature[] } | null;
  commune: { insee: string; name: string; is_rnu: boolean } | null;
  zoneDominante: {
    index: number;
    surfaceIntersection?: number;
    typezone?: string;
    libelle?: string;
    libelong?: string;
    destdomi?: string;
    formdomi?: string;
  } | null;
  zonageFinal: string;
}

/**
 * Diagnostic du zonage environnemental
 */
export interface DiagnosticEnvironnemental {
  natura2000: { present: boolean; nombreZones: number } | null;
  znieff: { present: boolean; type1: boolean; type2: boolean; nombreZones: number } | null;
  parcNaturel: { present: boolean; type: string | null; nom?: string } | null;
  reserveNaturelle: { present: boolean; nombreReserves: number } | null;
  zonageFinal: string;
}

/**
 * Diagnostic du zonage patrimonial
 */
export interface DiagnosticPatrimonial {
  ac1: { present: boolean; nombreZones: number; type?: string } | null;
  ac2: { present: boolean; nombreZones: number } | null;
  ac4: { present: boolean; nombreZones: number; type?: string } | null;
  zonageFinal: string;
}

/**
 * Diagnostic complet des zonages (temporaire, pour analyse staging)
 */
export interface DiagnosticZonages {
  reglementaire: DiagnosticReglementaire | null;
  environnemental: DiagnosticEnvironnemental | null;
  patrimonial: DiagnosticPatrimonial | null;
}
