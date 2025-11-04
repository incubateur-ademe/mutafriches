import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
  TrameVerteEtBleue,
  Coordonnees,
  GeometrieParcelle,
  CalculerMutabiliteInputDto,
  RaccordementEau,
} from "@mutafriches/shared-types";

/**
 * Entité métier Parcelle
 * Représente une friche avec toutes ses données
 */
export class Parcelle {
  // Identification
  identifiantParcelle: string;
  codeInsee: string;
  commune: string;
  coordonnees?: Coordonnees; // Point d'entrée GPS de la parcelle
  geometrie?: GeometrieParcelle; // Polygone complet de la parcelle

  // Données enrichies automatiquement
  surfaceSite: number;
  surfaceBati?: number;
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  distanceTransportCommun: number;
  proximiteCommercesServices: boolean;
  distanceRaccordementElectrique: number;
  tauxLogementsVacants: number;
  presenceRisquesTechnologiques: boolean;
  presenceRisquesNaturels?: RisqueNaturel;
  zonageReglementaire?: ZonageReglementaire;
  zonageEnvironnemental?: ZonageEnvironnemental;
  zonagePatrimonial?: ZonagePatrimonial;
  trameVerteEtBleue?: TrameVerteEtBleue;

  // Données saisies manuellement
  typeProprietaire?: TypeProprietaire;
  raccordementEau?: RaccordementEau;
  etatBatiInfrastructure?: EtatBatiInfrastructure;
  presencePollution?: PresencePollution;
  valeurArchitecturaleHistorique?: ValeurArchitecturale;
  qualitePaysage?: QualitePaysage;
  qualiteVoieDesserte?: QualiteVoieDesserte;

  // Métadonnées
  sourcesUtilisees: string[] = [];
  champsManquants: string[] = [];
  fiabilite: number = 0;

  /**
   * Constructeur à partir des données enrichies et complémentaires
   */
  static fromEnrichissement(
    enrichissement: EnrichissementOutputDto,
    donneesComplementaires?: DonneesComplementairesInputDto,
  ): Parcelle {
    const parcelle = new Parcelle();

    if (!enrichissement) {
      throw new Error("Données d'enrichissement manquantes");
    }

    Object.assign(parcelle, {
      ...enrichissement,
      // Cast sécurisé des enums
      presenceRisquesNaturels: enrichissement.presenceRisquesNaturels
        ? (enrichissement.presenceRisquesNaturels as RisqueNaturel)
        : undefined,
      zonageEnvironnemental: enrichissement.zonageEnvironnemental
        ? (enrichissement.zonageEnvironnemental as ZonageEnvironnemental)
        : undefined,
      zonagePatrimonial: enrichissement.zonagePatrimonial
        ? (enrichissement.zonagePatrimonial as ZonagePatrimonial)
        : undefined,
      zonageReglementaire: enrichissement.zonageReglementaire
        ? (enrichissement.zonageReglementaire as ZonageReglementaire)
        : undefined,
      trameVerteEtBleue: enrichissement.trameVerteEtBleue
        ? (enrichissement.trameVerteEtBleue as TrameVerteEtBleue)
        : undefined,
      // Copie des données géographiques
      coordonnees: enrichissement.coordonnees,
      geometrie: enrichissement.geometrie,
    });

    if (donneesComplementaires) {
      Object.assign(parcelle, donneesComplementaires);
    }

    return parcelle;
  }

  /**
   * Constructeur direct à partir de l'input complet (sans enrichissement)
   */
  static fromInput(input: CalculerMutabiliteInputDto): Parcelle {
    const parcelle = new Parcelle();

    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans l'input");
    }

    const { donneesEnrichies, donneesComplementaires } = input;

