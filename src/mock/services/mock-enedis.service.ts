import { Injectable } from '@nestjs/common';
import {
  IEnedisService,
  EnedisRaccordement,
  EnedisConnexionStatus,
  EnedisAnalyseComplete,
} from '../../friches/services/external-apis/enedis/enedis.interface';
import { ApiResponse } from '../../friches/services/external-apis/shared/api-response.interface';

@Injectable()
export class MockEnedisService implements IEnedisService {
  getDistanceRaccordement(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisRaccordement>> {
    console.log(
      `Mock - Calcul distance raccordement: ${latitude}, ${longitude}`,
    );

    // Simulation basée sur la position
    const distance = Math.random() * 2; // 0-2km
    const type = distance < 0.5 ? 'BT' : 'HTA';

    const result: ApiResponse<EnedisRaccordement> = {
      success: true,
      source: 'mock-enedis',
      data: {
        distance,
        type: type,
        capaciteDisponible: distance < 1,
        posteProche: {
          nom: 'Poste Mock',
          commune: 'Ville Test',
          coordonnees: { latitude, longitude },
        },
        infrastructureProche: {
          type: 'poste',
          distance: distance * 1000,
          tension: type,
        },
      },
    };

    return Promise.resolve(result);
  }

  checkConnection(
    identifiantParcelle: string,
  ): Promise<ApiResponse<EnedisConnexionStatus>> {
    console.log(
      `Mock - Vérification connexion parcelle: ${identifiantParcelle}`,
    );

    const isConnected = Math.random() > 0.3; // 70% de chances d'être connecté

    const result: ApiResponse<EnedisConnexionStatus> = {
      success: true,
      source: 'mock-enedis',
      data: {
        isConnected,
        confidence: isConnected ? 'high' : 'low',
        sources: isConnected ? ['postes-electriques', 'reseau-bt'] : [],
        details: {
          postesProches: isConnected ? Math.floor(Math.random() * 3) + 1 : 0,
          lignesBTProches: isConnected ? Math.floor(Math.random() * 5) : 0,
          poteauxProches: isConnected ? Math.floor(Math.random() * 10) : 0,
        },
      },
    };

    return Promise.resolve(result);
  }

  async analyseComplete(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<EnedisAnalyseComplete>> {
    console.log(`Mock - Analyse complète: ${latitude}, ${longitude}`);

    try {
      const raccordementResult = await this.getDistanceRaccordement(
        latitude,
        longitude,
      );
      const connexionResult = await this.checkConnection('mock-parcelle');

      if (!raccordementResult.success || !connexionResult.success) {
        return {
          success: false,
          source: 'mock-enedis',
          error: "Erreur lors de l'analyse complète mock",
        };
      }

      const raccordement = raccordementResult.data as EnedisRaccordement;
      const connexion = connexionResult.data as EnedisConnexionStatus;

      const result: ApiResponse<EnedisAnalyseComplete> = {
        success: true,
        source: 'mock-enedis',
        data: {
          raccordement,
          connexion,
          recommandations: [
            'Analyse simulée - Données de test',
            'Contacter Enedis pour une étude réelle',
            raccordement.distance < 0.5
              ? 'Raccordement favorable - Proximité immédiate'
              : 'Extension de réseau nécessaire',
          ],
          coutEstime: {
            min: Math.round(1500 + raccordement.distance * 1000),
            max: Math.round(8000 + raccordement.distance * 2000),
            devise: 'EUR',
            commentaire: 'Estimation mock pour tests',
          },
        },
      };

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Mock - Erreur analyse complète: ${errorMessage}`);

      return {
        success: false,
        source: 'mock-enedis',
        error: "Erreur lors de l'analyse complète mock",
      };
    }
  }

  rechercherInfrastructures(
    latitude: number,

    longitude: number,

    rayonMetres: number = 1000,
  ): Promise<
    ApiResponse<{
      postes: Array<{ distance: number; nom: string; commune: string }>;
      lignesBT: Array<{ distance: number; type: string; tension: string }>;
      poteaux: Array<{ distance: number; tension: string }>;
    }>
  > {
    console.log(`Mock - Recherche infrastructures dans rayon ${rayonMetres}m`);

    // Génération de données aléatoires mais cohérentes
    const nombrePostes = Math.floor(Math.random() * 3) + 1;
    const nombreLignesBT = Math.floor(Math.random() * 5) + 1;
    const nombrePoteaux = Math.floor(Math.random() * 8) + 2;

    const postes = Array.from({ length: nombrePostes }, (_, index) => ({
      distance: Math.round(200 + Math.random() * 1800), // 200m à 2km
      nom: `Poste Mock ${index + 1}`,
      commune: `Ville Test ${index + 1}`,
    }));

    const lignesBT = Array.from({ length: nombreLignesBT }, () => ({
      distance: Math.round(50 + Math.random() * 500), // 50m à 550m
      type: Math.random() > 0.5 ? 'Souterrain' : 'Aérien',
      tension: 'BT',
    }));

    const poteaux = Array.from({ length: nombrePoteaux }, () => ({
      distance: Math.round(10 + Math.random() * 200), // 10m à 210m
      tension: Math.random() > 0.8 ? 'HTA' : 'BT',
    }));

    const result: ApiResponse<{
      postes: Array<{ distance: number; nom: string; commune: string }>;
      lignesBT: Array<{ distance: number; type: string; tension: string }>;
      poteaux: Array<{ distance: number; tension: string }>;
    }> = {
      success: true,
      source: 'mock-enedis',
      data: {
        postes: postes.sort((a, b) => a.distance - b.distance),
        lignesBT: lignesBT.sort((a, b) => a.distance - b.distance),
        poteaux: poteaux.sort((a, b) => a.distance - b.distance),
      },
    };

    return Promise.resolve(result);
  }
}
