import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  CodeErreurEnrichissement,
  StatutEnrichissement,
} from "../services/enrichissement.constants";
import { DatabaseService } from "../../shared/database/database.service";
import { logs_enrichissement } from "../../shared/database/schema";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";

export interface LogEnrichissementData {
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
export class LogsEnrichissementRepository {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Enregistre un log d'enrichissement en base
   */
  async log(data: LogEnrichissementData): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    await this.database.db.insert(logs_enrichissement).values({
      id,
      identifiantCadastral: data.identifiantCadastral,
      codeInsee: data.codeInsee,
      commune: data.commune,
      statut: data.statut,
      donnees: data.donnees,
      messageErreur: data.messageErreur,
      codeErreur: data.codeErreur,
      sourcesReussies: data.sourcesReussies as any,
      sourcesEchouees: data.sourcesEchouees as any,
      dateEnrichissement: now,
      dureeMs: data.dureeMs,
      sourceUtilisation: data.sourceUtilisation,
      integrateur: data.integrateur,
      versionApi: data.versionApi,
    });

    return id;
  }
}
