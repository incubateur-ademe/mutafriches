/**
 * Conventions d'appel à l'API Carto Cadastre (IGN) — endpoint `/cadastre/parcelle`.
 *
 * Module 100 % pur (aucune I/O, aucune lib DOM) : construction des paramètres, de l'URL et
 * mapping de la réponse. Le `fetch` lui-même reste à la charge de chaque appelant (Node ou
 * navigateur), seule frontière spécifique à l'environnement. Source de vérité unique des
 * conventions apicarto (padding section/numéro, `source_ign`, forme du `geom`).
 */

export const APICARTO_CADASTRE_URL = "https://apicarto.ign.fr/api/cadastre/parcelle";

export interface ParcelleCadastre {
  idu: string; // IDU brut renvoyé par l'API (non normalisé)
  codeInsee: string;
  commune?: string;
  section: string;
  numero: string;
  contenance?: number;
}

export interface ApicartoCadastreFeature {
  properties: {
    idu: string;
    code_insee: string;
    nom_com?: string;
    section: string;
    numero: string;
    contenance?: number;
  };
}

export interface ApicartoCadastreResponse {
  features?: ApicartoCadastreFeature[];
}

// Paramètres pour une résolution par attributs. Section paddée à 2 caractères et numéro à 4
// (exigence API IGN).
export function apicartoParamsParAttributs(
  codeInsee: string,
  section: string,
  numero: string,
): Record<string, string> {
  return {
    code_insee: codeInsee,
    section: section.padStart(2, "0"),
    numero: numero.padStart(4, "0"),
    source_ign: "PCI",
  };
}

// Paramètres pour une résolution par point WGS84 (parcelle contenant le point).
export function apicartoParamsParPoint(
  longitude: number,
  latitude: number,
): Record<string, string> {
  return {
    geom: JSON.stringify({ type: "Point", coordinates: [longitude, latitude] }),
    source_ign: "PCI",
  };
}

// Construit l'URL complète (query-string encodée à la main pour rester sans dépendance DOM).
export function apicartoCadastreUrl(params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([cle, valeur]) => `${encodeURIComponent(cle)}=${encodeURIComponent(valeur)}`)
    .join("&");
  return `${APICARTO_CADASTRE_URL}?${query}`;
}

// Mappe une feature apicarto vers ParcelleCadastre.
export function toParcelleCadastre(feature: ApicartoCadastreFeature): ParcelleCadastre {
  return {
    idu: feature.properties.idu,
    codeInsee: feature.properties.code_insee,
    commune: feature.properties.nom_com,
    section: feature.properties.section,
    numero: feature.properties.numero,
    contenance: feature.properties.contenance,
  };
}

// Première parcelle d'une réponse apicarto, ou null si aucune.
export function premiereParcelle(response: ApicartoCadastreResponse): ParcelleCadastre | null {
  const feature = response.features?.[0];
  return feature ? toParcelleCadastre(feature) : null;
}
