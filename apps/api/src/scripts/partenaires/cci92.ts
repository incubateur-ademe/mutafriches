import { SitePrefetch } from "./types";

// Liste statique miroir de la data UI, regroupée par idtup
// (apps/ui/src/features/partenaires/partners/cci92/parcelles.ts).
// Si la liste change côté UI, mettre à jour ici aussi.
export const CCI92_SITES: SitePrefetch[] = [
  {
    idtup: "uf920250027182",
    commune: "COLOMBES",
    parcelles: [
      "920250000B0203",
      "920250000B0206",
      "920250000B0245",
      "920250000B0259",
      "920250000B0253",
      "920250000B0254",
      "920250000B0260",
    ],
  },
  { idtup: "92025000BY0265", commune: "COLOMBES", parcelles: ["92025000BY0265"] },
  { idtup: "920360000E0031", commune: "GENNEVILLIERS", parcelles: ["920360000E0031"] },
  { idtup: "920360000E0064", commune: "GENNEVILLIERS", parcelles: ["920360000E0064"] },
  { idtup: "920360000E0137", commune: "GENNEVILLIERS", parcelles: ["920360000E0137"] },
  {
    idtup: "uf920360030903",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000J0440",
      "920360000J0001",
      "920360000J0003",
      "920360000J0451",
      "920360000J0461",
      "920360000K0255",
      "920360000K0282",
      "920360000L0162",
    ],
  },
  {
    idtup: "uf920360029310",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000J0007",
      "920360000J0008",
      "920360000J0009",
      "920360000J0010",
      "920360000J0247",
      "920360000K0080",
      "920360000K0083",
    ],
  },
  { idtup: "920360000L0163", commune: "GENNEVILLIERS", parcelles: ["920360000L0163"] },
  { idtup: "920360000L0164", commune: "GENNEVILLIERS", parcelles: ["920360000L0164"] },
  { idtup: "920360000L0266", commune: "GENNEVILLIERS", parcelles: ["920360000L0266"] },
  {
    idtup: "uf920360007881",
    commune: "GENNEVILLIERS",
    parcelles: [
      "920360000N0111",
      "920360000N0144",
      "920360000N0146",
      "920360000N0148",
      "920360000N0155",
    ],
  },
  { idtup: "920360000O0117", commune: "GENNEVILLIERS", parcelles: ["920360000O0117"] },
  {
    idtup: "uf920360030900",
    commune: "GENNEVILLIERS",
    parcelles: ["92036000AN0035", "92036000AN0067", "92036000AN0070"],
  },
  { idtup: "920500000D0085", commune: "NANTERRE", parcelles: ["920500000D0085"] },
  {
    idtup: "uf920500010227",
    commune: "NANTERRE",
    parcelles: [
      "920500000K0002",
      "920500000K0059",
      "920500000L0027",
      "920500000L0029",
      "920500000L0031",
      "920500000L0033",
      "920500000L0055",
    ],
  },
  {
    idtup: "uf920500026067",
    commune: "NANTERRE",
    parcelles: ["920500000N0559", "920500000N0560", "920500000N0562"],
  },
];
