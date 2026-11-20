import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DUREE_CACHE_ORIGINES_MS,
  DUREE_CACHE_REFUS_MS,
  IntegrateursRegistreService,
} from "./integrateurs-registre.service";
import type { IntegrateurRepository } from "./repositories/integrateur.repository";
import { creerDepotOrigines, type DepotOriginesFactice } from "./__test-helpers__/registre.mocks";

const DECLAREE = "https://partenaire.fr";

function creerRegistre(depot: DepotOriginesFactice): IntegrateursRegistreService {
  return new IntegrateursRegistreService(depot as unknown as IntegrateurRepository);
}

describe("IntegrateursRegistreService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("autorise nos origines sans interroger la base", async () => {
    const depot = creerDepotOrigines();
    const registre = creerRegistre(depot);

    await expect(registre.estOrigineAutorisee("https://mutafriches.beta.gouv.fr")).resolves.toBe(
      true,
    );
    expect(depot.listerOriginesActives).not.toHaveBeenCalled();
  });

  it("charge les origines actives au démarrage et les sert depuis le cache", async () => {
    const depot = creerDepotOrigines([DECLAREE]);
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    expect(depot.listerOriginesActives).toHaveBeenCalledTimes(1);
    expect(depot.estOrigineActive).not.toHaveBeenCalled();
  });

  it("trouve en base une origine déclarée après le chargement", async () => {
    const depot = creerDepotOrigines();
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    depot.estOrigineActive.mockResolvedValue(true);

    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    expect(depot.estOrigineActive).toHaveBeenCalledTimes(1);
  });

  it("n'interroge la base qu'une fois par fenêtre pour une origine refusée", async () => {
    const depot = creerDepotOrigines();
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    await expect(registre.estOrigineAutorisee("https://inconnu.fr")).resolves.toBe(false);
    await expect(registre.estOrigineAutorisee("https://inconnu.fr")).resolves.toBe(false);
    expect(depot.estOrigineActive).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DUREE_CACHE_REFUS_MS + 1);
    await registre.estOrigineAutorisee("https://inconnu.fr");
    expect(depot.estOrigineActive).toHaveBeenCalledTimes(2);
  });

  it("rend une déclaration effective tout de suite, même après un refus", async () => {
    const depot = creerDepotOrigines();
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(false);
    registre.ajouterOrigine(DECLAREE);
    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
  });

  it("applique une révocation au rechargement suivant", async () => {
    const depot = creerDepotOrigines([DECLAREE]);
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    depot.listerOriginesActives.mockResolvedValue([]);
    depot.estOrigineActive.mockResolvedValue(false);

    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    vi.advanceTimersByTime(DUREE_CACHE_ORIGINES_MS + 1);
    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(false);
  });

  it("conserve le dernier état connu si la base ne répond plus", async () => {
    const depot = creerDepotOrigines([DECLAREE]);
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    depot.listerOriginesActives.mockRejectedValue(new Error("connexion perdue"));
    depot.estOrigineActive.mockRejectedValue(new Error("connexion perdue"));
    vi.advanceTimersByTime(DUREE_CACHE_ORIGINES_MS + 1);

    await expect(registre.estOrigineAutorisee(DECLAREE)).resolves.toBe(true);
    await expect(registre.estOrigineAutorisee("https://inconnu.fr")).resolves.toBe(false);
    await expect(registre.estOrigineAutorisee("https://mutafriches.beta.gouv.fr")).resolves.toBe(
      true,
    );
  });

  it("ne cherche jamais une origine en base pour CORS", async () => {
    const depot = creerDepotOrigines([DECLAREE]);
    const registre = creerRegistre(depot);
    await registre.onModuleInit();
    depot.estOrigineActive.mockResolvedValue(true);

    await expect(registre.estOrigineEnCache(DECLAREE)).resolves.toBe(true);
    await expect(registre.estOrigineEnCache("https://inconnu.fr")).resolves.toBe(false);
    await expect(registre.estOrigineEnCache("https://mutafriches.beta.gouv.fr")).resolves.toBe(
      true,
    );
    expect(depot.estOrigineActive).not.toHaveBeenCalled();
  });

  it("mutualise les recherches simultanées d'une même origine", async () => {
    const depot = creerDepotOrigines();
    const registre = creerRegistre(depot);
    await registre.onModuleInit();

    const reponses = await Promise.all(
      Array.from({ length: 50 }, () => registre.estOrigineAutorisee("https://inconnu.fr")),
    );

    expect(reponses.every((reponse) => reponse === false)).toBe(true);
    expect(depot.estOrigineActive).toHaveBeenCalledTimes(1);
  });

  it("démarre même si le premier chargement échoue", async () => {
    const depot = creerDepotOrigines();
    depot.listerOriginesActives.mockRejectedValue(new Error("base absente"));
    const registre = creerRegistre(depot);

    await expect(registre.onModuleInit()).resolves.toBeUndefined();
  });
});
