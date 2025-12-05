import { EnrichissementOutputDto } from "../../enrichissement";
import { CalculerMutabiliteInputDto, DonneesComplementairesInputDto } from "../../evaluation";
import { TestCase } from "../types/test-case.types";
import * as enumConverters from "./enum-converters";

/**
 * Convertit une valeur de distance textuelle en nombre
 */
function parseDistance(
  value: string | undefined,
  type: "autoroute" | "transport" | "electrique",
): number {
  if (!value) {
    return type === "autoroute" ? 5 : type === "transport" ? 500 : 1;
  }

  // Mapping pour les distances d'autoroute (en km)
  const autorouteMapping: Record<string, number> = {
    "moins-de-1km": 0.5,
    "entre-1-et-2km": 1.5,
    "entre-2-et-5km": 3.5,
    "plus-de-5km": 10,
  };

  // Mapping pour les distances de transport (en mètres)
  const transportMapping: Record<string, number> = {
    "moins-de-500m": 250,
    "plus-de-500m": 1000,
    "entre-500m-et-1km": 750,
    "plus-de-1km": 2000,
  };

  // Mapping pour les distances électriques (en km)
  const electriqueMapping: Record<string, number> = {
    "moins-de-1km": 0.5,
    "entre-1-et-5km": 3,
    "plus-de-5km": 10,
  };

  // Si c'est déjà un nombre, le retourner
  const parsed = parseFloat(value);
  if (!isNaN(parsed)) {
    return parsed;
  }

  // Sinon utiliser le mapping approprié
  if (type === "autoroute") {
    return autorouteMapping[value] || 5;
  } else if (type === "transport") {
    return transportMapping[value] || 500;
  } else {
    return electriqueMapping[value] || 1;
  }
}

// Convertit un test case en input pour le calcul de mutabilité
export function convertTestCaseToMutabilityInput(
  testCase: TestCase,
  identifiantParcelle?: string,
  commune?: string,
): CalculerMutabiliteInputDto {
  const input = testCase.input;

  // Données enrichies
  const donneesEnrichies: EnrichissementOutputDto = {
    identifiantParcelle: identifiantParcelle || input.identifiantParcelle || `test-${testCase.id}`,
    codeInsee: "12345", // Code INSEE fictif pour les tests
    commune: commune || input.commune || "Test",
    surfaceSite: input.surfaceSite,
    surfaceBati: input.surfaceBati,
    siteEnCentreVille: input.siteEnCentreVille,

    // Conversion des distances
    distanceAutoroute: parseDistance(input.distanceAutoroute, "autoroute"),
    distanceTransportCommun: parseDistance(input.distanceTransportCommun, "transport"),
    distanceRaccordementElectrique: parseDistance(
      input.distanceRaccordementElectrique,
      "electrique",
    ),

    proximiteCommercesServices: input.proximiteCommercesServices,
    tauxLogementsVacants: input.tauxLogementsVacants || 5,
    presenceRisquesTechnologiques: input.presenceRisquesTechnologiques,

    presenceRisquesNaturels: input.presenceRisquesNaturels,
    zonageEnvironnemental: input.zonageEnvironnemental,
    zonageReglementaire: input.zonageReglementaire,
    zonagePatrimonial: input.zonagePatrimonial,

    coordonnees: input.coordonnees,
    sourcesUtilisees: ["Test"],
    champsManquants: [],
  };

  // Données complémentaires
  // Ces données sont converties via les enum-converters car elles peuvent avoir des formats différents
  // (ex: "batiments-heterogenes" → "degradation-heterogene")
  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: enumConverters.toTypeProprietaire(input.typeProprietaire),
    raccordementEau: enumConverters.toRaccordementEau(input.raccordementEau),
    etatBatiInfrastructure: enumConverters.toEtatBati(input.etatBatiInfrastructure),
    presencePollution: enumConverters.toPresencePollution(input.presencePollution),
    valeurArchitecturaleHistorique: enumConverters.toValeurArchitecturale(
      input.valeurArchitecturaleHistorique,
    ),
    qualitePaysage: enumConverters.toQualitePaysage(input.qualitePaysage),
    qualiteVoieDesserte: enumConverters.toQualiteVoieDesserte(input.qualiteVoieDesserte),
    trameVerteEtBleue: enumConverters.toTrameVerteEtBleue(input.trameVerteEtBleu),
  };

  return {
    donneesEnrichies,
    donneesComplementaires,
  };
}
