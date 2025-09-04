 
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
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
    } else {
      // Local
      dbConfig = {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USER || "mutafriches_user",
        password: process.env.DB_PASSWORD || "mutafriches_password",
        database: process.env.DB_NAME || "mutafriches",
      };
    }

    this.client = postgres(dbConfig);
    this.db = drizzle(this.client, { schema });
    console.log("Base de données connectée avec Drizzle");
  }

  async onModuleDestroy() {
    await this.client.end();
    console.log("Connexion base de données fermée");
  }
}
