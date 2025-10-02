import { Injectable } from "@nestjs/common";
import { EvenementUtilisateur } from "./evenement.entity";
import { EvenementInputDto, EvenementOutputDto } from "@mutafriches/shared-types";
import { EvenementRepository } from "./evenement.repository";

@Injectable()
export class EvenementService {
  constructor(private readonly evenementRepository: EvenementRepository) {}

  async enregistrerEvenement(
    input: EvenementInputDto,
    metadata?: {
      sourceUtilisation?: string;
      integrateur?: string;
      userAgent?: string;
    },
  ): Promise<EvenementOutputDto> {
    const evenement = new EvenementUtilisateur({
      id: this.genererIdEvenement(),
      typeEvenement: input.typeEvenement,
      evaluationId: input.evaluationId,
      identifiantCadastral: input.identifiantCadastral,
      donnees: input.donnees,
      dateCreation: new Date(),
      sourceUtilisation: metadata?.sourceUtilisation,
      integrateur: metadata?.integrateur,
      userAgent: metadata?.userAgent,
      sessionId: input.sessionId,
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
}
