import { Injectable, Logger } from "@nestjs/common";
import { ZonageReglementaire } from "@mutafriches/shared-types";
import { ResultatZoneUrba, ResultatSecteurCC, InfoCommune } from "./zonage-reglementaire.types";

/** Mots-clés dans le libellé long (libelong) pour classifier les sous-zones U */
const MOTS_CLES_HABITAT = ["habitat", "mixte", "pavillonnaire", "centre"];
const MOTS_CLES_EQUIPEMENT = ["équipement", "equipement"];
const MOTS_CLES_ACTIVITE = [
  "activité",
  "activite",
  "économique",
  "economique",
  "industri",
  "artisanale",
  "artisanat",
];

/**
 * Calculator du sous-domaine Zonage Réglementaire
 *
 * Contient toute la logique métier pure pour évaluer le zonage réglementaire
 * basé sur PLU/POS (zone-urba) ou carte communale (secteur-cc) ou RNU
 */
@Injectable()
export class ZonageReglementaireCalculator {
  private readonly logger = new Logger(ZonageReglementaireCalculator.name);

  /**
   * Évalue le zonage réglementaire final
   *
   * Règles métier (par ordre de priorité) :
   * 1. Si zone-urba présente → analyser typezone (U, AU, A, N)
   * 2. Si secteur-cc présent → analyser typesect (constructible/non constructible)
   * 3. Si commune en RNU → NE_SAIT_PAS
   * 4. Sinon → NE_SAIT_PAS
   */
  evaluer(
    zoneUrba: ResultatZoneUrba | null,
    secteurCC: ResultatSecteurCC | null,
    commune: InfoCommune | null,
  ): ZonageReglementaire {
    // Priorité 1 : Zone PLU/POS
    if (zoneUrba?.present && zoneUrba.typezone) {
      return this.mapZoneUrbaToZonage(
        zoneUrba.typezone,
        zoneUrba.destdomi,
        zoneUrba.libelle,
        zoneUrba.libelong,
      );
    }

    // Priorité 2 : Secteur carte communale
    if (secteurCC?.present && secteurCC.typesect) {
      return this.mapSecteurCCToZonage(secteurCC.typesect);
    }

    // Priorité 3 : RNU
    if (commune?.is_rnu) {
      this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (RNU)");
      return ZonageReglementaire.NE_SAIT_PAS;
    }

    // Par défaut
    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS");
    return ZonageReglementaire.NE_SAIT_PAS;
  }

