// Logique de `import-all` (ADR-0050), séparée du script pour être testable sans base ni processus.

import type { ImportDatasetDefinition } from "../../donnees-externes/imports.registry";

export interface OptionsImportAll {
  /** Clés à réimporter même si leur table est remplie */
  force: string[];
  /** Restreint l'exécution à ces clés (toutes si vide) */
  only: string[];
  /** Sort en erreur si un import échoue (par défaut, le déploiement n'est pas bloqué) */
  strict: boolean;
}

export type StatutImport = "importe" | "ignore" | "echec";

export interface ResultatImport {
  key: string;
  statut: StatutImport;
  detail: string;
  source: ImportDatasetDefinition["source"];
}

export interface DependancesImportAll {
  compterLignes(table: string): Promise<number>;
  lancerScript(script: string): { ok: boolean; sortie: string; dureeMs: number };
}

export function parserOptions(argv: string[], cles: readonly string[]): OptionsImportAll {
  const options: OptionsImportAll = { force: [], only: [], strict: false };

  for (const argument of argv) {
    if (argument === "--strict") {
      options.strict = true;
      continue;
    }
    const correspondance = /^--(force|only)=(.+)$/.exec(argument);
    if (!correspondance) {
      throw new Error(`Option inconnue : ${argument}`);
    }
    const valeurs = correspondance[2].split(",").map((v) => v.trim());
    const inconnues = valeurs.filter((v) => !cles.includes(v));
    if (inconnues.length > 0) {
      throw new Error(
        `Référentiel inconnu : ${inconnues.join(", ")} (valides : ${cles.join(", ")})`,
      );
    }
    options[correspondance[1] as "force" | "only"] = valeurs;
  }

  return options;
}

// Un import qui échoue n'arrête pas les suivants : une panne de data.gouv.fr ne doit pas priver
// les autres référentiels de leur import.
export async function importerTout(
  datasets: readonly ImportDatasetDefinition[],
  options: OptionsImportAll,
  dependances: DependancesImportAll,
): Promise<ResultatImport[]> {
  const resultats: ResultatImport[] = [];

  for (const dataset of datasets) {
    if (options.only.length > 0 && !options.only.includes(dataset.key)) continue;

    const base = { key: dataset.key, source: dataset.source };
    let lignes: number;
    try {
      lignes = await dependances.compterLignes(dataset.countTable);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      resultats.push({
        ...base,
        statut: "echec",
        detail: `lecture de ${dataset.countTable} impossible (migration jouée ?) : ${message}`,
      });
      continue;
    }

    if (lignes > 0 && !options.force.includes(dataset.key)) {
      resultats.push({ ...base, statut: "ignore", detail: `déjà présent (${lignes} lignes)` });
      continue;
    }

    const execution = dependances.lancerScript(dataset.script);
    const duree = `${(execution.dureeMs / 1000).toFixed(1)} s`;
    resultats.push(
      execution.ok
        ? { ...base, statut: "importe", detail: `importé en ${duree}` }
        : { ...base, statut: "echec", detail: `échec après ${duree}\n${execution.sortie}` },
    );
  }

  return resultats;
}

export function codeSortie(resultats: ResultatImport[], strict: boolean): number {
  return strict && resultats.some((r) => r.statut === "echec") ? 1 : 0;
}
