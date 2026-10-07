import { describe, expect, it, vi } from "vitest";
import type { ImportDatasetDefinition } from "../../donnees-externes/imports.registry";
import { codeSortie, importerTout, parserOptions, DependancesImportAll } from "./import-all.core";

const dataset = (
  key: string,
  source: ImportDatasetDefinition["source"] = "fichier",
): ImportDatasetDefinition => ({
  key,
  label: key,
  datasetNamePattern: key,
  countTable: `raw_${key}`,
  docUrl: "https://exemple.fr",
  script: `import-${key}`,
  source,
});

const DATASETS = [dataset("a"), dataset("b", "reseau"), dataset("c")];
const AUCUNE = { force: [], only: [], strict: false };

function dependances(
  lignes: Record<string, number>,
  echecs: string[] = [],
): DependancesImportAll & { lancerScript: ReturnType<typeof vi.fn> } {
  return {
    compterLignes: vi.fn((table: string) => Promise.resolve(lignes[table] ?? 0)),
    lancerScript: vi.fn((script: string) => ({
      ok: !echecs.includes(script),
      sortie: "derniere ligne",
      dureeMs: 1500,
    })),
  };
}

describe("importerTout", () => {
  it("ignore les tables remplies et importe les tables vides", async () => {
    const deps = dependances({ raw_a: 10, raw_b: 0, raw_c: 5 });

    const resultats = await importerTout(DATASETS, AUCUNE, deps);

    expect(resultats.map((r) => [r.key, r.statut])).toEqual([
      ["a", "ignore"],
      ["b", "importe"],
      ["c", "ignore"],
    ]);
    expect(deps.lancerScript).toHaveBeenCalledTimes(1);
    expect(deps.lancerScript).toHaveBeenCalledWith("import-b");
  });

  it("n'écrase rien quand tout est déjà présent", async () => {
    const deps = dependances({ raw_a: 1, raw_b: 1, raw_c: 1 });

    await importerTout(DATASETS, AUCUNE, deps);

    expect(deps.lancerScript).not.toHaveBeenCalled();
  });

  it("poursuit après un échec pour ne pas priver les autres référentiels", async () => {
    const deps = dependances({}, ["import-a"]);

    const resultats = await importerTout(DATASETS, AUCUNE, deps);

    expect(resultats.map((r) => r.statut)).toEqual(["echec", "importe", "importe"]);
    expect(resultats[0].detail).toContain("derniere ligne");
  });

  it("réimporte un référentiel présent avec --force", async () => {
    const deps = dependances({ raw_a: 10, raw_b: 10, raw_c: 10 });

    const resultats = await importerTout(DATASETS, { ...AUCUNE, force: ["b"] }, deps);

    expect(resultats.map((r) => r.statut)).toEqual(["ignore", "importe", "ignore"]);
  });

  it("ne traite que les clés demandées avec --only", async () => {
    const deps = dependances({});

    const resultats = await importerTout(DATASETS, { ...AUCUNE, only: ["c"] }, deps);

    expect(resultats.map((r) => r.key)).toEqual(["c"]);
  });

  it("signale un échec, sans lancer le script, si la table est illisible", async () => {
    const deps = dependances({});
    deps.compterLignes = vi.fn().mockRejectedValue(new Error('relation "raw_a" does not exist'));

    const resultats = await importerTout([dataset("a")], AUCUNE, deps);

    expect(resultats[0].statut).toBe("echec");
    expect(resultats[0].detail).toContain("migration");
    expect(deps.lancerScript).not.toHaveBeenCalled();
  });
});

describe("codeSortie", () => {
  const echec = [{ key: "a", statut: "echec" as const, detail: "", source: "fichier" as const }];

  it("ne bloque pas le déploiement par défaut", () => {
    expect(codeSortie(echec, false)).toBe(0);
  });

  it("sort en erreur avec --strict", () => {
    expect(codeSortie(echec, true)).toBe(1);
  });

  it("reste à 0 en --strict quand tout passe", () => {
    expect(codeSortie([{ ...echec[0], statut: "importe" }], true)).toBe(0);
  });
});

describe("parserOptions", () => {
  const cles = ["a", "b", "c"];

  it("lit --force, --only et --strict", () => {
    expect(parserOptions(["--force=a,b", "--only=c", "--strict"], cles)).toEqual({
      force: ["a", "b"],
      only: ["c"],
      strict: true,
    });
  });

  it("refuse une clé inconnue plutôt que de l'ignorer en silence", () => {
    expect(() => parserOptions(["--force=zzz"], cles)).toThrow(/inconnu/);
  });

  it("refuse une option inconnue", () => {
    expect(() => parserOptions(["--tout"], cles)).toThrow(/Option inconnue/);
  });
});
