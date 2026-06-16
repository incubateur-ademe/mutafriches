// Liens vers le cadastre IGN (Géoportail), partagés par les onglets du diagnostic.
export const CADASTRE_LAYER = "CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)";

export const LIEN_CADASTRE = `https://www.geoportail.gouv.fr/carte?l0=${CADASTRE_LAYER}`;

export const lienGeoportail = ([lon, lat]: [number, number], zoom: number): string =>
  `https://www.geoportail.gouv.fr/carte?c=${lon},${lat}&z=${zoom}&l0=${CADASTRE_LAYER}`;
