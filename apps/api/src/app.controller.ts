import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "./shared/database/database.service";
import { HealthResponse } from "./shared/types/common.types";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: "Page d'accueil de l'API" })
  @ApiResponse({ status: 200, description: "Informations générales sur l'API" })
  getRoot(): {
    name: string;
    version: string;
    description: string;
    documentation: string;
    endpoints: string[];
  } {
    return {
      name: "Mutafriches API",
      version: "1.0.0",
      description: "API pour analyser la mutabilité des friches urbaines",
      documentation: "/api",
      endpoints: [
        "GET /health - Health check",
        "GET /version - Version de l'API",
        "POST /friches/enrich - Enrichissement de parcelle",
        "POST /friches/mutability - Calcul de mutabilité",
      ],
    };
  }

  @Get("health")
  async healthCheck(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    const health: HealthResponse = {
      status: "OK",
      timestamp,
      service: "Mutafriches API",
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
