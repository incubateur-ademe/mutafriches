import { SourceEnrichissement } from "../enrichissement";
import { CRITERES_METADATA_LIST } from "../recapitulatif/criteres.metadata";
import { CritereMetadata } from "../recapitulatif/recapitulatif.types";
import { SourceDonnees } from "./sources-donnees.types";

/**
 * Documentation partenaires des sources de données externes.
 *
 * Source de vérité unique consommée par la page UI, l'export PDF et la doc Markdown.
 * Chaque bloc regroupe une ou plusieurs valeurs de SourceEnrichissement ; les critères
 * d'évaluation alimentés (et leur poids) sont dérivés de CRITERES_METADATA, jamais re-saisis.
 */
export const SOURCES_DONNEES: SourceDonnees[] = [
  {
    id: "cadastre",
    nom: "Cadastre",
    organisme: "IGN — API Carto",
    type: "api-externe",
    urlDoc: "https://apicarto.ign.fr/api/doc/cadastre",
    sourcesEnrichissement: [SourceEnrichissement.CADASTRE],
    champsRecuperes: [
      "Identifiant parcellaire (idu)",
      "Contenance (surface en m²)",
      "Section et numéro",
      "Commune et code INSEE",
      "Géométrie de la parcelle (centroïde, contour)",
    ],
    traitementAlgo:
      "La contenance cadastrale initialise la surface du site, classée par seuils (< 5 000 m², " +
      "< 10 000 m², < 50 000 m², au-delà). La géométrie et les coordonnées servent de socle à tous " +
      "les autres appels géolocalisés.",
  },
  {
    id: "bdnb",
    nom: "Base de Données Nationale du Bâtiment (BDNB)",
    organisme: "CSTB",
    type: "api-externe",
    urlDoc: "https://api.bdnb.io/",
    sourcesEnrichissement: [SourceEnrichissement.BDNB_SURFACE_BATIE],
    champsRecuperes: ["Surface d'emprise au sol des bâtiments de la parcelle"],
    traitementAlgo:
      "La surface bâtie est agrégée sur la parcelle puis classée par seuils. Elle sert aussi à dériver " +
      "automatiquement le critère « raccordement à l'eau » (> 20 m² bâti => raccordé, cf. ADR-0019).",
  },
  {
    id: "enedis",
    nom: "Réseau électrique (Enedis Open Data)",
    organisme: "Enedis",
    type: "api-externe",
    urlDoc: "https://data.enedis.fr/",
    sourcesEnrichissement: [SourceEnrichissement.ENEDIS_RACCORDEMENT],
    champsRecuperes: [
      "Distance au poste électrique le plus proche (rayon 5 km)",
      "Distance au réseau basse tension (rayon 500 m)",
    ],
    traitementAlgo:
      "La distance au point de raccordement le plus proche est classée par seuils (proche, " +
      "intermédiaire, éloigné) pour évaluer la facilité de raccordement électrique.",
  },
  {
    id: "transport-accessibilite",
    nom: "Transport et accessibilité",
    organisme: "API Annuaire de l'administration, IGN Géoplateforme, data.gouv.fr",
    type: "api-externe",
    urlDoc: "https://www.geoportail.gouv.fr/",
    sourcesEnrichissement: [
      SourceEnrichissement.SERVICE_PUBLIC,
      SourceEnrichissement.IGN_WFS,
      SourceEnrichissement.TRANSPORT_DATA_GOUV,
    ],
    champsRecuperes: [
      "Coordonnées de la mairie (API Annuaire) pour situer le centre-ville",
      "Tronçons routiers de type autoroutier / voie à grande circulation (IGN WFS BD TOPO)",
      "Arrêts de transport en commun (référentiel GTFS local, base PostGIS)",
    ],
    traitementAlgo:
      "La proximité de la mairie détermine si le site est en centre-ville (booléen). La distance à la " +
      "voie de grande circulation la plus proche et la distance à l'arrêt de transport le plus proche " +
      "(seuil 500 m) sont classées par seuils.",
  },
  {
    id: "bpe-commerces",
    nom: "Commerces et services de proximité (BPE)",
    organisme: "INSEE — Base Permanente des Équipements",
    type: "referentiel-local",
    urlDoc: "https://www.insee.fr/fr/metadonnees/source/serie/s1161",
    sourcesEnrichissement: [SourceEnrichissement.BPE],
    champsRecuperes: [
      "Équipements et commerces géolocalisés autour du site (base PostGIS `raw_bpe`)",
    ],
    traitementAlgo:
      "La présence d'au moins un commerce ou service dans le rayon de recherche produit un booléen de " +
      "proximité commerces / services.",
  },
  {
    id: "lovac",
    nom: "Logements vacants (LOVAC)",
    organisme: "Cerema / DGALN",
    type: "referentiel-local",
    urlDoc:
      "https://www.data.gouv.fr/fr/datasets/logements-vacants-du-parc-prive-par-commune-lovac/",
    sourcesEnrichissement: [SourceEnrichissement.LOVAC],
    champsRecuperes: [
      "Taux de logements vacants de la commune (référentiel annuel local `raw_lovac`)",
    ],
    traitementAlgo:
      "Le taux communal de logements vacants est classé par seuils : un taux élevé pénalise les usages " +
      "résidentiels (marché détendu) et favorise d'autres vocations.",
  },
  {
    id: "zonage-gpu",
    nom: "Zonage réglementaire et patrimonial (Géoportail de l'urbanisme)",
    organisme: "IGN — API Carto GPU",
    type: "api-externe",
    urlDoc: "https://apicarto.ign.fr/api/doc/gpu",
    sourcesEnrichissement: [SourceEnrichissement.API_CARTO_GPU],
    champsRecuperes: [
      "Zone du PLU (libellé, type de zone : U, AU, A, N…)",
      "Secteurs de carte communale",
      "Servitudes d'utilité publique patrimoniales (AC1 monuments, AC2 sites, AC4 abords)",
    ],
    traitementAlgo:
      "La zone du PLU est normalisée en catégories réglementaires (urbaine habitat/activité/équipement, " +
      "à urbaniser, agricole, naturelle…). Les servitudes patrimoniales déterminent le zonage patrimonial " +
      "(site inscrit/classé, périmètre ABF).",
  },
  {
    id: "zonage-nature",
    nom: "Zonage environnemental",
    organisme: "IGN — API Carto Nature",
    type: "api-externe",
    urlDoc: "https://apicarto.ign.fr/api/doc/nature",
    sourcesEnrichissement: [SourceEnrichissement.API_CARTO_NATURE],
    champsRecuperes: [
      "Natura 2000 (directives Habitats et Oiseaux)",
      "ZNIEFF de type 1 et 2",
      "Parcs naturels régionaux",
      "Réserves naturelles",
    ],
    traitementAlgo:
      "L'intersection ou la proximité avec un zonage de protection est normalisée en niveau " +
      "(hors zone, proximité, ZNIEFF, Natura 2000, réserve naturelle), du plus favorable à l'aménagement " +
      "au plus contraignant.",
  },
  {
    id: "zonage-abc",
    nom: "Zonage ABC (tension du marché du logement)",
    organisme: "DGALN — data.gouv.fr",
    type: "api-externe",
    urlDoc: "https://www.data.gouv.fr/fr/datasets/zonage-abc/",
    sourcesEnrichissement: [SourceEnrichissement.ZONAGE_ABC_LOGEMENT],
    champsRecuperes: ["Zone ABC en vigueur de la commune (Abis, A, B1, B2, C)"],
    traitementAlgo:
      "La zone ABC de la commune qualifie la tension du marché du logement et pondère la pertinence " +
      "de l'usage résidentiel.",
  },
  {
    id: "georisques-naturels",
    nom: "GéoRisques — risques naturels",
    organisme: "BRGM / Ministère de la Transition écologique",
    type: "api-externe",
    urlDoc: "https://www.georisques.gouv.fr/doc-api",
    sourcesEnrichissement: [
      SourceEnrichissement.GEORISQUES_RGA,
      SourceEnrichissement.GEORISQUES_CAVITES,
      SourceEnrichissement.GEORISQUES_TRI,
    ],
    champsRecuperes: [
      "Aléa retrait-gonflement des argiles (niveau d'exposition)",
      "Cavités souterraines à proximité (rayon 1 km)",
      "Zones inondables : TRI, atlas des zones inondables (AZI), PAPI, PPR inondation",
    ],
    traitementAlgo:
      "L'aléa argiles est ramené à trois niveaux (aucun, faible/moyen, fort). La présence de cavités et " +
      "l'exposition au risque d'inondation (agrégée sur plusieurs référentiels) sont ramenées à des " +
      "booléens qui pénalisent le bâti et favorisent la renaturation.",
  },
  {
    id: "georisques-technologiques",
    nom: "GéoRisques — risques technologiques et pollution",
    organisme: "BRGM / Ministère de la Transition écologique + ADEME",
    type: "api-externe",
    urlDoc: "https://www.georisques.gouv.fr/doc-api",
    sourcesEnrichissement: [SourceEnrichissement.GEORISQUES_ICPE],
    champsRecuperes: [
      "Installations classées pour la protection de l'environnement (ICPE, statut Seveso)",
      "Secteurs d'information sur les sols (SIS)",
      "Sites et sols pollués (référentiel local ADEME, base PostGIS)",
    ],
    traitementAlgo:
      "La présence d'une ICPE ou d'un secteur SIS à proximité produit le booléen « risques " +
      "technologiques » (favorable à l'industrie, défavorable au résidentiel). Les référentiels SIS et " +
      "ADEME renseignent par ailleurs le caractère pollué du site.",
  },
  {
    id: "zaer",
    nom: "Zones d'accélération des énergies renouvelables (ZAER)",
    organisme: "IGN Géoplateforme",
    type: "api-externe",
    urlDoc: "https://data.geopf.fr/",
    sourcesEnrichissement: [SourceEnrichissement.ZAER],
    champsRecuperes: [
      "Appartenance à une zone d'accélération des EnR (nom, filière, détail de filière)",
    ],
    traitementAlgo:
      "L'appartenance à une zone d'accélération des EnR est ramenée à un niveau grossier (non, oui, " +
      "ombrière) qui valorise l'usage photovoltaïque (cf. ADR-0013).",
  },
  {
    id: "ite-fret",
    nom: "Installations terminales embranchées fret (ITE 3000)",
    organisme: "Cerema — Base ITE 3000",
    type: "referentiel-local",
    urlDoc:
      "https://www.data.gouv.fr/datasets/base-de-donnees-des-installations-terminales-embranchees-fret-en-france-ite-3000",
    sourcesEnrichissement: [SourceEnrichissement.ITE_FRET],
    champsRecuperes: [
      "Installations terminales embranchées géolocalisées autour du site : nom, état et distance " +
        "(base PostGIS `raw_ite_fret`)",
    ],
    traitementAlgo:
      "La distance à l'ITE la plus proche est classée selon le seuil de 1 km, croisé avec l'état de " +
      "l'embranchement (< 1 km bon état, < 1 km mauvais état, > 1 km). Le raccordement fret valorise " +
      "l'usage industriel.",
  },
];

/** Critères d'évaluation (avec poids) alimentés par une source, dérivés du registre autoritaire */
export function getCriteresPourSource(source: SourceDonnees): CritereMetadata[] {
  return CRITERES_METADATA_LIST.filter(
    (critere) =>
      critere.saisie === "AUTOMATIQUE" &&
      critere.source !== undefined &&
      source.sourcesEnrichissement.includes(critere.source),
  );
}

/** Critères saisis manuellement par l'utilisateur (non issus d'une source externe) */
export function getCriteresManuels(): CritereMetadata[] {
  return CRITERES_METADATA_LIST.filter((critere) => critere.saisie === "MANUELLE");
}
