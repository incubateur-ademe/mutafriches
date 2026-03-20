import { AlgorithmeConfig } from "../algorithme.types";
import * as v11 from "./v1.1";
import * as v12 from "./v1.2";
import * as v13 from "./v1.3";
import * as v14 from "./v1.4";

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
    label: "Zone urba + ENR + risques inondations (version actuelle)",
    date: "2026-03-01",
    poidsCriteres: v14.POIDS_CRITERES as unknown as Record<string, number>,
    matriceScoring: v14.MATRICE_SCORING as unknown as Record<string, number>,
  },
];

export const VERSION_COURANTE = "v1.4";

export function getAlgorithmeConfig(version: string): AlgorithmeConfig | undefined {
  return ALGORITHME_VERSIONS.find((v) => v.version === version);
}
