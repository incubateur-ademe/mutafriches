import { Injectable, Logger } from "@nestjs/common";
import { inArray, sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import {
  cacheBdnbParcelles,
  GroupeBatimentCache,
} from "../../shared/database/schemas/cache-bdnb-parcelles.schema";

export interface EntreeCacheBdnb {
  parcelleId: string;
  surfaceBati: number;
  groupes: GroupeBatimentCache[];
  dateRecuperation: Date;
}

/**
 * Cache de la surface bâtie BDNB par parcelle (ADR-0052).
 *
 * Ne lève jamais : un cache indisponible doit dégrader vers l'appel BDNB, pas faire échouer l'enrichissement.
 */
@Injectable()
export class BdnbCacheRepository {
  private readonly logger = new Logger(BdnbCacheRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findByParcelles(parcelleIds: string[]): Promise<Map<string, EntreeCacheBdnb>> {
    const entrees = new Map<string, EntreeCacheBdnb>();
    if (parcelleIds.length === 0) return entrees;

    try {
      const rows = await this.databaseService.db
        .select()
        .from(cacheBdnbParcelles)
        .where(inArray(cacheBdnbParcelles.parcelleId, parcelleIds));

      for (const row of rows) {
        entrees.set(row.parcelleId, row);
      }
    } catch (error: unknown) {
      this.logger.warn(`Lecture du cache BDNB impossible : ${(error as Error).message}`);
    }

    return entrees;
  }

  async enregistrer(
    entrees: Pick<EntreeCacheBdnb, "parcelleId" | "surfaceBati" | "groupes">[],
  ): Promise<void> {
    if (entrees.length === 0) return;

    try {
      await this.databaseService.db
        .insert(cacheBdnbParcelles)
        .values(entrees)
        .onConflictDoUpdate({
          target: cacheBdnbParcelles.parcelleId,
          set: {
            surfaceBati: sql`excluded.surface_bati`,
            groupes: sql`excluded.groupes`,
            dateRecuperation: sql`now()`,
          },
        });
    } catch (error: unknown) {
      this.logger.warn(`Écriture du cache BDNB impossible : ${(error as Error).message}`);
    }
  }
}
