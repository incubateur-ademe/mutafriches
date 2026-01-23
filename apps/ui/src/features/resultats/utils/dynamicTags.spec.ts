import { describe, it, expect } from "vitest";
import {
  UsageType,
  PresencePollution,
  RisqueNaturel,
  ZonageReglementaire,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  EtatBatiInfrastructure,
  TypeProprietaire,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { generateTagsForUsage, generateAllTags } from "./dynamicTags.resolver";
import { TagInputData } from "./dynamicTags.types";
import {
  SEUIL_GRANDE_PARCELLE,
  SEUIL_EMPRISE_BATI_FAIBLE,
  SEUIL_DISTANCE_TC_PROCHE,
  SEUIL_DISTANCE_RACCORDEMENT_ELEC,
} from "./dynamicTags.config";

// ============================================================================
// FIXTURES DE TEST
// ============================================================================

const createBaseEnrichmentData = (): EnrichissementOutputDto => ({
  identifiantParcelle: "12345000AB0001",
  codeInsee: "12345",
  commune: "Test Commune",
  surfaceSite: 5000,
  surfaceBati: 200,
  siteEnCentreVille: false,
  distanceAutoroute: 5,
  distanceTransportCommun: 1000,
  proximiteCommercesServices: false,
  distanceRaccordementElectrique: 1,
  tauxLogementsVacants: 5,
  presenceRisquesTechnologiques: false,
  siteReferencePollue: false,
  sourcesUtilisees: [],
  champsManquants: [],
  sourcesEchouees: [],
});

const createBaseManualData = (): DonneesComplementairesInputDto => ({
  typeProprietaire: TypeProprietaire.NE_SAIT_PAS,
  raccordementEau: RaccordementEau.NE_SAIT_PAS,
  etatBatiInfrastructure: EtatBatiInfrastructure.NE_SAIT_PAS,
  presencePollution: PresencePollution.NE_SAIT_PAS,
  valeurArchitecturaleHistorique: ValeurArchitecturale.NE_SAIT_PAS,
  qualitePaysage: QualitePaysage.NE_SAIT_PAS,
  qualiteVoieDesserte: QualiteVoieDesserte.NE_SAIT_PAS,
  trameVerteEtBleue: TrameVerteEtBleue.NE_SAIT_PAS,
});

const createTagInputData = (
  enrichmentOverrides: Partial<EnrichissementOutputDto> = {},
  manualOverrides: Partial<DonneesComplementairesInputDto> = {},
): TagInputData => ({
  enrichmentData: { ...createBaseEnrichmentData(), ...enrichmentOverrides },
  manualData: { ...createBaseManualData(), ...manualOverrides },
});

// ============================================================================
// TESTS DES SEUILS
// ============================================================================

describe("Seuils de configuration", () => {
  it("devrait avoir le seuil de grande parcelle à 10000 m²", () => {
    expect(SEUIL_GRANDE_PARCELLE).toBe(10000);
  });

  it("devrait avoir le seuil d'emprise bâtie faible à 500 m²", () => {
    expect(SEUIL_EMPRISE_BATI_FAIBLE).toBe(500);
  });

  it("devrait avoir le seuil de distance TC proche à 500 m", () => {
    expect(SEUIL_DISTANCE_TC_PROCHE).toBe(500);
  });

  it("devrait avoir le seuil de distance raccordement électrique à 500 m", () => {
    expect(SEUIL_DISTANCE_RACCORDEMENT_ELEC).toBe(500);
  });
});

// ============================================================================
// TESTS USAGE RÉSIDENTIEL (Logements et commerces de proximité)
// ============================================================================

describe("Usage RESIDENTIEL - Logements et commerces de proximité", () => {
  describe("Taille de la parcelle", () => {
    it("devrait afficher 'grande parcelle' si surface >= 10000 m²", () => {
      const data = createTagInputData({ surfaceSite: 10000 });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("grande parcelle");
    });

    it("devrait afficher 'petite parcelle' si surface < 10000 m²", () => {
      const data = createTagInputData({ surfaceSite: 5000 });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("petite parcelle");
    });
  });

  describe("Présence de pollution", () => {
    it("devrait afficher 'non-pollué' si pollution = non", () => {
      const data = createTagInputData({}, { presencePollution: PresencePollution.NON });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("non-pollué");
    });

    it("ne devrait pas afficher de tag pollution si pollution présente", () => {
      const data = createTagInputData(
        {},
        { presencePollution: PresencePollution.OUI_COMPOSES_VOLATILS },
      );
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("non-pollué");
    });

    it("ne devrait pas afficher de tag pollution si 'ne sait pas'", () => {
      const data = createTagInputData({}, { presencePollution: PresencePollution.NE_SAIT_PAS });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("non-pollué");
    });
  });

  describe("Distance du centre ville", () => {
    it("devrait afficher 'central' si en centre ville", () => {
      const data = createTagInputData({ siteEnCentreVille: true });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("central");
    });

    it("ne devrait pas afficher de tag si pas en centre ville", () => {
      const data = createTagInputData({ siteEnCentreVille: false });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("central");
    });
  });

  describe("Proximité des commerces et services", () => {
    it("devrait afficher 'services proches' si à proximité", () => {
      const data = createTagInputData({ proximiteCommercesServices: true });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("services proches");
    });

    it("ne devrait pas afficher de tag si pas à proximité", () => {
      const data = createTagInputData({ proximiteCommercesServices: false });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("services proches");
    });
  });

  describe("Risques naturels", () => {
    it("devrait afficher 'risques nat. faibles' si risques faibles", () => {
      const data = createTagInputData({ presenceRisquesNaturels: RisqueNaturel.FAIBLE });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("risques nat. faibles");
    });

    it("devrait afficher 'risques nat. faibles' si aucun risque", () => {
      const data = createTagInputData({ presenceRisquesNaturels: RisqueNaturel.AUCUN });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("risques nat. faibles");
    });

    it("devrait afficher 'risques nat. modérés' si risques moyens", () => {
      const data = createTagInputData({ presenceRisquesNaturels: RisqueNaturel.MOYEN });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("risques nat. modérés");
    });

    it("ne devrait pas afficher de tag si risques forts", () => {
      const data = createTagInputData({ presenceRisquesNaturels: RisqueNaturel.FORT });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("risques nat. faibles");
      expect(result.tags).not.toContain("risques nat. modérés");
    });
  });

  describe("Zonage réglementaire", () => {
    it("devrait afficher 'zonage favorable' si zone urbaine", () => {
      const data = createTagInputData({ zonageReglementaire: ZonageReglementaire.ZONE_URBAINE_U });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).toContain("zonage favorable");
    });

    it("ne devrait pas afficher de tag si autre zone", () => {
      const data = createTagInputData({ zonageReglementaire: ZonageReglementaire.ZONE_AGRICOLE_A });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("zonage favorable");
    });

    it("ne devrait pas afficher de tag si 'ne sait pas'", () => {
      const data = createTagInputData({ zonageReglementaire: ZonageReglementaire.NE_SAIT_PAS });
      const result = generateTagsForUsage(UsageType.RESIDENTIEL, data);
      expect(result.tags).not.toContain("zonage favorable");
    });
  });
});

