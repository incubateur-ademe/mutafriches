import {
  DonneesComplementairesInputDto,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

/**
 * Verifie si les donnees complementaires contiennent au moins une reponse "je ne sais pas"
 * Une evaluation avec "je ne sais pas" ne peut pas etre mise en cache
 */
export function hasJeNeSaisPas(donnees: DonneesComplementairesInputDto): boolean {
  return (
    donnees.typeProprietaire === TypeProprietaire.NE_SAIT_PAS ||
    donnees.raccordementEau === RaccordementEau.NE_SAIT_PAS ||
    donnees.etatBatiInfrastructure === EtatBatiInfrastructure.NE_SAIT_PAS ||
    donnees.presencePollution === PresencePollution.NE_SAIT_PAS ||
    donnees.valeurArchitecturaleHistorique === ValeurArchitecturale.NE_SAIT_PAS ||
    donnees.qualitePaysage === QualitePaysage.NE_SAIT_PAS ||
    donnees.qualiteVoieDesserte === QualiteVoieDesserte.NE_SAIT_PAS ||
    donnees.trameVerteEtBleue === TrameVerteEtBleue.NE_SAIT_PAS
  );
}
