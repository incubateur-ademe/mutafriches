import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  CRITERES_METADATA,
  normalizeParcelId,
  type CriteresSaisis,
  type DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";

const NE_SAIT_PAS = "ne-sait-pas";

/** Clé d'un site : un même ensemble de parcelles arrive dans des ordres et des formats variés. */
export function parcellesNormalisees(parcelles: readonly string[]): string[] {
  return [...new Set(parcelles.map((p) => normalizeParcelId(p.trim())))].sort();
}

export function cleSite(parcelles: readonly string[]): string {
  return parcellesNormalisees(parcelles).join(",");
}

/**
 * Formes brutes et normalisées des parcelles, pour retrouver les lignes enregistrées sans
 * normalisation (sites partenaires et export CNIG gardent la section « 0X »).
 */
export function variantesParcelles(parcelles: readonly string[]): string[] {
  const variantes = new Set<string>();
  for (const parcelle of parcellesNormalisees(parcelles)) {
    variantes.add(parcelle);
    // Section à une lettre : la forme brute la préfixe d'un zéro (cf. normalizeParcelId)
    if (parcelle.length === 13 && /[A-Z]/.test(parcelle[8])) {
      variantes.add(`${parcelle.slice(0, 8)}0${parcelle.slice(8)}`);
    }
  }
  return [...variantes];
}

export const DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS = Object.fromEntries(
  CHAMPS_COMPLEMENTAIRES_REQUIS.map((champ) => [champ, NE_SAIT_PAS]),
) as unknown as DonneesComplementairesInputDto;

/** Réponses réellement saisies, ou `null` quand la saisie ne contient que « ne sait pas ». */
export function extraireCriteresSaisis(
  donnees: Partial<DonneesComplementairesInputDto> | null | undefined,
): CriteresSaisis | null {
  if (!donnees) return null;

  const saisis: CriteresSaisis = {};
  for (const champ of CHAMPS_COMPLEMENTAIRES_REQUIS) {
    const valeur = donnees[champ] as unknown;
    saisis[champ] = typeof valeur === "string" && valeur !== "" ? valeur : NE_SAIT_PAS;
  }

  return Object.values(saisis).some((valeur) => valeur !== NE_SAIT_PAS) ? saisis : null;
}

export const CLES_CRITERES_AUTOMATIQUES = Object.values(CRITERES_METADATA)
  .filter((critere) => critere.saisie === "AUTOMATIQUE")
  .map((critere) => critere.key);
