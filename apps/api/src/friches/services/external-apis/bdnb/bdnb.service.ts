import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  BdnbBatiment,
  BdnbLocalisation,
  BdnbPatrimoine,
  BdnbRisquesNaturels,
  BdnbServiceResponse,
  IBdnbService,
} from "./bdnb.interface";
import { ApiResponse } from "../shared/api-response.interface";
import { BdnbBatimentGroupeComplet } from "./bdnb-api.interfaces";

@Injectable()
export class BdnbService implements IBdnbService {
  private readonly baseUrl = process.env.BDNB_API_BASE_URL || "https://api.bdnb.io/v1/bdnb";

  private readonly timeout = parseInt(process.env.BDNB_API_TIMEOUT || "10000", 10);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère uniquement la surface bâtie totale d'une parcelle
   */
  async getSurfaceBatie(identifiantParcelle: string): Promise<ApiResponse<number>> {
    const startTime = Date.now();

    try {
      console.log(`Récupération surface bâtie pour parcelle: ${identifiantParcelle}`);

      const response = await this.callBdnbApi(identifiantParcelle);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Aucune donnée retournée par l'API BDNB",
          source: "API BDNB",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const surfaceTotale = response.data.reduce(
        (total, batiment) => total + (batiment.surface_emprise_sol || 0),
        0,
      );

      console.log(
        `Surface bâtie calculée: ${surfaceTotale} m² pour ${response.data.length} bâtiment(s)`,
      );

      return {
        success: true,
        data: surfaceTotale,
        source: "API BDNB - Données cadastrales enrichies",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `Erreur lors de la récupération de la surface bâtie: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        error: `Erreur technique lors de l'appel à l'API BDNB: ${errorMessage}`,
        source: "API BDNB",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Récupère les données complètes des bâtiments d'une parcelle
   */
  async getBatiments(identifiantParcelle: string): Promise<ApiResponse<BdnbServiceResponse>> {
    const startTime = Date.now();

    try {
      console.log(`Récupération données complètes pour parcelle: ${identifiantParcelle}`);

      const response = await this.callBdnbApi(identifiantParcelle);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Aucune donnée retournée par l'API BDNB",
          source: "API BDNB",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const batimentsEnrichis = this.transformBatiments(response.data);
      const surfaceTotaleBatie = response.data.reduce(
        (total, batiment) => total + (batiment.surface_emprise_sol || 0),
        0,
      );
      const surfaceEmpriseAuSol = response.data.reduce(
        (total, batiment) => total + (batiment.s_geom_groupe || 0),
        0,
      );

      // Extraction des données transversales (basées sur le premier bâtiment)
      const premierBatiment = response.data[0];
      const risquesNaturels = this.extractRisquesNaturels(premierBatiment);
      const localisation = this.extractLocalisation(premierBatiment);
      const patrimoine = this.extractPatrimoine(premierBatiment);

      const result: BdnbServiceResponse = {
        parcelle: identifiantParcelle,
        batiments: batimentsEnrichis,
        surfaceTotaleBatie,
        surfaceEmpriseAuSol,
        risquesNaturels,
        localisation,
        patrimoine,
        fiabiliteEmpriseSol: premierBatiment?.fiabilite_emprise_sol,
        fiabiliteHauteur: premierBatiment?.fiabilite_hauteur,
        fiabiliteCroisementAdresse: premierBatiment?.fiabilite_cr_adr_niv_1,
      };

      console.log(
        `Données enrichies récupérées: ${batimentsEnrichis.length} bâtiment(s), surface totale: ${surfaceTotaleBatie} m²`,
      );

      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
        source: "API BDNB - Base de données nationale du bâtiment",
        responseTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `Erreur lors de la récupération des bâtiments: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        error: `Erreur technique lors de l'appel à l'API BDNB: ${errorMessage}`,
        source: "API BDNB",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Récupère uniquement les risques naturels d'une parcelle
   */
  async getRisquesNaturels(identifiantParcelle: string): Promise<ApiResponse<BdnbRisquesNaturels>> {
    const startTime = Date.now();

    try {
      console.log(`Récupération risques naturels pour parcelle: ${identifiantParcelle}`);

      const response = await this.callBdnbApi(identifiantParcelle);

      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          error: response.error || "Aucune donnée retournée par l'API BDNB",
          source: "API BDNB",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Utiliser le premier bâtiment pour extraire les risques naturels de la parcelle
      const premierBatiment = response.data[0];
      const risquesNaturels = this.extractRisquesNaturels(premierBatiment);

      console.log(
        `Risques naturels extraits - Aléa argiles: ${risquesNaturels.aleaArgiles}, Aléa radon: ${risquesNaturels.aleaRadon}`,
      );

      return {
        success: true,
        data: risquesNaturels,
        source: "API BDNB - Risques naturels",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `Erreur lors de la récupération des risques naturels: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        error: `Erreur technique lors de l'appel à l'API BDNB: ${errorMessage}`,
        source: "API BDNB",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Appel générique à l'API BDNB pour récupérer les données d'une parcelle
   */
  private async callBdnbApi(
    identifiantParcelle: string,
  ): Promise<ApiResponse<BdnbBatimentGroupeComplet[]>> {
    try {
      const url = `${this.baseUrl}/donnees/batiment_groupe_complet/parcelle`;
      const params = {
        parcelle_id: `eq.${identifiantParcelle}`,
        limit: 100,
      };

      console.log(`Appel API BDNB: ${url} avec parcelle_id=${identifiantParcelle}`);

      const response = await firstValueFrom(
        this.httpService.get<BdnbBatimentGroupeComplet[]>(url, {
          params,
          timeout: this.timeout,
          headers: {
            Accept: "application/json",
            "User-Agent": "Mutafriches-API/1.0",
          },
        }),
      );

      const data = response.data;

      if (!data || data.length === 0) {
        console.warn(`Aucun bâtiment trouvé pour la parcelle: ${identifiantParcelle}`);
        return {
          success: false,
          error: `Aucun bâtiment trouvé pour la parcelle ${identifiantParcelle}`,
          source: "API BDNB",
        };
      }

      console.log(`API BDNB: ${data.length} bâtiment(s) trouvé(s)`);

      return {
        success: true,
        data: data,
        source: "API BDNB",
      };
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API BDNB:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API BDNB",
        source: "API BDNB",
      };
    }
  }

  /**
   * Transforme les données brutes BDNB en format BdnbBatiment
   */
  private transformBatiments(batimentsData: BdnbBatimentGroupeComplet[]): BdnbBatiment[] {
    return batimentsData.map(
      (batiment) =>
        ({
          id: batiment.batiment_groupe_id || "unknown",
          surface: batiment.surface_emprise_sol || 0,
          usage:
            batiment.usage_niveau_1_txt || batiment.usage_principal_bdnb_open || "Non renseigné",
          etat: this.determinerEtatBatiment(batiment),
          anneeConstruction: batiment.annee_construction,
          hauteur: batiment.hauteur_mean,
          nbNiveaux: batiment.nb_niveau,
          nbLogements: batiment.nb_log,
          materiauxMur: batiment.mat_mur_txt,
          materiauxToit: batiment.mat_toit_txt,
          classeEnergetique: batiment.classe_bilan_dpe || batiment.classe_conso_energie_arrete_2012,
        }) as BdnbBatiment,
    );
  }

  /**
   * Détermine l'état d'un bâtiment basé sur les données disponibles
   */
  private determinerEtatBatiment(batiment: BdnbBatimentGroupeComplet): string {
    const anneeActuelle = new Date().getFullYear();
    const ageApprox = batiment.annee_construction
      ? anneeActuelle - batiment.annee_construction
      : null;

    if (!ageApprox) return "État inconnu";

    if (ageApprox <= 10) return "Récent";
    if (ageApprox <= 30) return "Bon état";
    if (ageApprox <= 50) return "État moyen";
    return "Ancien";
  }

  /**
   * Extrait les informations sur les risques naturels
   */
  private extractRisquesNaturels(batiment: BdnbBatimentGroupeComplet): BdnbRisquesNaturels {
    return {
      aleaArgiles: batiment?.alea_argiles,
      aleaRadon: batiment?.alea_radon,
      altitudeMoyenne: batiment?.altitude_sol_mean,
    };
  }

  /**
   * Extrait les informations de localisation
   */
  private extractLocalisation(batiment: BdnbBatimentGroupeComplet): BdnbLocalisation {
    return {
      codeCommune: batiment?.code_commune_insee,
      libelleCommuneInsee: batiment?.libelle_commune_insee,
      adressePrincipale: batiment?.libelle_adr_principale_ban,
      quartierPrioritaire: batiment?.quartier_prioritaire,
    };
  }

  /**
   * Extrait les informations patrimoniales
   */
  private extractPatrimoine(batiment: BdnbBatimentGroupeComplet): BdnbPatrimoine {
    return {
      distanceBatimentHistorique: batiment?.distance_batiment_historique_plus_proche,
      nomBatimentHistorique: batiment?.nom_batiment_historique_plus_proche,
      perimetreBatimentHistorique: batiment?.perimetre_bat_historique,
    };
  }

  /**
   * Calcule un indice de fiabilité basé sur les métadonnées BDNB
   */
  private calculateFiabilite(batimentsData: BdnbBatimentGroupeComplet[]): number {
    if (!batimentsData || batimentsData.length === 0) return 0;

    let scoreTotal = 0;
    let criteresEvalues = 0;

    batimentsData.forEach((batiment) => {
      // Fiabilité emprise au sol
      if (batiment.fiabilite_emprise_sol) {
        scoreTotal +=
          batiment.fiabilite_emprise_sol === "BONNE"
            ? 2
            : batiment.fiabilite_emprise_sol === "MOYENNE"
              ? 1
              : 0;
        criteresEvalues++;
      }

      // Fiabilité hauteur
      if (batiment.fiabilite_hauteur) {
        scoreTotal +=
          batiment.fiabilite_hauteur === "BONNE"
            ? 2
            : batiment.fiabilite_hauteur === "MOYENNE"
              ? 1
              : 0;
        criteresEvalues++;
      }

      // Fiabilité croisement adresse
      if (batiment.fiabilite_cr_adr_niv_1) {
        scoreTotal += batiment.fiabilite_cr_adr_niv_1.includes("fiables") ? 2 : 1;
        criteresEvalues++;
      }
    });

    const scoreMoyen = criteresEvalues > 0 ? scoreTotal / criteresEvalues : 0;
    return Math.round((scoreMoyen / 2) * 10) / 10; // Score sur 10
  }
}
