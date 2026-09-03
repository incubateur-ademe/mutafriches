import { describe, it, expect } from "vitest";
import { donneesComplementairesEquivalentes, hasJeNeSaisPas } from "./cache-validator";
import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  DonneesComplementairesInputDto,
  RaccordementEau,
  PresenceEspecesProtegees,
  PresenceZoneHumide,
  QualitePaysage,
} from "@mutafriches/shared-types";
import { DONNEES_COMPLEMENTAIRES_COMPLETES } from "../__test-helpers__/calculer-mutabilite.fixtures";

const donneesCompletes = DONNEES_COMPLEMENTAIRES_COMPLETES;

// "ne-sait-pas" est la meme valeur pour tous les enums complementaires
const avec = (champ: keyof DonneesComplementairesInputDto): DonneesComplementairesInputDto => ({
  ...donneesCompletes,
  [champ]: "ne-sait-pas",
});

describe("hasJeNeSaisPas", () => {
  it("devrait retourner false si aucun champ requis n'est 'ne-sait-pas'", () => {
    expect(hasJeNeSaisPas(donneesCompletes)).toBe(false);
  });

  it.each([...CHAMPS_COMPLEMENTAIRES_REQUIS])(
    "devrait retourner true si %s est 'ne-sait-pas'",
    (champ) => {
      expect(hasJeNeSaisPas(avec(champ))).toBe(true);
    },
  );

  it("ne devrait plus tenir compte de raccordementEau, dérivé et ignoré au scoring", () => {
    const donnees = { ...donneesCompletes, raccordementEau: RaccordementEau.NE_SAIT_PAS };

    expect(hasJeNeSaisPas(donnees)).toBe(false);
  });

  it("devrait retourner true si les données sont absentes", () => {
    expect(hasJeNeSaisPas(undefined)).toBe(true);
    expect(hasJeNeSaisPas(null)).toBe(true);
  });
});

describe("donneesComplementairesEquivalentes", () => {
  it("devrait reconnaître deux jeux identiques", () => {
    expect(donneesComplementairesEquivalentes(donneesCompletes, { ...donneesCompletes })).toBe(
      true,
    );
  });

  it.each([...CHAMPS_COMPLEMENTAIRES_REQUIS])(
    "devrait distinguer deux jeux différant sur %s",
    (champ) => {
      const modifie = { ...donneesCompletes, [champ]: "ne-sait-pas" };

      expect(donneesComplementairesEquivalentes(donneesCompletes, modifie)).toBe(false);
    },
  );

  // Regression : ces deux champs etaient absents de la comparaison, deux demandes aux
  // scores differents partageaient donc un meme resultat en cache
  it("devrait distinguer deux jeux ne différant que par les critères biodiversité", () => {
    const especes = {
      ...donneesCompletes,
      presenceEspecesProtegees: PresenceEspecesProtegees.OUI,
    };
    const zoneHumide = { ...donneesCompletes, presenceZoneHumide: PresenceZoneHumide.OUI };

    expect(donneesComplementairesEquivalentes(donneesCompletes, especes)).toBe(false);
    expect(donneesComplementairesEquivalentes(donneesCompletes, zoneHumide)).toBe(false);
  });

  it("devrait ignorer raccordementEau, recalculé côté serveur", () => {
    const avecRaccordement = { ...donneesCompletes, raccordementEau: RaccordementEau.OUI };
    const sansRaccordement = { ...donneesCompletes, raccordementEau: RaccordementEau.NON };

    expect(donneesComplementairesEquivalentes(avecRaccordement, sansRaccordement)).toBe(true);
  });

  it("devrait considérer un champ absent comme différent d'un champ renseigné", () => {
    const cacheIncomplet = { ...donneesCompletes };
    delete (cacheIncomplet as Partial<DonneesComplementairesInputDto>).qualitePaysage;

    expect(donneesComplementairesEquivalentes(donneesCompletes, cacheIncomplet)).toBe(false);
  });

  it("devrait refuser la comparaison si un des deux jeux est absent", () => {
    expect(donneesComplementairesEquivalentes(donneesCompletes, undefined)).toBe(false);
    expect(donneesComplementairesEquivalentes(null, donneesCompletes)).toBe(false);
  });

  it("devrait rester sensible à un changement de valeur métier", () => {
    const autrePaysage = {
      ...donneesCompletes,
      qualitePaysage: QualitePaysage.INTERET_REMARQUABLE,
    };

    expect(donneesComplementairesEquivalentes(donneesCompletes, autrePaysage)).toBe(false);
  });
});
