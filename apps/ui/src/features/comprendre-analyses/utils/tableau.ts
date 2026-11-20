// En-tête de tableau toujours lisible. Un en-tête collant ne colle qu'à son conteneur de défilement :
// - à partir de 78em (point de rupture xl du DSFR), le tableau tient en largeur : son conteneur ne
//   défile plus et l'en-tête colle à la fenêtre, sous la barre d'onglets (3rem) ;
// - en dessous, le défilement horizontal est nécessaire : le conteneur est borné à la fenêtre et
//   l'en-tête colle en haut de ce conteneur.
// `relative` : sans lui, les textes fr-sr-only (position absolue) des colonnes hors champ échappent
// au conteneur et élargissent la page.
export const CLASSES_CONTENEUR_TABLEAU =
  "fr-table__container relative max-h-[calc(100vh-12rem)] min-[78em]:max-h-none min-[78em]:overflow-visible!";
// Le cadre du tableau est tracé par le DSFR sur son conteneur : l'en-tête collant, placé
// au-dessus, en masque le haut et la gauche. Il porte donc ses propres traits, en ombre interne
// pour qu'ils le suivent quand il colle (une bordure CSS se perd avec border-collapse).
export const CLASSES_ENTETE_TABLEAU =
  "sticky! top-[0px] min-[78em]:top-[3rem] z-[2] [&_th]:shadow-[inset_0_1px_0_var(--border-contrast-grey)] [&_th:first-child]:shadow-[inset_1px_0_0_var(--border-contrast-grey),inset_0_1px_0_var(--border-contrast-grey)]";
