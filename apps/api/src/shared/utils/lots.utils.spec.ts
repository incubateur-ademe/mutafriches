import { describe, it, expect } from "vitest";
import { mapParLots } from "./lots.utils";

describe("mapParLots", () => {
  it("devrait préserver l'ordre des résultats", async () => {
    const resultats = await mapParLots([3, 1, 2], 2, async (n: number) => {
      await new Promise((resolve) => setTimeout(resolve, n));
      return n * 10;
    });

    expect(resultats).toEqual([30, 10, 20]);
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
