import {
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  ZonageReglementaire,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  EtatBatiInfrastructure,
  TypeProprietaire,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  ZoneAccelerationEnr,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import {
  SEUIL_GRANDE_PARCELLE,
  SEUIL_EMPRISE_BATI_FAIBLE,
  SEUIL_DISTANCE_TC_PROCHE,
  SEUIL_DISTANCE_RACCORDEMENT_ELEC,
} from "./constants";

/**
 * Convertit un critère de l'algorithme en label court lisible pour un tag.
 * Utilisé pour générer les tags à partir des données détaillées de scoring (detailsAvantages).
 * Retourne null si aucun label pertinent ne peut être généré.
 */
export function getCritereTagLabel(
  critere: string,
  valeur: string | number | boolean,
): string | null {
  switch (critere) {
    case "surfaceSite":
      return Number(valeur) >= SEUIL_GRANDE_PARCELLE ? "grande parcelle" : "petite parcelle";

    case "surfaceBati":
      return Number(valeur) < SEUIL_EMPRISE_BATI_FAIBLE
        ? "emprise bât. faible"
        : "emprise bât. forte";

    case "siteEnCentreVille":
      return valeur === true || valeur === "true" ? "centre-ville" : "excentré";

    case "distanceAutoroute":
      return Number(valeur) <= 5 ? "prox. autoroute" : "éloigné autoroute";

    case "distanceTransportCommun":
      return Number(valeur) <= SEUIL_DISTANCE_TC_PROCHE ? "TC prox." : "TC éloigné";

    case "proximiteCommercesServices":
      return valeur === true || valeur === "true" ? "services proches" : "services éloignés";

    case "distanceRaccordementElectrique":
      return Number(valeur) * 1000 <= SEUIL_DISTANCE_RACCORDEMENT_ELEC
        ? "raccordement élec."
        : "élec. éloigné";

    case "tauxLogementsVacants":
      return Number(valeur) >= 15 ? "logements vacants" : "peu de vacance";

    case "risqueRetraitGonflementArgile":
      return valeur === RisqueRetraitGonflementArgile.AUCUN
        ? "risques nat. faibles"
        : "risques nat. modérés";

    case "risqueCavitesSouterraines":
      return valeur === RisqueCavitesSouterraines.NON ? "pas de cavités" : "cavités souterraines";

    case "risqueInondation":
      return valeur === RisqueInondation.NON ? "pas d'inondation" : "risque inondation";

    case "presenceRisquesTechnologiques":
      return valeur === false || valeur === "false"
        ? "risques tech. faibles"
        : "risques tech. forts";

    case "zonageReglementaire": {
      const z = String(valeur) as ZonageReglementaire;
      if (z === ZonageReglementaire.ZONE_URBAINE_U) return "zone urbaine";
      if (
        z === ZonageReglementaire.ZONE_A_URBANISER_AU ||
        z === ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE
      )
        return "zonage compatible";
      return "zonage réglementaire";
    }

    case "zonageEnvironnemental": {
      const ze = String(valeur) as ZonageEnvironnemental;
      if (ze === ZonageEnvironnemental.HORS_ZONE || ze === ZonageEnvironnemental.PROXIMITE_ZONE)
        return "zon. env. non contraint";
      if (
        ze === ZonageEnvironnemental.RESERVE_NATURELLE ||
        ze === ZonageEnvironnemental.NATURA_2000 ||
        ze === ZonageEnvironnemental.ZNIEFF_TYPE_1_2
      )
        return "zone protégée";
      return "zon. environnemental";
    }

    case "zonagePatrimonial": {
      const zp = String(valeur) as ZonagePatrimonial;
      if (zp === ZonagePatrimonial.NON_CONCERNE) return "zon. pat. non-protégée";
      return "intérêt patrimonial";
    }

    case "trameVerteEtBleue": {
      const t = String(valeur) as TrameVerteEtBleue;
      if (t === TrameVerteEtBleue.HORS_TRAME) return "hors trame verte";
      if (
        t === TrameVerteEtBleue.RESERVOIR_BIODIVERSITE ||
        t === TrameVerteEtBleue.CORRIDOR_A_PRESERVER ||
        t === TrameVerteEtBleue.CORRIDOR_A_RESTAURER
      )
        return "continuité écologique";
      return "trame verte";
    }

    case "zoneAccelerationEnr": {
      const zaer = String(valeur) as ZoneAccelerationEnr;
      if (zaer === ZoneAccelerationEnr.OUI || zaer === ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE)
        return "zone accélération EnR";
      return "hors zone EnR";
    }

    case "typeProprietaire": {
      const tp = String(valeur) as TypeProprietaire;
      if (tp === TypeProprietaire.PUBLIC) return "prop. public";
      if (tp === TypeProprietaire.PRIVE) return "prop. privé";
      return "prop. mixte";
    }

    case "raccordementEau": {
      const re = String(valeur) as RaccordementEau;
      if (re === RaccordementEau.OUI) return "raccordement eau";
      return "absence eau";
    }

    case "etatBatiInfrastructure": {
      const ebi = String(valeur) as EtatBatiInfrastructure;
      if (ebi === EtatBatiInfrastructure.DEGRADATION_INEXISTANTE) return "bâti bon état";
      if (ebi === EtatBatiInfrastructure.PAS_DE_BATI) return "pas de bâti";
      if (ebi === EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE) return "bâti ruine";
      return "bâti dégradé";
    }

    case "presencePollution": {
      const pp = String(valeur) as PresencePollution;
      return pp === PresencePollution.NON ? "non-pollué" : "pollué";
    }

    case "valeurArchitecturaleHistorique": {
      const va = String(valeur) as ValeurArchitecturale;
      if (va === ValeurArchitecturale.ORDINAIRE || va === ValeurArchitecturale.SANS_INTERET)
        return "val. patr. faible";
      if (va === ValeurArchitecturale.INTERET_REMARQUABLE) return "val. patr. forte";
      return "val. patrimoniale";
    }

    case "qualitePaysage": {
      const qp = String(valeur) as QualitePaysage;
      return qp === QualitePaysage.INTERET_REMARQUABLE ? "qualité paysage" : "paysage dégradé";
    }

    case "qualiteVoieDesserte": {
      const qv = String(valeur) as QualiteVoieDesserte;
      return qv === QualiteVoieDesserte.ACCESSIBLE ? "bon accès" : "voie dégradée";
    }

    case "presenceEspecesProtegees": {
      const pep = String(valeur) as PresenceEspecesProtegees;
      return pep === PresenceEspecesProtegees.OUI ? "espèce protégée" : null;
    }

    case "presenceZoneHumide": {
      const pzh = String(valeur) as PresenceZoneHumide;
      return pzh === PresenceZoneHumide.OUI ? "zone humide" : null;
    }

    default:
      return critere;
  }
}
