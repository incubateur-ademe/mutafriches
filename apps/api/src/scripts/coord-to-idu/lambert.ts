import proj4 from "proj4";

// Définition Lambert-93 (EPSG:2154), le système projeté officiel de la France métropolitaine.
const LAMBERT_93 =
  "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 " +
  "+x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

export interface Wgs84 {
  longitude: number;
  latitude: number;
}

// Reprojette un point Lambert-93 (mètres) en WGS84 (degrés lon/lat).
export function lambert93ToWgs84(x: number, y: number): Wgs84 {
  const [longitude, latitude] = proj4(LAMBERT_93, WGS84, [x, y]) as [number, number];
  return { longitude, latitude };
}
