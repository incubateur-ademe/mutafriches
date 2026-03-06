// TODO: supprimer après analyse

/**
 * Feature brute d'une API Carto (sans géométrie) pour le diagnostic
 */
export interface DiagnosticFeature {
  id: string;
  properties: Record<string, unknown>;
}

/**
 * Diagnostic réglementaire : données brutes des APIs zone-urba, secteur-cc, commune
 */
export interface DiagnosticReglementaire {
  zoneUrba: {
    totalFeatures: number;
    features: DiagnosticFeature[];
  } | null;
  secteurCC: {
    totalFeatures: number;
    features: DiagnosticFeature[];
  } | null;
  commune: {
    insee: string;
    name: string;
    is_rnu: boolean;
  } | null;
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
 * Diagnostic complet des 3 zonages (environnemental, patrimonial, réglementaire)
 * Contient les données brutes des APIs pour le panneau de diagnostic
 */
export interface DiagnosticZonages {
  reglementaire: DiagnosticReglementaire | null;
  environnemental: {
    natura2000: any;
    znieff: any;
    parcNaturel: any;
    reserveNaturelle: any;
    zonageFinal: string;
  } | null;
  patrimonial: {
    ac1: any;
    ac2: any;
    ac4: any;
    zonageFinal: string;
  } | null;
}
