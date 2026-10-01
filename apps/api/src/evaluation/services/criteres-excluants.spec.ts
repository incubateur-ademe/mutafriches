import {
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  PresenceEspecesProtegees,
  PresenceZoneHumide,
  UsageResultat,
  UsageType,
  ZoneAccelerationEnr,
} from "@mutafriches/shared-types";
import { beforeEach, describe, expect, it } from "vitest";
import { EvaluationBuilder } from "../__test-helpers__/evaluation.builder";
import { Site } from "../entities/site.entity";
import { FiabiliteCalculator } from "./algorithme/fiabilite.calculator";
import { CalculService, POTENTIEL_EXCLU } from "./calcul.service";

// Règles d'exclusion v1.16 (REGLES_EXCLUSION, ADR-0048)
describe("Critères excluants", () => {
  let service: CalculService;

  beforeEach(() => {
    service = new CalculService(new FiabiliteCalculator());
  });

  const construireSite = (
    enrichissement: Partial<EnrichissementOutputDto> = {},
    complementaires: Partial<DonneesComplementairesInputDto> = {},
  ): Site => {
    const evaluation = new EvaluationBuilder()
      .withEnrichissement(enrichissement)
      .withDonneesComplementaires(complementaires)
      .build();
    return Site.fromEnrichissement(
      evaluation.donneesEnrichissement,
      evaluation.donneesComplementaires,
    );
  };

  const exclus = (resultats: UsageResultat[]): UsageType[] =>
    resultats.filter((r) => r.exclu).map((r) => r.usage);

  const zoneHumideEtEspeces = (
    presenceZoneHumide: PresenceZoneHumide,
    presenceEspecesProtegees: PresenceEspecesProtegees,
  ): Site => construireSite({}, { presenceZoneHumide, presenceEspecesProtegees });

  it("n'exclut aucun usage sur un site sans critère excluant", async () => {
    const { resultats } = await service.calculer(construireSite());

    expect(exclus(resultats)).toEqual([]);
    resultats.forEach((r) => {
      expect(r.exclu).toBe(false);
      expect(r.criteresExcluants).toBeUndefined();
    });
  });

  describe("zone d'exclusion des EnR", () => {
    it("exclut le photovoltaïque seul", async () => {
      const site = construireSite({ zoneAccelerationEnr: ZoneAccelerationEnr.EXCLUSION });
      const { resultats } = await service.calculer(site);

      expect(exclus(resultats)).toEqual([UsageType.PHOTOVOLTAIQUE]);
      const pv = resultats.find((r) => r.usage === UsageType.PHOTOVOLTAIQUE);
      expect(pv?.criteresExcluants).toEqual(["zoneAccelerationEnr"]);
      expect(pv?.potentiel).toBe(POTENTIEL_EXCLU);
    });

    it("n'exclut rien en zone d'accélération", async () => {
      const site = construireSite({ zoneAccelerationEnr: ZoneAccelerationEnr.OUI });
      const { resultats } = await service.calculer(site);

      expect(exclus(resultats)).toEqual([]);
    });
  });

  describe("zone humide et espèces protégées", () => {
    it("exclut l'industrie et le tertiaire quand les deux sont à oui", async () => {
      const site = zoneHumideEtEspeces(PresenceZoneHumide.OUI, PresenceEspecesProtegees.OUI);
      const { resultats } = await service.calculer(site);

      expect(exclus(resultats).sort()).toEqual([UsageType.INDUSTRIE, UsageType.TERTIAIRE].sort());
      expect(resultats.find((r) => r.usage === UsageType.INDUSTRIE)?.criteresExcluants).toEqual([
        "presenceZoneHumide",
        "presenceEspecesProtegees",
      ]);
    });

    it.each([
      [PresenceZoneHumide.OUI, PresenceEspecesProtegees.NON],
      [PresenceZoneHumide.NON, PresenceEspecesProtegees.OUI],
      [PresenceZoneHumide.OUI, PresenceEspecesProtegees.NE_SAIT_PAS],
      [PresenceZoneHumide.NE_SAIT_PAS, PresenceEspecesProtegees.OUI],
    ])("n'exclut rien si zone humide = %s et espèces protégées = %s", async (zh, especes) => {
      const { resultats } = await service.calculer(zoneHumideEtEspeces(zh, especes));

      expect(exclus(resultats)).toEqual([]);
    });
  });

  it("relègue les exclus en fin de classement en gardant leur indice", async () => {
    const site = construireSite(
      { zoneAccelerationEnr: ZoneAccelerationEnr.EXCLUSION },
      {
        presenceZoneHumide: PresenceZoneHumide.OUI,
        presenceEspecesProtegees: PresenceEspecesProtegees.OUI,
      },
    );
    const { resultats } = await service.calculer(site);

    expect(resultats.map((r) => r.rang)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(resultats.slice(0, 4).every((r) => !r.exclu)).toBe(true);
    expect(resultats.slice(4).every((r) => r.exclu)).toBe(true);

    for (const groupe of [resultats.slice(0, 4), resultats.slice(4)]) {
      for (let i = 1; i < groupe.length; i++) {
        expect(groupe[i - 1].indiceMutabilite).toBeGreaterThanOrEqual(groupe[i].indiceMutabilite);
      }
    }
    resultats.forEach((r) => expect(r.indiceMutabilite).toBeGreaterThan(0));
  });

  it("n'applique aucune exclusion en v1.15 (reproductibilité)", async () => {
    const site = construireSite({ zoneAccelerationEnr: ZoneAccelerationEnr.EXCLUSION });
    const { resultats } = await service.calculer(site, { versionAlgorithme: "v1.15" });

    expect(exclus(resultats)).toEqual([]);
  });

  it("garde le même indice qu'en v1.15 pour l'usage exclu", async () => {
    const site = construireSite({ zoneAccelerationEnr: ZoneAccelerationEnr.EXCLUSION });
    const indicePv = async (versionAlgorithme?: string): Promise<number | undefined> =>
      (await service.calculer(site, { versionAlgorithme })).resultats.find(
        (r) => r.usage === UsageType.PHOTOVOLTAIQUE,
      )?.indiceMutabilite;

    expect(await indicePv()).toBe(await indicePv("v1.15"));
  });
});
