import { Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { partenaires, type Partenaire } from "../../shared/database/schemas/partenaires.schema";
import {
  partenaireSites,
  type NewPartenaireSite,
  type PartenaireSite,
} from "../../shared/database/schemas/partenaire-sites.schema";

@Injectable()
export class PartenaireRepository {
  constructor(private readonly database: DatabaseService) {}

  async findBySlug(slug: string): Promise<Partenaire | null> {
    const rows = await this.database.db
      .select()
      .from(partenaires)
      .where(eq(partenaires.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }

  async findSites(slug: string): Promise<PartenaireSite[]> {
    return this.database.db
      .select()
      .from(partenaireSites)
      .where(eq(partenaireSites.partenaireSlug, slug))
      .orderBy(asc(partenaireSites.commune), asc(partenaireSites.idtup));
  }

  async findSiteById(slug: string, id: string): Promise<PartenaireSite | null> {
    const rows = await this.database.db
      .select()
      .from(partenaireSites)
      .where(and(eq(partenaireSites.partenaireSlug, slug), eq(partenaireSites.id, id)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findSiteByIdtup(slug: string, idtup: string): Promise<PartenaireSite | null> {
    const rows = await this.database.db
      .select()
      .from(partenaireSites)
      .where(and(eq(partenaireSites.partenaireSlug, slug), eq(partenaireSites.idtup, idtup)))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertSite(data: NewPartenaireSite): Promise<PartenaireSite> {
    const rows = await this.database.db.insert(partenaireSites).values(data).returning();
    return rows[0];
  }

  // Renomme un site (last-write-wins via updated_at). nom null => repli sur nom_defaut.
  async renommerSite(
    slug: string,
    id: string,
    nom: string | null,
    updatedBy?: string,
  ): Promise<PartenaireSite | null> {
    const rows = await this.database.db
      .update(partenaireSites)
      .set({ nom, updatedAt: new Date(), updatedBy: updatedBy ?? null })
      .where(and(eq(partenaireSites.partenaireSlug, slug), eq(partenaireSites.id, id)))
      .returning();
    return rows[0] ?? null;
  }
}
