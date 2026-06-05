import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import { schema } from "./schema";
import { getAppConfig } from "../../config";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client: postgres.Sql;
  public db: ReturnType<typeof drizzle>;

  onModuleInit() {
    const dbConfig = getAppConfig().database;
    this.logger.log(`Connexion à PostgreSQL sur ${dbConfig.host}:${dbConfig.port}`);

    this.client = postgres(dbConfig);
    this.db = drizzle(this.client, { schema });
    this.logger.log("Base de données connectée avec Drizzle");
  }

  async onModuleDestroy() {
    await this.client.end();
    this.logger.log("Connexion base de données fermée");
  }
}
