/**
 * Construction d'une ligne au standard CNIG Friches à partir des données Mutafriches.
 *
 * Fonction pure : l'orchestration (lecture du cache, enrichissement, sérialisation) est
 * à la charge de l'appelant. Les champs que Mutafriches ne connaît pas sortent à
 * `inconnu` (listes) ou vides (texte, dates, URL) — jamais devinés.
 */

import type { EnrichissementOutputDto } from "../enrichissement/dto/enrichissement-output.dto";
import type { DonneesComplementairesInputDto } from "../evaluation/dto/donnees-complementaires-input.dto";
import type { MutabiliteOutputDto } from "../evaluation/dto/mutabilite-output.dto";
import type { MutabiliteResumeeExportDto } from "./export-cnig.dto";
import { DistanceIte } from "../enrichissement/enums/distance-ite.enum";
import { UsageType } from "../evaluation/enums/usage.enum";
import {
  batiEtatCnig,
  batiPatrimoineCnig,
  batiPollutionCnig,
  dateCnig,
  proprioPersonneCnig,
  siteIdCnig,
  solPollutionExisteCnig,
  urbaDocTypeCnig,
  urbaZaerCnig,
  urbaZoneTypeCnig,
} from "./friche-cnig.mapping";
import {
  CNIG_INCONNU,
  CNIG_SEPARATEUR_VALEURS,
  estDebutDeFormule,
  type ExtensionMutafriches,
  type FricheCnig,
} from "./friche-cnig.types";
import { geometrieVersWkt, pointWkt } from "./friche-cnig.wkt";

/** Identité d'un site partenaire, telle que stockée en base. */
export interface SiteFricheCnig {
  idtup: string;
  parcelles: string[];
  nom?: string;
  commune?: string;
  codeInsee?: string;
  /** Date de création du site en base : sert de date d'identification (standard §3.3). */
  dateIdentification?: Date;
}

/** Bloc `source_*` du standard : qui produit et diffuse la donnée. */
export interface SourceFricheCnig {
  /** `source_nom`, limité à 20 caractères par le standard. */
  nom: string;
  producteur?: string;
  url?: string;
  contact?: string;
}

export interface ConstruireFricheCnigInput {
  site: SiteFricheCnig;
  enrichissement?: EnrichissementOutputDto;
  complementaires?: Partial<DonneesComplementairesInputDto>;
  source: SourceFricheCnig;
  /** Défaut : date du jour. */
  dateActualisation?: Date;
}

const LONGUEUR_MAX_SOURCE_NOM = 20;
const LONGUEUR_MAX_TEXTE = 255;

// La longueur du standard s'entend préfixe de neutralisation compris : une valeur qui en
// recevra un à l'écriture CSV est tronquée un caractère plus tôt.
function tronquer(valeur: string, longueur: number): string {
  const maximum = estDebutDeFormule(valeur) ? longueur - 1 : longueur;
  return valeur.length > maximum ? valeur.slice(0, maximum) : valeur;
}

function entierOuNull(valeur?: number | null): number | null {
  return typeof valeur === "number" && Number.isFinite(valeur) ? Math.round(valeur) : null;
}

