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
    site.codeInsee = "49007";
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
    icuRepository.findZoneProche.mockResolvedValue({
      codeGiris: "4900701",
      iuhi: 7.49,
      distanceM: 0,
    });

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.OUI);
    expect(site.intensiteIlotChaleurC).toBe(7.49);
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toHaveLength(0);
  });

  it("classe le site sous le seuil en zone cartographiée", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneProche.mockResolvedValue({
      codeGiris: "4900702",
      iuhi: 4.9,
      distanceM: 0,
    });

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.NON);
    expect(site.intensiteIlotChaleurC).toBe(4.9);
    expect(result.success).toBe(true);
  });

  it("classe le seuil exact en îlot de chaleur", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneProche.mockResolvedValue({
      codeGiris: "4900703",
      iuhi: SEUIL_ILOT_CHALEUR_C,
      distanceM: 0,
    });

    await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.OUI);
  });

  it("rattache le site à la zone voisine retenue dans la tolérance de bord", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneProche.mockResolvedValue({
      codeGiris: "4900704",
      iuhi: 6.47,
      distanceM: 120,
    });

    await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.OUI);
    expect(site.intensiteIlotChaleurC).toBe(6.47);
    expect(icuRepository.communeEstCouverte).not.toHaveBeenCalled();
  });

  it("déclare non concerné un site sans zone proche dans une commune étudiée", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneProche.mockResolvedValue(null);
    icuRepository.communeEstCouverte.mockResolvedValue(true);

    const result = await service.enrichir(site);

    expect(icuRepository.communeEstCouverte).toHaveBeenCalledWith("49007");
    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.NON);
    expect(site.intensiteIlotChaleurC).toBeNull();
    expect(result.success).toBe(true);
    expect(result.sourcesUtilisees).toContain(SourceEnrichissement.ICU);
    expect(result.sourcesEchouees).toHaveLength(0);
  });

  it("distingue une commune hors périmètre d'étude d'une commune étudiée", async () => {
    const site = siteAvecCoordonnees();
    site.codeInsee = "49018";
    icuRepository.findZoneProche.mockResolvedValue(null);
    icuRepository.communeEstCouverte.mockResolvedValue(false);

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
    icuRepository.findZoneProche.mockResolvedValue(undefined);

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toContain("ilotChaleurUrbain");
  });

  it("gère l'échec technique du test de couverture communale", async () => {
    const site = siteAvecCoordonnees();
    icuRepository.findZoneProche.mockResolvedValue(null);
    icuRepository.communeEstCouverte.mockResolvedValue(undefined);

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBeUndefined();
    expect(result.success).toBe(false);
    expect(result.sourcesUtilisees).toHaveLength(0);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toContain("ilotChaleurUrbain");
  });

  it("sans code INSEE, ne peut pas conclure à une commune étudiée", async () => {
    const site = siteAvecCoordonnees();
    site.codeInsee = "";
    icuRepository.findZoneProche.mockResolvedValue(null);

    const result = await service.enrichir(site);

    expect(site.ilotChaleurUrbain).toBe(IlotChaleurUrbain.NON_COUVERT);
    expect(result.success).toBe(true);
    expect(icuRepository.communeEstCouverte).not.toHaveBeenCalled();
  });

  it("gère l'absence de coordonnées sans interroger le référentiel", async () => {
    const site = new Site();
    site.identifiantParcelle = "49007000AB0001";

    const result = await service.enrichir(site);

    expect(result.success).toBe(false);
    expect(result.sourcesEchouees).toContain(SourceEnrichissement.ICU);
    expect(result.champsManquants).toContain("ilotChaleurUrbain");
    expect(icuRepository.findZoneProche).not.toHaveBeenCalled();
  });
});
