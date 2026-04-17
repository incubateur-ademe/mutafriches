import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
  TrameVerteEtBleue,
  ZoneAccelerationEnr,
  Coordonnees,
  GeometrieParcelle,
  CalculerMutabiliteInputDto,
  RaccordementEau,
} from "@mutafriches/shared-types";

/**
 * Entité métier Site
 * Représente un site (1 ou plusieurs parcelles) avec toutes ses données pour le calcul de mutabilité
 */
export class Site {
  // Identification
  identifiantParcelle: string; // Champ conservé pour compatibilité DTO public
  codeInsee: string;
  commune: string;
  coordonnees?: Coordonnees; // Centroïde du site
  geometrie?: GeometrieParcelle; // Géométrie du site (Polygon ou MultiPolygon)
  /** Géométrie spécifique pour le zonage réglementaire (parcelle prédominante en multi-parcellaire) */
  geometrieReglementaire?: GeometrieParcelle;
  nombreParcelles?: number; // Nombre de parcelles constituant le site

  // Données enrichies automatiquement
  surfaceSite: number;
  surfaceBati?: number;
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  /** Distance en mètres. null = aucun arrêt trouvé dans le rayon de recherche (2km) */
  distanceTransportCommun: number | null;
  proximiteCommercesServices: boolean;
  distanceRaccordementElectrique: number;
  tauxLogementsVacants: number;
  presenceRisquesTechnologiques: boolean;
  risqueRetraitGonflementArgile?: RisqueRetraitGonflementArgile;
  risqueCavitesSouterraines?: RisqueCavitesSouterraines;
  risqueInondation?: RisqueInondation;
  zonageReglementaire?: ZonageReglementaire;
  zonageEnvironnemental?: ZonageEnvironnemental;
  zonagePatrimonial?: ZonagePatrimonial;
  trameVerteEtBleue?: TrameVerteEtBleue;
  zoneAccelerationEnr?: ZoneAccelerationEnr;
  /** Site référencé comme pollué (détection auto via ADEME/SIS/ICPE) */
  siteReferencePollue?: boolean;

