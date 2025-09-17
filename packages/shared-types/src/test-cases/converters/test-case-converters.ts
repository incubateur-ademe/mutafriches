import {
  CalculerMutabiliteInputDto,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
} from "../../dto";
import { TestCase } from "../types/test-case.types";
import * as enumConverters from "./enum-converters";

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
    commune: commune || input.commune || "Test",
    surfaceSite: input.surfaceSite,
    surfaceBati: input.surfaceBati,
    siteEnCentreVille: input.siteEnCentreVille,
    distanceAutoroute: parseFloat(input.distanceAutoroute) || 5,
    distanceTransportCommun: parseFloat(input.distanceTransportCommun) || 500,
    proximiteCommercesServices: input.proximiteCommercesServices,
    connectionReseauElectricite: input.connectionReseauElectricite ?? true,
    distanceRaccordementElectrique: parseFloat(input.distanceRaccordementElectrique) || 1,
    tauxLogementsVacants: input.tauxLogementsVacants || 5,
    presenceRisquesTechnologiques: input.presenceRisquesTechnologiques,
    presenceRisquesNaturels: input.presenceRisquesNaturels,
    zonageEnvironnemental: input.zonageEnvironnemental,
    zonageReglementaire: input.zonageReglementaire,
    zonagePatrimonial: input.zonagePatrimonial,
    trameVerteEtBleue: input.trameVerteEtBleue,
    ancienneActivite: input.ancienneActivite,
    coordonnees: input.coordonnees,
    sourcesUtilisees: ["Test"],
    champsManquants: [],
    fiabilite: 10,
  };

  // Données complémentaires
  const donneesComplementaires: DonneesComplementairesInputDto = {
    typeProprietaire: enumConverters.toTypeProprietaire(input.typeProprietaire),
    terrainViabilise: enumConverters.toTerrainViabilise(input.terrainViabilise),
    etatBatiInfrastructure: enumConverters.toEtatBati(input.etatBatiInfrastructure),
    presencePollution: enumConverters.toPresencePollution(input.presencePollution),
    valeurArchitecturaleHistorique: enumConverters.toValeurArchitecturale(
      input.valeurArchitecturaleHistorique,
    ),
    qualitePaysage: enumConverters.toQualitePaysage(input.qualitePaysage),
    qualiteVoieDesserte: enumConverters.toQualiteVoieDesserte(input.qualiteVoieDesserte),
  };

  return {
    donneesEnrichies,
    donneesComplementaires,
  };
}
