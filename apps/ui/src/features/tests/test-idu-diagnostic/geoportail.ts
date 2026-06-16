// Liens vers le cadastre, partagés par les onglets du diagnostic.
//
// Note : le permalink Géoportail ne sait que centrer/zoomer/choisir des couches — il n'existe
// aucun paramètre d'URL pour surligner une parcelle précise. On centre donc sur le centroïde,
// au zoom max, avec l'ortho en fond et le cadastre en surimpression : la parcelle est alors
// plein centre, son contour et son numéro bien visibles.
const ORTHO_LAYER = "ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)";
export const CADASTRE_LAYER = "CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)";

// Lien général (entête de page) : cadastre seul, sans centrage
export const LIEN_CADASTRE = `https://www.geoportail.gouv.fr/carte?l0=${CADASTRE_LAYER}`;

// Lien Géoportail centré sur une parcelle (ortho + cadastre en surimpression)
export const lienGeoportail = ([lon, lat]: [number, number], zoom: number): string =>
  `https://www.geoportail.gouv.fr/carte?c=${lon},${lat}&z=${zoom}` +
  `&l0=${ORTHO_LAYER}&l1=${CADASTRE_LAYER}&permalink=yes`;
