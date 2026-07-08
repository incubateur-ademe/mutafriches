/**
 * Registre statique des APIs externes monitorées.
 *
 * Chaque entrée décrit une API distante utilisée par un adapter d'enrichissement,
 * avec l'URL légère utilisée pour le health-check journalier (cron GitHub Actions).
 *
 * Politique de scoring (cf api-monitoring.service.ts) :
 * - status HTTP 2xx ou 4xx + temps < 2000 ms → "up"
 *   (les 4xx indiquent que le serveur répond, donc l'API tourne ; ils sont attendus
 *    sur des endpoints qui exigent des paramètres précis qu'on ne fournit pas ici)
 * - status HTTP 2xx ou 4xx + temps ≥ 2000 ms → "slow"
 * - status HTTP 5xx, timeout ou erreur réseau → "down"
 *
 * TODO (future PR) : ajouter un `contractSchema` par entrée pour vérifier la
 * structure de la réponse en plus du simple code HTTP (cf section
 * "Évolution future" du plan).
 */
export interface ApiMonitoringEntry {
  key: string;
  name: string;
  category: string;
  description: string;
  docUrl: string;
  adapterFile: string;
  baseUrl: string;
  healthCheckMethod: "GET" | "POST";
  healthCheckUrl: string;
  /** Payload JSON pour les health-checks POST (ex: API Carto Nature) */
  healthCheckPayload?: Record<string, unknown>;
}

const GEORISQUES_BASE = "https://www.georisques.gouv.fr/api/v1";
const APICARTO_BASE = "https://apicarto.ign.fr/api";
const DATAGOUV_TABULAR = "https://tabular-api.data.gouv.fr/api";
const GEORISQUES_DOC = "https://www.georisques.gouv.fr/doc-api";

// Point de référence pour les checks géographiques : centroïde de Paris (75056)
const TEST_LATLON = "2.3522,48.8566";
const TEST_INSEE = "75056";

/**
 * Helper : crée une entrée GéoRisques pour un sous-service donné.
 */
function geoRisquesEntry(opts: {
  key: string;
  name: string;
  endpoint: string;
  description: string;
  adapterFile: string;
  param: "latlon" | "code_insee";
}): ApiMonitoringEntry {
  const queryParam = opts.param === "latlon" ? `latlon=${TEST_LATLON}` : `code_insee=${TEST_INSEE}`;
  return {
    key: opts.key,
    name: opts.name,
    category: "Risques",
    description: opts.description,
    docUrl: GEORISQUES_DOC,
    adapterFile: opts.adapterFile,
    baseUrl: GEORISQUES_BASE,
    healthCheckMethod: "GET",
    healthCheckUrl: `${GEORISQUES_BASE}${opts.endpoint}?${queryParam}`,
  };
}

