import { describe, it, expect, beforeEach, vi } from "vitest";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { CalculService } from "../evaluation/services/calcul.service";
import { FiabiliteCalculator } from "../evaluation/services/algorithme/fiabilite.calculator";
import {
  DONNEES_COMPLEMENTAIRES_COMPLETES,
  DONNEES_ENRICHIES_PARTENAIRE,
} from "../evaluation/__test-helpers__/calculer-mutabilite.fixtures";
import { AttributaireService } from "./attributaire.service";
import type { AttributaireRepository } from "./repositories/attributaire.repository";
import type {
  EnrichissementSource,
  SourcesAttributaireRepository,
} from "./repositories/sources-attributaire.repository";

const P1 = "77305000AP0452";
const P2 = "77305000AP0454";
const ENRICHI_COMPLET = { ...DONNEES_ENRICHIES_PARTENAIRE, sourcesEchouees: [] };

function creerSources() {
  return {
    evaluationsPartageantUneParcelle: vi.fn().mockResolvedValue([]),
    lireEvaluation: vi.fn().mockResolvedValue(null),
    enrichissementsPartageantUneParcelle: vi.fn().mockResolvedValue([]),
    lireEnrichissement: vi.fn().mockResolvedValue(null),
    sitesPartenairesPartageantUneParcelle: vi.fn().mockResolvedValue([]),
    listerParcellesEvaluees: vi.fn().mockResolvedValue([]),
    listerParcellesPartenaires: vi.fn().mockResolvedValue([]),
  };
}

function creerRepository() {
  return {
    enregistrer: vi.fn().mockResolvedValue(undefined),
    trouverParCodeInsee: vi.fn().mockResolvedValue([]),
    compter: vi.fn().mockResolvedValue(0),
    listerParcellesHorsVersion: vi.fn().mockResolvedValue([]),
    nomCommune: vi.fn().mockResolvedValue(undefined),
  };
}

function enCache(surcharge: Partial<EnrichissementSource>): EnrichissementSource {
  return {
    table: "sites",
    id: "site-1",
    parcelles: [P1, P2],
    complet: true,
    date: new Date("2026-09-01"),
    ...surcharge,
  };
}

