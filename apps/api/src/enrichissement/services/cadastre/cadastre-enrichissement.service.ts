import { Injectable, Logger } from "@nestjs/common";
import {
  GeometrieParcelle,
  padParcelleSection,
  SourceEnrichissement,
} from "@mutafriches/shared-types";
import { Site as EvaluationSite } from "../../../evaluation/entities/site.entity";
import { CadastreService } from "../../adapters/cadastre/cadastre.service";
import { BdnbService } from "../../adapters/bdnb/bdnb.service";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { ParcelleInitiale } from "./cadastre-enrichissement.types";
import { Site, ParcelleData } from "../../entities/site.entity";
import { SiteGeometryService } from "../site/site-geometry.service";

/**
 * Service d'enrichissement du sous-domaine Cadastre
 *
 * Responsabilités :
 * - Récupérer les données cadastrales (identifiant, commune, surface, géométrie)
 * - Récupérer la surface bâtie depuis BDNB
 * - Initialiser l'objet Site (évaluation) avec les données de base
 * - Enrichir un site multi-parcellaire (appels parallèles)
 */
@Injectable()
export class CadastreEnrichissementService {
  private readonly logger = new Logger(CadastreEnrichissementService.name);

  constructor(
    private readonly cadastreService: CadastreService,
    private readonly bdnbService: BdnbService,
    private readonly siteGeometryService: SiteGeometryService,
  ) {}

  /**
   * Enrichit un site avec les données cadastrales et BDNB
   *
   * @param identifiantParcelle - Identifiant cadastral de la parcelle
   * @returns Site initialisé et résultat de l'enrichissement
   */
  async enrichir(identifiantParcelle: string): Promise<{
    site: EvaluationSite | null;
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
        site: null,
        result: {
          success: false,
          sourcesUtilisees,
          sourcesEchouees: [SourceEnrichissement.CADASTRE],
          champsManquants: ["toutes-donnees-cadastrales"],
        },
      };
    }

    sourcesUtilisees.push(SourceEnrichissement.CADASTRE);

    // 2. Initialiser le site
    const site = new EvaluationSite();
    site.identifiantParcelle = cadastreData.identifiantParcelle;
    site.codeInsee = cadastreData.codeInsee;
    site.commune = cadastreData.commune;
    site.surfaceSite = cadastreData.surfaceSite;
    site.coordonnees = cadastreData.coordonnees;
    site.geometrie = cadastreData.geometrie as GeometrieParcelle;

    this.logger.log(
      `Site initialise: ${site.identifiantParcelle} (${site.commune}, ${site.surfaceSite}m²)`,
    );

    // 3. Récupérer la surface bâtie depuis BDNB (OPTIONNEL)
    const surfaceBatie = await this.getSurfaceBatie(site.identifiantParcelle);

    if (surfaceBatie !== null) {
      site.surfaceBati = surfaceBatie;
      sourcesUtilisees.push(SourceEnrichissement.BDNB);
      this.logger.debug(`Surface batie recuperee: ${surfaceBatie}m²`);
    } else {
      champsManquants.push("surfaceBati");
      sourcesEchouees.push(SourceEnrichissement.BDNB_SURFACE_BATIE);
      this.logger.warn("Surface batie non disponible");
    }

    return {
      site,
      result: {
        success: true,
        sourcesUtilisees,
        sourcesEchouees,
        champsManquants,
      },
    };
  }

  /**
   * Enrichit un site multi-parcellaire avec les données cadastrales et BDNB
   *
   * @param identifiantsParcelles - Liste des identifiants cadastraux
   * @returns Site initialisé avec toutes les parcelles et résultat de l'enrichissement
   */
  async enrichirMulti(identifiantsParcelles: string[]): Promise<{
    site: Site | null;
    result: EnrichmentResult;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Récupérer les données cadastrales en parallèle pour chaque parcelle
    this.logger.log(
      `Enrichissement cadastre multi-parcellaire : ${identifiantsParcelles.length} parcelle(s)`,
    );
    const cadastreResults = await Promise.allSettled(
      identifiantsParcelles.map((id) => this.getCadastreData(id)),
    );

    // 2. Filtrer les résultats valides
    const parcellesData: ParcelleData[] = [];
    let auMoinsUnCadastreOk = false;

    for (let i = 0; i < cadastreResults.length; i++) {
      const result = cadastreResults[i];
      const identifiant = identifiantsParcelles[i];

      if (result.status === "fulfilled" && result.value !== null) {
        const cadastreData = result.value;
        auMoinsUnCadastreOk = true;

        parcellesData.push({
          identifiantParcelle: cadastreData.identifiantParcelle,
          codeInsee: cadastreData.codeInsee,
          commune: cadastreData.commune,
          surface: cadastreData.surfaceSite,
          coordonnees: cadastreData.coordonnees,
          geometrie: cadastreData.geometrie,
        });

        this.logger.log(
          `Parcelle ${cadastreData.identifiantParcelle} : ${cadastreData.commune}, ${cadastreData.surfaceSite}m²`,
        );
      } else {
        this.logger.warn(`Parcelle cadastrale introuvable : ${identifiant}`);
        sourcesEchouees.push(`${SourceEnrichissement.CADASTRE}:${identifiant}`);
      }
    }

    if (!auMoinsUnCadastreOk || parcellesData.length === 0) {
      this.logger.error("Aucune parcelle cadastrale trouvée");
      return {
        site: null,
        result: {
          success: false,
          sourcesUtilisees,
          sourcesEchouees: [SourceEnrichissement.CADASTRE],
          champsManquants: ["toutes-donnees-cadastrales"],
        },
      };
    }

    sourcesUtilisees.push(SourceEnrichissement.CADASTRE);

    // 3. Récupérer la surface bâtie en parallèle pour chaque parcelle
    const bdnbResults = await Promise.allSettled(
      parcellesData.map((p) => this.getSurfaceBatie(p.identifiantParcelle)),
    );

    let auMoinsUnBdnbOk = false;
    for (let i = 0; i < bdnbResults.length; i++) {
      const result = bdnbResults[i];
      if (result.status === "fulfilled" && result.value !== null) {
        parcellesData[i].surfaceBati = result.value;
        auMoinsUnBdnbOk = true;
      }
    }

    if (auMoinsUnBdnbOk) {
      sourcesUtilisees.push(SourceEnrichissement.BDNB);
    } else {
      champsManquants.push("surfaceBati");
      sourcesEchouees.push(SourceEnrichissement.BDNB_SURFACE_BATIE);
    }

    // 4. Construire le site via SiteGeometryService
    const site = this.siteGeometryService.construireSite(parcellesData);

    return {
      site,
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
        identifiantParcelle: padParcelleSection(result.data.identifiant),
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
