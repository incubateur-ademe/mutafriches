/**
 * Client Node de l'API Carto Cadastre (IGN). Standalone (fetch, hors DI Nest) : utilisé par
 * les scripts d'onboarding partenaire.
 *
 * Les conventions apicarto (URL, params, mapping, forme du geom) vivent dans shared-types
 * (`apicarto-cadastre`) et sont partagées avec la page de test UI. Ici on ne garde que la
 * frontière I/O propre à Node : le fetch avec timeout.
 */
import {
  ApicartoCadastreResponse,
  apicartoCadastreUrl,
  apicartoParamsParAttributs,
  apicartoParamsParPoint,
  ParcelleCadastre,
  premiereParcelle,
} from "@mutafriches/shared-types";

const TIMEOUT_MS = 15000;

async function fetchCadastre(params: Record<string, string>): Promise<ParcelleCadastre | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(apicartoCadastreUrl(params), { signal: controller.signal });
    if (!res.ok) return null;
    return premiereParcelle((await res.json()) as ApicartoCadastreResponse);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Résout l'IDU réel par attributs (l'API renvoie l'IDU, COM_ABS inclus).
export function parcelleByAttributes(
  codeInsee: string,
  section: string,
  numero: string,
): Promise<ParcelleCadastre | null> {
  return fetchCadastre(apicartoParamsParAttributs(codeInsee, section, numero));
}

// Résout la parcelle contenant un point WGS84 (contre-vérification par coordonnées).
export function parcelleByPoint(
  longitude: number,
  latitude: number,
): Promise<ParcelleCadastre | null> {
  return fetchCadastre(apicartoParamsParPoint(longitude, latitude));
}
