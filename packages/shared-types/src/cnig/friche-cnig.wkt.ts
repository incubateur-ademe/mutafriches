/**
 * Conversion des géométries GeoJSON vers le WKT attendu par le standard CNIG.
 *
 * Ordre des coordonnées : `latitude longitude`, conformément au fichier de référence du
 * standard (`cnigfr/schema-friches`, POINT(49.2527 3.9815)) — et donc à l'inverse de la
 * convention WKT usuelle. Le GeoJSON, lui, reste en `[longitude, latitude]` (RFC 7946).
 */

import type { Coordonnees, GeometrieParcelle } from "../shared/types/common.types";

/** Environ 10 cm : au-delà, la précision dépasse celle du parcellaire cadastral. */
const DECIMALES = 6;

function nombre(valeur: number): string {
  return Number(valeur.toFixed(DECIMALES)).toString();
}

function estPositionValide(position: number[]): boolean {
  return position.length >= 2 && Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

// Un anneau GeoJSON ([lon, lat]) devient une suite « lat lon » séparée par des virgules.
function anneauWkt(anneau: number[][]): string | null {
  const positions = anneau.filter(estPositionValide);
  if (positions.length < 4) return null;
  return `(${positions.map(([lon, lat]) => `${nombre(lat)} ${nombre(lon)}`).join(", ")})`;
}

function polygoneWkt(anneaux: number[][][]): string | null {
  const rendus = anneaux.map(anneauWkt).filter((a): a is string => a !== null);
  return rendus.length > 0 ? `(${rendus.join(", ")})` : null;
}

/** `geompoint` — centroïde du site. */
export function pointWkt(coordonnees: Coordonnees): string | null {
  const { latitude, longitude } = coordonnees;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `POINT(${nombre(latitude)} ${nombre(longitude)})`;
}

/** `geomsurf` — emprise du site (POLYGON ou MULTIPOLYGON). */
export function geometrieVersWkt(geometrie?: GeometrieParcelle): string | null {
  if (!geometrie) return null;

  if (geometrie.type === "Polygon") {
    const corps = polygoneWkt(geometrie.coordinates as number[][][]);
    return corps ? `POLYGON${corps}` : null;
  }

  const polygones = (geometrie.coordinates as number[][][][])
    .map(polygoneWkt)
    .filter((p): p is string => p !== null);
  return polygones.length > 0 ? `MULTIPOLYGON(${polygones.join(", ")})` : null;
}
