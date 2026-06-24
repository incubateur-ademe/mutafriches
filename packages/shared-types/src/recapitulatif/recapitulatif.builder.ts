import { EnrichissementOutputDto } from "../enrichissement";
import { DonneesComplementairesInputDto } from "../evaluation";
import { CRITERES_METADATA_LIST } from "./criteres.metadata";
import {
  RecapitulatifSection,
  SectionRecapitulatifId,
  SECTIONS_RECAPITULATIF_TITRES,
} from "./recapitulatif.types";
import {
  formatBooleen,
  formatDistance,
  formatPourcentage,
  formatSurface,
  libelleEnum,
  SOURCE_LABELS,
  VALEUR_NON_DISPONIBLE,
  TYPE_PROPRIETAIRE_LABELS,
  RACCORDEMENT_EAU_LABELS,
  ETAT_BATI_LABELS,
  PRESENCE_POLLUTION_LABELS,
  VALEUR_ARCHITECTURALE_LABELS,
  QUALITE_PAYSAGE_LABELS,
  QUALITE_VOIE_LABELS,
  TRAME_VERTE_BLEUE_LABELS,
  PRESENCE_ESPECES_LABELS,
  PRESENCE_ZONE_HUMIDE_LABELS,
  RGA_LABELS,
  CAVITES_LABELS,
  INONDATION_LABELS,
  ZONAGE_ENVIRONNEMENTAL_LABELS,
  ZONAGE_REGLEMENTAIRE_LABELS,
  ZONAGE_PATRIMONIAL_LABELS,
  ZONAGE_ABC_LOGEMENT_LABELS,
  ZONE_ACCELERATION_ENR_LABELS,
} from "./valeurs.labels";

type Enrichissement = EnrichissementOutputDto | undefined;
type Complementaires = Partial<DonneesComplementairesInputDto> | undefined;

/**
 * Résolveurs de valeur affichée par critère.
 * Les critères AUTOMATIQUE lisent l'enrichissement, les MANUELLE les complémentaires.
 */
const RESOLVEURS: Record<string, (e: Enrichissement, c: Complementaires) => string> = {
  // Le site et son bâti
  surfaceSite: (e) => formatSurface(e?.surfaceSite),
  surfaceBati: (e) => formatSurface(e?.surfaceBati),
  typeProprietaire: (_e, c) => libelleEnum(TYPE_PROPRIETAIRE_LABELS, c?.typeProprietaire),
  distanceRaccordementElectrique: (e) => formatDistance(e?.distanceRaccordementElectrique),
  raccordementEau: (_e, c) => libelleEnum(RACCORDEMENT_EAU_LABELS, c?.raccordementEau),
  valeurArchitecturaleHistorique: (_e, c) =>
    libelleEnum(VALEUR_ARCHITECTURALE_LABELS, c?.valeurArchitecturaleHistorique),
  etatBatiInfrastructure: (_e, c) => libelleEnum(ETAT_BATI_LABELS, c?.etatBatiInfrastructure),
  presencePollution: (_e, c) => libelleEnum(PRESENCE_POLLUTION_LABELS, c?.presencePollution),

  // L'environnement du site
  siteEnCentreVille: (e) => formatBooleen(e?.siteEnCentreVille),
  proximiteCommercesServices: (e) => formatBooleen(e?.proximiteCommercesServices),
  tauxLogementsVacants: (e) => formatPourcentage(e?.tauxLogementsVacants),
  distanceTransportCommun: (e) => formatDistance(e?.distanceTransportCommun),
  distanceAutoroute: (e) => formatDistance(e?.distanceAutoroute),
  qualiteVoieDesserte: (_e, c) => libelleEnum(QUALITE_VOIE_LABELS, c?.qualiteVoieDesserte),
  qualitePaysage: (_e, c) => libelleEnum(QUALITE_PAYSAGE_LABELS, c?.qualitePaysage),
  trameVerteEtBleue: (_e, c) => libelleEnum(TRAME_VERTE_BLEUE_LABELS, c?.trameVerteEtBleue),
  presenceEspecesProtegees: (_e, c) =>
    libelleEnum(PRESENCE_ESPECES_LABELS, c?.presenceEspecesProtegees),
  presenceZoneHumide: (_e, c) => libelleEnum(PRESENCE_ZONE_HUMIDE_LABELS, c?.presenceZoneHumide),

  // Les risques et zonages du site
  presenceRisquesTechnologiques: (e) => formatBooleen(e?.presenceRisquesTechnologiques),
  risqueRetraitGonflementArgile: (e) => libelleEnum(RGA_LABELS, e?.risqueRetraitGonflementArgile),
  risqueCavitesSouterraines: (e) => libelleEnum(CAVITES_LABELS, e?.risqueCavitesSouterraines),
  risqueInondation: (e) => libelleEnum(INONDATION_LABELS, e?.risqueInondation),
  zonageEnvironnemental: (e) =>
    libelleEnum(ZONAGE_ENVIRONNEMENTAL_LABELS, e?.zonageEnvironnemental),
  zonageReglementaire: (e) => libelleEnum(ZONAGE_REGLEMENTAIRE_LABELS, e?.zonageReglementaire),
  zonagePatrimonial: (e) => libelleEnum(ZONAGE_PATRIMONIAL_LABELS, e?.zonagePatrimonial),
  zoneAccelerationEnr: (e) => libelleEnum(ZONE_ACCELERATION_ENR_LABELS, e?.zoneAccelerationEnr),
  zonageAbcLogement: (e) => libelleEnum(ZONAGE_ABC_LOGEMENT_LABELS, e?.zonageAbcLogement),
};

/**
 * Construit le récapitulatif du site : les 27 critères groupés par section,
 * chacun résolu en { label, valeurAffichee, saisie, source }.
 *
 * Fonction pure : aucune I/O. Réutilisable côté UI comme côté API.
 */
export function buildRecapitulatifSite(
  enrichissement: Enrichissement,
  complementaires?: Complementaires,
): RecapitulatifSection[] {
  const sections: Record<SectionRecapitulatifId, RecapitulatifSection> = {
    "site-bati": {
      id: "site-bati",
      titre: SECTIONS_RECAPITULATIF_TITRES["site-bati"],
      criteres: [],
    },
    environnement: {
      id: "environnement",
      titre: SECTIONS_RECAPITULATIF_TITRES.environnement,
      criteres: [],
    },
    "risques-zonages": {
      id: "risques-zonages",
      titre: SECTIONS_RECAPITULATIF_TITRES["risques-zonages"],
      criteres: [],
    },
  };

  for (const meta of CRITERES_METADATA_LIST) {
    const resolveur = RESOLVEURS[meta.key];
    const valeurAffichee = resolveur
      ? resolveur(enrichissement, complementaires)
      : VALEUR_NON_DISPONIBLE;

    sections[meta.section].criteres.push({
      key: meta.key,
      label: meta.label,
      valeurAffichee,
      saisie: meta.saisie,
      source: meta.source,
      sourceLabel: meta.source ? (SOURCE_LABELS[meta.source] ?? meta.source) : undefined,
    });
  }

  return Object.values(sections).filter((section) => section.criteres.length > 0);
}
