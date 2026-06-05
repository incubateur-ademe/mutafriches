import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../shared/database/database.service";
import { demandes_contact } from "../shared/database/schemas/demandes-contact.schema";

export interface DemandeContactRecord {
  id: string;
  email: string;
  besoin: string;
  evaluationId?: string;
  sessionId?: string;
  integrateur?: string;
}

@Injectable()
export class ContactRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async enregistrerDemande(demande: DemandeContactRecord): Promise<void> {
    await this.databaseService.db.insert(demandes_contact).values({
      id: demande.id,
      email: demande.email,
      besoin: demande.besoin,
      evaluationId: demande.evaluationId || null,
      sessionId: demande.sessionId || null,
      integrateur: demande.integrateur || null,
      mailConfirmationEnvoye: false,
    });
  }

  async marquerMailConfirmationEnvoye(id: string): Promise<void> {
    await this.databaseService.db
      .update(demandes_contact)
      .set({ mailConfirmationEnvoye: true })
      .where(eq(demandes_contact.id, id));
  }
}
