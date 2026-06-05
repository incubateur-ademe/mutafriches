export interface EmailReplyTo {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailReplyTo;
}

// Sortie normalisée : un provider ne throw jamais vers l'appelant.
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}

// Jeton d'injection du provider sélectionné (SMTP/MailHog ou Brevo).
export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");
