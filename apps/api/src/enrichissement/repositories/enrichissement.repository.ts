import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

import { DatabaseService } from "../../shared/database/database.service";
import { enrichissements } from "../../shared/database/schema";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  StatutEnrichissement,
} from "@mutafriches/shared-types";

export interface EnrichissementData {
  identifiantCadastral: string;
  codeInsee?: string;
  commune?: string;
  statut: StatutEnrichissement;
  donnees?: EnrichissementOutputDto | undefined;
  messageErreur?: string;
  codeErreur?: CodeErreurEnrichissement;
  sourcesReussies?: string[];
  sourcesEchouees?: string[];
  dureeMs?: number;
  sourceUtilisation?: string;
  integrateur?: string;
  versionApi?: string;
}

@Injectable()
export class EnrichissementRepository {
  private readonly logger = new Logger(EnrichissementRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Enregistre un enrichissement en base
   */
  async save(data: EnrichissementData): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    // Extraire les données géographiques si présentes
    const centroidLat = data.donnees?.coordonnees?.latitude;
    const centroidLon = data.donnees?.coordonnees?.longitude;
    const geometrie = data.donnees?.geometrie;

    // Logger les infos géographiques pour debug
    if (centroidLat && centroidLon) {
      this.logger.log(
        `Log enrichissement ${data.identifiantCadastral}: centroid lat=${centroidLat.toFixed(5)}, lon=${centroidLon.toFixed(5)}`,
      );
    } else {
      this.logger.warn(
        `Log enrichissement ${data.identifiantCadastral}: pas de coordonnées disponibles`,
      );
    }

    await this.database.db.insert(enrichissements).values({
      id,
      identifiantCadastral: data.identifiantCadastral,
      codeInsee: data.codeInsee,
      commune: data.commune,
      statut: data.statut,
      donnees: data.donnees as unknown as Record<string, unknown>,
      messageErreur: data.messageErreur,
      codeErreur: data.codeErreur,
      sourcesReussies: data.sourcesReussies as unknown as Record<string, unknown>,
      sourcesEchouees: data.sourcesEchouees as unknown as Record<string, unknown>,
      dateEnrichissement: now,
      dureeMs: data.dureeMs,
      sourceUtilisation: data.sourceUtilisation,
      integrateur: data.integrateur,
      versionApi: data.versionApi,

      // Nouvelles colonnes géographiques
      centroidLatitude: centroidLat?.toString(),
      centroidLongitude: centroidLon?.toString(),
      geometrie: geometrie as unknown as Record<string, unknown>,
    });

    return id;
  }
}
