import { Module } from "@nestjs/common";
import { AppConfig } from "../config";
import { MailService } from "./mail.service";
import { EMAIL_PROVIDER, EmailProvider } from "./mail.types";
import { SmtpProvider } from "./providers/smtp.provider";
import { BrevoProvider } from "./providers/brevo.provider";

// Sélection du transport : MailHog en local OU si la clé Brevo est absente, sinon Brevo.
export function createEmailProvider(config: AppConfig): EmailProvider {
  const useMailhog = config.runtime.isLocal || !config.mail.brevoApiKey;
  return useMailhog ? new SmtpProvider(config) : new BrevoProvider(config);
}

@Module({
  providers: [
    { provide: EMAIL_PROVIDER, useFactory: createEmailProvider, inject: [AppConfig] },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
