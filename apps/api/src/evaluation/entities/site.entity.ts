import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
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
  ZonageAbcLogement,
  DistanceIte,
  Coordonnees,
  GeometrieParcelle,
  CalculerMutabiliteInputDto,
  RaccordementEau,
  deriverRaccordementEau,
  listerChampsComplementairesManquants,
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
  /** null = commune absente du référentiel ABC (recherche effectuée, aucun résultat) */
  zonageAbcLogement?: ZonageAbcLogement | null;
  /** Catégorie de distance à une Installation Terminale Embranchée (ITE) fret */
  distanceIte?: DistanceIte;
  /** Distance réelle en mètres à l'ITE la plus proche (si trouvée dans le rayon de recherche) */
  distanceIteMetres?: number;
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
  presenceZoneHumide?: PresenceZoneHumide;

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
    if (!enrichissement) {
      throw new Error("Données d'enrichissement manquantes");
    }

    const site = new Site();
    Site.copierDonneesEnrichies(site, enrichissement);
    Site.copierDonneesComplementaires(site, donneesComplementaires);

    return site;
  }

  /**
   * Constructeur direct à partir de l'input complet (sans enrichissement)
   */
  static fromInput(input: CalculerMutabiliteInputDto): Site {
    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans l'input");
    }

    const site = new Site();
    Site.copierDonneesEnrichies(site, input.donneesEnrichies);
    Site.copierDonneesComplementaires(site, input.donneesComplementaires);

    return site;
  }

  /**
   * Copie champ par champ plutôt qu'Object.assign : un JSON entrant ne doit pas pouvoir
   * introduire de propriété inattendue sur l'entité, ni masquer une de ses méthodes.
   */
  private static copierDonneesEnrichies(site: Site, donnees: EnrichissementOutputDto): void {
    // Identification
    site.identifiantParcelle = donnees.identifiantParcelle;
    site.codeInsee = donnees.codeInsee;
    site.commune = donnees.commune;
    site.coordonnees = donnees.coordonnees;
    site.geometrie = donnees.geometrie;
    site.nombreParcelles = donnees.nombreParcelles;

    // Données physiques et localisation
    site.surfaceSite = donnees.surfaceSite;
    site.surfaceBati = donnees.surfaceBati;
    site.siteEnCentreVille = donnees.siteEnCentreVille;
    site.distanceAutoroute = donnees.distanceAutoroute;
    site.distanceTransportCommun = donnees.distanceTransportCommun;
    site.proximiteCommercesServices = donnees.proximiteCommercesServices;
    site.distanceRaccordementElectrique = donnees.distanceRaccordementElectrique;
    site.tauxLogementsVacants = donnees.tauxLogementsVacants;

    // Risques et pollution
    site.presenceRisquesTechnologiques = donnees.presenceRisquesTechnologiques;
    site.siteReferencePollue = donnees.siteReferencePollue;
    site.risqueRetraitGonflementArgile = donnees.risqueRetraitGonflementArgile
      ? (donnees.risqueRetraitGonflementArgile as RisqueRetraitGonflementArgile)
      : undefined;
    site.risqueCavitesSouterraines = donnees.risqueCavitesSouterraines
      ? (donnees.risqueCavitesSouterraines as RisqueCavitesSouterraines)
      : undefined;
    site.risqueInondation = donnees.risqueInondation
      ? (donnees.risqueInondation as RisqueInondation)
      : undefined;

    // Zonages
    site.zonageEnvironnemental = donnees.zonageEnvironnemental
      ? (donnees.zonageEnvironnemental as ZonageEnvironnemental)
      : undefined;
    site.zonagePatrimonial = donnees.zonagePatrimonial
      ? (donnees.zonagePatrimonial as ZonagePatrimonial)
      : undefined;
    site.zonageReglementaire = donnees.zonageReglementaire
      ? (donnees.zonageReglementaire as ZonageReglementaire)
      : undefined;
    site.trameVerteEtBleue = donnees.trameVerteEtBleue
      ? (donnees.trameVerteEtBleue as TrameVerteEtBleue)
      : undefined;
    site.zoneAccelerationEnr = donnees.zoneAccelerationEnr
      ? (donnees.zoneAccelerationEnr as ZoneAccelerationEnr)
      : undefined;
    // null préservé : commune hors référentiel ABC, à distinguer de la donnée indisponible
    site.zonageAbcLogement =
      donnees.zonageAbcLogement === null
        ? null
        : donnees.zonageAbcLogement
          ? (donnees.zonageAbcLogement as ZonageAbcLogement)
          : undefined;

    // Fret
    site.distanceIte = donnees.distanceIte ? (donnees.distanceIte as DistanceIte) : undefined;
    site.distanceIteMetres = donnees.distanceIteMetres;

    // Métadonnées
    site.sourcesUtilisees = donnees.sourcesUtilisees || [];
    site.champsManquants = donnees.champsManquants || [];
  }

  private static copierDonneesComplementaires(
    site: Site,
    donnees?: DonneesComplementairesInputDto,
  ): void {
    if (donnees) {
      site.typeProprietaire = donnees.typeProprietaire;
      site.etatBatiInfrastructure = donnees.etatBatiInfrastructure;
      site.presencePollution = donnees.presencePollution;
      site.valeurArchitecturaleHistorique = donnees.valeurArchitecturaleHistorique;
      site.qualitePaysage = donnees.qualitePaysage;
      site.qualiteVoieDesserte = donnees.qualiteVoieDesserte;
      site.trameVerteEtBleue = donnees.trameVerteEtBleue;
      site.presenceEspecesProtegees = donnees.presenceEspecesProtegees;
      site.presenceZoneHumide = donnees.presenceZoneHumide;
    }

    // Raccordement eau dérivé automatiquement de la surface bâtie (fait autorité sur la saisie)
    site.raccordementEau = deriverRaccordementEau(site.surfaceBati);
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
        v !== PresenceEspecesProtegees.NE_SAIT_PAS &&
        v !== PresenceZoneHumide.NE_SAIT_PAS,
    ).length;

    return Math.round((champsRemplis / champsTotal) * 100);
  }

  /**
   * Champs d'identification indispensables au calcul et à la persistance.
   * Test sur null/undefined et non sur la véracité : une surface de 0 est une valeur, pas une absence.
   */
  champsEssentielsManquants(): string[] {
    const essentiels: Record<string, unknown> = {
      identifiantParcelle: this.identifiantParcelle,
      codeInsee: this.codeInsee,
      commune: this.commune,
      surfaceSite: this.surfaceSite,
    };

    return Object.entries(essentiels)
      .filter(([, valeur]) => valeur === undefined || valeur === null || valeur === "")
      .map(([champ]) => champ);
  }

  /**
   * Vérifie si toutes les données obligatoires sont présentes
   */
  estComplete(): boolean {
    return (
      this.champsEssentielsManquants().length === 0 &&
      listerChampsComplementairesManquants(this).length === 0
    );
  }
}
