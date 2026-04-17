import {
  EnrichissementOutputDto,
  SourceEnrichissement,
  ZaerEnrichissement,
} from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../../../shared/types/parcelle.models";
import { formatDistance, formatSurface } from "../../../shared/utils/distance.formatter";

/**
 * Formate un booléen en "Oui" / "Non" ou chaîne vide si undefined
 */
const formatBoolean = (value: boolean | undefined): string => {
  if (value === undefined) return "";
  return value ? "Oui" : "Non";
};

/**
 * Détermine le message à afficher pour la distance au transport en commun
 */
const getDistanceTransportMessage = (enrichmentData: EnrichissementOutputDto): string => {
  const aucunArretMessage = "Aucun arrêt à moins de 2 km";

  // null = recherche OK, aucun arrêt trouvé dans le rayon de 2km
  if (enrichmentData.distanceTransportCommun === null) {
    return aucunArretMessage;
  }

  // Si une distance est disponible, la formater
  if (enrichmentData.distanceTransportCommun !== undefined) {
    return formatDistance(enrichmentData.distanceTransportCommun);
  }

  // Si la source a échoué (erreur technique), retourner vide
  if (enrichmentData.sourcesEchouees?.includes(SourceEnrichissement.TRANSPORT_DATA_GOUV)) {
    return "";
  }

  // Cas par défaut (undefined = donnée non disponible)
  return "";
};

/**
 * Transforme les données d'enrichissement brutes en format UI
 * Les valeurs vides ("") indiquent une donnée non accessible
 */
export const transformEnrichmentToUiData = (
  enrichmentData: EnrichissementOutputDto,
): ParcelleUiModel => {
  return {
    identifiantParcelle: enrichmentData.identifiantParcelle,
    identifiantsParcelles: enrichmentData.identifiantsParcelles,
    nombreParcelles: enrichmentData.nombreParcelles,
    commune: enrichmentData.commune || "",

    // Surfaces formatées
    surfaceParcelle: formatSurface(enrichmentData.surfaceSite),
    surfaceBatie: formatSurface(enrichmentData.surfaceBati),

    // Données électriques formatées
    distanceRaccordement: formatDistance(enrichmentData.distanceRaccordementElectrique),

    // Risques naturels (badges cumulatifs)
    risquesNaturels: buildRisquesNaturelsBadges(enrichmentData),
    risquesTechno: formatBoolean(enrichmentData.presenceRisquesTechnologiques),

    // Zonages
    zonageEnviro: enrichmentData.zonageEnvironnemental || "",
    zonageUrba: enrichmentData.zonageReglementaire || "",
    zonagePatrimonial: enrichmentData.zonagePatrimonial || "",

    // Transport
    centreVille: formatBoolean(enrichmentData.siteEnCentreVille),

    // Distance autoroute formatée
    distanceAutoroute: formatDistance(enrichmentData.distanceAutoroute),

    // Taux de logements vacants formaté
    tauxLV:
      enrichmentData.tauxLogementsVacants !== undefined
        ? `${enrichmentData.tauxLogementsVacants.toString()} %`
        : "",

    // Proximité commerces
    proximiteCommerces: formatBoolean(enrichmentData.proximiteCommercesServices),

    // Distance transports en commun formatée
    distanceTransportsEnCommun: getDistanceTransportMessage(enrichmentData),

    // Pollution - site reference dans les bases ADEME (sites et sols pollues)
    siteReferencePollue: enrichmentData.siteReferencePollue === true,

    // Énergies renouvelables
    zoneAccelerationEnr: formatZoneAccelerationEnr(enrichmentData.zoneAccelerationEnr),
    zaerBadges: buildZaerBadges(enrichmentData.zaer),
  };
};

/**
 * Construit un tableau de badges cumulatifs pour les risques naturels
 */
