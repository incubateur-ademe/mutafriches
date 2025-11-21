import { Evaluation } from "../entities/evaluation.entity";
import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
  SourceUtilisation,
  TypeProprietaire,
  UsageType,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  APP_CONFIG,
} from "@mutafriches/shared-types";

/**
 * Builder pour créer des instances d'Evaluation pour les tests
 * Utilise le pattern Builder fluent pour une API lisible
 *
 * @example
 * const evaluation = new EvaluationBuilder()
 *   .withId("custom-id")
 *   .withOrigine(SourceUtilisation.IFRAME_INTEGREE, "cartofriches")
 *   .build();
 */
export class EvaluationBuilder {
  private id = "eval-123";
  private parcelleId = "29232000AB0123";
  private codeInsee = "29232";
  private versionAlgorithme: string = APP_CONFIG.versionAlgo;

  private enrichissement: EnrichissementOutputDto = {
    identifiantParcelle: "29232000AB0123",
    codeInsee: "29232",
    commune: "Quimper",
    surfaceSite: 5000,
    surfaceBati: 1000,
    siteEnCentreVille: true,
    distanceAutoroute: 1500,
    distanceTransportCommun: 200,
    proximiteCommercesServices: true,
    distanceRaccordementElectrique: 500,
    tauxLogementsVacants: 5.2,
    presenceRisquesTechnologiques: false,
    presenceRisquesNaturels: "FAIBLE",
    zonageReglementaire: "U",
    sourcesUtilisees: ["cadastre"],
    champsManquants: [],
    fiabilite: 9.0,
  };

  private complementaires: DonneesComplementairesInputDto = {
    typeProprietaire: TypeProprietaire.PRIVE,
    raccordementEau: RaccordementEau.OUI,
    etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    presencePollution: PresencePollution.NON,
    valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE,
    qualitePaysage: QualitePaysage.ORDINAIRE,
    qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
  };

  private resultats: MutabiliteOutputDto = {
    fiabilite: {
      note: 8.5,
      text: "Fiable",
      description: "Calcul basé sur des données complètes",
      criteresRenseignes: 15,
      criteresTotal: 18,
    },
    resultats: [
      {
        usage: UsageType.RESIDENTIEL,
        indiceMutabilite: 75,
        rang: 7,
        potentiel: "Favorable",
      },
    ],
  };

  private origine: { source: SourceUtilisation; integrateur?: string } = {
    source: SourceUtilisation.API_DIRECTE,
  };

  /**
   * Définir l'ID de l'évaluation
   */
  withId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Créer une évaluation sans ID (pour tester les erreurs)
   */
  withoutId(): this {
    this.id = undefined as any;
    return this;
  }

  /**
   * Définir l'identifiant de parcelle
   */
  withParcelleId(parcelleId: string): this {
    this.parcelleId = parcelleId;
    this.enrichissement.identifiantParcelle = parcelleId;
    return this;
  }

  /**
   * Définir le code INSEE
   */
  withCodeInsee(codeInsee: string): this {
    this.codeInsee = codeInsee;
    this.enrichissement.codeInsee = codeInsee;
    return this;
  }

  /**
   * Définir la commune
   */
  withCommune(commune: string): this {
    this.enrichissement.commune = commune;
    return this;
  }

  /**
   * Surcharger partiellement les données d'enrichissement
   */
  withEnrichissement(enrichissement: Partial<EnrichissementOutputDto>): this {
    this.enrichissement = { ...this.enrichissement, ...enrichissement };
    return this;
  }

  /**
   * Surcharger partiellement les données complémentaires
   */
  withDonneesComplementaires(complementaires: Partial<DonneesComplementairesInputDto>): this {
    this.complementaires = { ...this.complementaires, ...complementaires };
    return this;
  }

  /**
   * Surcharger partiellement les résultats
   */
  withResultats(resultats: Partial<MutabiliteOutputDto>): this {
    this.resultats = { ...this.resultats, ...resultats };
    return this;
  }

  /**
   * Définir l'origine de l'évaluation
   */
  withOrigine(source: SourceUtilisation, integrateur?: string): this {
    this.origine = { source, integrateur };
    return this;
  }

  /**
   * Définir la version de l'algorithme
   */
  withVersionAlgorithme(version: string): this {
    this.versionAlgorithme = version;
    return this;
  }

  /**
   * Construire l'instance d'Evaluation
   */
  build(): Evaluation {
    const evaluation = new Evaluation(
      this.parcelleId,
      this.codeInsee,
      this.enrichissement,
      this.complementaires,
      this.resultats,
      this.origine,
    );

    if (this.id !== undefined) {
      evaluation.id = this.id;
    }

    evaluation.versionAlgorithme = this.versionAlgorithme;

    return evaluation;
  }
}

/**
 * Factory function pour créer rapidement une évaluation avec des valeurs par défaut
 *
 * @example
 * const evaluation = createMockEvaluation({ id: "custom-id" });
 */
export function createMockEvaluation(overrides?: Partial<Evaluation>): Evaluation {
  const builder = new EvaluationBuilder();
  const evaluation = builder.build();

  if (overrides) {
    return Object.assign(evaluation, overrides);
  }

  return evaluation;
}
