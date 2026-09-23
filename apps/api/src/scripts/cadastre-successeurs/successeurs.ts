import { area } from "@turf/area";
import { intersect } from "@turf/intersect";
import { union } from "@turf/union";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export type Surface = Feature<Polygon | MultiPolygon, { id: string }>;

// Part minimale d'une parcelle actuelle comprise dans l'emprise historique du site pour la
// retenir. Sous ce seuil, elle déborde surtout sur le voisinage (fusion avec une parcelle tierce).
export const SEUIL_INCLUSION = 0.5;

export interface Successeur {
  id: string;
  surfaceM2: number;
  partDansSite: number; // 0..1
}

export interface ResultatSuccession {
  successeurs: Successeur[];
  ecartes: Successeur[]; // intersectent la parcelle disparue mais débordent du site
  couverture: number; // part de la surface disparue couverte par les successeurs retenus
}

type Bbox = [number, number, number, number];

function bbox(f: Feature<Polygon | MultiPolygon>): Bbox {
  const anneaux =
    f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat();
  const b: Bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of anneaux.flat()) {
    b[0] = Math.min(b[0], x);
    b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x);
    b[3] = Math.max(b[3], y);
  }
  return b;
}

function bboxSeCroisent(a: Bbox, b: Bbox): boolean {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

function aire(f: Feature<Polygon | MultiPolygon> | null): number {
  return f ? area(f) : 0;
}

function intersection(
  a: Feature<Polygon | MultiPolygon>,
  b: Feature<Polygon | MultiPolygon>,
): Feature<Polygon | MultiPolygon> | null {
  return intersect({ type: "FeatureCollection", features: [a, b] });
}

export function unir(surfaces: Surface[]): Feature<Polygon | MultiPolygon> | null {
  if (surfaces.length === 0) return null;
  if (surfaces.length === 1) return surfaces[0];
  return union({ type: "FeatureCollection", features: surfaces });
}

// Parcelles actuelles qui remplacent les parcelles disparues d'un site, par recouvrement.
// empriseHistorique : union de toutes les parcelles du site au dernier millésime connu.
export function calculerSuccesseurs(
  disparues: Surface[],
  empriseHistorique: Feature<Polygon | MultiPolygon>,
  actuelles: Surface[],
  dejaPresentes: Set<string>,
): ResultatSuccession {
  const zoneDisparue = unir(disparues);
  if (!zoneDisparue) return { successeurs: [], ecartes: [], couverture: 0 };

  const bboxDisparue = bbox(zoneDisparue);
  const successeurs: Successeur[] = [];
  const ecartes: Successeur[] = [];
  const retenues: Surface[] = [];

  for (const parcelle of actuelles) {
    if (dejaPresentes.has(parcelle.properties.id)) continue;
    if (!bboxSeCroisent(bbox(parcelle), bboxDisparue)) continue;
    // Recouvrement négligeable (< 1 m²) : simple contact de bord
    if (aire(intersection(parcelle, zoneDisparue)) < 1) continue;

    const surfaceM2 = aire(parcelle);
    const partDansSite =
      surfaceM2 > 0 ? aire(intersection(parcelle, empriseHistorique)) / surfaceM2 : 0;
    const candidat = { id: parcelle.properties.id, surfaceM2, partDansSite };
    if (partDansSite >= SEUIL_INCLUSION) {
      successeurs.push(candidat);
      retenues.push(parcelle);
    } else {
      ecartes.push(candidat);
    }
  }

  const unionRetenues = unir(retenues);
  const couverture = unionRetenues
    ? aire(intersection(unionRetenues, zoneDisparue)) / aire(zoneDisparue)
    : 0;

  return { successeurs, ecartes, couverture };
}
