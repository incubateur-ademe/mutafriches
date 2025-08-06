import { Injectable } from '@nestjs/common';
import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { MutabilityResultDto } from 'src/friches/dto/mutability-result.dto';
import { PresencePollution } from 'src/friches/enums/parcelle.enums';
import { IMutabilityService } from 'src/friches/interfaces/mutability-service.interface';

@Injectable()
export class MockMutabilityService implements IMutabilityService {
  /**
   * Calcule les indices de mutabilité à partir d'un DTO (implémentation mock)
   */
  calculateMutability(
    input: MutabilityInputDto,
    fiabilite?: number,
  ): MutabilityResultDto {
    // Si on reconnaît un identifiant de parcelle spécifique, on retourne des données prédéfinies
    if (input.identifiantParcelle) {
      const mockResult = this.getMockResultByParcelle(
        input.identifiantParcelle,
      );
      if (mockResult) {
        // Si une fiabilité est fournie, on l'utilise à la place de celle du mock
        if (fiabilite !== undefined) {
          return {
            ...mockResult,
            fiabilite: this.formatFiabilite(fiabilite),
          };
        }
        return mockResult;
      }
    }

    // Sinon, on fait un calcul simplifié basé sur les données d'entrée
    return this.calculateFromInput(input, fiabilite);
  }

  /**
   * Retourne des résultats mockés basés sur l'identifiant de parcelle
   */
  private getMockResultByParcelle(
    identifiantParcelle: string,
  ): MutabilityResultDto | null {
    switch (identifiantParcelle) {
      case '490007000ZE0153': // Trélazé
        return this.getTrelazeResults();
      case '490007000AB0001': // Angers
        return this.getAngersResults();
      case '490007000CD0042': // Saumur
        return this.getSaumurResults();
      default:
        return null;
    }
  }

  /**
   * Calcul simplifié basé sur les données d'entrée
   */
  private calculateFromInput(
    input: MutabilityInputDto,
    fiabilite?: number,
  ): MutabilityResultDto {
    const calculatedFiabilite = fiabilite ?? input.fiabilite ?? 7;

    // Calcul simplifié pour les mocks
    let baseScore = 50;

    // Facteurs positifs simples
    if (input.siteEnCentreVille) baseScore += 10;
    if (input.proximiteCommercesServices) baseScore += 8;
    if (input.connectionReseauElectricite) baseScore += 5;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 500)
      baseScore += 8;

