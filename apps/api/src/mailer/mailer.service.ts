import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

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
    const host = process.env.SMTP_HOST;
    if (!host) return null;

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || "1025", 10),
        secure: process.env.SMTP_SECURE === "true",
        // MailHog n'exige pas d'authentification : on n'envoie auth que si renseignee
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    return this.transporter;
  }

  private getExpediteur(): string {
    const email = process.env.MAIL_SENDER_EMAIL || "contact@mutafriches.beta.gouv.fr";
    const nom = process.env.MAIL_SENDER_NAME || "Mutafriches";
    return `"${nom}" <${email}>`;
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
