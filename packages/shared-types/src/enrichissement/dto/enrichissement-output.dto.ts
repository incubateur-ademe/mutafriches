import { Coordonnees, GeometrieParcelle } from "../..";
import { DiagnosticZonages } from "./diagnostic-zonages.dto";
import { RisqueRetraitGonflementArgile } from "../enums/risque-retrait-gonflement-argile.enum";
import { RisqueCavitesSouterraines } from "../enums/risque-cavites-souterraines.enum";
import { RisqueInondation } from "../enums/risque-inondation.enum";
import { ZonageReglementaire } from "../enums/zonage-reglementaire.enum";
import { ZonageEnvironnemental } from "../enums/zonage-environnemental.enum";
import { ZonagePatrimonial } from "../enums/zonage-patrimonial.enum";
import { ZoneAccelerationEnr } from "../enums/zone-acceleration-enr.enum";
import { TrameVerteEtBleue } from "../enums/trame-verte-bleue.enum";

/**
 * Résultat de l'enrichissement automatique des données de parcelle ou site
 * Contient uniquement les données extraites automatiquement depuis des sources externes
 */
export interface EnrichissementOutputDto {
  // Données d'identification
  identifiantParcelle: string;
  codeInsee: string;
  commune: string;
  coordonnees?: Coordonnees; // Centroïde du site (ou point d'entrée en mono-parcelle)
  geometrie?: GeometrieParcelle; // Polygone complet (union en multi-parcelle)

  // Données multi-parcelle (optionnelles, absentes en mono-parcelle)
  /** Identifiants de toutes les parcelles du site */
  identifiantsParcelles?: string[];
  /** Nombre de parcelles constituant le site */
  nombreParcelles?: number;
  /** Identifiant de la parcelle prédominante (plus grande surface) */
  parcellePredominante?: string;
  /** Commune prédominante (plus grande surface cumulée) */
  communePredominante?: string;
  /** Géométrie union du site (union de toutes les parcelles) */
  geometrieSite?: GeometrieParcelle;

  // Données physiques du site
  surfaceSite: number;
  surfaceBati?: number;

  // Données de localisation et accessibilité
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  /** Distance en mètres. null = aucun arrêt trouvé dans le rayon de recherche (2km) */
  distanceTransportCommun: number | null;
  proximiteCommercesServices: boolean;

  // Infrastructure
  distanceRaccordementElectrique: number;

  // Contexte urbain
  tauxLogementsVacants: number;

  // Risques et contraintes
  presenceRisquesTechnologiques: boolean;
  risqueRetraitGonflementArgile?: RisqueRetraitGonflementArgile;
  risqueCavitesSouterraines?: RisqueCavitesSouterraines;
  risqueInondation?: RisqueInondation;

  // Pollution - site référencé dans les bases ADEME (sites et sols pollués)
  siteReferencePollue: boolean;

  // Zonages réglementaires
  zonageReglementaire?: ZonageReglementaire;
  zonageEnvironnemental?: ZonageEnvironnemental;
  zonagePatrimonial?: ZonagePatrimonial;
  trameVerteEtBleue?: TrameVerteEtBleue;

  // Métadonnées
  sourcesUtilisees: string[];
  champsManquants: string[];
  sourcesEchouees: string[];

  // Energies renouvelables
  /** Zones d'Acceleration des Energies Renouvelables */
  zaer?: ZaerEnrichissement;
  /** Critère calculé pour l'algorithme : zone d'accélération ENR */
  zoneAccelerationEnr?: ZoneAccelerationEnr;

  // Diagnostic zonages (dev/staging uniquement, absent en production)
  /** Données brutes des APIs de zonage pour le panneau de diagnostic */
  diagnosticZonages?: DiagnosticZonages;

  // TODO a supprimer Données Géorisques
  risquesGeorisques?: any;
}

/**
 * Resultat de l'enrichissement ZAER pour un site
 */
export interface ZaerEnrichissement {
  /** Le site intersecte au moins une zone ZAER */
  enZoneZaer: boolean;
  /** Nombre de zones ZAER intersectees */
  nombreZones: number;
  /** Filieres ENR uniques presentes (ex: ["SOLAIRE_PV", "EOLIEN"]) */
  filieres: string[];
  /** Detail par zone intersectee */
  zones: ZaerDetail[];
}

/**
 * Detail d'une zone ZAER intersectee
 */
export interface ZaerDetail {
  nom: string | null;
  filiere: string;
  detailFiliere: string | null;
}