// ============================================================================
// TESTS USAGE ÉQUIPEMENTS PUBLICS
// ============================================================================

describe("Usage EQUIPEMENTS - Équipements publics", () => {
  describe("Risques technologiques", () => {
    it("devrait afficher 'risques tech. faibles' si pas de risques", () => {
      const data = createTagInputData({ presenceRisquesTechnologiques: false });
      const result = generateTagsForUsage(UsageType.EQUIPEMENTS, data);
      expect(result.tags).toContain("risques tech. faibles");
    });

    it("devrait afficher 'risques tech. modérés' si risques présents", () => {
      const data = createTagInputData({ presenceRisquesTechnologiques: true });
      const result = generateTagsForUsage(UsageType.EQUIPEMENTS, data);
      expect(result.tags).toContain("risques tech. modérés");
    });
  });

  it("devrait avoir les mêmes critères que RESIDENTIEL sauf risques technologiques", () => {
    const data = createTagInputData(
      {
        surfaceSite: 15000,
        siteEnCentreVille: true,
        proximiteCommercesServices: true,
        presenceRisquesNaturels: RisqueNaturel.FAIBLE,
        presenceRisquesTechnologiques: false,
      },
      { presencePollution: PresencePollution.NON },
    );
    const result = generateTagsForUsage(UsageType.EQUIPEMENTS, data);

    expect(result.tags).toContain("grande parcelle");
    expect(result.tags).toContain("non-pollué");
    expect(result.tags).toContain("central");
    expect(result.tags).toContain("services proches");
    expect(result.tags).toContain("risques nat. faibles");
    expect(result.tags).toContain("risques tech. faibles");
    // Ne devrait pas avoir zonage réglementaire
    expect(result.tags).not.toContain("zonage favorable");
  });
});