const buildRisquesNaturelsBadges = (data: EnrichissementOutputDto): string[] => {
  const badges: string[] = [];

  // RGA : badge avec niveau sauf si "aucun"
  if (data.risqueRetraitGonflementArgile) {
    switch (data.risqueRetraitGonflementArgile) {
      case "fort":
        badges.push("Retrait gonflement argiles : Fort");
        break;
      case "faible-ou-moyen":
        badges.push("Retrait gonflement argiles : Faible ou moyen");
        break;
      // "aucun" : pas de badge
    }
  }

  // Cavités souterraines
  if (data.risqueCavitesSouterraines === "oui") {
    badges.push("Cavités souterraines");
  }

  // Inondations
  if (data.risqueInondation === "oui") {
    badges.push("Inondations");
  }

  // Si aucun badge, afficher "Aucun"
  if (badges.length === 0) {
    badges.push("Aucun");
  }

  return badges;
};

/**
 * Formate la valeur du critère zone d'accélération ENR en label lisible
 * (utilisé en fallback quand le bloc `zaer` détaillé n'est pas disponible)
 */
const formatZoneAccelerationEnr = (value?: string): string => {
  if (!value) return "";
  switch (value) {
    case "non":
      return "Non";
    case "oui":
      return "Oui";
    case "oui-solaire-pv-ombriere":
      return "Oui Solaire photovoltaïque";
    default:
      return value;
  }
};

/**
 * Libellés des filières ENR pour l'affichage en badges cumulatifs (étape 3 de qualification).
 *
 * Règles (spec) :
 * - Un badge par filière présente sur le site (cumulatif, dédupliqué)
 * - Cas spécial `SOLAIRE_PV` :
 *   - `detailFiliere` contenant "OMBRIERE" → badge "Oui Solaire photovoltaïque"
 *   - toute autre sous-catégorie (toit, sol, ...) → badge générique "Oui"
 * - Filières non-PV : libellé dédié "Oui <Nom de la filière>"
 * - Filière inconnue → fallback "Oui"
 * - Aucune zone ZAENR → ["Non"]
 */
export const buildZaerBadges = (zaer?: ZaerEnrichissement): string[] => {
  if (!zaer || !zaer.enZoneZaer || zaer.zones.length === 0) {
    return ["Non"];
  }

  const badges: string[] = [];
  const addUnique = (label: string): void => {
    if (!badges.includes(label)) badges.push(label);
  };

  // Regrouper les zones par filière (en majuscules pour normalisation)
  const filieresDuSite = new Set(zaer.zones.map((z) => z.filiere.toUpperCase()));

  for (const filiere of filieresDuSite) {
    addUnique(libelleFiliere(filiere, zaer.zones));
  }

  return badges;
};

/**
 * Retourne le libellé de badge pour une filière donnée.
 * Pour SOLAIRE_PV, examine les `detailFiliere` des zones correspondantes pour
 * distinguer l'ombrière (badge spécifique) des autres sous-catégories (badge générique).
 */
const libelleFiliere = (filiereUpper: string, zones: ZaerEnrichissement["zones"]): string => {
  if (filiereUpper === "SOLAIRE_PV") {
    const zonesPv = zones.filter((z) => z.filiere.toUpperCase() === "SOLAIRE_PV");
    const hasOmbriere = zonesPv.some((z) => z.detailFiliere?.toUpperCase().includes("OMBRIERE"));
    return hasOmbriere ? "Oui Solaire photovoltaïque" : "Oui";
  }

  switch (filiereUpper) {
    case "SOLAIRE_THERMIQUE":
      return "Oui Solaire thermique";
    case "EOLIEN":
      return "Oui Eolien";
    case "HYDROELECTRICITE":
    case "HYDRO_ELECTRICITE":
    case "HYDROELECTRIQUE":
      return "Oui Hydroélectricité";
    case "BIOGAZ":
    case "BIOMETHANE":
    case "METHANISATION":
      return "Oui Biométhane";
    case "BIOMASSE":
      return "Oui Biomasse";
    case "GEOTHERMIE":
      return "Oui Géothermie";
    case "AEROTHERMIE":
      return "Oui Aérothermie";
    case "THALASSOTHERMIE":
      return "Oui Thalassothermie";
    default:
      // Filière inconnue : on tombe sur le badge générique
      return "Oui";
  }
};
