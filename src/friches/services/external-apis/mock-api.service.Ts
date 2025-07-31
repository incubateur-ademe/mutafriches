import { Injectable } from '@nestjs/common';
import { ApiResponse } from './interfaces/api-response.interface';
import { MockApiService } from './interfaces/mock-api.interface';
import {
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from '../../enums/parcelle.enums';

@Injectable()
export class MockService implements MockApiService {
  /**
   * Base de données mockée basée sur ton exemple Excel
   * "Ancienne manufacture Les Allumettes" à Trélazé
   */
  private readonly mockDatabase = {
    // Données cadastrales de base
    '490007000ZE0153': {
      identifiant: '490007000ZE0153',
      commune: 'Trélazé',
      surface: 42780,
      coordonnees: { latitude: 47.4514, longitude: -0.4619 },

      // Surfaces
      surfaceBati: 6600,
      nombreBatiments: 8,

      // Infrastructure
      connectionReseauElectricite: true,
      distanceRaccordementElectrique: 0.3,

      // Localisation
      siteEnCentreVille: true,
      distanceAutoroute: 1.5,
      distanceTransportCommun: 250,
      proximiteCommercesServices: true,

      // Contexte
      tauxLogementsVacants: 4.9,
      ancienneActivite: 'Manufacture textile - Les Allumettes',

      // Risques
      presenceRisquesTechnologiques: false,
      presenceRisquesNaturels: RisqueNaturel.FAIBLE,

      // Zonages
      zonageEnvironnemental: ZonageEnvironnemental.HORS_ZONE,
      zonageReglementaire: 'Zone urbaine - U',
      zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE,
      trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,

      // Infos complémentaires
      typeProprietaire: 'Privé',
      nomProprietaire: 'Podeliha (bailleur social)',
      etatBatiInfrastructure: 'Bâtiments hétérogènes',
      presencePollution: 'Ne sait pas',
      terrainEnPente: false,
      terrainViabilise: true,
      qualiteVoieDesserte: 'Accessible',
      voieEauProximite: false,
      qualitePaysage: 'Banal / infra-ordinaire',
      valeurArchitecturaleHistorique: 'Exceptionnel',
      couvertVegetal: 'Imperméabilisé',
      presenceEspeceProtegee: false,
      zoneHumide: 'Absence',
    },

    // Parcelle d'exemple 2 (pour tester la variété)
    '490007000AB0001': {
      identifiant: '490007000AB0001',
      commune: 'Angers',
      surface: 15000,
      coordonnees: { latitude: 47.4784, longitude: -0.5632 },

      surfaceBati: 2500,
      nombreBatiments: 3,

      connectionReseauElectricite: true,
      distanceRaccordementElectrique: 0.8,

      siteEnCentreVille: false,
      distanceAutoroute: 0.5,
      distanceTransportCommun: 800,
      proximiteCommercesServices: false,

      tauxLogementsVacants: 7.2,
      ancienneActivite: 'Entrepôt logistique',

      presenceRisquesTechnologiques: true,
      presenceRisquesNaturels: RisqueNaturel.MOYEN,

      zonageEnvironnemental: ZonageEnvironnemental.ZNIEFF_TYPE_2,
      zonageReglementaire: "Zone d'activité - AUi",
      zonagePatrimonial: ZonagePatrimonial.NON_CONCERNE,
      trameVerteEtBleue: TrameVerteEtBleue.CORRIDOR_ECOLOGIQUE,

      typeProprietaire: 'Public',
      nomProprietaire: "Commune d'Angers",
      etatBatiInfrastructure: 'Dégradé',
      presencePollution: 'Oui',
      terrainEnPente: false,
      terrainViabilise: true,
      qualiteVoieDesserte: 'Difficile',
      voieEauProximite: true,
      qualitePaysage: 'Dégradé',
      valeurArchitecturaleHistorique: 'Ordinaire',
      couvertVegetal: 'Pelouse',
      presenceEspeceProtegee: true,
      zoneHumide: 'Potentielle',
    },
  };

  /**
   * Récupère toutes les données mockées pour une parcelle
   */
  async getMockParcelle(
    identifiantParcelle: string,
  ): Promise<ApiResponse<any>> {
    await this.simulateApiDelay();

    const data = this.mockDatabase[identifiantParcelle];

    if (!data) {
      return {
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée dans la base mock`,
        source: 'Mock Database',
      };
    }

    return {
      success: true,
      data,
      source: 'Mock Database',
      responseTimeMs: this.getRandomResponseTime(),
    };
  }

  /**
   * Récupère une donnée spécifique mockée
   */
  async getMockData(
    champ: string,
    identifiantParcelle: string,
  ): Promise<ApiResponse<any>> {
    await this.simulateApiDelay();

    const parcelle = this.mockDatabase[identifiantParcelle];

    if (!parcelle) {
      return {
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée`,
        source: `Mock API - ${champ}`,
      };
    }

    const value = parcelle[champ];

    if (value === undefined) {
      return {
        success: false,
        error: `Champ ${champ} non disponible pour cette parcelle`,
        source: `Mock API - ${champ}`,
      };
    }

    return {
      success: true,
      data: value,
      source: `Mock API - ${champ}`,
      responseTimeMs: this.getRandomResponseTime(),
    };
  }

  /**
   * Mock spécifique pour les données cadastrales
   */
  async getMockCadastreData(
    identifiantParcelle: string,
  ): Promise<ApiResponse<any>> {
    await this.simulateApiDelay();

    const parcelle = this.mockDatabase[identifiantParcelle];

    if (!parcelle) {
      return {
        success: false,
        error: `Parcelle ${identifiantParcelle} non trouvée dans le cadastre mock`,
        source: 'Mock Cadastre IGN',
      };
    }

    return {
      success: true,
      data: {
        identifiant: parcelle.identifiant,
        commune: parcelle.commune,
        surface: parcelle.surface,
        coordonnees: parcelle.coordonnees,
      },
      source: 'Mock Cadastre IGN',
      responseTimeMs: this.getRandomResponseTime(),
    };
  }

  /**
   * Mock spécifique pour BDNB (surface bâtie)
   */
  async getMockBdnbData(
    identifiantParcelle: string,
  ): Promise<ApiResponse<number>> {
    await this.simulateApiDelay();

    const parcelle = this.mockDatabase[identifiantParcelle];

    if (!parcelle) {
      return {
        success: false,
        error: `Aucune donnée BDNB pour la parcelle ${identifiantParcelle}`,
        source: 'Mock BDNB',
      };
    }

    return {
      success: true,
      data: parcelle.surfaceBati,
      source: 'Mock BDNB',
      responseTimeMs: this.getRandomResponseTime(),
    };
  }

  /**
   * Mock spécifique pour les transports
   */
  async getMockTransportData(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<number>> {
    await this.simulateApiDelay();

    // Trouve la parcelle la plus proche par les coordonnées (approximatif)
    const parcelle = Object.values(this.mockDatabase).find(
      (p) =>
        Math.abs(p.coordonnees.latitude - latitude) < 0.01 &&
        Math.abs(p.coordonnees.longitude - longitude) < 0.01,
    );

    if (!parcelle) {
      // Retourne une valeur par défaut si pas de match
      return {
        success: true,
        data: 1500, // 1.5km par défaut
        source: 'Mock Transport Data Gouv',
        responseTimeMs: this.getRandomResponseTime(),
      };
    }

    return {
      success: true,
      data: parcelle.distanceTransportCommun,
      source: 'Mock Transport Data Gouv',
      responseTimeMs: this.getRandomResponseTime(),
    };
  }

  /**
   * Ajoute une parcelle à la base mock (utile pour les tests)
   */
  addMockParcelle(identifiant: string, data: any): void {
    this.mockDatabase[identifiant] = {
      identifiant,
      ...data,
    };
  }

  /**
   * Liste toutes les parcelles mockées disponibles
   */
  getAvailableParcelles(): string[] {
    return Object.keys(this.mockDatabase);
  }

  /**
   * Simule la latence d'une API réelle
   */
  private async simulateApiDelay(): Promise<void> {
    const delay = Math.random() * 500 + 100; // Entre 100ms et 600ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Génère un temps de réponse aléatoire réaliste
   */
  private getRandomResponseTime(): number {
    return Math.floor(Math.random() * 500 + 100); // Entre 100ms et 600ms
  }

  /**
   * Reset la base mock (utile pour les tests)
   */
  resetMockDatabase(): void {
    // Garde seulement les parcelles par défaut
    const defaultKeys = ['490007000ZE0153', '490007000AB0001'];
    const newDb = {};

    defaultKeys.forEach((key) => {
      if (this.mockDatabase[key]) {
        newDb[key] = this.mockDatabase[key];
      }
    });

    Object.keys(this.mockDatabase).forEach((key) => {
      if (!defaultKeys.includes(key)) {
        delete this.mockDatabase[key];
      }
    });
  }
}
