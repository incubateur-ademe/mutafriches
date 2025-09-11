import { TestCase } from "./types";

/**
 * Convertit un TestCase vers le format MutabilityInputDto pour l'API
 */
export function convertTestCaseToMutabilityInput(
  testCase: TestCase,
  identifiantParcelle?: string,
  commune?: string,
): any {
  const input = testCase.input;

  return {
    // Identifiants
    identifiantParcelle: identifiantParcelle || input.identifiantParcelle || `test-${testCase.id}`,
    commune: commune || input.commune || "Test",

    // Surfaces et propriété
    surfaceSite: input.surfaceSite,
    surfaceBati: input.surfaceBati,
    nombreBatiments: input.nombreBatiments,

    // État du site - conversion des strings en enums
    etatBatiInfrastructure: convertEtatBatiEnum(input.etatBatiInfrastructure),
    presencePollution: convertPresencePollutionEnum(input.presencePollution),
    terrainEnPente: input.terrainEnPente,

    // Localisation
    siteEnCentreVille: input.siteEnCentreVille,
    tauxLogementsVacants: input.tauxLogementsVacants,
    terrainViabilise: input.terrainViabilise,
    qualiteVoieDesserte: convertQualiteVoieEnum(input.qualiteVoieDesserte),
    distanceAutoroute: convertDistanceAutorouteEnum(input.distanceAutoroute),
    distanceTransportCommun: convertDistanceTransportEnum(input.distanceTransportCommun),
    proximiteCommercesServices: input.proximiteCommercesServices,
    distanceRaccordementElectrique: convertDistanceRaccordementEnum(
      input.distanceRaccordementElectrique,
    ),
    connectionReseauElectricite: input.connectionReseauElectricite,

    // Zonages
    zonageReglementaire: convertZonageReglementaireEnum(input.zonageReglementaire),
    presenceRisquesNaturels: convertRisqueNaturelEnum(input.presenceRisquesNaturels),
    presenceRisquesTechnologiques: input.presenceRisquesTechnologiques,
    zonagePatrimonial: convertZonagePatrimonialEnum(input.zonagePatrimonial),

    // Qualités
    qualitePaysage: convertQualitePaysageEnum(input.qualitePaysage),
    valeurArchitecturaleHistorique: convertValeurArchitecturaleEnum(
      input.valeurArchitecturaleHistorique,
    ),

    // Environnement
    couvertVegetal: input.couvertVegetal,
    presenceEspeceProtegee: input.presenceEspeceProtegee,
    zonageEnvironnemental: convertZonageEnvironnementalEnum(input.zonageEnvironnemental),
    trameVerteEtBleue: convertTrameVerteEnum(input.trameVerteEtBleue),
    zoneHumide: input.zoneHumide,

    // Optionnels
    coordonnees: input.coordonnees,
    ancienneActivite: input.ancienneActivite,
    typeProprietaire: convertTypeProprietaireEnum(input.typeProprietaire),
  };
}

// Fonctions de conversion spécialisées
function convertTypeProprietaireEnum(value: string): string {
  const mapping: Record<string, string> = {
    public: "PUBLIC",
    prive: "PRIVE",
    mixte: "MIXTE",
  };
  return mapping[value] || value.toUpperCase();
}

function convertEtatBatiEnum(value: string): string {
  const mapping: Record<string, string> = {
    "batiments-heterogenes": "BATIMENTS_HETEROGENES",
    "batiments-homogenes": "BATIMENTS_HOMOGENES",
    "absence-batiments": "ABSENCE_BATIMENTS",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertPresencePollutionEnum(value: string): string {
  const mapping: Record<string, string> = {
    "ne-sait-pas": "NE_SAIT_PAS",
    "oui-autres-composes": "OUI_AUTRES_COMPOSES",
    "oui-hydrocarbures": "OUI_HYDROCARBURES",
    non: "NON",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertQualiteVoieEnum(value: string): string {
  const mapping: Record<string, string> = {
    accessible: "ACCESSIBLE",
    "peu-accessible": "PEU_ACCESSIBLE",
    "difficilement-accessible": "DIFFICILEMENT_ACCESSIBLE",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertDistanceAutorouteEnum(value: string): string {
  const mapping: Record<string, string> = {
    "moins-de-1km": "MOINS_DE_1KM",
    "entre-1-et-2km": "ENTRE_1_ET_2KM",
    "entre-2-et-5km": "ENTRE_2_ET_5KM",
    "plus-de-5km": "PLUS_DE_5KM",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertDistanceTransportEnum(value: string): string {
  const mapping: Record<string, string> = {
    "moins-de-500m": "MOINS_DE_500M",
    "plus-de-500m": "PLUS_DE_500M",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertDistanceRaccordementEnum(value: string): string {
  const mapping: Record<string, string> = {
    "moins-de-1km": "MOINS_DE_1KM",
    "entre-1-et-5km": "ENTRE_1_ET_5KM",
    "plus-de-5km": "PLUS_DE_5KM",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertZonageReglementaireEnum(value: string): string {
  const mapping: Record<string, string> = {
    "zone-urbaine-u": "ZONE_URBAINE_U",
    "zone-naturelle": "ZONE_NATURELLE",
    "zone-agricole": "ZONE_AGRICOLE",
    "zone-economique": "ZONE_ECONOMIQUE",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertRisqueNaturelEnum(value: string): string {
  const mapping: Record<string, string> = {
    aucun: "AUCUN",
    faible: "FAIBLE",
    moyen: "MOYEN",
    fort: "FORT",
  };
  return mapping[value] || value.toUpperCase();
}

function convertZonagePatrimonialEnum(value: string): string {
  const mapping: Record<string, string> = {
    "non-concerne": "NON_CONCERNE",
    "monument-historique": "MONUMENT_HISTORIQUE",
    "site-classe": "SITE_CLASSE",
    "secteur-sauvegarde": "SECTEUR_SAUVEGARDE",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertQualitePaysageEnum(value: string): string {
  const mapping: Record<string, string> = {
    exceptionnel: "EXCEPTIONNEL",
    interessant: "INTERESSANT",
    "banal-infra-ordinaire": "BANAL_INFRA_ORDINAIRE",
    degrade: "DEGRADE",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertValeurArchitecturaleEnum(value: string): string {
  const mapping: Record<string, string> = {
    exceptionnel: "EXCEPTIONNEL",
    "interet-fort": "INTERET_FORT",
    "interet-moyen": "INTERET_MOYEN",
    "peu-dinteret": "PEU_DINTERET",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertZonageEnvironnementalEnum(value: string): string {
  const mapping: Record<string, string> = {
    "hors-zone": "HORS_ZONE",
    "znieff-type-1-2": "ZNIEFF_TYPE_1_2",
    "natura-2000": "NATURA_2000",
    "parc-national": "PARC_NATIONAL",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}

function convertTrameVerteEnum(value: string): string {
  const mapping: Record<string, string> = {
    "hors-trame": "HORS_TRAME",
    "corridor-ecologique": "CORRIDOR_ECOLOGIQUE",
    "reservoir-biodiversite": "RESERVOIR_BIODIVERSITE",
    "ne-sait-pas": "NE_SAIT_PAS",
  };
  return mapping[value] || value.toUpperCase().replace(/-/g, "_");
}
