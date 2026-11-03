import { sanitizeCodeInsee } from "@mutafriches/shared-types";
import { mapParLots } from "../../shared/utils/lots.utils";
import type {
  ResultatRafraichissement,
  StatutRafraichissement,
} from "../../attributaire/attributaire.service";

/** Calcul pur et lectures en base : quelques sites de front suffisent. */
const CONCURRENCE = 4;

export interface OptionsPeuplement {
  codeInsee?: string;
  dryRun: boolean;
  /** Postdeploy : tout si la table est vide, sinon les lignes d'une ancienne version d'algo. */
  siNecessaire: boolean;
}

export interface DependancesPeuplement {
  compter: () => Promise<number>;
  listerPerimetre: (codeInsee?: string) => Promise<string[][]>;
  listerHorsVersionCourante: () => Promise<string[][]>;
  rafraichir: (parcelles: string[]) => Promise<ResultatRafraichissement>;
}

export interface BilanPeuplement {
  mode: "complet" | "commune" | "version" | "aucun";
  traites: number;
  parStatut: Record<StatutRafraichissement | "erreur", number>;
  ecartes: { cle: string; motif: string }[];
}

export function parserOptions(argv: string[]): OptionsPeuplement {
  const options: OptionsPeuplement = { dryRun: false, siNecessaire: false };

  for (const argument of argv) {
    if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--si-necessaire") {
      options.siNecessaire = true;
    } else if (argument.startsWith("--commune=")) {
      const codeInsee = sanitizeCodeInsee(argument.slice("--commune=".length).toUpperCase());
      if (!codeInsee) throw new Error(`Code INSEE invalide : ${argument}`);
      options.codeInsee = codeInsee;
    } else {
      throw new Error(`Option inconnue : ${argument}`);
    }
  }

  if (options.siNecessaire && options.codeInsee) {
    throw new Error("--si-necessaire et --commune ne se combinent pas");
  }
  return options;
}

async function choisirPerimetre(
  options: OptionsPeuplement,
  deps: DependancesPeuplement,
): Promise<{ mode: BilanPeuplement["mode"]; sites: string[][] }> {
  if (options.codeInsee) {
    return { mode: "commune", sites: await deps.listerPerimetre(options.codeInsee) };
  }
  if (options.siNecessaire && (await deps.compter()) > 0) {
    const sites = await deps.listerHorsVersionCourante();
    return { mode: sites.length > 0 ? "version" : "aucun", sites };
  }
  return { mode: "complet", sites: await deps.listerPerimetre() };
}

export async function peupler(
  options: OptionsPeuplement,
  deps: DependancesPeuplement,
  onProgression?: (traites: number, total: number) => void,
): Promise<BilanPeuplement> {
  const { mode, sites } = await choisirPerimetre(options, deps);
  const bilan: BilanPeuplement = {
    mode,
    traites: 0,
    parStatut: {
      "a-jour": 0,
      "hors-perimetre": 0,
      "sans-enrichissement": 0,
      ecarte: 0,
      erreur: 0,
    },
    ecartes: [],
  };

  await mapParLots(sites, CONCURRENCE, async (parcelles) => {
    try {
      const resultat = await deps.rafraichir(parcelles);
      bilan.parStatut[resultat.statut] += 1;
      if (resultat.statut === "ecarte" || resultat.statut === "sans-enrichissement") {
        bilan.ecartes.push({
          cle: resultat.cle,
          motif: resultat.motif ?? "Aucun enrichissement en base",
        });
      }
    } catch (error: unknown) {
      bilan.parStatut.erreur += 1;
      bilan.ecartes.push({
        cle: parcelles.join(","),
        motif: error instanceof Error ? error.message : String(error),
      });
    }
    bilan.traites += 1;
    onProgression?.(bilan.traites, sites.length);
  });

  return bilan;
}
