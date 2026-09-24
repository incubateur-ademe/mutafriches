import { SourceEnrichissement } from "../enrichissement";
import { CritereMetadata } from "./recapitulatif.types";

/**
 * Registre autoritaire des 31 critères du récapitulatif du site.
 *
 * Source de vérité partagée : libellé, section, type de saisie, poids et source
 * d'enrichissement de chaque critère. L'ensemble des clés et des poids doit rester
 * aligné avec POIDS_CRITERES (algorithme.config.ts) — garde-fou dans le test dédié côté API.
 *
 * Mapping critère → source établi d'après l'orchestration d'enrichissement
 * (apps/api/src/enrichissement/services), pas d'après la maquette.
 */
export const CRITERES_METADATA: Record<string, CritereMetadata> = {
  // --- Le site et son bâti ---
  surfaceSite: {
    key: "surfaceSite",
    label: "Surface du site",
    section: "site-bati",
    saisie: "AUTOMATIQUE",
    poids: 2,
    source: SourceEnrichissement.CADASTRE,
    ordre: 1,
  },
  surfaceBati: {
    key: "surfaceBati",
    label: "Surface bâtie",
    section: "site-bati",
    saisie: "AUTOMATIQUE",
    poids: 2,
    source: SourceEnrichissement.BDNB_SURFACE_BATIE,
    ordre: 2,
  },
  typeProprietaire: {
    key: "typeProprietaire",
    label: "Type de propriétaire",
    section: "site-bati",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 3,
  },
  distanceRaccordementElectrique: {
    key: "distanceRaccordementElectrique",
    label: "Distance au raccordement électrique",
    section: "site-bati",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.ENEDIS_RACCORDEMENT,
    ordre: 4,
  },
  raccordementEau: {
    key: "raccordementEau",
    label: "Raccordement aux réseaux d'eau",
    section: "site-bati",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 5,
  },
  distanceReseauChaleur: {
    key: "distanceReseauChaleur",
    label: "Distance au réseau de chaleur",
    section: "site-bati",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.FRANCE_CHALEUR_URBAINE,
    ordre: 6,
  },
  valeurArchitecturaleHistorique: {
    key: "valeurArchitecturaleHistorique",
    label: "Valeur patrimoniale des constructions",
    section: "site-bati",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 7,
  },
  etatBatiInfrastructure: {
    key: "etatBatiInfrastructure",
    label: "État du bâti",
    section: "site-bati",
    saisie: "MANUELLE",
    poids: 2,
    ordre: 8,
  },
  presencePollution: {
    key: "presencePollution",
    label: "Présence de pollution",
    section: "site-bati",
    saisie: "MANUELLE",
    poids: 2,
    ordre: 9,
  },

  // --- L'environnement du site ---
  siteEnCentreVille: {
    key: "siteEnCentreVille",
    label: "Site en centre-ville",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.SERVICE_PUBLIC,
    ordre: 10,
  },
  proximiteCommercesServices: {
    key: "proximiteCommercesServices",
    label: "Proximité commerces et services",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.BPE,
    ordre: 11,
  },
  tauxLogementsVacants: {
    key: "tauxLogementsVacants",
    label: "Taux de logements vacants",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.LOVAC,
    ordre: 12,
  },
  distanceTransportCommun: {
    key: "distanceTransportCommun",
    label: "Distance aux transports en commun",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.TRANSPORT_DATA_GOUV,
    ordre: 13,
  },
  distanceAutoroute: {
    key: "distanceAutoroute",
    label: "Distance par la route à un accès autoroutier",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 0.5,
    source: SourceEnrichissement.IGN_WFS,
    ordre: 14,
  },
  distanceIte: {
    key: "distanceIte",
    label: "Distance à une installation terminale embranchée fret",
    section: "environnement",
    saisie: "AUTOMATIQUE",
    poids: 0.5,
    source: SourceEnrichissement.ITE_FRET,
    ordre: 15,
  },
  qualiteVoieDesserte: {
    key: "qualiteVoieDesserte",
    label: "Qualité de la voie de desserte",
    section: "environnement",
    saisie: "MANUELLE",
    poids: 0.5,
    ordre: 16,
  },
  qualitePaysage: {
    key: "qualitePaysage",
    label: "Intérêt du paysage environnant",
    section: "environnement",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 17,
  },
  trameVerteEtBleue: {
    key: "trameVerteEtBleue",
    label: "Trame verte et bleue",
    section: "environnement",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 18,
  },
  presenceEspecesProtegees: {
    key: "presenceEspecesProtegees",
    label: "Présence d'espèces protégées",
    section: "environnement",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 19,
  },
  presenceZoneHumide: {
    key: "presenceZoneHumide",
    label: "Présence d'une zone humide",
    section: "environnement",
    saisie: "MANUELLE",
    poids: 1,
    ordre: 20,
  },

  // --- Les risques et zonages du site ---
  presenceRisquesTechnologiques: {
    key: "presenceRisquesTechnologiques",
    label: "Présence de risques technologiques",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.GEORISQUES_ICPE,
    ordre: 21,
  },
  risqueRetraitGonflementArgile: {
    key: "risqueRetraitGonflementArgile",
    label: "Retrait-gonflement des argiles",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 0.5,
    source: SourceEnrichissement.GEORISQUES_RGA,
    ordre: 22,
  },
  risqueCavitesSouterraines: {
    key: "risqueCavitesSouterraines",
    label: "Cavités souterraines",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 0.5,
    source: SourceEnrichissement.GEORISQUES_CAVITES,
    ordre: 23,
  },
  risqueInondation: {
    key: "risqueInondation",
    label: "Risque d'inondation",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.GEORISQUES_TRI,
    ordre: 24,
  },
  zonageEnvironnemental: {
    key: "zonageEnvironnemental",
    label: "Zonage environnemental",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.API_CARTO_NATURE,
    ordre: 25,
  },
  zonageReglementaire: {
    key: "zonageReglementaire",
    label: "Zonage réglementaire",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 2,
    source: SourceEnrichissement.API_CARTO_GPU,
    ordre: 26,
  },
  zonagePatrimonial: {
    key: "zonagePatrimonial",
    label: "Zonage patrimonial",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.API_CARTO_GPU,
    ordre: 27,
  },
  zoneAccelerationEnr: {
    key: "zoneAccelerationEnr",
    label: "Zone d'accélération des EnR",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.ZAER,
    ordre: 28,
  },
  zonageAbcLogement: {
    key: "zonageAbcLogement",
    label: "Zonage ABC (logement)",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 0.5,
    source: SourceEnrichissement.ZONAGE_ABC_LOGEMENT,
    ordre: 29,
  },
  siteEnQpv: {
    key: "siteEnQpv",
    label: "Quartier prioritaire de la politique de la ville",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.QPV,
    ordre: 30,
  },
  saturationReseauEnr: {
    key: "saturationReseauEnr",
    label: "Saturation du réseau électrique pour les projets EnR",
    section: "risques-zonages",
    saisie: "AUTOMATIQUE",
    poids: 1,
    source: SourceEnrichissement.ZONES_CONTRAINTE_ENR,
    ordre: 31,
  },
};

/** Liste ordonnée des critères */
export const CRITERES_METADATA_LIST: CritereMetadata[] = Object.values(CRITERES_METADATA).sort(
  (a, b) => a.ordre - b.ordre,
);

/**
 * Compteurs de l'algorithme dérivés du registre, pour les textes de documentation.
 *
 * Le paragraphe "Comment sont utilisées ces données" était recopié en dur dans la page
 * `/documentation-donnees`, l'export PDF et le générateur Markdown : les trois avaient
 * divergé du code. Source de vérité unique, cf. ADR-0026.
 */
export const CRITERES_STATS = {
  total: CRITERES_METADATA_LIST.length,
  automatiques: CRITERES_METADATA_LIST.filter((c) => c.saisie === "AUTOMATIQUE").length,
  manuels: CRITERES_METADATA_LIST.filter((c) => c.saisie === "MANUELLE").length,
  poidsTotal: CRITERES_METADATA_LIST.reduce((somme, c) => somme + c.poids, 0),
};

/** Poids total formaté pour l'affichage (locale fr-FR : "31", "29,5") */
export const POIDS_TOTAL_AFFICHE = CRITERES_STATS.poidsTotal.toLocaleString("fr-FR");
