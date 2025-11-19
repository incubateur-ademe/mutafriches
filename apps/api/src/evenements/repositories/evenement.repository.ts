import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/database/database.service";
import { evenements_utilisateur } from "src/shared/database/schemas/evenements.schema";
import { EvenementUtilisateur } from "../entities/evenement.entity";

@Injectable()
export class EvenementRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async enregistrerEvenement(evenement: EvenementUtilisateur): Promise<void> {
    await this.databaseService.db.insert(evenements_utilisateur).values({
      id: evenement.id,
      typeEvenement: evenement.typeEvenement,
      evaluationId: evenement.evaluationId || null,
      identifiantCadastral: evenement.identifiantCadastral || null,
      donnees: evenement.donnees || null,
      dateCreation: evenement.dateCreation,
      sourceUtilisation: evenement.sourceUtilisation || null,
      modeUtilisation: evenement.modeUtilisation || null,
      ref: evenement.ref || null,
      integrateur: evenement.integrateur || null,
      userAgent: evenement.userAgent || null,
      sessionId: evenement.sessionId || null,
    });
  }
}
