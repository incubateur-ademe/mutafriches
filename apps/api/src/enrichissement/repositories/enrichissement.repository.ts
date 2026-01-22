import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { eq, and, gte, sql } from "drizzle-orm";

import { DatabaseService } from "../../shared/database/database.service";
import { enrichissements } from "../../shared/database/schema";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  StatutEnrichissement,
} from "@mutafriches/shared-types";

/** Duree de validite du cache des enrichissements en heures */
export const ENRICHISSEMENT_CACHE_TTL_HOURS = 24;

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
  /** ID de l'enrichissement source si servi depuis le cache */
  enrichissementSourceId?: string;
}

/** Resultat d'un enrichissement en cache */
export interface CachedEnrichissement {
  id: string;
  donnees: EnrichissementOutputDto;
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

      // Colonnes geographiques
      centroidLatitude: centroidLat?.toString(),
      centroidLongitude: centroidLon?.toString(),
      geometrie: geometrie as unknown as Record<string, unknown>,

      // Cache : reference vers l'enrichissement source
      enrichissementSourceId: data.enrichissementSourceId,
    });

    return id;
  }

  /**
   * Recherche un enrichissement valide en cache pour une parcelle
   * Criteres : statut='succes', sources_echouees vide, date < TTL
   */
  async findValidCache(identifiantCadastral: string): Promise<CachedEnrichissement | null> {
    const ttlDate = new Date();
    ttlDate.setHours(ttlDate.getHours() - ENRICHISSEMENT_CACHE_TTL_HOURS);

    const result = await this.database.db
      .select({
        id: enrichissements.id,
        donnees: enrichissements.donnees,
      })
      .from(enrichissements)
      .where(
        and(
          eq(enrichissements.identifiantCadastral, identifiantCadastral),
          eq(enrichissements.statut, StatutEnrichissement.SUCCES),
          gte(enrichissements.dateEnrichissement, ttlDate),
          // sources_echouees doit etre vide (null, [], ou '[]')
          sql`(${enrichissements.sourcesEchouees} IS NULL OR ${enrichissements.sourcesEchouees} = '[]'::jsonb OR jsonb_array_length(${enrichissements.sourcesEchouees}) = 0)`,
        ),
      )
      .orderBy(sql`${enrichissements.dateEnrichissement} DESC`)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    if (!row.donnees) {
      return null;
    }

    this.logger.log(`Cache enrichissement trouve pour ${identifiantCadastral}: ${row.id}`);

    return {
      id: row.id,
      donnees: row.donnees as unknown as EnrichissementOutputDto,
    };
  }
}
