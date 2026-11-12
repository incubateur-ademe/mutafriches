/** Règle d'exclusion à laquelle participe une réponse : les usages sont exclus si les conditions associées sont aussi réunies */
export interface ExclusionMatriceDoc {
  usages: string[];
  /** Autres conditions de la règle ; vide si la réponse suffit à exclure */
  conditionsAssociees: { critere: string; reponse: string }[];
}

/** Scores d'une réponse (ou d'une tranche) pour chaque usage, clé = UsageType */
export interface LigneMatriceDoc {
  reponse: string;
  scores: Record<string, number>;
  exclusions?: ExclusionMatriceDoc[];
}

/** Critère de la matrice de scoring, tel que documenté dans la page « Comprendre les analyses » */
export interface CritereMatriceDoc {
  cle: string;
  nom: string;
  poids: number;
  /** Version de l'algorithme qui a introduit le critère */
  versionAjout: string;
  /** Versions récentes où les scores du critère ont changé */
  versionsModification: string[];
  lignes: LigneMatriceDoc[];
}
