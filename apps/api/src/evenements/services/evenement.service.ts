import { Injectable } from "@nestjs/common";
import {
  EvenementInputDto,
  EvenementOutputDto,
  EvenementDonnees,
  ModeUtilisation,
  ContexteEvenement,
  UsageType,
} from "@mutafriches/shared-types";
import { EvenementUtilisateur } from "../entities/evenement.entity";
import { EvenementRepository } from "../repositories/evenement.repository";

/** Regex pour valider les pages (pathname) */
const PAGE_REGEX = /^\/[a-z0-9\-/]*$/i;

@Injectable()
export class EvenementService {
  constructor(private readonly evenementRepository: EvenementRepository) {}

  async enregistrerEvenement(
    input: EvenementInputDto,
    metadata?: {
      sourceUtilisation?: string;
      modeUtilisation?: ModeUtilisation;
      integrateur?: string;
      userAgent?: string;
      ref?: string;
    },
  ): Promise<EvenementOutputDto> {
    const evenement = new EvenementUtilisateur({
      id: this.genererIdEvenement(),
      typeEvenement: input.typeEvenement,
      evaluationId: this.sanitizeString(input.evaluationId),
      identifiantCadastral: this.sanitizeString(input.identifiantCadastral),
      donnees: this.sanitizeDonnees(input.donnees),
      dateCreation: new Date(),
      sourceUtilisation: this.sanitizeString(metadata?.sourceUtilisation),
      modeUtilisation: metadata?.modeUtilisation,
      ref: this.sanitizeString(metadata?.ref),
      integrateur: this.sanitizeString(metadata?.integrateur),
      userAgent: this.sanitizeUserAgent(metadata?.userAgent),
      sessionId: this.sanitizeString(input.sessionId),
    });

    await this.evenementRepository.enregistrerEvenement(evenement);

    return {
      id: evenement.id,
      typeEvenement: evenement.typeEvenement,
      dateCreation: evenement.dateCreation.toISOString(),
      success: true,
    };
  }

  private genererIdEvenement(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Nettoie une chaîne de caractères des caractères dangereux
   */
  private sanitizeString(value: string | undefined): string | undefined {
    if (!value) return undefined;

    return value
      .replace(/[<>"'`]/g, "")
      .replace(/(?:javascript|data|vbscript):/gi, "")
      .replace(/on\w+=/gi, "")
      .substring(0, 255)
      .trim();
  }

  /**
   * Nettoie le User-Agent (plus permissif)
   */
  private sanitizeUserAgent(userAgent: string | undefined): string | undefined {
    if (!userAgent) return undefined;

    return userAgent
      .replace(/[<>"'`]/g, "")
      .substring(0, 500)
      .trim();
  }

  /**
   * Valide et nettoie le contenu du champ donnees
   * Applique des contraintes strictes sur chaque champ
   */
  private sanitizeDonnees(donnees: EvenementDonnees | undefined): EvenementDonnees | undefined {
    if (!donnees) return undefined;

    const sanitized: EvenementDonnees = {};

    // page: doit etre un pathname valide commencant par /
    if (donnees.page !== undefined) {
      const page = String(donnees.page).substring(0, 100);
      if (PAGE_REGEX.test(page)) {
        sanitized.page = page;
      }
      // Si invalide, on ignore silencieusement
    }

    // contexte: doit etre une valeur de l'enum ContexteEvenement
    if (donnees.contexte !== undefined) {
      const contexteValues = Object.values(ContexteEvenement) as string[];
      if (contexteValues.includes(String(donnees.contexte))) {
        sanitized.contexte = donnees.contexte as ContexteEvenement;
      }
      // Si invalide, on ignore silencieusement
    }

    // pertinent: doit etre un boolean
    if (donnees.pertinent !== undefined && typeof donnees.pertinent === "boolean") {
      sanitized.pertinent = donnees.pertinent;
    }

    // commentaire: string sanitizee avec boucle pour eviter reintroduction de patterns
    if (donnees.commentaire !== undefined && typeof donnees.commentaire === "string") {
      let commentaire = String(donnees.commentaire).substring(0, 500);

      // Supprimer toutes les balises HTML simples
      commentaire = commentaire.replace(/<[^>]*>/g, "");

      // Supprimer de maniere repetee les schemas dangereux multi-caracteres
      let previous: string;
      do {
        previous = commentaire;
        commentaire = commentaire
          .replace(/(?:javascript|data|vbscript):/gi, "")
          .replace(/on\w+=/gi, "");
      } while (commentaire !== previous);

      sanitized.commentaire = commentaire.trim();
    }

    // usageConcerne: doit etre une valeur de l'enum UsageType
    if (donnees.usageConcerne !== undefined) {
      const usageValues = Object.values(UsageType) as string[];
      if (usageValues.includes(String(donnees.usageConcerne))) {
        sanitized.usageConcerne = donnees.usageConcerne as UsageType;
      }
      // Si invalide, on ignore silencieusement
    }

    // nombreChampsSaisis: doit etre un entier entre 0 et 100
    if (
      donnees.nombreChampsSaisis !== undefined &&
      typeof donnees.nombreChampsSaisis === "number"
    ) {
      sanitized.nombreChampsSaisis = Math.max(
        0,
        Math.min(100, Math.floor(donnees.nombreChampsSaisis)),
      );
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }
}
