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
  TrameVerteEtBleue,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageReglementaire,
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
  private siteId = "29232000AB0123";
  private codeInsee = "29232";
  private nombreParcelles?: number;
  private versionAlgorithme = "1.1.0";

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
    risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN,
    risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
    risqueInondation: RisqueInondation.NON,
    siteReferencePollue: false,
    zonageReglementaire: ZonageReglementaire.ZONE_URBAINE_U,
    sourcesUtilisees: ["cadastre"],
    champsManquants: [],
    sourcesEchouees: [],
  };

  private complementaires: DonneesComplementairesInputDto = {
    typeProprietaire: TypeProprietaire.PRIVE,
    raccordementEau: RaccordementEau.OUI,
    etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    presencePollution: PresencePollution.NON,
    valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE,
    qualitePaysage: QualitePaysage.ORDINAIRE,
    qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
    trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,
  };

  private resultats: MutabiliteOutputDto = {
    fiabilite: {
      note: 8.5,
      text: "Fiable",
      description: "Calcul base sur des donnees completes",
      criteresRenseignes: 15,
      criteresTotal: 21,
      poidsRenseignes: 22,
      poidsTotal: 26,
    },
    resultats: [
      {
        usage: UsageType.RESIDENTIEL,
        indiceMutabilite: 75,
        rang: 1,
        potentiel: "Favorable",
      },
    ],
  };

  private origine: { source: SourceUtilisation; integrateur?: string } = {
    source: SourceUtilisation.API_DIRECTE,
  };

  /**
   * Definir l'ID de l'evaluation
   */
  withId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Creer une evaluation sans ID (pour tester les erreurs)
   */
  withoutId(): this {
    this.id = undefined as any;
    return this;
  }

  /**
   * Définir l'identifiant du site (= identifiant parcelle pour mono, clé composite pour multi)
   */
  withSiteId(siteId: string): this {
    this.siteId = siteId;
    this.enrichissement.identifiantParcelle = siteId;
    return this;
  }

  /**
   * Définir le nombre de parcelles du site
   */
  withNombreParcelles(n: number): this {
    this.nombreParcelles = n;
    return this;
  }

  /**
   * Definir le code INSEE
   */
  withCodeInsee(codeInsee: string): this {
    this.codeInsee = codeInsee;
    this.enrichissement.codeInsee = codeInsee;
    return this;
  }

  /**
   * Definir la commune
   */
  withCommune(commune: string): this {
    this.enrichissement.commune = commune;
    return this;
  }

  /**
   * Surcharger partiellement les donnees d'enrichissement
   */
  withEnrichissement(enrichissement: Partial<EnrichissementOutputDto>): this {
    this.enrichissement = { ...this.enrichissement, ...enrichissement };
    return this;
  }

  /**
   * Surcharger partiellement les donnees complementaires
   */
  withDonneesComplementaires(complementaires: Partial<DonneesComplementairesInputDto>): this {
    this.complementaires = { ...this.complementaires, ...complementaires };
    return this;
  }

  /**
   * Surcharger partiellement les resultats
   */
  withResultats(resultats: Partial<MutabiliteOutputDto>): this {
    this.resultats = { ...this.resultats, ...resultats };
    return this;
  }

  /**
   * Definir l'origine de l'evaluation
   */
  withOrigine(source: SourceUtilisation, integrateur?: string): this {
    this.origine = { source, integrateur };
    return this;
  }

  /**
   * Definir la version de l'algorithme
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
      this.siteId,
      this.codeInsee,
      this.enrichissement,
      this.complementaires,
      this.resultats,
      this.origine,
      this.nombreParcelles,
    );

    if (this.id !== undefined) {
      evaluation.id = this.id;
    }

    evaluation.versionAlgorithme = this.versionAlgorithme;

    return evaluation;
  }
}

/**
 * Factory function pour creer rapidement une evaluation avec des valeurs par defaut
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
