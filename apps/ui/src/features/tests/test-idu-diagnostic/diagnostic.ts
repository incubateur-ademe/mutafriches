import { isValidParcelId, normalizeParcelId, padParcelleSection } from "@mutafriches/shared-types";
import type { Geometry } from "geojson";
import {
  fetchParcelByRef,
  fetchSectionParcels,
} from "@shared/services/cadastre/api.cadastre.service";
import { extraireDepartement } from "@shared/utils/cadastre.utils";

export type DiagnosticStatut =
  | "trouvee"
  | "format-invalide"
  | "commune-inconnue"
  | "section-absente"
  | "numero-introuvable"
  | "erreur";

export interface IduParts {
  departement: string;
  codeInsee: string;
  prefixe: string;
  section: string;
  numero: string;
}

export interface DiagnosticResult {
  iduSaisi: string;
  iduNormalise?: string;
  parts?: IduParts;
  commune?: string;
  statut: DiagnosticStatut;
  message: string;
  voisins?: string[]; // numéros voisins présents (cas numero-introuvable)
  contenance?: number; // surface en m² (cas trouvee)
  centreCommune?: [number, number]; // [lon, lat] centre de la commune (repli lien cadastre)
  geocodeurTrouve?: boolean; // 2e source IGN (géocodeur) : true=présente, false=absente
  coordonnees?: [number, number]; // [lon, lat] : parcelle (trouvée) ou voisin réel (KO)
  adresse?: string; // adresse BAN la plus proche des coordonnées
}

/**
 * Découpe un IDU normalisé (section paddée à 2 car.) en composants.
 * Gère métropole (dépt 2 car.), DOM (97x, 3 car.) et Corse (2A/2B).
 */
export function parseIdu(iduPad: string): IduParts {
  const departement = extraireDepartement(iduPad);

  const rest = iduPad.slice(departement.length); // commune(3) + préfixe(3) + section(2) + numéro(4)
  const commune = rest.slice(0, 3);
  const prefixe = rest.slice(3, 6);
  const numero = rest.slice(-4);
  const section = rest.slice(6, rest.length - 4);

  return { departement, codeInsee: departement + commune, prefixe, section, numero };
}

interface CommuneInfo {
  nom: string | null;
  centre?: [number, number]; // [lon, lat]
}

async function fetchCommune(codeInsee: string): Promise<CommuneInfo> {
  try {
    const res = await fetch(`https://geo.api.gouv.fr/communes/${codeInsee}?fields=nom,centre`);
    if (!res.ok) return { nom: null };
    const data = (await res.json()) as {
      nom?: string;
      centre?: { coordinates?: [number, number] };
    };
    return { nom: data?.nom ?? null, centre: data?.centre?.coordinates };
  } catch {
    return { nom: null };
  }
}

/**
 * 2e source IGN indépendante d'apicarto : le géocodeur (data.geopf.fr, index parcel).
 * Renvoie true si la parcelle est trouvée, false si absente, undefined en cas d'erreur.
 */
