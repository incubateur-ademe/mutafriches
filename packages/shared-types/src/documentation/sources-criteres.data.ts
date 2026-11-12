import { SourceEnrichissement } from "../enrichissement";
import { CritereMetadata } from "../recapitulatif/recapitulatif.types";
import { SOURCES_DONNEES } from "./sources-donnees.data";
import { TypeSourceDonnees } from "./sources-donnees.types";

/** Source d'un critère, telle qu'affichée dans l'onglet « Sources des données » */
export interface SourceCritereDoc {
  nom: string;
  producteur: string;
  type: TypeSourceDonnees;
  /** Format sous lequel la donnée est récupérée (API web, CSV, GeoJSON…) */
  format: string;
  urlDoc: string;
}

// `type` et `urlDoc` : seulement quand ils diffèrent du bloc SOURCES_DONNEES qui regroupe la source
type SourceCritereDeclaree = Pick<SourceCritereDoc, "nom" | "producteur" | "format"> &
  Partial<Pick<SourceCritereDoc, "type" | "urlDoc">>;

const GEORISQUES: SourceCritereDeclaree = {
  nom: "GéoRisques",
  producteur: "BRGM, ministère de la Transition écologique",
  format: "API web",
};

const SOURCES_CRITERES: Partial<Record<SourceEnrichissement, SourceCritereDeclaree>> = {
  [SourceEnrichissement.CADASTRE]: { nom: "Cadastre", producteur: "IGN", format: "API web" },
  [SourceEnrichissement.BDNB_SURFACE_BATIE]: { nom: "BDNB", producteur: "CSTB", format: "API web" },
  [SourceEnrichissement.ENEDIS_RACCORDEMENT]: {
    nom: "Réseau électrique",
    producteur: "Enedis",
    format: "API web",
  },
  [SourceEnrichissement.FRANCE_CHALEUR_URBAINE]: {
    nom: "Réseaux de chaleur",
    producteur: "France Chaleur Urbaine",
    format: "API web",
  },
  [SourceEnrichissement.SERVICE_PUBLIC]: {
    nom: "Annuaire de l'administration",
    producteur: "DILA",
    format: "API web",
    urlDoc:
      "https://www.data.gouv.fr/dataservices/api-annuaire-de-ladministration-et-des-services-publics/",
  },
  [SourceEnrichissement.BPE]: {
    nom: "Base permanente des équipements",
    producteur: "INSEE",
    format: "CSV",
  },
  [SourceEnrichissement.LOVAC]: { nom: "LOVAC", producteur: "Cerema, DGALN", format: "CSV" },
  [SourceEnrichissement.TRANSPORT_DATA_GOUV]: {
    nom: "Arrêts de transport",
    producteur: "transport.data.gouv.fr",
    format: "CSV",
    type: "referentiel-local",
    urlDoc: "https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france",
  },
  [SourceEnrichissement.IGN_WFS]: {
    nom: "BD TOPO et calcul d'itinéraire",
    producteur: "IGN",
    format: "API web",
    urlDoc: "https://geoservices.ign.fr/documentation/services/services-geoplateforme/itineraire",
  },
  [SourceEnrichissement.ITE_FRET]: { nom: "ITE 3000", producteur: "Cerema", format: "GeoJSON" },
  [SourceEnrichissement.GEORISQUES_ICPE]: GEORISQUES,
  [SourceEnrichissement.GEORISQUES_RGA]: GEORISQUES,
  [SourceEnrichissement.GEORISQUES_CAVITES]: GEORISQUES,
  [SourceEnrichissement.GEORISQUES_TRI]: GEORISQUES,
  [SourceEnrichissement.API_CARTO_NATURE]: {
    nom: "API Carto Nature",
    producteur: "IGN",
    format: "API web",
  },
  [SourceEnrichissement.API_CARTO_GPU]: {
    nom: "Géoportail de l'urbanisme",
    producteur: "IGN",
    format: "API web",
  },
  [SourceEnrichissement.ZAER]: {
    nom: "Zones d'accélération des EnR",
    producteur: "IGN, OFB",
    format: "API web",
  },
  [SourceEnrichissement.ZONAGE_ABC_LOGEMENT]: {
    nom: "Zonage ABC",
    producteur: "DGALN",
    format: "CSV",
  },
  [SourceEnrichissement.QPV]: {
    nom: "Quartiers prioritaires",
    producteur: "ANCT",
    format: "GeoJSON",
  },
  [SourceEnrichissement.ZONES_CONTRAINTE_ENR]: {
    nom: "Zones de contrainte réseau",
    producteur: "Enedis, RTE",
    format: "GeoJSON",
  },
  [SourceEnrichissement.ZAE_FUSAC]: { nom: "Fusac", producteur: "Cerema", format: "GeoPackage" },
};

/** Source d'un critère automatique ; undefined pour un critère saisi */
export function getSourceCritere(critere: CritereMetadata): SourceCritereDoc | undefined {
  const source = critere.source;
  if (critere.saisie !== "AUTOMATIQUE" || source === undefined) return undefined;
  const declaree = SOURCES_CRITERES[source];
  const bloc = SOURCES_DONNEES.find((s) => s.sourcesEnrichissement.includes(source));
  if (!declaree || !bloc) return undefined;
  return {
    nom: declaree.nom,
    producteur: declaree.producteur,
    format: declaree.format,
    type: declaree.type ?? bloc.type,
    urlDoc: declaree.urlDoc ?? bloc.urlDoc,
  };
}
