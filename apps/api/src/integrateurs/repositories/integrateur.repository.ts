import { Injectable } from "@nestjs/common";
import { and, asc, eq, inArray, isNotNull, ne, notInArray } from "drizzle-orm";
import {
  CANAUX_ACTIFS_A_LA_DECLARATION,
  StatutIntegrateur,
  type CanalIntegrateur,
} from "@mutafriches/shared-types";
import { DatabaseService } from "../../shared/database/database.service";
import {
  integrateurs,
  type Integrateur,
  type NewIntegrateur,
} from "../../shared/database/schemas/integrateurs.schema";

@Injectable()
export class IntegrateurRepository {
  constructor(private readonly database: DatabaseService) {}

  // Origines qui passent le guard et CORS : canaux déclaratifs (API, QGIS) en statut actif.
  async listerOriginesActives(): Promise<string[]> {
    const lignes = await this.database.db
      .select({ origine: integrateurs.origine })
      .from(integrateurs)
      .where(this.conditionOrigineActive());
    return lignes.map((ligne) => ligne.origine).filter((o): o is string => o !== null);
  }

  async estOrigineActive(origine: string): Promise<boolean> {
    const lignes = await this.database.db
      .select({ id: integrateurs.id })
      .from(integrateurs)
      .where(and(this.conditionOrigineActive(), eq(integrateurs.origine, origine)))
      .limit(1);
    return lignes.length > 0;
  }

  // Une ligne révoquée bloque son origine pour tous les canaux : sans cela, redéclarer le
  // domaine sur l'autre canal (API ou QGIS) lèverait la révocation.
  async estOrigineRevoquee(origine: string): Promise<boolean> {
    const lignes = await this.database.db
      .select({ id: integrateurs.id })
      .from(integrateurs)
      .where(
        and(eq(integrateurs.statut, StatutIntegrateur.REVOQUE), eq(integrateurs.origine, origine)),
      )
      .limit(1);
    return lignes.length > 0;
  }

  async trouverParCanalEtOrigine(
    canal: CanalIntegrateur,
    origine: string,
  ): Promise<Integrateur | null> {
    const lignes = await this.database.db
      .select()
      .from(integrateurs)
      .where(and(eq(integrateurs.canal, canal), eq(integrateurs.origine, origine)))
      .limit(1);
    return lignes[0] ?? null;
  }

  async trouverParId(id: string): Promise<Integrateur | null> {
    const lignes = await this.database.db
      .select()
      .from(integrateurs)
      .where(eq(integrateurs.id, id))
      .limit(1);
    return lignes[0] ?? null;
  }

  async lister(): Promise<Integrateur[]> {
    return this.database.db
      .select()
      .from(integrateurs)
      .orderBy(asc(integrateurs.canal), asc(integrateurs.structure));
  }

  // Retourne null si une contrainte d'unicité a écarté la ligne (déclaration concurrente,
  // reprise déjà jouée).
  async creerSiAbsent(ligne: NewIntegrateur): Promise<Integrateur | null> {
    const lignes = await this.database.db
      .insert(integrateurs)
      .values(ligne)
      .onConflictDoNothing()
      .returning();
    return lignes[0] ?? null;
  }

  async marquerContactEnregistre(id: string): Promise<void> {
    await this.database.db
      .update(integrateurs)
      .set({ contactEnregistre: true, updatedAt: new Date() })
      .where(eq(integrateurs.id, id));
  }

  // Le déploiement d'un nouveau partenaire ou d'une nouvelle iframe crée sa ligne de reprise
  // (`integrateurs:synchroniser`) avant que la demande ne soit publiée : la demande, qui porte
  // la structure déclarée et son contact, remplace alors cette ligne.
  async publier(id: string, cleStats: string): Promise<Integrateur | null> {
    const maintenant = new Date();
    return this.database.db.transaction(async (tx) => {
      await tx
        .delete(integrateurs)
        .where(and(eq(integrateurs.cleStats, cleStats), ne(integrateurs.id, id)));

      const lignes = await tx
        .update(integrateurs)
        .set({
          statut: StatutIntegrateur.ACTIF,
          cleStats,
          activeLe: maintenant,
          updatedAt: maintenant,
        })
        .where(eq(integrateurs.id, id))
        .returning();
      return lignes[0] ?? null;
    });
  }

  // Révocation ou réactivation : la clé de statistiques est conservée.
  async changerStatut(id: string, statut: StatutIntegrateur): Promise<Integrateur | null> {
    const lignes = await this.database.db
      .update(integrateurs)
      .set({ statut, updatedAt: new Date() })
      .where(eq(integrateurs.id, id))
      .returning();
    return lignes[0] ?? null;
  }

  private conditionOrigineActive() {
    const originesRevoquees = this.database.db
      .select({ origine: integrateurs.origine })
      .from(integrateurs)
      .where(
        and(eq(integrateurs.statut, StatutIntegrateur.REVOQUE), isNotNull(integrateurs.origine)),
      );

    return and(
      inArray(integrateurs.canal, CANAUX_ACTIFS_A_LA_DECLARATION),
      eq(integrateurs.statut, StatutIntegrateur.ACTIF),
      isNotNull(integrateurs.origine),
      notInArray(integrateurs.origine, originesRevoquees),
    );
  }
}