  // Données saisies manuellement
  typeProprietaire?: TypeProprietaire;
  raccordementEau?: RaccordementEau;
  etatBatiInfrastructure?: EtatBatiInfrastructure;
  presencePollution?: PresencePollution;
  valeurArchitecturaleHistorique?: ValeurArchitecturale;
  qualitePaysage?: QualitePaysage;
  qualiteVoieDesserte?: QualiteVoieDesserte;
  presenceEspecesProtegees?: PresenceEspecesProtegees;

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
  ): Site {
    const site = new Site();

    if (!enrichissement) {
      throw new Error("Données d'enrichissement manquantes");
    }

    Object.assign(site, {
      ...enrichissement,
      // Cast sécurisé des enums
      risqueRetraitGonflementArgile: enrichissement.risqueRetraitGonflementArgile
        ? (enrichissement.risqueRetraitGonflementArgile as RisqueRetraitGonflementArgile)
        : undefined,
      risqueCavitesSouterraines: enrichissement.risqueCavitesSouterraines
        ? (enrichissement.risqueCavitesSouterraines as RisqueCavitesSouterraines)
        : undefined,
      risqueInondation: enrichissement.risqueInondation
        ? (enrichissement.risqueInondation as RisqueInondation)
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
      zoneAccelerationEnr: enrichissement.zoneAccelerationEnr
        ? (enrichissement.zoneAccelerationEnr as ZoneAccelerationEnr)
        : undefined,
      // Copie des données géographiques
      coordonnees: enrichissement.coordonnees,
      geometrie: enrichissement.geometrie,
      // Multi-parcelle
      nombreParcelles: enrichissement.nombreParcelles,
    });

    if (donneesComplementaires) {
      Object.assign(site, donneesComplementaires);
    }

    return site;
  }

  /**
   * Constructeur direct à partir de l'input complet (sans enrichissement)
   */
  static fromInput(input: CalculerMutabiliteInputDto): Site {
    const site = new Site();

    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans l'input");
    }

    const { donneesEnrichies, donneesComplementaires } = input;

    // Copier les données enrichies
    site.identifiantParcelle = donneesEnrichies.identifiantParcelle;
    site.commune = donneesEnrichies.commune;
    site.coordonnees = donneesEnrichies.coordonnees;
    site.geometrie = donneesEnrichies.geometrie;
    site.surfaceSite = donneesEnrichies.surfaceSite;
    site.surfaceBati = donneesEnrichies.surfaceBati;
    site.siteEnCentreVille = donneesEnrichies.siteEnCentreVille;
    site.distanceAutoroute = donneesEnrichies.distanceAutoroute;
    site.distanceTransportCommun = donneesEnrichies.distanceTransportCommun;
    site.proximiteCommercesServices = donneesEnrichies.proximiteCommercesServices;
    site.distanceRaccordementElectrique = donneesEnrichies.distanceRaccordementElectrique;
    site.tauxLogementsVacants = donneesEnrichies.tauxLogementsVacants;
    site.presenceRisquesTechnologiques = donneesEnrichies.presenceRisquesTechnologiques;

    // Cast sécurisé des enums
    site.risqueRetraitGonflementArgile = donneesEnrichies.risqueRetraitGonflementArgile
      ? (donneesEnrichies.risqueRetraitGonflementArgile as RisqueRetraitGonflementArgile)
      : undefined;
    site.risqueCavitesSouterraines = donneesEnrichies.risqueCavitesSouterraines
      ? (donneesEnrichies.risqueCavitesSouterraines as RisqueCavitesSouterraines)
      : undefined;
    site.risqueInondation = donneesEnrichies.risqueInondation
      ? (donneesEnrichies.risqueInondation as RisqueInondation)
      : undefined;
    site.zonageEnvironnemental = donneesEnrichies.zonageEnvironnemental
      ? (donneesEnrichies.zonageEnvironnemental as ZonageEnvironnemental)
      : undefined;
    site.zonagePatrimonial = donneesEnrichies.zonagePatrimonial
      ? (donneesEnrichies.zonagePatrimonial as ZonagePatrimonial)
      : undefined;
    site.zonageReglementaire = donneesEnrichies.zonageReglementaire
      ? (donneesEnrichies.zonageReglementaire as ZonageReglementaire)
      : undefined;
    site.zoneAccelerationEnr = donneesEnrichies.zoneAccelerationEnr
      ? (donneesEnrichies.zoneAccelerationEnr as ZoneAccelerationEnr)
      : undefined;

    // Multi-parcelle
    site.nombreParcelles = donneesEnrichies.nombreParcelles;

    // Métadonnées
    site.sourcesUtilisees = donneesEnrichies.sourcesUtilisees || [];
    site.champsManquants = donneesEnrichies.champsManquants || [];

    // Copier les données complémentaires si présentes
    if (donneesComplementaires) {
      site.typeProprietaire = donneesComplementaires.typeProprietaire;
      site.raccordementEau = donneesComplementaires.raccordementEau;
      site.etatBatiInfrastructure = donneesComplementaires.etatBatiInfrastructure;
      site.presencePollution = donneesComplementaires.presencePollution;
      site.valeurArchitecturaleHistorique = donneesComplementaires.valeurArchitecturaleHistorique;
      site.qualitePaysage = donneesComplementaires.qualitePaysage;
      site.qualiteVoieDesserte = donneesComplementaires.qualiteVoieDesserte;
      site.trameVerteEtBleue = donneesComplementaires.trameVerteEtBleue;
      site.presenceEspecesProtegees = donneesComplementaires.presenceEspecesProtegees;
    }

    return site;
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
        v !== QualiteVoieDesserte.NE_SAIT_PAS &&
        v !== TrameVerteEtBleue.NE_SAIT_PAS &&
        v !== PresenceEspecesProtegees.NE_SAIT_PAS,
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
      this.qualiteVoieDesserte &&
      this.trameVerteEtBleue &&
      this.presenceEspecesProtegees
    );
  }
}
