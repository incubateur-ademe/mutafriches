import { describe, it, expect, vi } from "vitest";
import {
  parserOptions,
  peupler,
  type DependancesPeuplement,
  type OptionsPeuplement,
} from "./peupler-attributaire.core";

const SITES = [["77305000AN0068"], ["77305000AV0499", "77305000AV0500"]];

function dependances(surcharge: Partial<DependancesPeuplement> = {}): DependancesPeuplement {
  return {
    compter: vi.fn().mockResolvedValue(0),
    listerPerimetre: vi.fn().mockResolvedValue(SITES),
    listerHorsVersionCourante: vi.fn().mockResolvedValue([]),
    rafraichir: vi
      .fn()
      .mockImplementation((parcelles: string[]) =>
        Promise.resolve({ cle: parcelles.join(","), statut: "a-jour" }),
      ),
    ...surcharge,
  };
}

const PAR_DEFAUT: OptionsPeuplement = { dryRun: false, siNecessaire: false };

describe("parserOptions", () => {
  it("lit la commune, le dry-run et le mode déploiement", () => {
    expect(parserOptions(["--commune=2a004", "--dry-run"])).toEqual({
      codeInsee: "2A004",
      dryRun: true,
      siNecessaire: false,
    });
    expect(parserOptions(["--si-necessaire"]).siNecessaire).toBe(true);
  });

  it("refuse une option inconnue, un code invalide ou une combinaison incohérente", () => {
    expect(() => parserOptions(["--force"])).toThrow("Option inconnue");
    expect(() => parserOptions(["--commune=7730"])).toThrow("Code INSEE invalide");
    expect(() => parserOptions(["--si-necessaire", "--commune=77305"])).toThrow();
  });
});

describe("peupler", () => {
  it("traite tout le périmètre par défaut", async () => {
    const deps = dependances();

    const bilan = await peupler(PAR_DEFAUT, deps);

    expect(bilan.mode).toBe("complet");
    expect(deps.listerPerimetre).toHaveBeenCalledWith();
    expect(bilan.parStatut["a-jour"]).toBe(2);
  });

  it("restreint à une commune", async () => {
    const deps = dependances();

    const bilan = await peupler({ ...PAR_DEFAUT, codeInsee: "77305" }, deps);

    expect(bilan.mode).toBe("commune");
    expect(deps.listerPerimetre).toHaveBeenCalledWith("77305");
  });

  it("au déploiement, remplit une table vide", async () => {
    const deps = dependances();

    const bilan = await peupler({ ...PAR_DEFAUT, siNecessaire: true }, deps);

    expect(bilan.mode).toBe("complet");
    expect(deps.listerHorsVersionCourante).not.toHaveBeenCalled();
  });

  it("au déploiement, ne recalcule que les lignes d'une ancienne version", async () => {
    const deps = dependances({
      compter: vi.fn().mockResolvedValue(1680),
      listerHorsVersionCourante: vi.fn().mockResolvedValue([SITES[0]]),
    });

    const bilan = await peupler({ ...PAR_DEFAUT, siNecessaire: true }, deps);

    expect(bilan.mode).toBe("version");
    expect(bilan.traites).toBe(1);
    expect(deps.listerPerimetre).not.toHaveBeenCalled();
  });

  it("au déploiement, ne fait rien si tout est à jour", async () => {
    const deps = dependances({ compter: vi.fn().mockResolvedValue(1680) });

    const bilan = await peupler({ ...PAR_DEFAUT, siNecessaire: true }, deps);

    expect(bilan.mode).toBe("aucun");
    expect(deps.rafraichir).not.toHaveBeenCalled();
  });

  it("compte les sites écartés et les erreurs sans s'interrompre", async () => {
    const deps = dependances({
      rafraichir: vi
        .fn()
        .mockResolvedValueOnce({ cle: "a", statut: "sans-enrichissement" })
        .mockRejectedValueOnce(new Error("calcul impossible")),
    });

    const bilan = await peupler(PAR_DEFAUT, deps);

    expect(bilan.parStatut["sans-enrichissement"]).toBe(1);
    expect(bilan.parStatut.erreur).toBe(1);
    expect(bilan.ecartes.map((e) => e.motif)).toEqual([
      "Aucun enrichissement en base",
      "calcul impossible",
    ]);
  });
});