// ============================================================================
// TESTS USAGE TERTIAIRE (Bureaux)
// ============================================================================

describe("Usage TERTIAIRE - Bureaux", () => {
  describe("Desserte par les réseaux", () => {
    it("devrait afficher 'desserte réseaux' si eau = oui", () => {
      const data = createTagInputData({}, { raccordementEau: RaccordementEau.OUI });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).toContain("desserte réseaux");
    });

    it("devrait afficher 'desserte réseaux' si distance raccordement élec < 500m", () => {
      // 0.4 km = 400m < 500m
      const data = createTagInputData({ distanceRaccordementElectrique: 0.4 });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).toContain("desserte réseaux");
    });

    it("ne devrait pas afficher de tag si eau = non et élec > 500m", () => {
      const data = createTagInputData(
        { distanceRaccordementElectrique: 1 }, // 1km = 1000m > 500m
        { raccordementEau: RaccordementEau.NON },
      );
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).not.toContain("desserte réseaux");
    });
  });

  describe("Distance des transports en commun", () => {
    it("devrait afficher 'TC prox.' si distance < 500m", () => {
      const data = createTagInputData({ distanceTransportCommun: 300 });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).toContain("TC prox.");
    });

    it("devrait afficher 'TC prox.' si distance = 500m", () => {
      const data = createTagInputData({ distanceTransportCommun: 500 });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).toContain("TC prox.");
    });

    it("ne devrait pas afficher de tag si distance > 500m", () => {
      const data = createTagInputData({ distanceTransportCommun: 600 });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).not.toContain("TC prox.");
    });

    it("ne devrait pas afficher de tag si distance = null (aucun arrêt trouvé)", () => {
      const data = createTagInputData({ distanceTransportCommun: null });
      const result = generateTagsForUsage(UsageType.TERTIAIRE, data);
      expect(result.tags).not.toContain("TC prox.");
    });
  });
});

// ============================================================================
// TESTS USAGE CULTURE (Équipements culturels et touristiques)
// ============================================================================

