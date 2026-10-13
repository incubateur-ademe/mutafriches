import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../shared/api-response.types";
import { LimiteurDebit } from "./bdnb-limiteur";
import {
  BdnbBatiment,
  BdnbBatimentGroupeComplet,
  BdnbLocalisation,
  BdnbPatrimoine,
  BdnbRisquesNaturels,
  BdnbServiceResponse,
} from "./bdnb.types";

// Plafond imposé par l'API (en-tête x-max-items-per-call) : un `limit` supérieur est ramené à 10 sans erreur
const TAILLE_PAGE = 10;
// 300 groupes de bâtiments : au-delà, on signale un échec plutôt que de sous-estimer la surface
const PAGES_MAX = 30;
const TENTATIVES_MAX = 3;
// Marge sous la limite de 120 requêtes/minute, partagée avec la pré-chauffe et les autres instances
const REQUETES_PAR_MINUTE_MAX = 100;
const ATTENTE_429_MAX_MS = 20000;
const ATTENTE_429_DEFAUT_MS = 5000;
const ATTENTE_ERREUR_BASE_MS = 500;

interface ErreurHttp {
  response?: { status?: number; headers?: Record<string, string> };
}

@Injectable()
export class BdnbService {
  private readonly logger = new Logger(BdnbService.name);
  private readonly baseUrl = "https://api.bdnb.io/v1/bdnb";
  private readonly timeout = 10000; // 10 secondes
  private readonly limiteur = new LimiteurDebit(REQUETES_PAR_MINUTE_MAX, 60000);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère uniquement la surface bâtie totale d'une parcelle
   *
   * Sémantique :
   * - success=true, data=N (>0)  : bâtiments trouvés, surface bâtie totale = N m²
   * - success=true, data=0       : recherche effectuée, aucun bâtiment sur la parcelle (terrain non bâti)
   * - success=false              : erreur technique (timeout, 4xx/5xx, parse...)
   */
  async getSurfaceBatie(identifiantParcelle: string): Promise<ApiResponse<number>> {
    const startTime = Date.now();

    try {
      const response = await this.callBdnbApi(identifiantParcelle, "surface_emprise_sol");

      if (!response.success) {
        return {
          success: false,
          error: response.error || "Erreur technique API BDNB",
          source: "API BDNB",
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Cas "parcelle non bâtie" : API a répondu OK avec 0 bâtiment
      // C'est une donnée valide (pas une erreur) → surface = 0 m²
      const batiments = response.data ?? [];
      const surfaceTotale = batiments.reduce(
        (total, batiment) => total + (batiment.surface_emprise_sol || 0),
        0,
      );

      return {
        success: true,
        data: surfaceTotale,
        source: "API BDNB - Données cadastrales enrichies",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(
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
      const response = await this.callBdnbApi(identifiantParcelle);

      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          error: response.error || `Aucun bâtiment trouvé pour la parcelle ${identifiantParcelle}`,
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

      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
        source: "API BDNB - Base de données nationale du bâtiment",
        responseTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(
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

      return {
        success: true,
        data: risquesNaturels,
        source: "API BDNB - Risques naturels",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.error(
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
   * Appel générique à l'API BDNB : pagine jusqu'à épuisement des groupes de bâtiments de la parcelle
   */
  private async callBdnbApi(
    identifiantParcelle: string,
    select?: string,
  ): Promise<ApiResponse<BdnbBatimentGroupeComplet[]>> {
    try {
      const url = `${this.baseUrl}/donnees/batiment_groupe_complet/parcelle`;
      const batiments: BdnbBatimentGroupeComplet[] = [];

      for (let page = 0; page < PAGES_MAX; page++) {
        const lot = await this.getPage(url, {
          parcelle_id: `eq.${identifiantParcelle}`,
          ...(select ? { select } : {}),
          order: "batiment_groupe_id",
          limit: TAILLE_PAGE,
          offset: page * TAILLE_PAGE,
        });
        batiments.push(...lot);

        // Réponse 200 avec un tableau (potentiellement vide) = succès technique.
        // Un tableau vide signifie "parcelle non bâtie" : c'est une information valide,
        // pas une erreur. Les consommateurs (getSurfaceBatie / getBatiments / getRisquesNaturels)
        // décident comment exploiter le cas "0 bâtiment".
        if (lot.length < TAILLE_PAGE) {
          return { success: true, data: batiments, source: "API BDNB" };
        }
      }

      this.logger.warn(
        `BDNB: plus de ${PAGES_MAX * TAILLE_PAGE} groupes sur ${identifiantParcelle}`,
      );
      return {
        success: false,
        error: `Plus de ${PAGES_MAX * TAILLE_PAGE} groupes de bâtiments, résultat tronqué`,
        source: "API BDNB",
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'appel à l'API BDNB: ${error instanceof Error ? error.message : "inconnue"}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API BDNB",
        source: "API BDNB",
      };
    }
  }

  /**
   * Une page de résultats, avec respect du débit et nouvelles tentatives (429, 5xx, timeout)
   */
  private async getPage(
    url: string,
    params: Record<string, string | number>,
  ): Promise<BdnbBatimentGroupeComplet[]> {
    for (let tentative = 1; ; tentative++) {
      await this.limiteur.acquerir();

      try {
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

        // Un objet d'erreur en 200 ne doit pas passer pour "parcelle non bâtie"
        if (!Array.isArray(response.data)) {
          throw new Error("Réponse BDNB inattendue (tableau attendu)");
        }
        return response.data;
      } catch (error) {
        const attenteMs = this.attenteAvantNouvelEssai(error, tentative);
        if (attenteMs === null) {
          throw error;
        }
        this.logger.warn(
          `BDNB: nouvelle tentative ${tentative + 1}/${TENTATIVES_MAX} dans ${attenteMs} ms`,
        );
        await new Promise<void>((resolve) => setTimeout(resolve, attenteMs));
      }
    }
  }

  // null = ne pas réessayer
  private attenteAvantNouvelEssai(error: unknown, tentative: number): number | null {
    if (tentative >= TENTATIVES_MAX) return null;

    const reponse = (error as ErreurHttp).response;
    const status = reponse?.status;

    if (status === 429) {
      // x-rate-limit-reset : instant (ms epoch) de remise à zéro de la fenêtre
      const reset = Number(reponse?.headers?.["x-rate-limit-reset"]);
      const attenteMs = Number.isFinite(reset) ? reset - Date.now() + 250 : ATTENTE_429_DEFAUT_MS;
      return Math.min(Math.max(attenteMs, 250), ATTENTE_429_MAX_MS);
    }

    // Pas de statut = timeout ou erreur réseau
    if (status === undefined || status >= 500) {
      return ATTENTE_ERREUR_BASE_MS * 2 ** (tentative - 1);
    }

    return null;
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
