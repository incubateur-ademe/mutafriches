import { Test, TestingModule } from "@nestjs/testing";
import { IlotChaleurUrbain, SourceEnrichissement } from "@mutafriches/shared-types";
import { IcuEnrichissementService, SEUIL_ILOT_CHALEUR_C } from "./icu-enrichissement.service";
import { IcuRepository } from "../../repositories/icu.repository";
import { createMockIcuRepository } from "../../__test-helpers__/enrichissement.mocks";
import { Site } from "../../../evaluation/entities/site.entity";

describe("IcuEnrichissementService", () => {
  let service: IcuEnrichissementService;
  let icuRepository: ReturnType<typeof createMockIcuRepository>;

  const siteAvecCoordonnees = (): Site => {
    const site = new Site();
    site.identifiantParcelle = "49007000AB0001";
    site.coordonnees = { latitude: 47.4784, longitude: -0.5632 };
    return site;
  };

  beforeEach(async () => {
    icuRepository = createMockIcuRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [IcuEnrichissementService, { provide: IcuRepository, useValue: icuRepository }],
    }).compile();

    service = module.get<IcuEnrichissementService>(IcuEnrichissementService);
  });

  it("classe le site en îlot de chaleur au-dessus du seuil", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneContenant.mockResolvedValue({ codeGiris: "4900701", iuhi: 7.49 });

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.OUI);
    expect(site.intensiteIlotChaleurC).toBe(7.49);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("classe le site sous le seuil en zone cartographiée", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneContenant.mockResolvedValue({ codeGiris: "4900702", iuhi: 4.9 });

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.NON);
    expect(site.intensiteIlotChaleurC).toBe(4.9);
    expect(result.success).toBe(true);
  });

  it("classe le seuil exact en îlot de chaleur", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneContenant.mockResolvedValue({
      codeGiris: "4900703",
      iuhi: SEUIL_ILOT_CHALEUR_C,
    });

    await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.OUI);
  });

  it("distingue un site hors périmètre d'étude d'un site sous le seuil", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneContenant.mockResolvedValue(null);

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.NON_COUVERT);
    expect(site.intensiteIlotChaleurC).toBeNull();
    // La recherche a fonctionné : la source compte comme utilisée, pas comme échouée
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ICU);
    expect(result.sourcesEchouees).toHaveLength(0);
  });

  it("gère l'échec technique de lecture du référentiel", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneContenant.mockResolvedValue(undefined);

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toContain("ilotChaleurUrbain");
  });

  it("gère l'absence de coordonnées sans interroger le référentiel", async () => {
    const site = new Site();
    site.identifiantParcelle = "49007000AB0001";

    const result = await service.enrichir(site);

    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toContain("ilotChaleurUrbain");
    expect(icuRepository.findZoneContenant).not.toHaveBeenCalled();
  });
});