describe("Usage CULTURE - Équipements culturels et touristiques", () => {
  describe("État du bâti", () => {
    it("devrait afficher 'bâti bon état' si dégradation inexistante", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE },
      );
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("bâti bon état");
    });

    it("devrait afficher 'bâti dégradé' si dégradation moyenne", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE },
      );
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("bâti dégradé");
    });

    it("devrait afficher 'bâti dégradé' si dégradation hétérogène", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_HETEROGENE },
      );
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("bâti dégradé");
    });

    it("devrait afficher 'bâti ruine' si dégradation très importante", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE },
      );
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("bâti ruine");
    });

    it("ne devrait pas afficher de tag si 'ne sait pas'", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.NE_SAIT_PAS },
      );
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).not.toContain("bâti bon état");
      expect(result.tags).not.toContain("bâti dégradé");
      expect(result.tags).not.toContain("bâti ruine");
    });
  });

  describe("Zonage patrimonial", () => {
    it("devrait afficher 'intérêt patrimonial' si site inscrit", () => {
      const data = createTagInputData({ zonagePatrimonial: ZonagePatrimonial.SITE_INSCRIT_CLASSE });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("intérêt patrimonial");
    });

    it("devrait afficher 'intérêt patrimonial' si périmètre ABF", () => {
      const data = createTagInputData({ zonagePatrimonial: ZonagePatrimonial.PERIMETRE_ABF });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("intérêt patrimonial");
    });

    it("devrait afficher 'zon. pat. non-protégé' si non concerné", () => {
      const data = createTagInputData({ zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("zon. pat. non-protégé");
    });
  });

  describe("Qualité du paysage environnant", () => {
    it("devrait afficher 'qualité paysage' si intérêt remarquable", () => {
      const data = createTagInputData({}, { qualitePaysage: QualitePaysage.INTERET_REMARQUABLE });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).toContain("qualité paysage");
    });

    it("ne devrait pas afficher de tag si ordinaire", () => {
      const data = createTagInputData({}, { qualitePaysage: QualitePaysage.ORDINAIRE });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).not.toContain("qualité paysage");
    });

    it("ne devrait pas afficher de tag si sans intérêt", () => {
      const data = createTagInputData({}, { qualitePaysage: QualitePaysage.SANS_INTERET });
      const result = generateTagsForUsage(UsageType.CULTURE, data);
      expect(result.tags).not.toContain("qualité paysage");
    });
  });
});

// ============================================================================
// TESTS USAGE INDUSTRIE (Bâtiments industriels)
// ============================================================================

describe("Usage INDUSTRIE - Bâtiments industriels", () => {
  describe("Taille de la parcelle", () => {
    it("devrait afficher 'grande parcelle' si surface >= 10000 m²", () => {
      const data = createTagInputData({ surfaceSite: 15000 });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).toContain("grande parcelle");
    });

    it("ne devrait pas afficher de tag si surface < 10000 m²", () => {
      const data = createTagInputData({ surfaceSite: 5000 });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("grande parcelle");
      expect(result.tags).not.toContain("petite parcelle");
    });
  });

  describe("Qualité de la voie de desserte", () => {
    it("devrait afficher 'bon accès' si accessible", () => {
      const data = createTagInputData({}, { qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).toContain("bon accès");
    });

    it("ne devrait pas afficher de tag si dégradée", () => {
      const data = createTagInputData({}, { qualiteVoieDesserte: QualiteVoieDesserte.DEGRADEE });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("bon accès");
    });

    it("ne devrait pas afficher de tag si peu accessible", () => {
      const data = createTagInputData(
        {},
        { qualiteVoieDesserte: QualiteVoieDesserte.PEU_ACCESSIBLE },
      );
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("bon accès");
    });
  });

  describe("Zonage environnemental", () => {
    it("devrait afficher 'zon. env. non contraint' si hors zone", () => {
      const data = createTagInputData({
        zonageEnvironnemental: ZonageEnvironnemental.HORS_ZONE,
      });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).toContain("zon. env. non contraint");
    });

    it("devrait afficher 'zon. env. non contraint' si proximité zone", () => {
      const data = createTagInputData({
        zonageEnvironnemental: ZonageEnvironnemental.PROXIMITE_ZONE,
      });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).toContain("zon. env. non contraint");
    });

    it("ne devrait pas afficher de tag si Natura 2000", () => {
      const data = createTagInputData({ zonageEnvironnemental: ZonageEnvironnemental.NATURA_2000 });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("zon. env. non contraint");
    });

    it("ne devrait pas afficher de tag si réserve naturelle", () => {
      const data = createTagInputData({
        zonageEnvironnemental: ZonageEnvironnemental.RESERVE_NATURELLE,
      });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("zon. env. non contraint");
    });
  });

  describe("Zonage patrimonial", () => {
    it("devrait afficher 'zon. pat. non-protégé' si non concerné", () => {
      const data = createTagInputData({ zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).toContain("zon. pat. non-protégé");
    });

    it("ne devrait pas afficher de tag si site inscrit", () => {
      const data = createTagInputData({ zonagePatrimonial: ZonagePatrimonial.SITE_INSCRIT_CLASSE });
      const result = generateTagsForUsage(UsageType.INDUSTRIE, data);
      expect(result.tags).not.toContain("zon. pat. non-protégé");
    });
  });
});

