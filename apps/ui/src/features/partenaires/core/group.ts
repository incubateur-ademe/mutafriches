import type { PartnerParcelle, PartnerSite } from "./types";

// Regroupe les parcelles partageant un même idtup en un site unique.
export function groupByIdtup(parcelles: PartnerParcelle[]): PartnerSite[] {
  const map = new Map<string, PartnerSite>();
  for (const p of parcelles) {
    const existing = map.get(p.idtup);
    if (existing) {
      existing.parcelles.push(p.idpar);
    } else {
      map.set(p.idtup, { idtup: p.idtup, commune: p.commune, parcelles: [p.idpar] });
    }
  }
  // Libellé d'affichage des sites multi-parcelles : la première parcelle (le badge donne le nombre).
  // L'idtup synthétique (ex. "aura-04") reste l'identifiant technique mais n'est plus affiché.
  const sites = Array.from(map.values());
  for (const site of sites) {
    if (site.parcelles.length > 1) {
      site.nom = site.parcelles[0];
    }
  }
  return sites;
}

export function groupByCommune(sites: PartnerSite[]): Record<string, PartnerSite[]> {
  const result: Record<string, PartnerSite[]> = {};
  for (const site of sites) {
    if (!result[site.commune]) {
      result[site.commune] = [];
    }
    result[site.commune].push(site);
  }
  return result;
}
