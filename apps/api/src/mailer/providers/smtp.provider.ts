import { Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppConfig } from "../../config";
import { EmailProvider, SendEmailParams, SendEmailResult } from "../mail.types";

// Transport SMTP local (MailHog). Init paresseuse du transporteur.
export class SmtpProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: AppConfig) {}

  private getTransporter(): Transporter | null {
    const mail = this.config.mail;
    if (!mail.smtpHost) return null;

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: mail.smtpHost,
        port: mail.smtpPort,
        secure: mail.smtpSecure,
        ignoreTLS: !mail.smtpSecure, // MailHog n'expose pas de TLS
        auth: mail.smtpUser ? { user: mail.smtpUser, pass: mail.smtpPass } : undefined,
      });
    }
    return this.transporter;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn("SMTP_HOST non configuré : envoi ignoré");
      return { success: false, error: "SMTP non configuré" };
    }

    const mail = this.config.mail;
    const to = Array.isArray(params.to) ? params.to.join(", ") : params.to;
    const replyTo = params.replyTo ?? { email: mail.replyToEmail, name: mail.replyToName };

    try {
      const info = await transporter.sendMail({
        from: `"${mail.senderName}" <${mail.senderEmail}>`,
        to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: `"${replyTo.name ?? ""}" <${replyTo.email}>`,
      });
      this.logger.log(`Email SMTP envoyé à ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur SMTP";
      this.logger.warn(`Échec envoi SMTP : ${message}`);
      return { success: false, error: message };
    }
  }
}
