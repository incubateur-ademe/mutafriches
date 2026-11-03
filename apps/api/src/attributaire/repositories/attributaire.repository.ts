import { Injectable } from "@nestjs/common";
import { asc, eq, ne, sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import {
  attributaireSites,
  type AttributaireSite,
  type NewAttributaireSite,
} from "../../shared/database/schemas/attributaire-sites.schema";
import { communes } from "../../shared/database/schemas/communes.schema";

@Injectable()
export class AttributaireRepository {
  constructor(private readonly database: DatabaseService) {}

  async enregistrer(ligne: NewAttributaireSite): Promise<void> {
    const miseAJour = Object.fromEntries(
      Object.entries(ligne).filter(([colonne]) => colonne !== "cleSite"),
    ) as Partial<NewAttributaireSite>;

    await this.database.db
      .insert(attributaireSites)
      .values(ligne)
      .onConflictDoUpdate({ target: attributaireSites.cleSite, set: miseAJour });
  }

  async trouverParCodeInsee(codeInsee: string): Promise<AttributaireSite[]> {
    return this.database.db
      .select()
      .from(attributaireSites)
      .where(eq(attributaireSites.codeInsee, codeInsee))
      .orderBy(asc(attributaireSites.nom), asc(attributaireSites.cleSite));
  }

  async compter(): Promise<number> {
    const [ligne] = await this.database.db
      .select({ total: sql<number>`count(*)::int` })
      .from(attributaireSites);
    return ligne?.total ?? 0;
  }

  /** Ensembles de parcelles dont les indices ont été calculés avec une autre version. */
  async listerParcellesHorsVersion(version: string): Promise<string[][]> {
    const lignes = await this.database.db
      .select({ parcelles: attributaireSites.identifiantsCadastraux })
      .from(attributaireSites)
      .where(ne(attributaireSites.versionAlgorithme, version));
    return lignes.map((l) => l.parcelles);
  }

  async nomCommune(codeInsee: string): Promise<string | undefined> {
    const [ligne] = await this.database.db
      .select({ nom: communes.nom })
      .from(communes)
      .where(eq(communes.codeInsee, codeInsee))
      .limit(1);
    return ligne?.nom;
  }
}
