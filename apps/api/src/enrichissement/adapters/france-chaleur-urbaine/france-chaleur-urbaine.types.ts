/**
 * Réponse de `GET /v1/eligibility` de l'API France Chaleur Urbaine.
 *
 * Attention : le schéma OpenAPI publié déclare ces champs non nullables, ce qui est faux.
 * Vérifié en conditions réelles, l'API renvoie `null` dans deux situations distinctes :
 *   - `distance: null` avec `id`/`name` renseignés : un réseau est connu dans le quartier
 *     mais France Chaleur Urbaine n'en possède pas le tracé, donc aucune distance calculable ;
 *   - tous les champs à `null` : aucun réseau connu à proximité.
 * Ne pas régénérer ce type depuis le schéma, il réintroduirait des types non nullables.
 */
export interface FranceChaleurUrbaineEligibiliteResponse {
  /** Distance à vol d'oiseau en mètres jusqu'au réseau le plus proche */
  distance: number | null;
  /** true si le réseau le plus proche est en construction */
  futurNetwork: boolean;
  gestionnaire: string | null;
  /** Identifiant national du réseau (SNCU) */
  id: string | null;
  /** true si le point est dans un périmètre de développement prioritaire */
  inPDP: boolean;
  /** Éligibilité au sens de France Chaleur Urbaine (seuil propre à FCU, non repris ici) */
  isEligible: boolean;
  name: string | null;
  /** Contenu CO2 en analyse du cycle de vie (kg/kWh) */
  rateCO2: number | null;
  /** Taux d'énergies renouvelables et de récupération (%) */
  rateENRR: number | null;
}
