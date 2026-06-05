import { Injectable } from "@nestjs/common";
import {
  getEnvironment,
  isDeployed,
  isDevelopment,
  isLocal,
  isProduction,
  isStaging,
  isTest,
} from "../shared/utils/environment.utils";
import { EnvironmentVariables, validateEnvironment } from "./env.validation";

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: { rejectUnauthorized: boolean };
}

// Accès typé et centralisé à la configuration de l'API.
// Source d'autorité pour NODE_ENV : shared/utils/environment.utils (ré-exposé via runtime).
@Injectable()
export class AppConfig {
  private readonly env: EnvironmentVariables;

  constructor() {
    this.env = validateEnvironment(process.env);
  }

  get runtime() {
    return {
      environment: getEnvironment(),
      port: this.env.PORT ?? 3000,
      isProduction: isProduction(),
      isStaging: isStaging(),
      isDevelopment: isDevelopment(),
      isTest: isTest(),
      isDeployed: isDeployed(),
      isLocal: isLocal(),
    };
  }

  // Centralise le choix Scalingo (URL unique) vs configuration locale (DB_*)
  get database(): DatabaseConfig {
    if (this.env.SCALINGO_POSTGRESQL_URL) {
      const url = new URL(this.env.SCALINGO_POSTGRESQL_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port, 10),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: { rejectUnauthorized: false },
      };
    }

    return {
      host: this.env.DB_HOST ?? "localhost",
      port: this.env.DB_PORT ?? 5432,
      user: this.env.DB_USER ?? "mutafriches_user",
      password: this.env.DB_PASSWORD ?? "mutafriches_password",
      database: this.env.DB_NAME ?? "mutafriches",
    };
  }

  get origins() {
    return {
      allowed: this.env.ALLOWED_ORIGINS,
      allowedIntegrators: this.env.ALLOWED_INTEGRATOR_ORIGINS,
    };
  }

  get metabase() {
    return {
      siteUrl: this.env.METABASE_SITE_URL,
      secretKey: this.env.METABASE_SECRET_KEY,
      dashboardId: this.env.METABASE_DASHBOARD_ID ?? 3,
    };
  }

  get mail() {
    const senderEmail = this.env.MAIL_SENDER_EMAIL ?? "contact@mutafriches.beta.gouv.fr";
    const senderName = this.env.MAIL_SENDER_NAME ?? "Mutafriches";
    return {
      // Transport
      brevoApiKey: this.env.BREVO_API_KEY,
      smtpHost: this.env.SMTP_HOST,
      smtpPort: this.env.SMTP_PORT ?? 1025,
      smtpSecure: this.env.SMTP_SECURE === "true",
      smtpUser: this.env.SMTP_USER,
      smtpPass: this.env.SMTP_PASS,
      // Expéditeur / réponse
      senderEmail,
      senderName,
      replyToEmail: this.env.EMAIL_REPLY_TO ?? senderEmail,
      replyToName: senderName,
      // Garde-fou staging : redirige tous les destinataires vers cette boîte
      devInbox: this.env.EMAIL_DEV_INBOX,
      // Contact multisites
      notificationEmail: this.env.CONTACT_NOTIFICATION_EMAIL,
      dashboardUrl:
        this.env.CONTACT_DASHBOARD_URL ??
        "https://metabase.mutafriches.beta.gouv.fr/dashboard/10-demandes-de-contact",
    };
  }

  get app() {
    return {
      baseUrl: this.env.APP_BASE_URL ?? "https://mutafriches.beta.gouv.fr",
    };
  }

  get externalApis() {
    return {
      georisquesUrl: this.env.GEORISQUES_API_URL,
      enedisUrl: this.env.ENEDIS_API_URL,
      enedisTimeoutMs: this.env.ENEDIS_API_TIMEOUT,
    };
  }

  get scripts() {
    return {
      apiUrl: this.env.API_URL ?? "http://localhost:3000",
      apiRefreshToken: this.env.API_REFRESH_TOKEN,
      cci92PrefetchDelayMs: this.env.CCI92_PREFETCH_DELAY_MS ?? 1000,
    };
  }
}

// Singleton pour les contextes hors injection NestJS (scripts d'import).
let instance: AppConfig | undefined;

export function getAppConfig(): AppConfig {
  if (!instance) {
    instance = new AppConfig();
  }
  return instance;
}

// Réinitialise le singleton. Réservé aux tests qui manipulent process.env.
export function resetAppConfig(): void {
  instance = undefined;
}
