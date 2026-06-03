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
  return Array.from(map.values());
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
