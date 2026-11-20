import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ORIGINES_MUTAFRICHES } from "../shared/utils";
import { IntegrateurRepository } from "./repositories/integrateur.repository";

// Une révocation prend effet au plus tard après ce délai.
export const DUREE_CACHE_ORIGINES_MS = 60_000;
// Une origine refusée n'interroge la base qu'une fois par fenêtre.
export const DUREE_CACHE_REFUS_MS = 30_000;
const TAILLE_MAX_CACHE_REFUS = 1_000;

// Origines autorisées à appeler l'API (guard et CORS), lues dans la table `integrateurs`
// (ADR-0055). Une déclaration vaut tout de suite : le guard cherche en base une origine
// inconnue du cache avant de la refuser. CORS, lui, ne lit que le cache : son middleware
// passe avant la limite de débit, et l'en-tête Origin est libre.
@Injectable()
export class IntegrateursRegistreService implements OnModuleInit {
  private readonly logger = new Logger(IntegrateursRegistreService.name);
  private readonly originesMutafriches = new Set<string>(ORIGINES_MUTAFRICHES);
  private originesActives = new Set<string>();
  private chargeLe = 0;
  private rechargement: Promise<void> | null = null;
  private readonly refus = new Map<string, number>();
  private readonly recherches = new Map<string, Promise<boolean>>();

  constructor(private readonly repository: IntegrateurRepository) {}

  async onModuleInit(): Promise<void> {
    await this.recharger();
  }

  // Pour le guard, derrière la limite de débit : cache, puis base pour une origine inconnue.
  async estOrigineAutorisee(origine: string): Promise<boolean> {
    if (await this.estOrigineEnCache(origine)) {
      return true;
    }
    return this.chercherEnBase(origine);
  }

  // Pour CORS : aucune requête en base par origine, seulement le rechargement périodique.
  // Nos propres origines sont codées : l'UI doit fonctionner même sans base.
  async estOrigineEnCache(origine: string): Promise<boolean> {
    if (this.originesMutafriches.has(origine)) {
      return true;
    }

    if (Date.now() - this.chargeLe > DUREE_CACHE_ORIGINES_MS) {
      await this.recharger();
    }

    return this.originesActives.has(origine);
  }

  // Rend une déclaration effective sans attendre le rechargement, sur cette instance.
  ajouterOrigine(origine: string): void {
    this.originesActives.add(origine);
    this.refus.delete(origine);
  }

  // Une seule requête par origine à la fois, puis un refus mémorisé pour la fenêtre.
  private chercherEnBase(origine: string): Promise<boolean> {
    const refuseLe = this.refus.get(origine);
    if (refuseLe !== undefined && Date.now() - refuseLe < DUREE_CACHE_REFUS_MS) {
      return Promise.resolve(false);
    }

    const enCours = this.recherches.get(origine);
    if (enCours) {
      return enCours;
    }

    const recherche = this.repository
      .estOrigineActive(origine)
      .then((active) => {
        if (active) {
          this.ajouterOrigine(origine);
          return true;
        }
        // Borne mémoire : l'en-tête Origin est libre, un robot peut en envoyer des milliers.
        if (this.refus.size >= TAILLE_MAX_CACHE_REFUS) {
          this.refus.clear();
        }
        this.refus.set(origine, Date.now());
        return false;
      })
      .catch((error: unknown) => {
        this.logger.error(`Lecture du registre impossible : ${(error as Error).message}`);
        return false;
      })
      .finally(() => {
        this.recherches.delete(origine);
      });

    this.recherches.set(origine, recherche);
    return recherche;
  }

  // Un seul rechargement à la fois ; en cas d'échec, le dernier état connu est conservé.
  private recharger(): Promise<void> {
    this.rechargement ??= this.repository
      .listerOriginesActives()
      .then((origines) => {
        // Rechargé chaque minute sous trafic : ne journaliser que les changements.
        if (origines.length !== this.originesActives.size || this.chargeLe === 0) {
          this.logger.log(`Registre des intégrateurs : ${origines.length} origine(s) active(s)`);
        }
        this.originesActives = new Set(origines);
      })
      .catch((error: unknown) => {
        this.logger.error(`Chargement du registre impossible : ${(error as Error).message}`);
      })
      .finally(() => {
        this.chargeLe = Date.now();
        this.rechargement = null;
      });
    return this.rechargement;
  }
}
