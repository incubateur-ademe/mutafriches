import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "./shared/database/database.service";
import { HealthResponse } from "./shared/types/common.types";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get("health")
  @ApiOperation({ summary: "Vérification de l'état de santé de l'API" })
  @ApiResponse({ status: 200, description: "État de santé de l'API" })
  async healthCheck(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    const health: HealthResponse = {
      status: "OK",
      timestamp,
      service: "Mutafriches API",
      version: "1.0.0", // À synchroniser avec la version dans package.json
      checks: {
        api: "OK",
        database: "OK",
      },
    };

    // Test de la connexion base de données
    try {
      if (this.databaseService.db) {
        await this.databaseService.db.execute("SELECT 1 as test");
        health.checks.database = "OK";
      } else {
        health.checks.database = "DISCONNECTED";
        health.status = "DEGRADED";
      }
    } catch {
      health.checks.database = "ERROR";
      health.status = "DEGRADED";
    }

    return health;
  }
}
