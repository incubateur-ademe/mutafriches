import "reflect-metadata";
import { plainToInstance, Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from "class-validator";

export type NodeEnv = "development" | "production" | "staging" | "test";

// Schéma de validation de toutes les variables d'environnement de l'API.
// La plupart sont optionnelles (des valeurs par défaut existent dans le code) :
// on valide surtout le TYPE et le FORMAT quand la variable est présente.
export class EnvironmentVariables {
  @IsOptional()
  @IsIn(["development", "production", "staging", "test"])
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  // Base de données
  @IsOptional()
  @IsString()
  SCALINGO_POSTGRESQL_URL?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USER?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_NAME?: string;

  // Origines (CORS / guards)
  @IsOptional()
  @IsString()
  ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsString()
  ALLOWED_INTEGRATOR_ORIGINS?: string;

  // Metabase
  @IsOptional()
  @IsString()
  METABASE_SITE_URL?: string;

  @IsOptional()
  @IsString()
  METABASE_SECRET_KEY?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  METABASE_DASHBOARD_ID?: number;

  // Emails (SMTP)
  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  SMTP_PORT?: number;

  @IsOptional()
  @IsIn(["true", "false"])
  SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsEmail()
  MAIL_SENDER_EMAIL?: string;

  @IsOptional()
  @IsString()
  MAIL_SENDER_NAME?: string;

  @IsOptional()
  @IsEmail()
  CONTACT_NOTIFICATION_EMAIL?: string;

  @IsOptional()
  @IsString()
  CONTACT_DASHBOARD_URL?: string;

  // Brevo (envoi transactionnel en staging/prod ; absente -> bascule MailHog)
  @IsOptional()
  @IsString()
  BREVO_API_KEY?: string;

  // Redirection des emails en staging vers une boîte de test (interdite en prod)
  @IsOptional()
  @IsEmail()
  EMAIL_DEV_INBOX?: string;

  @IsOptional()
  @IsEmail()
  EMAIL_REPLY_TO?: string;

  @IsOptional()
  @IsString()
  APP_BASE_URL?: string;

  // APIs externes
  @IsOptional()
  @IsString()
  GEORISQUES_API_URL?: string;

  @IsOptional()
  @IsString()
  ENEDIS_API_URL?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ENEDIS_API_TIMEOUT?: number;

  // Scripts / jobs
  @IsOptional()
  @IsString()
  API_URL?: string;

  @IsOptional()
  @IsString()
  API_REFRESH_TOKEN?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  PARTENAIRES_PREFETCH_DELAY_MS?: number;

  @IsOptional()
  @IsString()
  PARTENAIRE?: string;
}

// Valide les variables d'environnement et retourne l'objet typé.
// Throw au démarrage (fail-fast) si une valeur présente est malformée.
export function validateEnvironment(source: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, source, {
    enableImplicitConversion: false,
  });

  const erreurs = validateSync(validated, {
    skipMissingProperties: true,
    whitelist: false,
  });

  if (erreurs.length > 0) {
    const details = erreurs.map((e) => Object.values(e.constraints ?? {}).join(", ")).join(" | ");
    throw new Error(`Variables d'environnement invalides : ${details}`);
  }

  assertEmailDevInboxSafety(validated);

  return validated;
}

// Domaines autorisés pour la boîte de redirection de test (EMAIL_DEV_INBOX)
const ALLOWED_DEV_INBOX_DOMAINS = ["beta.gouv.fr", "incubateur.ademe.dev"];

// Garde-fou : EMAIL_DEV_INBOX interdite en production et restreinte à un domaine autorisé.
function assertEmailDevInboxSafety(env: EnvironmentVariables): void {
  const inbox = env.EMAIL_DEV_INBOX;
  if (!inbox) return;

  if (env.NODE_ENV === "production") {
    throw new Error("EMAIL_DEV_INBOX est interdite en production");
  }

  const domain = inbox.split("@")[1]?.toLowerCase();
  if (!domain || !ALLOWED_DEV_INBOX_DOMAINS.includes(domain)) {
    throw new Error(
      `Domaine EMAIL_DEV_INBOX non autorisé (${domain ?? "inconnu"}) : autorisés ${ALLOWED_DEV_INBOX_DOMAINS.join(", ")}`,
    );
  }
}
