import {
  CANAUX_ACTIFS_A_LA_DECLARATION,
  StatutIntegrateur,
  type CanalIntegrateur,
} from "@mutafriches/shared-types";
import type {
  Integrateur,
  NewIntegrateur,
} from "../../shared/database/schemas/integrateurs.schema";
import type { IntegrateurRepository } from "../repositories/integrateur.repository";

// Table `integrateurs` en mémoire, avec les règles de la vraie : unicité (canal, origine) et
// `cle_stats`, révocation au grain de l'origine. Pour les tests qui enchaînent déclaration,
// guard et détection d'origine sans base.
export class DepotIntegrateursEnMemoire {
  lignes: Integrateur[] = [];

  versRepository(): IntegrateurRepository {
    return this as unknown as IntegrateurRepository;
  }

  trouverParCle(cleStats: string): Integrateur[] {
    return this.lignes.filter((ligne) => ligne.cleStats === cleStats);
  }

  listerOriginesActives(): Promise<string[]> {
    return Promise.resolve(
      this.lignes.filter((ligne) => this.estActive(ligne)).map((ligne) => ligne.origine as string),
    );
  }

  estOrigineActive(origine: string): Promise<boolean> {
    return Promise.resolve(
      this.lignes.some((ligne) => ligne.origine === origine && this.estActive(ligne)),
    );
  }

  estOrigineRevoquee(origine: string): Promise<boolean> {
    return Promise.resolve(this.origineRevoquee(origine));
  }

  trouverParCanalEtOrigine(canal: CanalIntegrateur, origine: string): Promise<Integrateur | null> {
    return Promise.resolve(
      this.lignes.find((ligne) => ligne.canal === canal && ligne.origine === origine) ?? null,
    );
  }

  lister(): Promise<Integrateur[]> {
    return Promise.resolve([...this.lignes]);
  }

  creerSiAbsent(ligne: NewIntegrateur): Promise<Integrateur | null> {
    const conflit = this.lignes.some(
      (existante) =>
        (ligne.origine != null &&
          existante.canal === ligne.canal &&
          existante.origine === ligne.origine) ||
        (ligne.cleStats != null && existante.cleStats === ligne.cleStats),
    );
    if (conflit) {
      return Promise.resolve(null);
    }

    const maintenant = new Date();
    const creee: Integrateur = {
      origine: null,
      cleStats: null,
      contactEnregistre: false,
      activeLe: null,
      createdAt: maintenant,
      updatedAt: maintenant,
      ...ligne,
    };
    this.lignes.push(creee);
    return Promise.resolve(creee);
  }

  marquerContactEnregistre(id: string): Promise<void> {
    const ligne = this.lignes.find((existante) => existante.id === id);
    if (ligne) {
      ligne.contactEnregistre = true;
    }
    return Promise.resolve();
  }

  changerStatut(id: string, statut: StatutIntegrateur): Promise<Integrateur | null> {
    const ligne = this.lignes.find((existante) => existante.id === id);
    if (!ligne) {
      return Promise.resolve(null);
    }
    ligne.statut = statut;
    return Promise.resolve(ligne);
  }

  private origineRevoquee(origine: string): boolean {
    return this.lignes.some(
      (ligne) => ligne.origine === origine && ligne.statut === StatutIntegrateur.REVOQUE,
    );
  }

  private estActive(ligne: Integrateur): boolean {
    return (
      ligne.origine !== null &&
      CANAUX_ACTIFS_A_LA_DECLARATION.includes(ligne.canal) &&
      ligne.statut === StatutIntegrateur.ACTIF &&
      !this.origineRevoquee(ligne.origine)
    );
  }
}
