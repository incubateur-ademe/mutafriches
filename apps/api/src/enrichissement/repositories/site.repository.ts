import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { eq, and, gte, sql } from "drizzle-orm";

import { DatabaseService } from "../../shared/database/database.service";
import { sites } from "../../shared/database/schema";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  StatutEnrichissement,
} from "@mutafriches/shared-types";

/** Durée de validité du cache des sites en heures */
export const SITE_CACHE_TTL_HOURS = 24;

export interface SiteData {
  identifiantsCadastraux: string[];
  nombreParcelles: number;
  codeInsee?: string;
  commune?: string;
  parcellePredominante?: string;
  statut: StatutEnrichissement;
  donnees?: EnrichissementOutputDto;
  messageErreur?: string;
  codeErreur?: CodeErreurEnrichissement;
  sourcesReussies?: string[];
  sourcesEchouees?: string[];
  dureeMs?: number;
  sourceUtilisation?: string;
  integrateur?: string;
  versionApi?: string;
  /** ID du site source si servi depuis le cache */
  siteSourceId?: string;
}

/** Résultat d'un site en cache */
export interface CachedSite {
  id: string;
  donnees: EnrichissementOutputDto;
}

@Injectable()
export class SiteRepository {
  private readonly logger = new Logger(SiteRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Construit une clé de cache déterministe à partir des identifiants de parcelles
   * Tri alphabétique pour garantir l'unicité indépendamment de l'ordre
   */
  static buildCacheKey(identifiants: string[]): string {
    return [...identifiants].sort().join("|");
  }

  /**
   * Enregistre un site en base
   */
  async save(data: SiteData): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    const centroidLat = data.donnees?.coordonnees?.latitude;
    const centroidLon = data.donnees?.coordonnees?.longitude;
    const geometrie = data.donnees?.geometrieSite ?? data.donnees?.geometrie;

    await this.database.db.insert(sites).values({
      id,
      identifiantsCadastraux: data.identifiantsCadastraux as unknown as Record<string, unknown>,
      nombreParcelles: data.nombreParcelles,
      codeInsee: data.codeInsee,
      commune: data.commune,
      parcellePredominante: data.parcellePredominante,
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
      centroidLatitude: centroidLat?.toString(),
      centroidLongitude: centroidLon?.toString(),
      geometrie: geometrie as unknown as Record<string, unknown>,
      siteSourceId: data.siteSourceId,
    });

    return id;
  }

  /**
   * Recherche un site valide en cache
   * Utilise la clé de cache (identifiants triés et joints)
   */
  async findValidCache(identifiants: string[]): Promise<CachedSite | null> {
    const cacheKey = SiteRepository.buildCacheKey(identifiants);

    try {
      const ttlDate = new Date();
      ttlDate.setHours(ttlDate.getHours() - SITE_CACHE_TTL_HOURS);

      // Recherche par correspondance exacte des identifiants cadastraux triés
      // On utilise CAST(... AS jsonb) au lieu de ::jsonb pour garantir la compatibilité
      // avec postgres.js qui peut avoir des problèmes de binding avec la syntaxe ::jsonb
      const sortedJson = JSON.stringify([...identifiants].sort());

      const result = await this.database.db
        .select({
          id: sites.id,
          donnees: sites.donnees,
        })
        .from(sites)
        .where(
          and(
            // Correspondance bidirectionnelle : le contenu en base inclut tous les identifiants demandés ET inversement
            sql`${sites.identifiantsCadastraux} @> CAST(${sortedJson} AS jsonb)`,
            sql`CAST(${sortedJson} AS jsonb) @> ${sites.identifiantsCadastraux}`,
            eq(sites.statut, StatutEnrichissement.SUCCES),
            gte(sites.dateEnrichissement, ttlDate),
            sql`(${sites.sourcesEchouees} IS NULL OR ${sites.sourcesEchouees} = '[]'::jsonb OR jsonb_array_length(${sites.sourcesEchouees}) = 0)`,
          ),
        )
        .orderBy(sql`${sites.dateEnrichissement} DESC`)
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      if (!row.donnees) {
        return null;
      }

      this.logger.log(`Cache site trouvé pour [${cacheKey}]: ${row.id}`);

      return {
        id: row.id,
        donnees: row.donnees as unknown as EnrichissementOutputDto,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche cache site [${cacheKey}]: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
