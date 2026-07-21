import L from "leaflet";

/**
 * Couleur d'un marqueur de friche selon son statut, façon Cartofriches.
 * - orange : friche sans projet
 * - vert : friche avec projet ou reconvertie
 * - bleu : statut inconnu
 */
export function couleurStatut(statut: string | null): string {
  const s = (statut ?? "").toLowerCase();
  if (s.includes("sans projet")) return "#e67c00";
  if (s.includes("avec projet") || s.includes("reconvert")) return "#4c9a2a";
  return "#6a6af4";
}

/** Libellé lisible du statut */
export function libelleStatut(statut: string | null): string {
  const s = (statut ?? "").toLowerCase();
  if (s.includes("sans projet")) return "Friche sans projet";
  if (s.includes("avec projet")) return "Friche avec projet";
  if (s.includes("reconvert")) return "Friche reconvertie";
  return statut ?? "Statut inconnu";
}

// Silhouette d'usine (path FontAwesome fa-industry, viewBox 512), comme Cartofriches
const INDUSTRY_PATH =
  "M475.115 163.781L336 252.309V184c0-13.199-14.664-21.242-25.837-14.176L176 252.309V48c0-8.837-7.163-16-16-16H48c-8.837 0-16 7.163-16 16v416c0 8.837 7.163 16 16 16h416c8.837 0 16-7.163 16-16V177.943c0-12.708-14.13-20.31-24.885-14.162z";

/**
 * Marqueur en goutte (divIcon SVG) coloré selon le statut, avec l'icône usine —
 * reproduit le style des marqueurs Cartofriches sans dépendance externe.
 */
export function fricheMarkerIcon(statut: string | null, highlighted = false): L.DivIcon {
  const couleur = couleurStatut(statut);
  const scale = highlighted ? 1.2 : 1;
  const w = 26 * scale;
  const h = 40 * scale;
  const html = `
    <svg width="${w}" height="${h}" viewBox="0 0 26 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 27 13 27s13-17.25 13-27C26 5.82 20.18 0 13 0z"
            fill="${couleur}" stroke="#ffffff" stroke-width="1.5"/>
      <g transform="translate(6.2 5.8) scale(0.0262)">
        <path d="${INDUSTRY_PATH}" fill="#ffffff"/>
      </g>
    </svg>`;
  return L.divIcon({
    html,
    className: "mf-cf-marker",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    tooltipAnchor: [0, -h + 10],
  });
}
