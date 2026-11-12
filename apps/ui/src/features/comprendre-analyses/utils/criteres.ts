import {
  CRITERES_METADATA,
  MATRICE_SCORING_DOC,
  type CritereMatriceDoc,
  type ExclusionMatriceDoc,
} from "@mutafriches/shared-types";

// Coefficient décroissant ; à coefficient égal, l'ordre de la matrice est conservé (tri stable)
export const CRITERES_PAR_COEFFICIENT: CritereMatriceDoc[] = [...MATRICE_SCORING_DOC].sort(
  (a, b) => b.poids - a.poids,
);

// Libellé du parcours (« Surface bâtie »), complété de l'unité portée par le nom de la matrice
export const libelleCritere = (critere: Pick<CritereMatriceDoc, "cle" | "nom">): string => {
  const libelle = CRITERES_METADATA[critere.cle]?.label ?? critere.nom;
  const unite = /\((m²|%)\)$/.exec(critere.nom)?.[0];
  return unite ? `${libelle} ${unite}` : libelle;
};

// Texte d'une exclusion : la réponse suffit, ou n'exclut que combinée à d'autres conditions
export const descriptionExclusion = (exclusion: ExclusionMatriceDoc): string => {
  if (exclusion.conditionsAssociees.length === 0) return "Usage incompatible";
  const conditions = exclusion.conditionsAssociees
    .map((c) => `${libelleCritere({ cle: c.critere, nom: c.critere })} : ${c.reponse}`)
    .join(" et ");
  return `Usage incompatible si « ${conditions} »`;
};
