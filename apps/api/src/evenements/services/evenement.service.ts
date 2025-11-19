import { Injectable } from "@nestjs/common";
import { EvenementInputDto, EvenementOutputDto, ModeUtilisation } from "@mutafriches/shared-types";
import { EvenementUtilisateur } from "../entities/evenement.entity";
import { EvenementRepository } from "../repositories/evenement.repository";

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
      .replace(/javascript:/gi, "")
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
   * Nettoie le contenu JSON du champ donnees
   */
  private sanitizeDonnees(
    donnees: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!donnees) return undefined;

    const sanitized: Record<string, unknown> = {};
    const allowedKeys = [
      "contexte",
      "pertinent",
      "commentaire",
      "usageConcerne",
      "metadata",
      "nombreChampsSaisis",
    ];

    for (const [key, value] of Object.entries(donnees)) {
      if (!allowedKeys.includes(key)) {
        continue;
      }

      const cleanKey = key.substring(0, 50);

      if (typeof value === "string") {
        sanitized[cleanKey] = value
          .replace(/[<>"'`]/g, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+=/gi, "")
          .replace(/http:\/\//gi, "")
          .replace(/https:\/\//gi, "")
          .replace(/esi:include/gi, "")
          .replace(/\$\{/g, "")
          .replace(/\{\{/g, "")
          .replace(/<%/g, "")
          .replace(/%>/g, "")
          .substring(0, 500)
          .trim();
      } else if (typeof value === "boolean") {
        sanitized[cleanKey] = value;
      } else if (typeof value === "number") {
        sanitized[cleanKey] = Math.max(-999999, Math.min(999999, value));
      } else if (value === null) {
        sanitized[cleanKey] = null;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }
}
