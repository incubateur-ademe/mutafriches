// Conversion et validation de la carte Enedis des zones de contrainte EnR (ADR-0046).

/** Statuts publiés par Enedis. Un statut inconnu signale un changement de format. */
export const STATUTS_ZONE_CONTRAINTE_ENR = [
  "TRES_FAVORABLE",
  "FAVORABLE",
  "EN_TENSION",
  "SATUREE",
  "ELD",
] as const;

export type StatutZoneContrainteEnr = (typeof STATUTS_ZONE_CONTRAINTE_ENR)[number];

// ~2 300 zones de postes sources : en dessous, fichier tronqué ou format modifié
export const MIN_ZONES_ATTENDUES = 2000;

// 5 décimales = ~1 m, largement suffisant pour des zones de plusieurs km²
export const PRECISION_COORDONNEES = 5;

export interface ZoneContrainteEnrFeature {
  type: "Feature";
  properties: { id: string; statut: StatutZoneContrainteEnr };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

export interface ZonesContrainteEnrCollection {
  type: "FeatureCollection";
  features: ZoneContrainteEnrFeature[];
}

export interface ChangementStatut {
  id: string;
  avant: StatutZoneContrainteEnr | null;
  apres: StatutZoneContrainteEnr | null;
}

interface ZoneCapca {
  id?: unknown;
  status?: unknown;
  geometry?: { type?: unknown; coordinates?: unknown } | null;
}

function arrondir(coordonnees: unknown): unknown {
  if (typeof coordonnees === "number") {
    const facteur = 10 ** PRECISION_COORDONNEES;
    return Math.round(coordonnees * facteur) / facteur;
  }
  if (Array.isArray(coordonnees)) {
    return coordonnees.map((c: unknown) => arrondir(c));
  }
  throw new Error("Coordonnées non numériques");
}

function versFeature(cle: string, zone: ZoneCapca): ZoneContrainteEnrFeature {
  const id = String(zone.id ?? cle).trim();
  if (id === "") {
    throw new Error(`Zone ${cle} : identifiant manquant`);
  }

  const statut = String(zone.status ?? "").trim();
  if (!(STATUTS_ZONE_CONTRAINTE_ENR as readonly string[]).includes(statut)) {
    throw new Error(`Zone ${id} : statut inconnu « ${statut} »`);
  }

  const type = zone.geometry?.type;
  if (!zone.geometry?.coordinates || (type !== "Polygon" && type !== "MultiPolygon")) {
    throw new Error(`Zone ${id} : géométrie manquante ou non surfacique`);
  }

  return {
    type: "Feature",
    properties: { id, statut: statut as StatutZoneContrainteEnr },
    geometry: { type, coordinates: arrondir(zone.geometry.coordinates) },
  };
}

function verifierVolume(collection: ZonesContrainteEnrCollection): ZonesContrainteEnrCollection {
  if (collection.features.length < MIN_ZONES_ATTENDUES) {
    throw new Error(
      `Fichier suspect : ${collection.features.length} zones, minimum attendu ${MIN_ZONES_ATTENDUES}`,
    );
  }
  return collection;
}

// Convertit le `capca.json` brut de la carte Enedis ; lève si le fichier est inexploitable.
export function convertirCapca(fichier: unknown): ZonesContrainteEnrCollection {
  const zones = (fichier as { data?: { geo_status_data?: Record<string, ZoneCapca> } })?.data
    ?.geo_status_data;
  if (!zones || typeof zones !== "object") {
    throw new Error("Format inattendu : data.geo_status_data absent");
  }

  // Tri par identifiant : une régénération sans changement produit un fichier identique
  const features = Object.entries(zones)
    .map(([cle, zone]) => versFeature(cle, zone))
    .sort((a, b) => a.properties.id.localeCompare(b.properties.id));

  return verifierVolume({ type: "FeatureCollection", features });
}

// Revalide le GeoJSON commité avant import (fichier édité à la main, tronqué...).
export function validerCollection(contenu: unknown): ZonesContrainteEnrCollection {
  const features = (contenu as { features?: unknown })?.features;
  if (!Array.isArray(features)) {
    throw new Error("Format inattendu : features absent");
  }

  const zones = features.map((f: unknown, index: number) => {
    const feature = f as {
      properties?: { id?: unknown; statut?: unknown };
      geometry?: ZoneCapca["geometry"];
    };
    return versFeature(String(index), {
      id: feature.properties?.id,
      status: feature.properties?.statut,
      geometry: feature.geometry,
    });
  });

  return verifierVolume({ type: "FeatureCollection", features: zones });
}

// Zones dont le statut change, apparaissent (avant = null) ou disparaissent (après = null).
export function comparerStatuts(
  ancienne: ZonesContrainteEnrCollection | null,
  nouvelle: ZonesContrainteEnrCollection,
): ChangementStatut[] {
  const statutsParId = (collection: ZonesContrainteEnrCollection | null) =>
    new Map((collection?.features ?? []).map((f) => [f.properties.id, f.properties.statut]));
  const avant = statutsParId(ancienne);
  const apres = statutsParId(nouvelle);

  const ids = [...new Set([...avant.keys(), ...apres.keys()])].sort((a, b) => a.localeCompare(b));
  return ids
    .map((id) => ({ id, avant: avant.get(id) ?? null, apres: apres.get(id) ?? null }))
    .filter((c) => c.avant !== c.apres);
}

export function compterParStatut(
  collection: ZonesContrainteEnrCollection,
): Record<StatutZoneContrainteEnr, number> {
  const compte = Object.fromEntries(STATUTS_ZONE_CONTRAINTE_ENR.map((s) => [s, 0])) as Record<
    StatutZoneContrainteEnr,
    number
  >;
  for (const f of collection.features) {
    compte[f.properties.statut] += 1;
  }
  return compte;
}
