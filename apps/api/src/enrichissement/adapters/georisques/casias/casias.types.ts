// Types de l'API CASIAS (carte des anciens sites industriels et activités de service)

// Site CASIAS brut ; `geom` est un point le plus souvent, parfois une emprise
export interface CasiasApiData {
  identifiant_ssp: string;
  identifiant_casias: string;
  nom_etablissement: string | null;
  activite_principale: string | null;
  adresse: string | null;
  adresse_lieudit: string | null;
  code_insee: string;
  nom_commune: string;
  statut: string | null;
  fiche_risque: string;
  date_maj: string;
  geom?: unknown;
}

export interface CasiasApiResponse {
  // Total sur l'emprise demandée, toutes pages confondues
  results: number;
  page: number;
  total_pages: number;
  data: CasiasApiData[];
  response_code: number;
  message: string | null;
  next: string | null;
  previous: string | null;
}

export interface CasiasSummary {
  id: string;
  nom: string | null;
  adresse: string | null;
  commune: string;
  // « En arrêt », « En activité », « Indéterminé »
  statut: string | null;
  ficheRisque: string;
}

export interface CasiasResultNormalized {
  presenceCasias: boolean;
  nombreCasias: number;
  casiasProches: CasiasSummary[];
  rayonMetres: number;
  source: string;
  dateRecuperation: string;
}

export interface CasiasSearchByLatLonParams {
  latitude: number;
  longitude: number;
  // En mètres, 10 000 au plus
  rayon?: number;
}
