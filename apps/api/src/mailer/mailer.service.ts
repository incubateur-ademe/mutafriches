import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getAppConfig } from "../config";

export interface EnvoyerMailParams {
  to: string;
  subject: string;
  html: string;
}

export interface EnvoyerMailResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    const mail = getAppConfig().mail;
    if (!mail.smtpHost) return null;

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: mail.smtpHost,
        port: mail.smtpPort,
        secure: mail.smtpSecure,
        // MailHog n'exige pas d'authentification : on n'envoie auth que si renseignee
        auth: mail.smtpUser ? { user: mail.smtpUser, pass: mail.smtpPass } : undefined,
      });
    }
    return this.transporter;
  }

  private getExpediteur(): string {
    const mail = getAppConfig().mail;
    return `"${mail.senderName}" <${mail.senderEmail}>`;
  }

  // Envoie un email. Ne throw jamais : retourne success=false en cas d'echec
  // pour ne pas casser le flux appelant (ex: tracking d'evenement).
  async envoyer(params: EnvoyerMailParams): Promise<EnvoyerMailResult> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        "SMTP_HOST non configuré : envoi d'email ignoré (configurer MailHog en local ou Brevo en production)",
      );
      return { success: false, error: "SMTP non configuré" };
    }

    const startTime = Date.now();
    try {
      await transporter.sendMail({
        from: this.getExpediteur(),
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email envoyé à ${params.to} (${Date.now() - startTime}ms)`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Échec envoi email : ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