    // Facteurs négatifs simples
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES)
      baseScore -= 15;
    if (input.presenceRisquesTechnologiques) baseScore -= 12;

    const finalScore = Math.max(20, Math.min(100, baseScore));

    return {
      fiabilite: this.formatFiabilite(calculatedFiabilite),
      resultats: [
        {
          rang: 1,
          usage: 'Logement et commerces de proximité',
          indiceMutabilite: finalScore,
          potentiel: this.getPotentielFromScore(finalScore),
          explication: this.getSimpleExplication(input, finalScore),
        },
        {
          rang: 2,
          usage: 'Équipements publics',
          indiceMutabilite: Math.max(20, finalScore - 5),
          potentiel: this.getPotentielFromScore(finalScore - 5),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
        {
          rang: 3,
          usage: 'Bureaux',
          indiceMutabilite: Math.max(20, finalScore - 10),
          potentiel: this.getPotentielFromScore(finalScore - 10),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
        {
          rang: 4,
          usage: 'Equipements culturels et touristiques',
          indiceMutabilite: Math.max(20, finalScore - 15),
          potentiel: this.getPotentielFromScore(finalScore - 15),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
        {
          rang: 5,
          usage: 'Bâtiments industriels',
          indiceMutabilite: Math.max(20, finalScore - 20),
          potentiel: this.getPotentielFromScore(finalScore - 20),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
        {
          rang: 6,
          usage: 'Centrale photovoltaïque au sol',
          indiceMutabilite: Math.max(20, finalScore - 25),
          potentiel: this.getPotentielFromScore(finalScore - 25),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
        {
          rang: 7,
          usage: 'Espace renaturé',
          indiceMutabilite: Math.max(20, finalScore - 30),
          potentiel: this.getPotentielFromScore(finalScore - 30),
          explication:
            'Évaluation basée sur les données fournies (mode développement).',
        },
      ],
    };
  }

  private getSimpleExplication(
    input: MutabilityInputDto,
    score: number,
  ): string {
    const facteurs: string[] = [];

    if (input.siteEnCentreVille) facteurs.push('emplacement central');
    if (input.proximiteCommercesServices) facteurs.push('commerces proches');
    if (input.connectionReseauElectricite) facteurs.push('réseaux en place');
    if (input.presencePollution !== PresencePollution.OUI_AUTRES_COMPOSES)
      facteurs.push('absence de pollution majeure');

    if (score >= 60) {
      return `${facteurs.length > 0 ? facteurs.join(', ') + ' font que ce' : 'Ce'} site semble adapté pour un programme mixte logements-commerces (évaluation simplifiée).`;
    } else {
      return 'Site présentant quelques contraintes pour un usage résidentiel (évaluation simplifiée).';
    }
  }

  private getPotentielFromScore(
    score: number,
  ):
    | 'Très favorable'
    | 'Favorable'
    | 'Modéré'
    | 'Peu favorable'
    | 'Défavorable' {
    if (score >= 75) return 'Très favorable';
    if (score >= 60) return 'Favorable';
    if (score >= 40) return 'Modéré';
    if (score >= 20) return 'Peu favorable';
    return 'Défavorable';
  }

  private formatFiabilite(note: number): MutabilityResultDto['fiabilite'] {
    let text: string;
    let description: string;

    if (note >= 9) {
      text = 'Très fiable';
      description =
        'Les données sont suffisamment précises pour une analyse robuste.';
    } else if (note >= 7) {
      text = 'Fiable';
      description =
        'Les données permettent une analyse correcte avec quelques incertitudes.';
    } else if (note >= 5) {
      text = 'Modérément fiable';
      description =
        'Certaines données manquent, les résultats sont à interpréter avec prudence.';
    } else {
      text = 'Peu fiable';
      description = 'Données insuffisantes, analyse approximative uniquement.';
    }

    return { note, text, description };
  }

  private getTrelazeResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 9.5,
        text: 'Très fiable',
        description:
          'Les données sont suffisamment précises pour une analyse robuste.',
      },
      resultats: [
        {
          rang: 1,
          usage: 'Logement et commerces de proximité',
          explication:
            'Emplacement central, réseaux déjà en place et absence de pollution majeure font que ce site semble adapté pour un programme mixte logements-commerces.',
          indiceMutabilite: 68,
          potentiel: 'Favorable',
        },
        {
          rang: 2,
          usage: 'Équipements publics',
          explication:
            'Bonne accessibilité et services proches ; quelques travaux de dépollution ou de remise à niveau des bâtiments seront toutefois nécessaires.',
          indiceMutabilite: 63,
          potentiel: 'Favorable',
        },
        {
          rang: 3,
          usage: 'Bureaux',
          explication:
            "Accessibilité routière moyenne et surfaces limitées pourraient restreindre l'attractivité pour des activités tertiaires.",
          indiceMutabilite: 60,
          potentiel: 'Modéré',
        },
        {
          rang: 4,
          usage: 'Equipements culturels et touristiques',
          explication:
            'Localisation intéressante pour des activités culturelles mais nécessite des aménagements spécifiques.',
          indiceMutabilite: 56,
          potentiel: 'Modéré',
        },
        {
          rang: 5,
          usage: 'Bâtiments industriels',
          explication:
            "Site adapté pour de l'industrie légère mais contraintes environnementales à considérer.",
          indiceMutabilite: 54,
          potentiel: 'Modéré',
        },
        {
          rang: 6,
          usage: 'Centrale photovoltaïque au sol',
          explication:
            "Surface disponible mais contraintes d'accès et de raccordement électrique.",
          indiceMutabilite: 47,
          potentiel: 'Peu favorable',
        },
        {
          rang: 7,
          usage: 'Espace renaturé',
          explication:
            'Renaturation possible mais nécessite des investissements importants de dépollution.',
          indiceMutabilite: 41,
          potentiel: 'Peu favorable',
        },
      ],
    };
  }

  private getAngersResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 7.8,
        text: 'Fiable',
        description:
          'Les données permettent une analyse correcte avec quelques incertitudes.',
      },
      resultats: [
        {
          rang: 1,
          usage: 'Bâtiments industriels',
          explication:
            'Proche autoroute, surface importante, adapté pour industrie légère.',
          indiceMutabilite: 72,
          potentiel: 'Favorable',
        },
        {
          rang: 2,
          usage: 'Centrale photovoltaïque au sol',
          explication:
            'Grande surface disponible, bon raccordement électrique.',
          indiceMutabilite: 65,
          potentiel: 'Favorable',
        },
        {
          rang: 3,
          usage: 'Logement et commerces de proximité',
          explication:
            'Éloignement du centre mais potentiel de développement résidentiel.',
          indiceMutabilite: 52,
          potentiel: 'Modéré',
        },
        {
          rang: 4,
          usage: 'Équipements publics',
          explication:
            'Accessibilité correcte mais nécessite des aménagements.',
          indiceMutabilite: 48,
          potentiel: 'Peu favorable',
        },
        {
          rang: 5,
          usage: 'Bureaux',
          explication: 'Localisation moins attractive pour le tertiaire.',
          indiceMutabilite: 42,
          potentiel: 'Peu favorable',
        },
        {
          rang: 6,
          usage: 'Equipements culturels et touristiques',
          explication: 'Potentiel limité en raison de la localisation.',
          indiceMutabilite: 35,
          potentiel: 'Défavorable',
        },
        {
          rang: 7,
          usage: 'Espace renaturé',
          explication: 'Pollution présente, coûts de dépollution élevés.',
          indiceMutabilite: 28,
          potentiel: 'Défavorable',
        },
      ],
    };
  }

  private getSaumurResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 6.2,
        text: 'Modérément fiable',
        description:
          'Certaines données manquent, les résultats sont à interpréter avec prudence.',
      },
      resultats: [
        {
          rang: 1,
          usage: 'Espace renaturé',
          explication:
            'Zone Natura 2000, forte valeur écologique, idéal pour renaturation.',
          indiceMutabilite: 78,
          potentiel: 'Très favorable',
        },
        {
          rang: 2,
          usage: 'Equipements culturels et touristiques',
          explication:
            'Valeur architecturale remarquable, potentiel touristique élevé.',
          indiceMutabilite: 71,
          potentiel: 'Favorable',
        },
        {
          rang: 3,
          usage: 'Centrale photovoltaïque au sol',
          explication: 'Surface disponible mais contraintes patrimoniales.',
          indiceMutabilite: 45,
          potentiel: 'Peu favorable',
        },
        {
          rang: 4,
          usage: 'Équipements publics',
          explication: "Éloignement des centres urbains limite l'attractivité.",
          indiceMutabilite: 38,
          potentiel: 'Défavorable',
        },
        {
          rang: 5,
          usage: 'Logement et commerces de proximité',
          explication: 'Zone rurale, marché résidentiel limité.',
          indiceMutabilite: 32,
          potentiel: 'Défavorable',
        },
        {
          rang: 6,
          usage: 'Bureaux',
          explication: 'Accessibilité difficile, marché tertiaire inexistant.',
          indiceMutabilite: 25,
          potentiel: 'Défavorable',
        },
        {
          rang: 7,
          usage: 'Bâtiments industriels',
          explication:
            'Contraintes environnementales et patrimoniales majeures.',
          indiceMutabilite: 18,
          potentiel: 'Défavorable',
        },
      ],
    };
  }
}
