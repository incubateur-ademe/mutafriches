import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";

const VALEUR_NE_SAIT_PAS = "ne-sait-pas";

/**
 * Verifie si les donnees complementaires contiennent au moins une reponse "je ne sais pas".
 * Une evaluation avec "je ne sais pas" ne peut pas etre mise en cache (resultat partiel).
 *
 * Parcourt les champs requis : `raccordementEau` en est exclu, il est derive de la surface
 * batie et ignore par le scoring — sa valeur ne doit pas conditionner la mise en cache.
 */
export function hasJeNeSaisPas(donnees?: DonneesComplementairesInputDto | null): boolean {
  if (!donnees) {
    return true;
  }

  return CHAMPS_COMPLEMENTAIRES_REQUIS.some(
    (champ) => (donnees[champ] as unknown) === VALEUR_NE_SAIT_PAS,
  );
}

/**
 * Compare deux jeux de donnees complementaires pour la cle de cache.
 *
 * Itere sur CHAMPS_COMPLEMENTAIRES_REQUIS plutot que d'enumerer les champs a la main :
 * une comparaison ecrite en dur avait fini par ignorer presenceEspecesProtegees et
 * presenceZoneHumide, deux demandes aux scores differents partageant alors un meme resultat.
 */
export function donneesComplementairesEquivalentes(
  a?: DonneesComplementairesInputDto | null,
  b?: DonneesComplementairesInputDto | null,
): boolean {
  if (!a || !b) {
    return false;
  }

  return CHAMPS_COMPLEMENTAIRES_REQUIS.every((champ) => a[champ] === b[champ]);
}
