import { AlgorithmeConfig } from "../algorithme.types";
import * as v11 from "./v1.1";
import * as v12 from "./v1.2";
import * as v13 from "./v1.3";
import * as v14 from "./v1.4";
import * as v15 from "./v1.5";
import * as v16 from "./v1.6";
import * as v17 from "./v1.7";
import * as v18 from "./v1.8";
import * as v19 from "./v1.9";
import * as v110 from "./v1.10";

export const ALGORITHME_VERSIONS: AlgorithmeConfig[] = [
  {
    version: "v1.1",
    label: "Version en prod",
    date: "2025-01-15",
    poidsCriteres: v11.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v11.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.2",
    label: "Zone urba",
    date: "2025-11-01",
    poidsCriteres: v12.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v12.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.3",
    label: "Zone urba + ENR",
    date: "2026-02-01",
    poidsCriteres: v13.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v13.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.4",
    label: "Zone urba + ENR + risques inondations",
    date: "2026-03-01",
    poidsCriteres: v14.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v14.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.5",
    label: "v1.4 + espèces protégées",
    date: "2026-04-17",
    poidsCriteres: v15.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v15.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.6",
    label: "v1.5 + zone humide",
    date: "2026-04-17",
    poidsCriteres: v16.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v16.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.7",
    label: "v1.6 + zonage ABC logement",
    date: "2026-05-06",
    poidsCriteres: v17.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v17.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.8",
    label: "v1.7 + distance ITE fret",
    date: "2026-05-06",
    poidsCriteres: v18.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v18.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.9",
    label: "v1.7 + corrections PV (sans ITE fret)",
    date: "2026-05-21",
    poidsCriteres: v19.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v19.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
  {
    version: "v1.10",
    label: "v1.9 + correction unité distances (m→km)",
    date: "2026-07-09",
    poidsCriteres: v110.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v110.MATRICE_SCORING as unknown as Record<string, unknown>,
  },
];

export const VERSION_COURANTE = "v1.10";

export function getAlgorithmeConfig(version: string): AlgorithmeConfig | undefined {
  return ALGORITHME_VERSIONS.find((v) => v.version === version);
}
