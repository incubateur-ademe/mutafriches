import { Injectable } from '@nestjs/common';
import { MutabilityResultDto } from 'src/friches/dto/mutability-result.dto';

@Injectable()
export class MockMutabilityService {
  /**
   * Retourne des résultats mockés basés sur l'identifiant de parcelle
   */
  calculateMutabilityForParcelle(
    identifiantParcelle: string,
  ): Promise<MutabilityResultDto | null> {
    // Retourne des données spécifiques selon l'identifiant
    switch (identifiantParcelle) {
      case '490007000ZE0153': // Trélazé
        return Promise.resolve(this.getTrelazeResults());
      case '490007000AB0001': // Angers
        return Promise.resolve(this.getAngersResults());
      case '490007000CD0042': // Saumur
        return Promise.resolve(this.getSaumurResults());
      default:
        return Promise.resolve(this.getDefaultResults());
    }
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

  private getDefaultResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 5.0,
        text: 'Peu fiable',
        description: 'Données insuffisantes, analyse approximative uniquement.',
      },
      resultats: [
        {
          rang: 1,
          usage: 'Analyse insuffisante',
          explication: 'Données manquantes pour une évaluation précise.',
          indiceMutabilite: 50,
          potentiel: 'Modéré',
        },
      ],
    };
  }
}
