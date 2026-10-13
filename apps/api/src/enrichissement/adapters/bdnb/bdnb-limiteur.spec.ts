import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LimiteurDebit } from "./bdnb-limiteur";

describe("LimiteurDebit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("laisse passer jusqu'au maximum sans attendre", async () => {
    const limiteur = new LimiteurDebit(3, 1000);
    let acquis = 0;

    for (let i = 0; i < 3; i++) {
      await limiteur.acquerir();
      acquis++;
    }

    expect(acquis).toBe(3);
  });

  it("retient la requête excédentaire jusqu'à la fin de la fenêtre", async () => {
    const limiteur = new LimiteurDebit(2, 1000);
    await limiteur.acquerir();
    await limiteur.acquerir();

    let troisiemeAcquise = false;
    const troisieme = limiteur.acquerir().then(() => {
      troisiemeAcquise = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(troisiemeAcquise).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await troisieme;
    expect(troisiemeAcquise).toBe(true);
  });

  it("ne dépasse jamais le maximum sur une rafale", async () => {
    const limiteur = new LimiteurDebit(5, 1000);
    const instants: number[] = [];

    const rafale = Promise.all(
      Array.from({ length: 12 }, async () => {
        await limiteur.acquerir();
        instants.push(Date.now());
      }),
    );
    await vi.advanceTimersByTimeAsync(3000);
    await rafale;

    for (const instant of instants) {
      const dansLaFenetre = instants.filter((i) => i >= instant && i < instant + 1000);
      expect(dansLaFenetre.length).toBeLessThanOrEqual(5);
    }
  });
});
