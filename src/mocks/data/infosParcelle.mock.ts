import { MockInfosParcelle } from '../mock.types';

export const mockInfosParcelle: MockInfosParcelle = {
  // Données de base
  surfaceParcelle: '42 780 m²',
  surfaceBatie: '6 680 m²',
  typeProprietaire: 'Privé',
  ancienneActivite: 'Manufacture',

  // Informations parcelle
  commune: 'Chanteloup-en-brie',
  identifiantParcelle: '154654121',
  connectionElectricite: 'Oui',

  // Environnement
  centreVille: 'Oui',
  distanceAutoroute: 'Entre 1 et 2km',
  distanceTrain: 'Moins de 500m',
  proximiteCommerces: 'Oui',
  distanceRaccordement: 'Moins de 1km',
  tauxLV: '4,9%',

  // Risques et zonage
  risquesTechno: 'Non',
  risquesNaturels: 'Faible',
  zonageEnviro: 'Hors zone',
  zonageUrba: 'Zone urbaine – U',
  zonagePatrimonial: 'Non concerné',
  tvb: 'Hors trame',

  // Données techniques (pour cohérence)
  potentielEcologique: 'Moyen',
};
