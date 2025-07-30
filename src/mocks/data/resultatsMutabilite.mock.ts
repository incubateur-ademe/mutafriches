import { MockResultatsMutabilite } from '../mock.types';

export const mockResultatsMutabilite: MockResultatsMutabilite = {
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
      potentiel: 'Très favorable',
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
