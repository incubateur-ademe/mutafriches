// Archives trimestrielles du plan cadastral (Etalab / DGFiP), un fichier GeoJSON par commune.
import { gunzipSync } from "zlib";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Surface } from "./successeurs";

const BASE_URL = "https://cadastre.data.gouv.fr/data/etalab-cadastre";
const TIMEOUT_MS = 60000;

async function fetchAvecTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Millésimes disponibles, du plus récent au plus ancien.
export async function listerMillesimes(): Promise<string[]> {
  const res = await fetchAvecTimeout(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`Index des millésimes Etalab indisponible (${res.status})`);
  const html = await res.text();
  const dates = Array.from(html.matchAll(/href="[^"]*?(\d{4}-\d{2}-\d{2})\/"/g), (m) => m[1]);
  return Array.from(new Set(dates)).sort().reverse();
}

function departementDe(codeInsee: string): string {
  return codeInsee.startsWith("97") ? codeInsee.slice(0, 3) : codeInsee.slice(0, 2);
}

const cache = new Map<string, Map<string, Surface> | null>();

// Parcelles d'une commune à un millésime, indexées par IDU (section sur 2 caractères).
// null si le fichier n'existe pas (commune créée ou fusionnée depuis).
export async function parcellesCommune(
  millesime: string,
  codeInsee: string,
): Promise<Map<string, Surface> | null> {
  const cle = `${millesime}/${codeInsee}`;
  if (cache.has(cle)) return cache.get(cle);

  const url =
    `${BASE_URL}/${millesime}/geojson/communes/${departementDe(codeInsee)}/${codeInsee}/` +
    `cadastre-${codeInsee}-parcelles.json.gz`;
  const res = await fetchAvecTimeout(url);
  if (!res.ok) {
    cache.set(cle, null);
    return null;
  }

  const brut = Buffer.from(await res.arrayBuffer());
  // Selon le serveur, le contenu arrive compressé ou déjà décompressé par fetch
  const json = brut[0] === 0x1f && brut[1] === 0x8b ? gunzipSync(brut) : brut;
  const collection = JSON.parse(json.toString("utf-8")) as FeatureCollection<
    Polygon | MultiPolygon,
    { id: string }
  >;

  const index = new Map<string, Surface>();
  for (const feature of collection.features) {
    index.set(feature.properties.id, feature as Surface);
  }
  cache.set(cle, index);
  return index;
}
