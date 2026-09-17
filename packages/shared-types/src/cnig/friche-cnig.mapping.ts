/**
 * Correspondances entre les valeurs Mutafriches et les types énumérés du standard CNIG.
 *
 * Règle du standard (§3.3) : un attribut de type LISTE n'admet pas de valeur vide — on y
 * écrit `inconnu` quand la donnée manque. Les champs libres, dates et URL restent vides.
 */

import { ZonageReglementaire } from "../enrichissement/enums/zonage-reglementaire.enum";
import { ZoneAccelerationEnr } from "../enrichissement/enums/zone-acceleration-enr.enum";
import { EtatBatiInfrastructure } from "../evaluation/enums/etat-bati.enum";
import { PresencePollution } from "../evaluation/enums/presence-pollution.enum";
import { TypeProprietaire } from "../evaluation/enums/type-proprietaire.enum";
import { ValeurArchitecturale } from "../evaluation/enums/valeur-architecturale.enum";
import { CNIG_INCONNU, CNIG_SANS_OBJET } from "./friche-cnig.types";

/** Identifiant CNIG : `<INSEE>_<IdentifiantTechnique>` (standard §4.2). */
export function siteIdCnig(codeInsee: string, idtup: string): string {
  return `${codeInsee}_${idtup}`;
}

/** Date au format ISO 8601 étendu AAAA-MM-JJ (standard §4.2). */
export function dateCnig(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `bati_etat` — état de dégradation des bâtiments. */
export function batiEtatCnig(etat?: EtatBatiInfrastructure): string {
  switch (etat) {
    case EtatBatiInfrastructure.DEGRADATION_INEXISTANTE:
    case EtatBatiInfrastructure.DEGRADATION_FAIBLE:
      return "dégradation inexistante ou faible";
    case EtatBatiInfrastructure.DEGRADATION_MOYENNE:
      return "dégradation moyenne";
    case EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE:
      return "dégradation très importante";
    case EtatBatiInfrastructure.DEGRADATION_HETEROGENE:
      return "dégradation hétérogène";
    case EtatBatiInfrastructure.PAS_DE_BATI:
      return CNIG_SANS_OBJET;
    default:
      return CNIG_INCONNU;
  }
}

/** `bati_patrimoine` — présence de bâtiment de valeur patrimoniale. */
export function batiPatrimoineCnig(valeur?: ValeurArchitecturale): string {
  switch (valeur) {
    case ValeurArchitecturale.SANS_INTERET:
    case ValeurArchitecturale.ORDINAIRE:
      return "aucun";
    case ValeurArchitecturale.INTERET_REMARQUABLE:
      return "présence d'un bâtiment d'intérêt";
    case ValeurArchitecturale.PAS_DE_BATI:
      return CNIG_SANS_OBJET;
    default:
      return CNIG_INCONNU;
  }
}

/**
 * `bati_pollution` — pollution connue dans les bâtiments.
 * Seul l'amiante est identifiable : les autres réponses ne disent rien du bâti lui-même.
 */
export function batiPollutionCnig(pollution?: PresencePollution): string {
  return pollution === PresencePollution.OUI_AMIANTE ? "amiante" : CNIG_INCONNU;
}

/**
 * `sol_pollution_existe` — existence de pollution du sol.
 * À défaut de saisie, un site référencé dans les bases ADEME vaut « pollution supposée ».
 */
export function solPollutionExisteCnig(
  pollution?: PresencePollution,
  siteReferencePollue?: boolean,
): string {
  switch (pollution) {
    case PresencePollution.NON:
      return "pollution inexistante";
    case PresencePollution.DEJA_GEREE:
      return "pollution traitée";
    case PresencePollution.OUI_COMPOSES_VOLATILS:
    case PresencePollution.OUI_AMIANTE:
    case PresencePollution.OUI_AUTRES_COMPOSES:
      return "pollution avérée";
    default:
      return siteReferencePollue === true ? "pollution supposée" : CNIG_INCONNU;
  }
}

/**
 * `proprio_personne` — personne physique ou morale.
 * Seul un propriétaire public est une personne morale à coup sûr ; « privé », « mixte » et
 * « copropriété » recouvrent les deux.
 */
export function proprioPersonneCnig(type?: TypeProprietaire): string {
  return type === TypeProprietaire.PUBLIC ? "personne morale" : CNIG_INCONNU;
}

/**
 * `urba_zaer` — site en zone d'accélération des énergies renouvelables.
 * Une zone d'exclusion APER n'est pas une ZAER : elle vaut `non`.
 */
export function urbaZaerCnig(zone?: ZoneAccelerationEnr): string {
  switch (zone) {
    case ZoneAccelerationEnr.OUI:
    case ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE:
      return "oui";
    case ZoneAccelerationEnr.NON:
    case ZoneAccelerationEnr.EXCLUSION:
      return "non";
    default:
      return CNIG_INCONNU;
  }
}

/**
 * `urba_zone_type` — type de zone d'urbanisme (codes du standard CNIG PLU).
 * Les quatre sous-types de zone urbaine Mutafriches retombent sur `U`.
 * `ZONE_A_URBANISER_AU` reste `inconnu` : l'enrichissement ne distingue pas AUc (ouverte)
 * de AUs (bloquée), et trancher reviendrait à affirmer une constructibilité non vérifiée.
 */
export function urbaZoneTypeCnig(zonage?: ZonageReglementaire): string {
  switch (zonage) {
    case ZonageReglementaire.ZONE_URBAINE_U:
    case ZonageReglementaire.ZONE_URBAINE_U_HABITAT:
    case ZonageReglementaire.ZONE_URBAINE_U_EQUIPEMENT:
    case ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE:
    case ZonageReglementaire.ZONE_VOCATION_ACTIVITES:
      return "U";
    case ZonageReglementaire.ZONE_AGRICOLE_A:
      return "A";
    case ZonageReglementaire.ZONE_NATURELLE_N:
      return "N";
    case ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION:
      return "Zc";
    case ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION:
      return "ZnC";
    case ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME:
      return "RNU";
    default:
      return CNIG_INCONNU;
  }
}

/**
 * `urba_doc_type` — type de document d'urbanisme.
 * Seuls les secteurs de carte communale et le RNU sont déductibles du zonage : une zone U,
 * AU, A ou N peut relever d'un PLU, d'un PLUi ou d'un PSMV.
 */
export function urbaDocTypeCnig(zonage?: ZonageReglementaire): string {
  switch (zonage) {
    case ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION:
    case ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION:
      return "CC";
    case ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME:
      return "RNU";
    default:
      return CNIG_INCONNU;
  }
}
