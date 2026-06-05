import { Inject, Injectable, Logger } from "@nestjs/common";
import { isValidEmail } from "@mutafriches/shared-types";
import { convert } from "html-to-text";
import { AppConfig } from "../config";
import { EMAIL_PROVIDER, EmailProvider, SendEmailParams, SendEmailResult } from "./mail.types";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    private readonly config: AppConfig,
  ) {}

  // Envoie un email. Ne throw jamais : retourne toujours { success, messageId?, error? }.
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    if (recipients.length === 0 || !recipients.every((email) => isValidEmail(email))) {
      this.logger.warn("Destinataire(s) email invalide(s), envoi ignoré");
      return { success: false, error: "Destinataire invalide" };
    }

    // Fallback texte automatique pour la délivrabilité
    const text = params.text ?? convert(params.html, { wordwrap: 130 });

    const effectif = this.appliquerRedirectionStaging({ ...params, text });
    return this.provider.send(effectif);
  }

  // Garde-fou staging : réécrit tous les destinataires vers EMAIL_DEV_INBOX si défini.
  private appliquerRedirectionStaging(params: SendEmailParams): SendEmailParams {
    const inbox = this.config.mail.devInbox;
    if (!inbox) return params;

    const destinataireOriginal = Array.isArray(params.to) ? params.to.join(", ") : params.to;
    this.logger.warn(
      `Redirection staging : email destiné à ${destinataireOriginal} envoyé vers ${inbox}`,
    );
    return {
      ...params,
      to: inbox,
      subject: `[STAGING → ${destinataireOriginal}] ${params.subject}`,
    };
  }
}
