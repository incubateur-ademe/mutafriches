import "reflect-metadata";
import { plainToInstance, Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min, validateSync } from "class-validator";

export type NodeEnv = "development" | "production" | "staging" | "test";

// Schéma de validation de toutes les variables d'environnement de l'API.
// La plupart sont optionnelles (des valeurs par défaut existent dans le code) :
// on valide surtout le TYPE et le FORMAT quand la variable est présente.
export class EnvironmentVariables {
  @IsOptional()
  @IsIn(["development", "production", "staging", "test"])
  NODE_ENV?: NodeEnv;

  // PORT absent, vide ou <= 0 (ex. conteneur one-off "scalingo run") => traité comme non
  // fourni (l'app retombe sur le défaut 3000). Les valeurs non numériques restent rejetées.
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const n = Number(value);
    if (Number.isNaN(n)) return value; // laisse @IsInt rejeter les non-numériques (ex. "abc")
    return n < 1 ? undefined : n; // 0 / négatif => non fourni
  })
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

  return validated;
}