export const API_MONITORING_ENTRIES: readonly ApiMonitoringEntry[] = [
  {
    key: "cadastre-ign",
    name: "IGN — Cadastre",
    category: "Cadastre",
    description: "Géométrie et surface des parcelles cadastrales",
    docUrl: "https://geoservices.ign.fr/services-web-essentiels",
    adapterFile: "apps/api/src/enrichissement/adapters/cadastre/cadastre.service.ts",
    baseUrl: "https://apicarto.ign.fr/api/cadastre",
    healthCheckMethod: "GET",
    healthCheckUrl: `https://apicarto.ign.fr/api/cadastre/commune?code_insee=${TEST_INSEE}`,
  },
  {
    key: "bdnb",
    name: "BDNB",
    category: "Bâti",
    description: "Base de Données Nationale du Bâtiment (surface bâtie, hauteur, usage)",
    docUrl: "https://api-portail.bdnb.io/",
    adapterFile: "apps/api/src/enrichissement/adapters/bdnb/bdnb.service.ts",
    baseUrl: "https://api.bdnb.io/v1/bdnb",
    healthCheckMethod: "GET",
    healthCheckUrl:
      "https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?parcelle_id=eq.750560000AB0001&limit=1",
  },
  {
    key: "enedis",
    name: "Enedis",
    category: "Énergie",
    description: "Distance aux postes électriques (raccordement BT / HTA)",
    docUrl: "https://opendata.enedis.fr/datasets/poste-electrique",
    adapterFile: "apps/api/src/enrichissement/adapters/enedis/enedis.service.ts",
    baseUrl: "https://opendata.enedis.fr/data-fair/api/v1/datasets",
    healthCheckMethod: "GET",
    healthCheckUrl:
      "https://opendata.enedis.fr/data-fair/api/v1/datasets/poste-electrique/lines?size=1",
  },
  geoRisquesEntry({
    key: "georisques-rga",
    name: "GéoRisques — RGA",
    endpoint: "/rga",
    description: "Retrait-gonflement des argiles",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/rga/rga.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-catnat",
    name: "GéoRisques — CATNAT",
    endpoint: "/gaspar/catnat",
    description: "Catastrophes naturelles historiques",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/catnat/catnat.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-tri",
    name: "GéoRisques — TRI",
    endpoint: "/gaspar/tri",
    description: "Territoires à risque important d'inondation",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/tri/tri.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-tri-zonage",
    name: "GéoRisques — TRI Zonage",
    endpoint: "/tri_zonage",
    description: "Zonage d'inondation",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/tri-zonage/tri-zonage.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-mvt",
    name: "GéoRisques — Mouvements de terrain",
    endpoint: "/mvt",
    description: "Glissements, affaissements, éboulements",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/mvt/mvt.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-sismique",
    name: "GéoRisques — Zonage sismique",
    endpoint: "/zonage_sismique",
    description: "Classes sismiques (1 à 5)",
    adapterFile:
      "apps/api/src/enrichissement/adapters/georisques/zonage-sismique/zonage-sismique.service.ts",
    param: "code_insee",
  }),
  geoRisquesEntry({
    key: "georisques-cavites",
    name: "GéoRisques — Cavités",
    endpoint: "/cavites",
    description: "Cavités naturelles et anciennes mines",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/cavites/cavites.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-old",
    name: "GéoRisques — OLD",
    endpoint: "/old",
    description: "Obligations légales de débroussaillement",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/old/old.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-sis",
    name: "GéoRisques — SIS",
    endpoint: "/ssp/conclusions_sis",
    description: "Secteurs d'information sur les sols (pollution)",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/sis/sis.service.ts",
    param: "code_insee",
  }),
  geoRisquesEntry({
    key: "georisques-icpe",
    name: "GéoRisques — ICPE",
    endpoint: "/installations_classees",
    description: "Installations classées pour la protection de l'environnement",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/icpe/icpe.service.ts",
    param: "code_insee",
  }),
  geoRisquesEntry({
    key: "georisques-azi",
    name: "GéoRisques — AZI",
    endpoint: "/gaspar/azi",
    description: "Atlas des zones inondables",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/azi/azi.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-papi",
    name: "GéoRisques — PAPI",
    endpoint: "/gaspar/papi",
    description: "Programmes d'actions de prévention des inondations",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/papi/papi.service.ts",
    param: "latlon",
  }),
  geoRisquesEntry({
    key: "georisques-ppr",
    name: "GéoRisques — PPR",
    endpoint: "/ppr",
    description: "Plans de prévention des risques (naturels et technologiques)",
    adapterFile: "apps/api/src/enrichissement/adapters/georisques/ppr/ppr.service.ts",
    param: "code_insee",
  }),
  {
    key: "apicarto-nature",
    name: "API Carto IGN — Nature",
    category: "Environnement",
    description: "Natura 2000, ZNIEFF, parcs naturels régionaux, réserves",
    docUrl: "https://apicarto.ign.fr/api/doc/nature",
    adapterFile:
      "apps/api/src/enrichissement/adapters/api-carto/nature/api-carto-nature.service.ts",
    baseUrl: APICARTO_BASE,
    healthCheckMethod: "POST",
    healthCheckUrl: `${APICARTO_BASE}/nature/znieff1`,
    healthCheckPayload: {
      geom: {
        type: "Point",
        coordinates: [2.3522, 48.8566],
      },
    },
  },
  {
    key: "apicarto-gpu",
    name: "API Carto IGN — GPU",
    category: "Urbanisme",
    description: "Géoportail de l'urbanisme : PLU, secteurs, servitudes",
    docUrl: "https://apicarto.ign.fr/api/doc/gpu",
    adapterFile: "apps/api/src/enrichissement/adapters/api-carto/gpu/api-carto-gpu.service.ts",
    baseUrl: APICARTO_BASE,
    healthCheckMethod: "GET",
    healthCheckUrl: `${APICARTO_BASE}/gpu/municipality?insee=${TEST_INSEE}`,
  },
  {
    key: "ign-wfs-bdtopo",
    name: "IGN WFS — BDTOPO",
    category: "Transport",
    description: "Voies de grande circulation (autoroutes, routes 2 chaussées)",
    docUrl: "https://geoservices.ign.fr/services-web-essentiels",
    adapterFile: "apps/api/src/enrichissement/adapters/ign-wfs/ign-wfs.service.ts",
    baseUrl: "https://data.geopf.fr/wfs/ows",
    healthCheckMethod: "GET",
    healthCheckUrl:
      "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities",
  },
  {
    key: "zaer-wfs",
    name: "IGN WFS — ZAER",
    category: "Énergies",
    description: "Zones d'accélération des énergies renouvelables",
    docUrl:
      "https://www.data.gouv.fr/datasets/zones-d-acceleration-pour-l-implantation-d-energies-renouvelables/",
    adapterFile: "apps/api/src/enrichissement/adapters/zaer-wfs/zaer-wfs.service.ts",
    baseUrl: "https://data.geopf.fr/wfs",
    healthCheckMethod: "GET",
    healthCheckUrl: "https://data.geopf.fr/wfs?service=WFS&version=2.0.0&request=GetCapabilities",
  },
  {
    key: "service-public-mairies",
    name: "API Service Public — Annuaire",
    category: "Mairies",
    description: "Coordonnées GPS officielles des mairies (centre-ville)",
    docUrl:
      "https://www.data.gouv.fr/dataservices/api-annuaire-de-ladministration-et-des-services-publics/",
    adapterFile: "apps/api/src/enrichissement/adapters/service-public/service-public.service.ts",
    baseUrl: "https://api-lannuaire.service-public.gouv.fr",
    healthCheckMethod: "GET",
    healthCheckUrl:
      "https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?limit=1",
  },
  {
    key: "zonage-abc",
    name: "Zonage ABC",
    category: "Logement",
    description: "Classification des communes en zones A, Abis, B1, B2, C",
    docUrl: "https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc",
    adapterFile:
      "apps/api/src/enrichissement/adapters/datagouv-zonage-abc/datagouv-zonage-abc.service.ts",
    baseUrl: DATAGOUV_TABULAR,
    healthCheckMethod: "GET",
    healthCheckUrl: `${DATAGOUV_TABULAR}/resources/13f7282b-8a25-43ab-9713-8bb4e476df55/data/?CODGEO__exact=${TEST_INSEE}&page=1&page_size=1`,
  },
] as const;