// ============================================================================
// TESTS USAGE PHOTOVOLTAÏQUE (Centrale photovoltaïque au sol)
// ============================================================================

describe("Usage PHOTOVOLTAIQUE - Centrale photovoltaïque au sol", () => {
  describe("Emprise au sol du bâti", () => {
    it("devrait afficher 'emprise bât. faible' si surface < 500 m²", () => {
      const data = createTagInputData({ surfaceBati: 300 });
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).toContain("emprise bât. faible");
    });

    it("ne devrait pas afficher de tag si surface >= 500 m²", () => {
      const data = createTagInputData({ surfaceBati: 600 });
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).not.toContain("emprise bât. faible");
    });
  });

  describe("Valeur architecturale/patrimoniale du bâti", () => {
    it("devrait afficher 'val. patr. faible' si ordinaire", () => {
      const data = createTagInputData(
        {},
        { valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE },
      );
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).toContain("val. patr. faible");
    });

    it("devrait afficher 'val. patr. faible' si sans intérêt", () => {
      const data = createTagInputData(
        {},
        { valeurArchitecturaleHistorique: ValeurArchitecturale.SANS_INTERET },
      );
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).toContain("val. patr. faible");
    });

    it("ne devrait pas afficher de tag si intérêt remarquable", () => {
      const data = createTagInputData(
        {},
        { valeurArchitecturaleHistorique: ValeurArchitecturale.INTERET_REMARQUABLE },
      );
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).not.toContain("val. patr. faible");
    });
  });

  describe("Continuité écologique", () => {
    it("devrait afficher 'absence continuité écologique' si hors trame", () => {
      const data = createTagInputData({}, { trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME });
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).toContain("absence continuité écologique");
    });

    it("ne devrait pas afficher de tag si réservoir biodiversité", () => {
      const data = createTagInputData(
        {},
        { trameVerteEtBleue: TrameVerteEtBleue.RESERVOIR_BIODIVERSITE },
      );
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).not.toContain("absence continuité écologique");
    });

    it("ne devrait pas afficher de tag si corridor à préserver", () => {
      const data = createTagInputData(
        {},
        { trameVerteEtBleue: TrameVerteEtBleue.CORRIDOR_A_PRESERVER },
      );
      const result = generateTagsForUsage(UsageType.PHOTOVOLTAIQUE, data);
      expect(result.tags).not.toContain("absence continuité écologique");
    });
  });
});

// ============================================================================
// TESTS USAGE RENATURATION (Espace renaturé)
// ============================================================================

