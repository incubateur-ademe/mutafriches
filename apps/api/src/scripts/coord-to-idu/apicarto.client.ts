/**
 * Client minimal de l'API Carto Cadastre (IGN) pour résoudre un IDU parcellaire.
 * Standalone (fetch, hors DI Nest) : utilisé par les scripts d'onboarding partenaire.
 *
 * Deux modes :
 *  - par attributs (code_insee + section + numero) : renvoie l'IDU réel de la parcelle,
 *    COM_ABS inclus (on ne le devine donc pas côté script).
 *  - par point WGS84 (geom) : renvoie l'IDU de la parcelle contenant le point.
 */

const BASE_URL = "https://apicarto.ign.fr/api/cadastre/parcelle";
const TIMEOUT_MS = 15000;

export interface ParcelleApicarto {
  idu: string;
  codeInsee: string;
  commune?: string;
  section: string;
  numero: string;
  contenance?: number;
}

interface ApicartoFeature {
  properties: {
    idu: string;
    code_insee: string;
    nom_com?: string;
    section: string;
    numero: string;
    contenance?: number;
  };
}

interface ApicartoResponse {
  features?: ApicartoFeature[];
}

async function fetchApicarto(params: Record<string, string>): Promise<ApicartoFeature[]> {
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as ApicartoResponse;
    return data.features ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function toParcelle(f: ApicartoFeature): ParcelleApicarto {
  return {
    idu: f.properties.idu,
    codeInsee: f.properties.code_insee,
    commune: f.properties.nom_com,
    section: f.properties.section,
    numero: f.properties.numero,
    contenance: f.properties.contenance,
  };
}

// Résout l'IDU réel par attributs. Section paddée à 2 caractères (exigence API IGN).
export async function parcelleByAttributes(
  codeInsee: string,
  section: string,
  numero: string,
): Promise<ParcelleApicarto | null> {
  const features = await fetchApicarto({
    code_insee: codeInsee,
    section: section.padStart(2, "0"),
    numero: numero.padStart(4, "0"),
    source_ign: "PCI",
  });
  return features.length > 0 ? toParcelle(features[0]) : null;
}

// Résout la parcelle contenant un point WGS84 (contre-vérification par coordonnées).
export async function parcelleByPoint(
  longitude: number,
  latitude: number,
): Promise<ParcelleApicarto | null> {
  const geom = JSON.stringify({ type: "Point", coordinates: [longitude, latitude] });
  const features = await fetchApicarto({ geom, source_ign: "PCI" });
  return features.length > 0 ? toParcelle(features[0]) : null;
}
