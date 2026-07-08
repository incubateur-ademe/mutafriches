export enum EtatBatiInfrastructure {
  DEGRADATION_TRES_IMPORTANTE = "degradation-tres-importante",
  DEGRADATION_MOYENNE = "degradation-moyenne",
  // "Bâti intact" : dégradation inexistante
  DEGRADATION_INEXISTANTE = "degradation-inexistante",
  // "Bâti faiblement dégradé" : scores identiques à DEGRADATION_INEXISTANTE (cf. ADR-0025)
  DEGRADATION_FAIBLE = "degradation-faible",
  DEGRADATION_HETEROGENE = "degradation-heterogene",
  PAS_DE_BATI = "pas-de-bati",
  NE_SAIT_PAS = "ne-sait-pas",
}