describe("AttributaireService", () => {
  let sources: ReturnType<typeof creerSources>;
  let repository: ReturnType<typeof creerRepository>;
  let service: AttributaireService;

  beforeEach(() => {
    sources = creerSources();
    repository = creerRepository();
    service = new AttributaireService(
      sources as unknown as SourcesAttributaireRepository,
      repository as unknown as AttributaireRepository,
      new CalculService(new FiabiliteCalculator()),
    );
  });

  describe("rafraichir", () => {
    it("ignore un site ni évalué ni partenaire", async () => {
      // Recouvrement partiel : une autre évaluation partage une parcelle
      sources.evaluationsPartageantUneParcelle.mockResolvedValue([
        {
          id: "e1",
          siteId: `${P1},77305000AP0453`,
          dateCalcul: new Date(),
          evaluationSourceId: null,
        },
      ]);

      const resultat = await service.rafraichir([P1, P2]);

      expect(resultat.statut).toBe("hors-perimetre");
      expect(repository.enregistrer).not.toHaveBeenCalled();
    });

    it("reconnaît l'évaluation du même ensemble, dans un autre ordre", async () => {
      sources.evaluationsPartageantUneParcelle.mockResolvedValue([
        {
          id: "e1",
          siteId: `${P2},${P1}`,
          dateCalcul: new Date("2026-09-17"),
          evaluationSourceId: null,
        },
      ]);
      sources.lireEvaluation.mockResolvedValue({
        donneesEnrichissement: ENRICHI_COMPLET,
        donneesComplementaires: DONNEES_COMPLEMENTAIRES_COMPLETES,
      });

      const resultat = await service.rafraichir([P1, P2]);

      expect(resultat).toEqual({ cle: `${P1},${P2}`, statut: "a-jour" });
      const ligne = repository.enregistrer.mock.calls[0][0];
      expect(ligne.criteresSaisis?.typeProprietaire).toBe("public");
      expect(ligne.evaluationId).toBe("e1");
    });

    it("retient la saisie de la dernière évaluation et compte hors cache", async () => {
      sources.evaluationsPartageantUneParcelle.mockResolvedValue([
        {
          id: "ancienne",
          siteId: `${P1},${P2}`,
          dateCalcul: new Date("2026-09-01"),
          evaluationSourceId: null,
        },
        {
          id: "recente",
          siteId: `${P1},${P2}`,
          dateCalcul: new Date("2026-09-17"),
          evaluationSourceId: null,
        },
        {
          id: "cache",
          siteId: `${P1},${P2}`,
          dateCalcul: new Date("2026-09-10"),
          evaluationSourceId: "ancienne",
        },
      ]);
      sources.lireEvaluation.mockResolvedValue({
        donneesEnrichissement: ENRICHI_COMPLET,
        donneesComplementaires: DONNEES_COMPLEMENTAIRES_COMPLETES,
      });

      await service.rafraichir([P1, P2]);

      expect(sources.lireEvaluation).toHaveBeenCalledWith("recente");
      expect(repository.enregistrer.mock.calls[0][0].nombreEvaluations).toBe(2);
    });

    it("donne « ne sait pas » partout à un site partenaire jamais évalué", async () => {
      sources.sitesPartenairesPartageantUneParcelle.mockResolvedValue([
        { slug: "scet", idtup: "scet-1", parcelles: [P1, P2], nom: "Ex Poste" },
      ]);
      sources.enrichissementsPartageantUneParcelle.mockResolvedValue([enCache({})]);
      sources.lireEnrichissement.mockResolvedValue(ENRICHI_COMPLET);

      await service.rafraichir([P1, P2]);

      const ligne = repository.enregistrer.mock.calls[0][0];
      expect(ligne.criteresSaisis).toBeNull();
      expect(ligne.partenaireSlug).toBe("scet");
      expect(ligne.nom).toBe("Ex Poste");
      expect(ligne.nombreEvaluations).toBe(0);
    });

    it("préfère un enrichissement complet à un partiel plus récent", async () => {
      sources.sitesPartenairesPartageantUneParcelle.mockResolvedValue([
        { slug: "scet", idtup: "scet-1", parcelles: [P1, P2], nom: null },
      ]);
      sources.enrichissementsPartageantUneParcelle.mockResolvedValue([
        enCache({ id: "partiel", complet: false, date: new Date("2026-10-01") }),
        enCache({ id: "complet", complet: true, date: new Date("2026-09-01") }),
      ]);
      sources.lireEnrichissement.mockResolvedValue(ENRICHI_COMPLET);

      await service.rafraichir([P1, P2]);

      expect(sources.lireEnrichissement).toHaveBeenCalledTimes(1);
      expect(sources.lireEnrichissement).toHaveBeenCalledWith(
        expect.objectContaining({ id: "complet" }),
      );
      expect(repository.enregistrer.mock.calls[0][0].dateEnrichissement).toEqual(
        new Date("2026-09-01"),
      );
    });

    it("utilise l'enrichissement frais, pas encore lisible en base", async () => {
      sources.sitesPartenairesPartageantUneParcelle.mockResolvedValue([
        { slug: "scet", idtup: "scet-1", parcelles: [P1, P2], nom: null },
      ]);
      const frais = {
        ...ENRICHI_COMPLET,
        commune: "Montereau-Fault-Yonne",
      } as EnrichissementOutputDto;

      await service.rafraichir([P1, P2], { frais: { donnees: frais, complet: true } });

      expect(sources.lireEnrichissement).not.toHaveBeenCalled();
      expect(repository.enregistrer.mock.calls[0][0].commune).toBe("Montereau-Fault-Yonne");
    });

    it("signale un site du périmètre sans enrichissement en base", async () => {
      sources.sitesPartenairesPartageantUneParcelle.mockResolvedValue([
        { slug: "scet", idtup: "scet-1", parcelles: [P1, P2], nom: null },
      ]);

      const resultat = await service.rafraichir([P1, P2]);

      expect(resultat.statut).toBe("sans-enrichissement");
      expect(repository.enregistrer).not.toHaveBeenCalled();
    });

    it("n'écrit rien en dry-run", async () => {
      sources.sitesPartenairesPartageantUneParcelle.mockResolvedValue([
        { slug: "scet", idtup: "scet-1", parcelles: [P1, P2], nom: null },
      ]);
      sources.enrichissementsPartageantUneParcelle.mockResolvedValue([enCache({})]);
      sources.lireEnrichissement.mockResolvedValue(ENRICHI_COMPLET);

      const resultat = await service.rafraichir([P1, P2], { enregistrer: false });

      expect(resultat.statut).toBe("a-jour");
      expect(repository.enregistrer).not.toHaveBeenCalled();
    });
  });

  describe("rafraichirEnArrierePlan", () => {
    it("n'interrompt pas l'appelant quand la base échoue", async () => {
      sources.evaluationsPartageantUneParcelle.mockRejectedValue(new Error("base indisponible"));

      expect(() => service.rafraichirEnArrierePlan([P1])).not.toThrow();
      await vi.waitFor(() => expect(sources.evaluationsPartageantUneParcelle).toHaveBeenCalled());
    });
  });

  describe("listerPerimetre", () => {
    it("dédoublonne un site évalué qui est aussi un site partenaire", async () => {
      sources.listerParcellesEvaluees.mockResolvedValue([[P2, P1]]);
      sources.listerParcellesPartenaires.mockResolvedValue([[P1, P2], ["491300000B0234"]]);

      const perimetre = await service.listerPerimetre();

      expect(perimetre).toEqual([[P1, P2], ["49130000B0234"]]);
    });
  });

  describe("listerParCommune", () => {
    it("lit le nom dans le référentiel des communes quand aucun site n'est trouvé", async () => {
      repository.nomCommune.mockResolvedValue("Montereau-Fault-Yonne");

      const resultat = await service.listerParCommune("77305");

      expect(resultat).toEqual({
        codeInsee: "77305",
        commune: "Montereau-Fault-Yonne",
        lignes: [],
      });
    });
  });
});