function distanceLisible(metres?: number | null): string | null {
  if (typeof metres !== "number" || !Number.isFinite(metres)) return null;
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1).replace(".", ",")} km`;
}

const LIBELLES_ITE: Record<DistanceIte, string> = {
  [DistanceIte.MOINS_1KM_BON_ETAT]: "moins d'1 km, en bon état",
  [DistanceIte.MOINS_1KM_MAUVAIS_ETAT]: "moins d'1 km, en mauvais état",
  [DistanceIte.PLUS_1KM]: "plus d'1 km",
};

/**
 * `desserte_commentaire` — les distances Mutafriches en clair.
 * `desserte_distance` reste vide : son format impose les trois réseaux routier, ferroviaire
 * et fluvial, or le fluvial n'est pas enrichi.
 */
export function commentaireDesserte(enrichissement?: EnrichissementOutputDto): string | null {
  if (!enrichissement) return null;

  const morceaux: string[] = [];
  const autoroute = distanceLisible(enrichissement.distanceAutoroute);
  if (autoroute) morceaux.push(`voie de grande circulation à ${autoroute}`);

  const transport = distanceLisible(enrichissement.distanceTransportCommun);
  if (transport) morceaux.push(`transport en commun à ${transport}`);

  if (enrichissement.distanceIte) {
    morceaux.push(`embranchement ferroviaire fret à ${LIBELLES_ITE[enrichissement.distanceIte]}`);
  }

  const electrique = distanceLisible(enrichissement.distanceRaccordementElectrique);
  if (electrique) morceaux.push(`raccordement électrique à ${electrique}`);

  const chaleur = distanceLisible(enrichissement.distanceReseauChaleur);
  if (chaleur) morceaux.push(`réseau de chaleur à ${chaleur}`);

  if (morceaux.length === 0) return null;
  return tronquer(`Distances estimées par Mutafriches : ${morceaux.join(" ; ")}.`, 1000);
}

/**
 * Construit la ligne CNIG d'un site.
 *
 * Retourne `null` quand les attributs obligatoires du standard ne peuvent pas être servis :
 * `comm_insee`, `comm_nom` et `geompoint` (centroïde). Un site jamais enrichi tombe dans ce
 * cas — l'appelant le signale plutôt que de produire une ligne invalide.
 */
export function construireFricheCnig(input: ConstruireFricheCnigInput): FricheCnig | null {
  const { site, enrichissement, complementaires, source } = input;

  const codeInsee = enrichissement?.codeInsee ?? site.codeInsee;
  const commune = enrichissement?.communePredominante ?? enrichissement?.commune ?? site.commune;
  const geompoint = enrichissement?.coordonnees ? pointWkt(enrichissement.coordonnees) : null;

  if (!codeInsee || !commune || !geompoint) return null;

  const dateActualisation = input.dateActualisation ?? new Date();

  return {
    site_id: siteIdCnig(codeInsee, site.idtup),
    site_nom: tronquer(site.nom?.trim() || site.idtup, LONGUEUR_MAX_TEXTE),
    // Mutafriches n'établit pas la typologie de friche (industrielle, commerciale, etc.).
    site_type: CNIG_INCONNU,
    site_adresse: null,
    site_identif_date: dateCnig(site.dateIdentification ?? dateActualisation),
    site_actu_date: dateCnig(dateActualisation),
    site_url: null,
    site_ademe_url: null,
    site_securite: CNIG_INCONNU,
    site_occupation: CNIG_INCONNU,
    site_statut: CNIG_INCONNU,
    site_projet_url: null,
    site_reconv_annee: null,
    site_reconv_type: CNIG_INCONNU,

    activite_libelle: null,
    activite_code: null,
    activite_fin_annee: null,

    comm_nom: tronquer(commune, LONGUEUR_MAX_TEXTE),
    comm_insee: codeInsee,

    bati_type: CNIG_INCONNU,
    bati_nombre: null,
    // Surface bâtie BDNB : emprise au sol, à distinguer de la surface de plancher du standard.
    bati_surface: entierOuNull(enrichissement?.surfaceBati),
    bati_pollution: batiPollutionCnig(complementaires?.presencePollution),
    bati_vacance: CNIG_INCONNU,
    bati_patrimoine: batiPatrimoineCnig(complementaires?.valeurArchitecturaleHistorique),
    bati_etat: batiEtatCnig(complementaires?.etatBatiInfrastructure),
    local_ancien_annee: null,
    local_recent_annee: null,

    proprio_type: null,
    proprio_personne: proprioPersonneCnig(complementaires?.typeProprietaire),
    // Jamais exporté : donnée à caractère personnel (standard, remarque RGPD).
    proprio_nom: null,

    sol_pollution_annee: null,
    sol_pollution_existe: solPollutionExisteCnig(
      complementaires?.presencePollution,
      enrichissement?.siteReferencePollue,
    ),
    sol_pollution_origine: CNIG_INCONNU,
    sol_pollution_commentaire:
      enrichissement?.siteReferencePollue === true
        ? "Site référencé dans les bases ADEME des sites et sols pollués."
        : null,
    sol_depollution_fiche: null,

    unite_fonciere_surface: entierOuNull(enrichissement?.surfaceSite),
    unite_fonciere_refcad: site.parcelles.join(CNIG_SEPARATEUR_VALEURS) || null,

    urba_zone_type: urbaZoneTypeCnig(enrichissement?.zonageReglementaire),
    urba_zone_lib: null,
    urba_zone_formdomi: null,
    urba_zaer: urbaZaerCnig(enrichissement?.zoneAccelerationEnr),
    urba_doc_type: urbaDocTypeCnig(enrichissement?.zonageReglementaire),

    desserte_distance: null,
    desserte_commentaire: commentaireDesserte(enrichissement),

    source_nom: tronquer(source.nom, LONGUEUR_MAX_SOURCE_NOM),
    source_url: source.url ?? null,
    source_producteur: source.producteur ? tronquer(source.producteur, LONGUEUR_MAX_TEXTE) : null,
    source_contact: source.contact ?? null,

    geompoint,
    geomsurf: geometrieVersWkt(enrichissement?.geometrieSite ?? enrichissement?.geometrie),
  };
}

/** Résumé transmissible d'un calcul de mutabilité (indices, usage prioritaire, fiabilité). */
export function resumerMutabilite(mutabilite: MutabiliteOutputDto): MutabiliteResumeeExportDto {
  const indices: Partial<Record<UsageType, number>> = {};
  for (const resultat of mutabilite.resultats) {
    indices[resultat.usage] = resultat.indiceMutabilite;
  }

  return {
    indices,
    usagePrioritaire: mutabilite.resultats.find((r) => r.rang === 1)?.usage,
    fiabilite: mutabilite.fiabilite?.note,
  };
}

const USAGES_CONNUS = new Set<string>(Object.values(UsageType));

// Le résumé de mutabilité arrive du client : seules des valeurs reconnues entrent dans le
// fichier, les autres sont ignorées plutôt que recopiées.
function indice(valeur: unknown): number | null {
  return typeof valeur === "number" && Number.isFinite(valeur) ? valeur : null;
}

/** Colonnes Mutafriches hors standard : indices par usage, fiabilité, version d'algorithme. */
export function construireExtensionMutafriches(
  mutabilite?: MutabiliteResumeeExportDto | null,
  versionAlgorithme?: string,
): ExtensionMutafriches {
  const indices = mutabilite?.indices ?? {};
  const usage = mutabilite?.usagePrioritaire;

  return {
    mf_indice_residentiel: indice(indices[UsageType.RESIDENTIEL]),
    mf_indice_equipements: indice(indices[UsageType.EQUIPEMENTS]),
    mf_indice_culture: indice(indices[UsageType.CULTURE]),
    mf_indice_tertiaire: indice(indices[UsageType.TERTIAIRE]),
    mf_indice_industrie: indice(indices[UsageType.INDUSTRIE]),
    mf_indice_renaturation: indice(indices[UsageType.RENATURATION]),
    mf_indice_photovoltaique: indice(indices[UsageType.PHOTOVOLTAIQUE]),
    mf_usage_prioritaire: usage && USAGES_CONNUS.has(usage) ? usage : null,
    mf_fiabilite: indice(mutabilite?.fiabilite),
    mf_version_algorithme: mutabilite ? (versionAlgorithme ?? null) : null,
  };
}
