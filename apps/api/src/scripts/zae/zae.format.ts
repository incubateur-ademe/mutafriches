// Validation du référentiel commité des zones d'activité économique Fusac (ADR-0049).

// ~45 000 ZAE en métropole : en dessous, fichier tronqué ou filtre modifié
export const MIN_ZAE_ATTENDUES = 40000;

export interface ZaeFeature {
  type: "Feature";
  properties: { id: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

export interface ZaeCollection {
  type: "FeatureCollection";
  features: ZaeFeature[];
}

interface FeatureBrute {
  properties?: { id?: unknown; site_id?: unknown } | null;
  geometry?: { type?: unknown; coordinates?: unknown } | null;
}

function versFeature(feature: FeatureBrute, index: number): ZaeFeature {
  const id = String(feature.properties?.id ?? feature.properties?.site_id ?? "").trim();
  if (id === "") {
    throw new Error(`Site ${index} : identifiant manquant`);
  }

  const type = feature.geometry?.type;
  if (!feature.geometry?.coordinates || (type !== "Polygon" && type !== "MultiPolygon")) {
    throw new Error(`Site ${id} : géométrie manquante ou non surfacique`);
  }

  return {
    type: "Feature",
    properties: { id },
    geometry: { type, coordinates: feature.geometry.coordinates },
  };
}

// Normalise et valide un GeoJSON issu d'ogr2ogr ou du fichier commité ; trié par identifiant
// pour qu'une régénération sans changement produise un fichier identique.
export function validerCollection(contenu: unknown): ZaeCollection {
  const brutes = (contenu as { features?: unknown })?.features;
  if (!Array.isArray(brutes)) {
    throw new Error("Format inattendu : features absent");
  }

  const features = brutes
    .map((f: unknown, index: number) => versFeature(f as FeatureBrute, index))
    .sort((a, b) => a.properties.id.localeCompare(b.properties.id));

  if (features.length < MIN_ZAE_ATTENDUES) {
    throw new Error(
      `Fichier suspect : ${features.length} sites, minimum attendu ${MIN_ZAE_ATTENDUES}`,
    );
  }

  const doublons = features.length - new Set(features.map((f) => f.properties.id)).size;
  if (doublons > 0) {
    throw new Error(`Fichier invalide : ${doublons} identifiants en double`);
  }

  return { type: "FeatureCollection", features };
}