describe("Usage RENATURATION - Espace renaturé", () => {
  describe("Type de propriétaire", () => {
    it("devrait afficher 'prop. public' si propriétaire public", () => {
      const data = createTagInputData({}, { typeProprietaire: TypeProprietaire.PUBLIC });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("prop. public");
    });

    it("ne devrait pas afficher de tag si propriétaire privé", () => {
      const data = createTagInputData({}, { typeProprietaire: TypeProprietaire.PRIVE });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("prop. public");
    });

    it("ne devrait pas afficher de tag si mixte", () => {
      const data = createTagInputData({}, { typeProprietaire: TypeProprietaire.MIXTE });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("prop. public");
    });

    it("ne devrait pas afficher de tag si copropriété", () => {
      const data = createTagInputData({}, { typeProprietaire: TypeProprietaire.COPRO_INDIVISION });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("prop. public");
    });
  });

  describe("État du bâti (spécifique renaturation)", () => {
    it("devrait afficher 'bâti dégradé' si dégradation moyenne", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("bâti dégradé");
    });

    it("devrait afficher 'bâti ruine' si dégradation très importante", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("bâti ruine");
    });

    it("ne devrait pas afficher de tag si dégradation inexistante (bon état)", () => {
      const data = createTagInputData(
        {},
        { etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("bâti bon état");
      expect(result.tags).not.toContain("bâti dégradé");
    });
  });

  describe("Zonage environnemental (spécifique renaturation)", () => {
    it("devrait afficher 'zone protégée' si réserve naturelle", () => {
      const data = createTagInputData({
        zonageEnvironnemental: ZonageEnvironnemental.RESERVE_NATURELLE,
      });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("zone protégée");
    });

    it("devrait afficher 'zone protégée' si Natura 2000", () => {
      const data = createTagInputData({ zonageEnvironnemental: ZonageEnvironnemental.NATURA_2000 });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("zone protégée");
    });

    it("devrait afficher 'zone protégée' si ZNIEFF", () => {
      const data = createTagInputData({
        zonageEnvironnemental: ZonageEnvironnemental.ZNIEFF_TYPE_1_2,
      });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("zone protégée");
    });

    it("ne devrait pas afficher de tag si hors zone", () => {
      const data = createTagInputData({ zonageEnvironnemental: ZonageEnvironnemental.HORS_ZONE });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("zone protégée");
    });
  });

  describe("Continuité écologique (spécifique renaturation)", () => {
    it("devrait afficher 'continuité écologique' si réservoir biodiversité", () => {
      const data = createTagInputData(
        {},
        { trameVerteEtBleue: TrameVerteEtBleue.RESERVOIR_BIODIVERSITE },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("continuité écologique");
    });

    it("devrait afficher 'continuité écologique' si corridor à restaurer", () => {
      const data = createTagInputData(
        {},
        { trameVerteEtBleue: TrameVerteEtBleue.CORRIDOR_A_RESTAURER },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("continuité écologique");
    });

    it("devrait afficher 'continuité écologique' si corridor à préserver", () => {
      const data = createTagInputData(
        {},
        { trameVerteEtBleue: TrameVerteEtBleue.CORRIDOR_A_PRESERVER },
      );
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("continuité écologique");
    });

    it("ne devrait pas afficher de tag si hors trame", () => {
      const data = createTagInputData({}, { trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).not.toContain("continuité écologique");
    });
  });

  describe("Risques technologiques (spécifique renaturation)", () => {
    it("devrait afficher 'risques tech. faibles' si pas de risques", () => {
      const data = createTagInputData({ presenceRisquesTechnologiques: false });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("risques tech. faibles");
    });

    it("devrait afficher 'risques tech. forts' si risques présents", () => {
      const data = createTagInputData({ presenceRisquesTechnologiques: true });
      const result = generateTagsForUsage(UsageType.RENATURATION, data);
      expect(result.tags).toContain("risques tech. forts");
    });
  });
});

// ============================================================================
// TESTS DE LA FONCTION generateAllTags
// ============================================================================

describe("generateAllTags", () => {
  it("devrait générer des tags pour tous les 7 usages", () => {
    const data = createTagInputData();
    const result = generateAllTags(data);

    expect(result.size).toBe(7);
    expect(result.has(UsageType.RESIDENTIEL)).toBe(true);
    expect(result.has(UsageType.EQUIPEMENTS)).toBe(true);
    expect(result.has(UsageType.TERTIAIRE)).toBe(true);
    expect(result.has(UsageType.CULTURE)).toBe(true);
    expect(result.has(UsageType.INDUSTRIE)).toBe(true);
    expect(result.has(UsageType.PHOTOVOLTAIQUE)).toBe(true);
    expect(result.has(UsageType.RENATURATION)).toBe(true);
  });

  it("devrait générer des tags différents selon l'usage pour les mêmes données", () => {
    const data = createTagInputData(
      {
        surfaceSite: 15000,
        zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE,
      },
      {},
    );
    const result = generateAllTags(data);

    // RESIDENTIEL devrait avoir "grande parcelle" mais pas "zon. pat. non-protégé"
    const residentielTags = result.get(UsageType.RESIDENTIEL) || [];
    expect(residentielTags).toContain("grande parcelle");
    expect(residentielTags).not.toContain("zon. pat. non-protégé");

    // INDUSTRIE devrait avoir "grande parcelle" ET "zon. pat. non-protégé"
    const industrieTags = result.get(UsageType.INDUSTRIE) || [];
    expect(industrieTags).toContain("grande parcelle");
    expect(industrieTags).toContain("zon. pat. non-protégé");

    // CULTURE devrait avoir "zon. pat. non-protégé" mais pas "grande parcelle"
    const cultureTags = result.get(UsageType.CULTURE) || [];
    expect(cultureTags).toContain("zon. pat. non-protégé");
    expect(cultureTags).not.toContain("grande parcelle");
  });
});

// ============================================================================
// TESTS DE CAS LIMITES
// ============================================================================

describe("Cas limites", () => {
  it("devrait gérer les données minimales sans erreur", () => {
    const data: TagInputData = {
      enrichmentData: {
        identifiantParcelle: "",
        codeInsee: "",
        commune: "",
        surfaceSite: 0,
        siteEnCentreVille: false,
        distanceAutoroute: 0,
        distanceTransportCommun: null,
        proximiteCommercesServices: false,
        distanceRaccordementElectrique: 0,
        tauxLogementsVacants: 0,
        presenceRisquesTechnologiques: false,
        siteReferencePollue: false,
        sourcesUtilisees: [],
        champsManquants: [],
        sourcesEchouees: [],
      },
      manualData: createBaseManualData(),
    };

    expect(() => generateAllTags(data)).not.toThrow();
  });

  it("devrait retourner un tableau vide si toutes les conditions sont 'ne sait pas'", () => {
    const data = createTagInputData(
      {
        presenceRisquesNaturels: undefined,
        zonageReglementaire: ZonageReglementaire.NE_SAIT_PAS,
        zonageEnvironnemental: undefined,
        zonagePatrimonial: undefined,
        distanceTransportCommun: null,
      },
      {
        typeProprietaire: TypeProprietaire.NE_SAIT_PAS,
        raccordementEau: RaccordementEau.NE_SAIT_PAS,
        etatBatiInfrastructure: EtatBatiInfrastructure.NE_SAIT_PAS,
        presencePollution: PresencePollution.NE_SAIT_PAS,
        valeurArchitecturaleHistorique: ValeurArchitecturale.NE_SAIT_PAS,
        qualitePaysage: QualitePaysage.NE_SAIT_PAS,
        qualiteVoieDesserte: QualiteVoieDesserte.NE_SAIT_PAS,
        trameVerteEtBleue: TrameVerteEtBleue.NE_SAIT_PAS,
      },
    );

    // Pour CULTURE, tous les critères sont "ne sait pas" donc aucun tag
    const result = generateTagsForUsage(UsageType.CULTURE, data);
    expect(result.tags.length).toBe(0);
  });

  it("devrait gérer les valeurs limites exactes pour les seuils", () => {
    // Test exact à 10000 m² (seuil grande parcelle)
    const dataExact = createTagInputData({ surfaceSite: 10000 });
    const resultExact = generateTagsForUsage(UsageType.RESIDENTIEL, dataExact);
    expect(resultExact.tags).toContain("grande parcelle");

    // Test juste en dessous
    const dataBelow = createTagInputData({ surfaceSite: 9999 });
    const resultBelow = generateTagsForUsage(UsageType.RESIDENTIEL, dataBelow);
    expect(resultBelow.tags).toContain("petite parcelle");

    // Test exact à 500m pour TC
    const dataTcExact = createTagInputData({ distanceTransportCommun: 500 });
    const resultTcExact = generateTagsForUsage(UsageType.TERTIAIRE, dataTcExact);
    expect(resultTcExact.tags).toContain("TC prox.");

    // Test juste au dessus
    const dataTcAbove = createTagInputData({ distanceTransportCommun: 501 });
    const resultTcAbove = generateTagsForUsage(UsageType.TERTIAIRE, dataTcAbove);
    expect(resultTcAbove.tags).not.toContain("TC prox.");
  });
});
