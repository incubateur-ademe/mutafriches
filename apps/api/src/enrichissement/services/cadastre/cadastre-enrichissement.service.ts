import { Injectable, Logger } from "@nestjs/common";
import { GeometrieParcelle, SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { CadastreService } from "../external/cadastre/cadastre.service";
import { BdnbService } from "../external/bdnb/bdnb.service";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { ParcelleInitiale } from "./cadastre-enrichissement.types";

/**
 * Service d'enrichissement du sous-domaine Cadastre
 *
 * Responsabilités :
 * - Récupérer les données cadastrales (identifiant, commune, surface, géométrie)
 * - Récupérer la surface bâtie depuis BDNB
 * - Initialiser l'objet Parcelle avec les données de base
 */
@Injectable()
export class CadastreEnrichissementService {
  private readonly logger = new Logger(CadastreEnrichissementService.name);

  constructor(
    private readonly cadastreService: CadastreService,
    private readonly bdnbService: BdnbService,
  ) {}

  /**
   * Enrichit une parcelle avec les données cadastrales et BDNB
   *
   * @param identifiantParcelle - Identifiant cadastral de la parcelle
   * @returns Parcelle initialisée et résultat de l'enrichissement
   */
  async enrichir(identifiantParcelle: string): Promise<{
    parcelle: Parcelle | null;
    result: EnrichmentResult;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Récupérer les données cadastrales (OBLIGATOIRES)
    const cadastreData = await this.getCadastreData(identifiantParcelle);

    if (!cadastreData) {
      this.logger.error(`Parcelle cadastrale introuvable: ${identifiantParcelle}`);
      return {
        parcelle: null,
        result: {
          success: false,
          sourcesUtilisees,
          sourcesEchouees: [SourceEnrichissement.CADASTRE],
          champsManquants: ["toutes-donnees-cadastrales"],
        },
      };
    }

    sourcesUtilisees.push(SourceEnrichissement.CADASTRE);

    // 2. Initialiser la parcelle
    const parcelle = new Parcelle();
    parcelle.identifiantParcelle = cadastreData.identifiantParcelle;
    parcelle.codeInsee = cadastreData.codeInsee;
    parcelle.commune = cadastreData.commune;
    parcelle.surfaceSite = cadastreData.surfaceSite;
    parcelle.coordonnees = cadastreData.coordonnees;
    parcelle.geometrie = cadastreData.geometrie as GeometrieParcelle;

    this.logger.log(
      `Parcelle initialisee: ${parcelle.identifiantParcelle} (${parcelle.commune}, ${parcelle.surfaceSite}m²)`,
    );

    // 3. Récupérer la surface bâtie depuis BDNB (OPTIONNEL)
    const surfaceBatie = await this.getSurfaceBatie(identifiantParcelle);

    if (surfaceBatie !== null) {
      parcelle.surfaceBati = surfaceBatie;
      sourcesUtilisees.push(SourceEnrichissement.BDNB);
      this.logger.debug(`Surface batie recuperee: ${surfaceBatie}m²`);
    } else {
      champsManquants.push("surfaceBati");
      sourcesEchouees.push(SourceEnrichissement.BDNB_SURFACE_BATIE);
      this.logger.warn("Surface batie non disponible");
    }

    return {
      parcelle,
      result: {
        success: true,
        sourcesUtilisees,
        sourcesEchouees,
        champsManquants,
      },
    };
  }

  /**
   * Récupère les données cadastrales
   */
  private async getCadastreData(identifiant: string): Promise<ParcelleInitiale | null> {
    try {
      const result = await this.cadastreService.getParcelleInfo(identifiant);

      if (!result.success || !result.data) {
        this.logger.warn(`Echec recuperation cadastre: ${result.error || "Aucune donnee"}`);
        return null;
      }

      return {
        identifiantParcelle: result.data.identifiant,
        codeInsee: result.data.codeInsee,
        commune: result.data.commune,
        surfaceSite: result.data.surface,
        coordonnees: result.data.coordonnees,
        geometrie: result.data.geometrie as GeometrieParcelle,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation cadastre:", error);
      return null;
    }
  }

  /**
   * Récupère la surface bâtie depuis BDNB
   */
  private async getSurfaceBatie(identifiant: string): Promise<number | null> {
    try {
      const result = await this.bdnbService.getSurfaceBatie(identifiant);

      if (!result.success || result.data === undefined) {
        this.logger.debug(
          `BDNB: surface batie non disponible (${result.error || "Aucune donnee"})`,
        );
        return null;
      }

      return result.data;
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation BDNB:", error);
      return null;
    }
  }
}
