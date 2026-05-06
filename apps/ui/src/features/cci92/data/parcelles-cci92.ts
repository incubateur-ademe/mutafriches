export interface CCI92Parcelle {
  idpar: string;
  commune: string;
  idtup: string;
}

export interface CCI92Site {
  idtup: string;
  commune: string;
  parcelles: string[];
}

const PARCELLES_CCI92: CCI92Parcelle[] = [
  { idpar: "920250000B0203", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0206", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0245", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0259", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0253", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0254", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "920250000B0260", commune: "COLOMBES", idtup: "uf920250027182" },
  { idpar: "92025000BY0265", commune: "COLOMBES", idtup: "92025000BY0265" },
  { idpar: "920360000E0031", commune: "GENNEVILLIERS", idtup: "920360000E0031" },
  { idpar: "920360000E0064", commune: "GENNEVILLIERS", idtup: "920360000E0064" },
  { idpar: "920360000E0137", commune: "GENNEVILLIERS", idtup: "920360000E0137" },
  { idpar: "920360000J0440", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000J0001", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000J0003", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000J0007", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000J0008", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000J0009", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000J0010", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000J0247", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000J0451", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000J0461", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000K0080", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000K0083", commune: "GENNEVILLIERS", idtup: "uf920360029310" },
  { idpar: "920360000K0255", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000K0282", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000L0162", commune: "GENNEVILLIERS", idtup: "uf920360030903" },
  { idpar: "920360000L0163", commune: "GENNEVILLIERS", idtup: "920360000L0163" },
  { idpar: "920360000L0164", commune: "GENNEVILLIERS", idtup: "920360000L0164" },
  { idpar: "920360000L0266", commune: "GENNEVILLIERS", idtup: "920360000L0266" },
  { idpar: "920360000N0111", commune: "GENNEVILLIERS", idtup: "uf920360007881" },
  { idpar: "920360000N0144", commune: "GENNEVILLIERS", idtup: "uf920360007881" },
  { idpar: "920360000N0146", commune: "GENNEVILLIERS", idtup: "uf920360007881" },
  { idpar: "920360000N0148", commune: "GENNEVILLIERS", idtup: "uf920360007881" },
  { idpar: "920360000N0155", commune: "GENNEVILLIERS", idtup: "uf920360007881" },
  { idpar: "920360000O0117", commune: "GENNEVILLIERS", idtup: "920360000O0117" },
  { idpar: "92036000AN0035", commune: "GENNEVILLIERS", idtup: "uf920360030900" },
  { idpar: "92036000AN0067", commune: "GENNEVILLIERS", idtup: "uf920360030900" },
  { idpar: "92036000AN0070", commune: "GENNEVILLIERS", idtup: "uf920360030900" },
  { idpar: "920500000D0085", commune: "NANTERRE", idtup: "920500000D0085" },
  { idpar: "920500000K0002", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000K0059", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000L0027", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000L0029", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000L0031", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000L0033", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000L0055", commune: "NANTERRE", idtup: "uf920500010227" },
  { idpar: "920500000N0559", commune: "NANTERRE", idtup: "uf920500026067" },
  { idpar: "920500000N0560", commune: "NANTERRE", idtup: "uf920500026067" },
  { idpar: "920500000N0562", commune: "NANTERRE", idtup: "uf920500026067" },
];

function groupByIdtup(parcelles: CCI92Parcelle[]): CCI92Site[] {
  const map = new Map<string, CCI92Site>();
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

function groupByCommune(sites: CCI92Site[]): Record<string, CCI92Site[]> {
  const result: Record<string, CCI92Site[]> = {};
  for (const site of sites) {
    if (!result[site.commune]) {
      result[site.commune] = [];
    }
    result[site.commune].push(site);
  }
  return result;
}

export const CCI92_SITES: CCI92Site[] = groupByIdtup(PARCELLES_CCI92);

export const CCI92_SITES_BY_COMMUNE: Record<string, CCI92Site[]> = groupByCommune(CCI92_SITES);
