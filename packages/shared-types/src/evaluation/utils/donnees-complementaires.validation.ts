import { DonneesComplementairesInputDto } from "../dto/donnees-complementaires-input.dto";

/**
 * Champs de `donneesComplementaires` que l'appelant doit obligatoirement transmettre.
 *
 * `raccordementEau` en est volontairement absent : il est dérivé de la surface bâtie
 * côté serveur (cf. deriverRaccordementEau) et ignoré s'il est fourni.
 *
 * Liste contractuelle explicite plutôt que dérivée de CRITERES_METADATA : `saisie: "MANUELLE"`
 * y décrit une provenance, pas une obligation dans la requête. Un test de cohérence garde les
 * deux alignés.
 */
export const CHAMPS_COMPLEMENTAIRES_REQUIS = [
  "typeProprietaire",
  "etatBatiInfrastructure",
  "presencePollution",
  "valeurArchitecturaleHistorique",
  "qualitePaysage",
  "qualiteVoieDesserte",
  "trameVerteEtBleue",
  "presenceEspecesProtegees",
  "presenceZoneHumide",
] as const satisfies readonly (keyof DonneesComplementairesInputDto)[];

export type ChampComplementaireRequis = (typeof CHAMPS_COMPLEMENTAIRES_REQUIS)[number];

/**
 * Liste les champs complémentaires requis absents de la requête.
 *
 * Une clé absente, `null`, `undefined` ou une chaîne vide comptent comme manquantes.
 * `"ne-sait-pas"` est une réponse valide : le critère est ignoré au scoring et fait baisser
 * la fiabilité, mais la requête reste calculable.
 */
export function listerChampsComplementairesManquants(
  donnees?: Partial<DonneesComplementairesInputDto> | null,
): ChampComplementaireRequis[] {
  if (!donnees) {
    return [...CHAMPS_COMPLEMENTAIRES_REQUIS];
  }

  return CHAMPS_COMPLEMENTAIRES_REQUIS.filter((champ) => {
    const valeur = donnees[champ] as unknown;
    return valeur === undefined || valeur === null || valeur === "";
  });
}
