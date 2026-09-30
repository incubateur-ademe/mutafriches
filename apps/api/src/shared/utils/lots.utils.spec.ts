import { describe, it, expect } from "vitest";
import { mapParLots } from "./lots.utils";

describe("mapParLots", () => {
  it("devrait préserver l'ordre des résultats quel que soit l'ordre de résolution", async () => {
    const resoudre = new Map<number, (valeur: number) => void>();
    const resultats = mapParLots(
      [3, 1, 2],
      3,
      (n: number) => new Promise<number>((resolve) => resoudre.set(n, resolve)),
    );

    resoudre.get(2)?.(20);
    resoudre.get(1)?.(10);
    resoudre.get(3)?.(30);

    expect(await resultats).toEqual([30, 10, 20]);
  });

  it("ne devrait jamais dépasser la taille de lot en simultané", async () => {
    let enCours = 0;
    let maximum = 0;

    await mapParLots(
      Array.from({ length: 25 }, (_, i) => i),
      10,
      async () => {
        enCours += 1;
        maximum = Math.max(maximum, enCours);
        await new Promise((resolve) => setTimeout(resolve, 1));
        enCours -= 1;
      },
    );

    expect(maximum).toBe(10);
  });

  it("devrait propager la première erreur", async () => {
    await expect(
      mapParLots([1, 2], 2, async (n: number) => {
        if (n === 2) throw new Error("échec");
        return n;
      }),
    ).rejects.toThrow("échec");
  });

  it("devrait renvoyer un tableau vide sans élément", async () => {
    expect(await mapParLots([], 10, async (n: number) => n)).toEqual([]);
  });
});
