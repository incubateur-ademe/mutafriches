import { Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { partenaires, type Partenaire } from "../../shared/database/schemas/partenaires.schema";
import {
  partenaireSites,
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
}
