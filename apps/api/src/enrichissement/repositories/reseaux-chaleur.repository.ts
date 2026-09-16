import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";

/** Rayon de recherche : au-delà, la distance exacte n'a plus d'intérêt pour le scoring */
const RAYON_RECHERCHE_M = 5000;

export interface ReseauChaleurProche {
  /** Distance en mètres au réseau le plus proche */
  distance: number;
  nom: string | null;
  gestionnaire: string | null;
  identifiantReseau: string | null;
  /** false = seule la position d'un point est publiée : la distance est un majorant */
  traceComplet: boolean;
}

/**
 * Accès au référentiel local des réseaux de chaleur urbains (table raw_reseaux_chaleur,
 * alimentée par `pnpm db:reseaux-chaleur:import` depuis France Chaleur Urbaine).
 */
@Injectable()
export class ReseauxChaleurRepository {
  private readonly logger = new Logger(ReseauxChaleurRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Retourne le réseau de chaleur le plus proche d'un point, ou null si aucun dans le rayon.
   *
   * Le cast en geography donne une distance en mètres sur l'ellipsoïde ; l'index dédié
   * (raw_reseaux_chaleur_geog_idx) est indispensable, sans lui la requête est 20 fois plus lente.
   */
  async findReseauProche(latitude: number, longitude: number): Promise<ReseauChaleurProche | null> {
    const resultat = await this.database.db.execute<{
      distance: number;
      nom: string | null;
      gestionnaire: string | null;
      identifiant_reseau: string | null;
      trace_complet: boolean;
    }>(sql`
      SELECT
        ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS distance,
        nom,
        gestionnaire,
        identifiant_reseau,
        trace_complet
      FROM raw_reseaux_chaleur
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${RAYON_RECHERCHE_M}
      )
      ORDER BY
        geom::geography <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      LIMIT 1
    `);

    const lignes = resultat as unknown as Array<{
      distance: number;
      nom: string | null;
      gestionnaire: string | null;
      identifiant_reseau: string | null;
      trace_complet: boolean;
    }>;

    if (lignes.length === 0) return null;

    const ligne = lignes[0];
    return {
      distance: Number(ligne.distance),
      nom: ligne.nom,
      gestionnaire: ligne.gestionnaire,
      identifiantReseau: ligne.identifiant_reseau,
      traceComplet: ligne.trace_complet,
    };
  }

  /** Nombre de réseaux en base, pour vérifier que le référentiel a bien été importé. */
  async compter(): Promise<number> {
    const resultat = await this.database.db.execute<{ count: string }>(
      sql`SELECT COUNT(*) AS count FROM raw_reseaux_chaleur`,
    );
    const lignes = resultat as unknown as Array<{ count: string }>;
    return lignes.length > 0 ? Number(lignes[0].count) : 0;
  }
}