    // Copier les données enrichies
    parcelle.identifiantParcelle = donneesEnrichies.identifiantParcelle;
    parcelle.commune = donneesEnrichies.commune;
    parcelle.coordonnees = donneesEnrichies.coordonnees;
    parcelle.geometrie = donneesEnrichies.geometrie;
    parcelle.surfaceSite = donneesEnrichies.surfaceSite;
    parcelle.surfaceBati = donneesEnrichies.surfaceBati;
    parcelle.siteEnCentreVille = donneesEnrichies.siteEnCentreVille;
    parcelle.distanceAutoroute = donneesEnrichies.distanceAutoroute;
    parcelle.distanceTransportCommun = donneesEnrichies.distanceTransportCommun;
    parcelle.proximiteCommercesServices = donneesEnrichies.proximiteCommercesServices;
    parcelle.distanceRaccordementElectrique = donneesEnrichies.distanceRaccordementElectrique;
    parcelle.tauxLogementsVacants = donneesEnrichies.tauxLogementsVacants;
    parcelle.presenceRisquesTechnologiques = donneesEnrichies.presenceRisquesTechnologiques;

    // Cast sécurisé des enums
    parcelle.presenceRisquesNaturels = donneesEnrichies.presenceRisquesNaturels
      ? (donneesEnrichies.presenceRisquesNaturels as RisqueNaturel)
      : undefined;
    parcelle.zonageEnvironnemental = donneesEnrichies.zonageEnvironnemental
      ? (donneesEnrichies.zonageEnvironnemental as ZonageEnvironnemental)
      : undefined;
    parcelle.zonagePatrimonial = donneesEnrichies.zonagePatrimonial
      ? (donneesEnrichies.zonagePatrimonial as ZonagePatrimonial)
      : undefined;
    parcelle.zonageReglementaire = donneesEnrichies.zonageReglementaire
      ? (donneesEnrichies.zonageReglementaire as ZonageReglementaire)
      : undefined;
    parcelle.trameVerteEtBleue = donneesEnrichies.trameVerteEtBleue
      ? (donneesEnrichies.trameVerteEtBleue as TrameVerteEtBleue)
      : undefined;

    // Métadonnées
    parcelle.sourcesUtilisees = donneesEnrichies.sourcesUtilisees || [];
    parcelle.champsManquants = donneesEnrichies.champsManquants || [];
    parcelle.fiabilite = donneesEnrichies.fiabilite || 0;

    // Copier les données complémentaires si présentes
    if (donneesComplementaires) {
      parcelle.typeProprietaire = donneesComplementaires.typeProprietaire;
      parcelle.raccordementEau = donneesComplementaires.raccordementEau;
      parcelle.etatBatiInfrastructure = donneesComplementaires.etatBatiInfrastructure;
      parcelle.presencePollution = donneesComplementaires.presencePollution;
      parcelle.valeurArchitecturaleHistorique =
        donneesComplementaires.valeurArchitecturaleHistorique;
      parcelle.qualitePaysage = donneesComplementaires.qualitePaysage;
      parcelle.qualiteVoieDesserte = donneesComplementaires.qualiteVoieDesserte;
    }

    return parcelle;
  }

  /**
   * Calcule le taux de remplissage des données
   */
  calculerTauxCompletude(): number {
    const champsTotal = 30;
    const champsRemplis = Object.values(this).filter(
      (v) =>
        v !== undefined &&
        v !== null &&
        v !== TypeProprietaire.NE_SAIT_PAS &&
        v !== RaccordementEau.NE_SAIT_PAS &&
        v !== EtatBatiInfrastructure.NE_SAIT_PAS &&
        v !== PresencePollution.NE_SAIT_PAS &&
        v !== ValeurArchitecturale.NE_SAIT_PAS &&
        v !== QualitePaysage.NE_SAIT_PAS &&
        v !== QualiteVoieDesserte.NE_SAIT_PAS,
    ).length;

    return Math.round((champsRemplis / champsTotal) * 100);
  }

  /**
   * Vérifie si toutes les données obligatoires sont présentes
   */
  estComplete(): boolean {
    return !!(
      this.identifiantParcelle &&
      this.commune &&
      this.surfaceSite &&
      this.typeProprietaire &&
      this.raccordementEau &&
      this.etatBatiInfrastructure &&
      this.presencePollution &&
      this.valeurArchitecturaleHistorique &&
      this.qualitePaysage &&
      this.qualiteVoieDesserte
    );
  }
}