  /**
   * Mappe une zone PLU/POS vers le zonage réglementaire
   *
   * Ordre de classification pour les zones U :
   * 1. destdomi activité → ZONE_VOCATION_ACTIVITES
   * 2. Mots-clés dans libelong (prioritaire quand présent) → sous-type U
   * 3. Code zone (UA/UB/UC/UD, UE, UX/UY/UZ/UI) → sous-type U (fallback)
   * 4. Catch-all → ZONE_URBAINE_U
   *
   * Le libelong est prioritaire car le code court peut être ambigu selon les territoires
   * (ex: UE = "urbain équipement" standard CNIG, mais "urbain économique" en Loire-Atlantique)
   */
  private mapZoneUrbaToZonage(
    typezone: string,
    destdomi?: string,
    libelle?: string,
    libelong?: string,
  ): ZonageReglementaire {
    const type = typezone.toUpperCase();

    // Vérifier d'abord la destination dominante (plus spécifique)
    // Le standard CNIG autorise le code numérique ("02") ou le libellé littéral ("activité")
    if (destdomi && this.isDestdomiActivite(destdomi)) {
      this.logger.debug("Zonage réglementaire: ZONE_VOCATION_ACTIVITES");
      return ZonageReglementaire.ZONE_VOCATION_ACTIVITES;
    }

    if (type.startsWith("U")) {
      // Priorité au libellé long quand il est présent (plus fiable que le code court)
      const zonageParLibelong = this.classifierParLibelong(libelong);
      if (zonageParLibelong) {
        this.logger.debug(`Zonage réglementaire: ${zonageParLibelong} (libelong="${libelong}")`);
        return zonageParLibelong;
      }

      // Fallback : classification par code court (UA/UB/UC/UD, UE, UI/UX/UY/UZ)
      // Utilisé quand le libelong est absent ou ne contient aucun mot-clé reconnu
      const codeZone = type === "U" && libelle ? libelle.toUpperCase() : type;

      if (/^U[ABCD]/i.test(codeZone)) {
        this.logger.debug(`Zonage réglementaire: ZONE_URBAINE_U_HABITAT (code=${codeZone})`);
        return ZonageReglementaire.ZONE_URBAINE_U_HABITAT;
      }

      if (/^UE/i.test(codeZone)) {
        this.logger.debug(`Zonage réglementaire: ZONE_URBAINE_U_EQUIPEMENT (code=${codeZone})`);
        return ZonageReglementaire.ZONE_URBAINE_U_EQUIPEMENT;
      }

      if (/^U[XYZI]/i.test(codeZone)) {
        this.logger.debug(`Zonage réglementaire: ZONE_URBAINE_U_ACTIVITE (code=${codeZone})`);
        return ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE;
      }

      this.logger.debug("Zonage réglementaire: ZONE_URBAINE_U");
      return ZonageReglementaire.ZONE_URBAINE_U;
    }

    // Zone à urbaniser AU
    if (type.startsWith("AU")) {
      this.logger.debug("Zonage réglementaire: ZONE_A_URBANISER_AU");
      return ZonageReglementaire.ZONE_A_URBANISER_AU;
    }

    // Zone agricole A
    if (type.startsWith("A")) {
      this.logger.debug("Zonage réglementaire: ZONE_AGRICOLE_A");
      return ZonageReglementaire.ZONE_AGRICOLE_A;
    }

    // Zone naturelle N
    if (type.startsWith("N")) {
      this.logger.debug("Zonage réglementaire: ZONE_NATURELLE_N");
      return ZonageReglementaire.ZONE_NATURELLE_N;
    }

    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (type inconnu)");
    return ZonageReglementaire.NE_SAIT_PAS;
  }

  /**
   * Classifie une zone U à partir des mots-clés présents dans le libellé long
   * Retourne le zonage si un mot-clé est trouvé, null sinon
   */
  private classifierParLibelong(libelong?: string): ZonageReglementaire | null {
    if (!libelong) return null;

    const texte = libelong.toLowerCase();

    if (MOTS_CLES_HABITAT.some((mot) => texte.includes(mot))) {
      return ZonageReglementaire.ZONE_URBAINE_U_HABITAT;
    }

    if (MOTS_CLES_EQUIPEMENT.some((mot) => texte.includes(mot))) {
      return ZonageReglementaire.ZONE_URBAINE_U_EQUIPEMENT;
    }

    if (MOTS_CLES_ACTIVITE.some((mot) => texte.includes(mot))) {
      return ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE;
    }

    return null;
  }

  /**
   * Vérifie si la destination dominante correspond à une activité
   * Gère le code numérique CNIG ("02") et le libellé littéral ("activité", "activite", etc.)
   */
  private isDestdomiActivite(destdomi: string): boolean {
    const value = destdomi.trim().toLowerCase();
    return value === "02" || value.includes("activit");
  }

  /**
   * Mappe un secteur de carte communale vers le zonage réglementaire
   */
  private mapSecteurCCToZonage(typesect: string): ZonageReglementaire {
    const type = typesect.toLowerCase();

    // Secteur constructible
    if (
      type.includes("constructible") &&
      !type.includes("non") &&
      !type.includes("inconstructible")
    ) {
      this.logger.debug("Zonage réglementaire: SECTEUR_OUVERT_A_LA_CONSTRUCTION");
      return ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION;
    }

    // Secteur non constructible
    if (type.includes("non") || type.includes("inconstructible") || type.includes("interdit")) {
      this.logger.debug("Zonage réglementaire: SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION");
      return ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION;
    }

    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (secteur inconnu)");
    return ZonageReglementaire.NE_SAIT_PAS;
  }
}
