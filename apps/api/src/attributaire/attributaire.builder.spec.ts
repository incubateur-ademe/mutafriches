import { describe, it, expect } from "vitest";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { CalculService } from "../evaluation/services/calcul.service";
import { FiabiliteCalculator } from "../evaluation/services/algorithme/fiabilite.calculator";
import { VERSION_COURANTE } from "../evaluation/services/algorithme/versions";
import { Site } from "../evaluation/entities/site.entity";
import {
  DONNEES_COMPLEMENTAIRES_COMPLETES,
  DONNEES_ENRICHIES_PARTENAIRE,
} from "../evaluation/__test-helpers__/calculer-mutabilite.fixtures";
import {
  construireLigneAttributaire,
  resumerPourAttributaire,
  type SourcesSiteAttributaire,
} from "./attributaire.builder";
import { DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS } from "./attributaire.utils";

const calculService = new CalculService(new FiabiliteCalculator());
const DATE = new Date("2026-09-17T08:00:00Z");

function sources(surcharge: Partial<SourcesSiteAttributaire> = {}): SourcesSiteAttributaire {
  return {
    parcelles: ["49353000AV0202"],
    enrichissement: { donnees: DONNEES_ENRICHIES_PARTENAIRE, date: DATE },
    nombreEvaluations: 0,
    ...surcharge,
  };
}

async function ligne(surcharge: Partial<SourcesSiteAttributaire> = {}) {
  const resultat = await construireLigneAttributaire(sources(surcharge), calculService);
  if (!("ligne" in resultat)) throw new Error(resultat.motif);
  return resultat.ligne;
}

describe("construireLigneAttributaire", () => {
  it("calcule avec « ne sait pas » partout quand le site n'a jamais été qualifié", async () => {
    const attendu = resumerPourAttributaire(
      await calculService.calculer(
        Site.fromEnrichissement(DONNEES_ENRICHIES_PARTENAIRE, DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS),
      ),
    );

    const resultat = await ligne();

    expect(resultat.criteresSaisis).toBeNull();
    expect(resultat.dateSaisie).toBeNull();
    expect(resultat.mutabilite).toEqual(attendu);
  });

  it("calcule avec la saisie de l'évaluation quand elle existe", async () => {
    const attendu = resumerPourAttributaire(
      await calculService.calculer(
        Site.fromEnrichissement(DONNEES_ENRICHIES_PARTENAIRE, DONNEES_COMPLEMENTAIRES_COMPLETES),
      ),
    );

    const resultat = await ligne({
      saisie: { donnees: DONNEES_COMPLEMENTAIRES_COMPLETES, date: DATE, evaluationId: "eval-1" },
      nombreEvaluations: 2,
    });

    expect(resultat.criteresSaisis?.typeProprietaire).toBe("public");
    expect(resultat.dateSaisie).toEqual(DATE);
    expect(resultat.evaluationId).toBe("eval-1");
    expect(resultat.nombreEvaluations).toBe(2);
    expect(resultat.mutabilite).toEqual(attendu);
    expect(resultat.fiabilite).toBe(String(attendu.fiabilite.note));
  });

  it("tague la version courante et les colonnes d'identification", async () => {
    const resultat = await ligne({
      partenaire: { slug: "scet", idtup: "scet-1", nom: "Ex-Poste" },
    });

    expect(resultat.versionAlgorithme).toBe(VERSION_COURANTE);
    expect(resultat.cleSite).toBe("49353000AV0202");
    expect(resultat.codeInsee).toBe("49353");
    expect(resultat.partenaireSlug).toBe("scet");
    expect(resultat.nom).toBe("Ex-Poste");
    expect(resultat.parcellePredominante).toBe("49353000AV0202");
    expect(resultat.centroidLatitude).toBe("47.4457");
  });

  it("omet un critère indisponible et garde un critère sans résultat", async () => {
    const donnees = {
      ...DONNEES_ENRICHIES_PARTENAIRE,
      distanceRaccordementElectrique: null,
      surfaceBati: undefined,
    } as unknown as EnrichissementOutputDto;

    const resultat = await ligne({ enrichissement: { donnees, date: DATE } });

    expect(resultat.criteresAutomatiques).toHaveProperty("distanceRaccordementElectrique", null);
    expect(resultat.criteresAutomatiques).not.toHaveProperty("surfaceBati");
    expect(resultat.criteresAutomatiques.raccordementEau).toBe("ne-sait-pas");
  });

  it("écarte un enrichissement sans code INSEE ou sans surface", async () => {
    const sansInsee = { ...DONNEES_ENRICHIES_PARTENAIRE, codeInsee: "" };
    const sansSurface = { ...DONNEES_ENRICHIES_PARTENAIRE, surfaceSite: undefined };

    const resultatInsee = await construireLigneAttributaire(
      sources({ enrichissement: { donnees: sansInsee, date: DATE } }),
      calculService,
    );
    const resultatSurface = await construireLigneAttributaire(
      sources({
        enrichissement: {
          donnees: sansSurface as unknown as EnrichissementOutputDto,
          date: DATE,
        },
      }),
      calculService,
    );

    expect(resultatInsee).toEqual({ motif: "Enrichissement sans code INSEE" });
    expect(resultatSurface).toEqual({ motif: "Enrichissement incomplet : surfaceSite" });
  });
});
