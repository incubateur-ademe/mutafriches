import { Injectable, Logger } from "@nestjs/common";
import { BesoinMultisites, isValidEmail } from "@mutafriches/shared-types";
import { ContactRepository } from "./contact.repository";
import { MailService } from "../mailer/mail.service";
import {
  CONTACT_CONFIRMATION_SUBJECT,
  contactConfirmationTemplate,
} from "../mailer/templates/contact-confirmation.template";
import { contactNotificationTemplate } from "../mailer/templates/contact-notification.template";
import { getAppConfig } from "../config";

export interface TraiterDemandeParams {
  email: string;
  besoin: BesoinMultisites | string;
  evaluationId?: string;
  sessionId?: string;
  integrateur?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly mailService: MailService,
  ) {}

  estEmailValide(email: string | undefined): boolean {
    return isValidEmail(email);
  }

  estBesoinValide(besoin: unknown): boolean {
    return (Object.values(BesoinMultisites) as string[]).includes(String(besoin));
  }

  // Persiste la demande et envoie les deux emails (confirmation + notification equipe).
  // Ne throw jamais : une erreur ici ne doit pas casser le tracking d'evenement appelant.
  async traiterDemande(params: TraiterDemandeParams): Promise<void> {
    if (!this.estEmailValide(params.email) || !this.estBesoinValide(params.besoin)) {
      this.logger.warn("Demande de contact ignorée : email ou besoin invalide");
      return;
    }

    const id = `dc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      await this.contactRepository.enregistrerDemande({
        id,
        email: params.email,
        besoin: String(params.besoin),
        evaluationId: params.evaluationId,
        sessionId: params.sessionId,
        integrateur: params.integrateur,
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Échec persistance demande de contact : ${err.message}`);
      return;
    }

    // Notification equipe
    const mailConfig = getAppConfig().mail;
    if (mailConfig.notificationEmail) {
      await this.mailService.send({
        to: mailConfig.notificationEmail,
        subject: "Nouvelle demande de contact multisites",
        html: contactNotificationTemplate({
          email: params.email,
          besoin: params.besoin,
          date: new Date(),
          evaluationId: params.evaluationId,
          dashboardUrl: mailConfig.dashboardUrl,
        }),
      });
    }

    // Confirmation utilisateur
    const confirmation = await this.mailService.send({
      to: params.email,
      subject: CONTACT_CONFIRMATION_SUBJECT,
      html: contactConfirmationTemplate(),
    });

    if (confirmation.success) {
      try {
        await this.contactRepository.marquerMailConfirmationEnvoye(id);
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.warn(`Mise à jour mailConfirmationEnvoyé échouée : ${err.message}`);
      }
    }
  }
}
