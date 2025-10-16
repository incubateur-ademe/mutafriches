import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import { schema } from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client: postgres.Sql;
  public db: ReturnType<typeof drizzle>;

  onModuleInit() {
    let dbConfig;

    // Prod / Staging
    if (process.env.SCALINGO_POSTGRESQL_URL) {
      const url = new URL(process.env.SCALINGO_POSTGRESQL_URL);
      dbConfig = {
        host: url.hostname,
        port: parseInt(url.port),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: { rejectUnauthorized: false },
      };
      this.logger.log(`Connexion à PostgreSQL (Scalingo)`);
    } else {
      // Local
      const host = process.env.DB_HOST || "localhost";
      const port = process.env.DB_PORT || "5432";
      dbConfig = {
        host,
        port: parseInt(port),
        user: process.env.DB_USER || "mutafriches_user",
        password: process.env.DB_PASSWORD || "mutafriches_password",
        database: process.env.DB_NAME || "mutafriches",
      };
      this.logger.log(`Connexion à PostgreSQL (Local) sur ${host}:${port}`);
    }

    this.client = postgres(dbConfig);
    this.db = drizzle(this.client, { schema });
    this.logger.log("Base de données connectée avec Drizzle");
  }

  async onModuleDestroy() {
    await this.client.end();
    this.logger.log("Connexion base de données fermée");
  }
}
