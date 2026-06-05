import { Logger } from "@nestjs/common";
import { BrevoClient } from "@getbrevo/brevo";
import { AppConfig } from "../../config";
import { EmailProvider, SendEmailParams, SendEmailResult } from "../mail.types";

const MAX_TENTATIVES = 3;
const BACKOFF_BASE_MS = 300;

// Transport API HTTP Brevo (staging/prod). Retry exponentiel sur les 5xx transitoires.
export class BrevoProvider implements EmailProvider {
  private readonly logger = new Logger(BrevoProvider.name);
  private client: BrevoClient | null = null;

  constructor(private readonly config: AppConfig) {}

  private getClient(): BrevoClient | null {
    const apiKey = this.config.mail.brevoApiKey;
    if (!apiKey) return null;
    if (!this.client) {
      this.client = new BrevoClient({ apiKey });
    }
    return this.client;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const client = this.getClient();
    if (!client) {
      this.logger.warn("BREVO_API_KEY absente : envoi ignoré");
      return { success: false, error: "Brevo non configuré" };
    }

    const mail = this.config.mail;
    const to = (Array.isArray(params.to) ? params.to : [params.to]).map((email) => ({ email }));
    const replyTo = params.replyTo ?? { email: mail.replyToEmail, name: mail.replyToName };

    let derniereErreur = "Erreur Brevo";

    for (let tentative = 1; tentative <= MAX_TENTATIVES; tentative++) {
      try {
        const res = await client.transactionalEmails.sendTransacEmail({
          sender: { email: mail.senderEmail, name: mail.senderName },
          to,
          subject: params.subject,
          htmlContent: params.html,
          textContent: params.text,
          replyTo,
        });
        this.logger.log(`Email Brevo envoyé (messageId=${res.messageId ?? "?"})`);
        return { success: true, messageId: res.messageId };
      } catch (error: unknown) {
        derniereErreur = error instanceof Error ? error.message : "Erreur Brevo";
        const statusCode = (error as { statusCode?: number }).statusCode;
        const transitoire = statusCode === undefined || statusCode >= 500;

        if (transitoire && tentative < MAX_TENTATIVES) {
          const delai = BACKOFF_BASE_MS * 2 ** (tentative - 1);
          this.logger.warn(
            `Échec Brevo (tentative ${tentative}/${MAX_TENTATIVES}, statut ${statusCode ?? "n/a"}), nouvel essai dans ${delai}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delai));
          continue;
        }

        this.logger.warn(`Échec envoi Brevo : ${derniereErreur}`);
        return { success: false, error: derniereErreur };
      }
    }

    return { success: false, error: derniereErreur };
  }
}