async function geocodeParcelle(parts: IduParts): Promise<boolean | undefined> {
  const municipalitycode = parts.codeInsee.slice(parts.departement.length);
  const url =
    `https://data.geopf.fr/geocodage/search?index=parcel&departmentcode=${parts.departement}` +
    `&municipalitycode=${municipalitycode}&section=${parts.section}&number=${parts.numero}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { features?: unknown[] };
    return (data.features?.length ?? 0) > 0;
  } catch {
    return undefined;
  }
}

/** Adresse BAN la plus proche d'un point [lon, lat]. */
async function reverseAdresse([lon, lat]: [number, number]): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { features?: { properties?: { label?: string } }[] };
    return data.features?.[0]?.properties?.label;
  } catch {
    return undefined;
  }
}

/** Centroïde approché (moyenne des sommets de l'anneau extérieur). */
function centroid(geom: Geometry): [number, number] | undefined {
  let ring: number[][] | undefined;
  if (geom.type === "Polygon") ring = geom.coordinates[0];
  else if (geom.type === "MultiPolygon") ring = geom.coordinates[0]?.[0];
  if (!ring || ring.length === 0) return undefined;
  let x = 0;
  let y = 0;
  for (const pt of ring) {
    x += pt[0];
    y += pt[1];
  }
  return [x / ring.length, y / ring.length];
}

/**
 * Diagnostique un IDU : format, commune, section, existence de la parcelle.
 * Sources : API Carto IGN (cadastre actuel) + géocodeur IGN (2e source) + geo.api + BAN.
 */
export async function diagnostiquerIdu(iduSaisi: string): Promise<DiagnosticResult> {
  const idu = iduSaisi.trim();

  if (!isValidParcelId(idu)) {
    return {
      iduSaisi,
      statut: "format-invalide",
      message:
        "Format d'IDU invalide (attendu : département + commune + préfixe + section + numéro).",
    };
  }

  const iduNormalise = padParcelleSection(normalizeParcelId(idu));
  const parts = parseIdu(iduNormalise);

  // Appels indépendants en parallèle : commune + existence (apicarto) + 2e source (géocodeur)
  const [communeInfo, exact, geocodeurTrouve] = await Promise.all([
    fetchCommune(parts.codeInsee),
    fetchParcelByRef(parts.codeInsee, parts.section, parts.numero),
    geocodeParcelle(parts),
  ]);
  const commune = communeInfo.nom;
  const centreCommune = communeInfo.centre;

  if (exact === null) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? undefined,
      centreCommune,
      geocodeurTrouve,
      statut: "erreur",
      message: "Erreur lors de l'appel au cadastre (API Carto).",
    };
  }

  if (exact.features.length > 0) {
    const feature = exact.features[0];
    const coordonnees = centroid(feature.geometry);
    const adresse = coordonnees ? await reverseAdresse(coordonnees) : undefined;
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? feature.properties.nom_com,
      centreCommune,
      geocodeurTrouve,
      coordonnees,
      adresse,
      statut: "trouvee",
      message: "Parcelle trouvée dans le cadastre actuel.",
      contenance: feature.properties.contenance,
    };
  }

  // Pas trouvée : on inspecte la section pour qualifier le problème
  const section = await fetchSectionParcels(parts.codeInsee, parts.section);
  const features = section?.features ?? [];

  if (!commune && features.length === 0) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      geocodeurTrouve,
      statut: "commune-inconnue",
      message: `Code commune ${parts.codeInsee} introuvable dans le cadastre.`,
    };
  }

  if (features.length === 0) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? undefined,
      centreCommune,
      geocodeurTrouve,
      statut: "section-absente",
      message: `Section ${parts.section} absente du cadastre pour ${commune ?? parts.codeInsee}.`,
    };
  }

  // Section peuplée mais numéro absent : voisins (signe d'un redécoupage) + ancrage géographique
  const cible = parseInt(parts.numero, 10);
  const voisins = features
    .map((f) => f.properties.numero)
    .filter((n): n is string => typeof n === "string")
    .filter((n) => Math.abs(parseInt(n, 10) - cible) <= 3)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  // Voisin réel le plus proche en numéro (géométrie disponible) pour situer la zone
  const voisinFeature = features
    .filter((f) => typeof f.properties.numero === "string")
    .map((f) => ({ f, d: Math.abs(parseInt(f.properties.numero as string, 10) - cible) }))
    .filter((x) => x.d > 0)
    .sort((a, b) => a.d - b.d)[0]?.f;
  const coordonnees = voisinFeature ? centroid(voisinFeature.geometry) : undefined;
  const adresse = coordonnees ? await reverseAdresse(coordonnees) : undefined;

  return {
    iduSaisi,
    iduNormalise,
    parts,
    commune: commune ?? undefined,
    centreCommune,
    geocodeurTrouve,
    coordonnees,
    adresse,
    statut: "numero-introuvable",
    message: voisins.length
      ? `Numéro ${parts.numero} absent — voisins présents (${voisins.join(", ")}) : parcelle vraisemblablement redécoupée ou renumérotée.`
      : `Numéro ${parts.numero} absent de la section ${parts.section}.`,
    voisins,
  };
}
