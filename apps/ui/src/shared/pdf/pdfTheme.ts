// Teintes DSFR des exports PDF : react-pdf ne lit pas les variables CSS, d'où les valeurs.
export const PDF_COULEURS = {
  texte: "#161616", // --text-title-grey
  texteCourant: "#3a3a3a", // --text-default-grey
  mention: "#666666", // --text-mention-grey
  bleuFrance: "#000091", // --blue-france-sun-113-625
  rougeMarianne: "#e1000f", // --red-marianne-main-472
  fondEnTeteTableau: "#f6f6f6", // --background-alt-grey
  filetEnTeteTableau: "#3a3a3a", // --border-plain-grey
  filetLigne: "#dddddd", // --border-default-grey
  fondSection: "#f5f5fe", // --background-alt-blue-france
  fondEncadre: "#ececfe", // --blue-france-950-100
  fondTag: "#e3e3fd", // --background-action-low-blue-france
  bordureCarte: "#e5e5e5",
  ombreCarte: "#d5d5d5",
} as const;

export const PDF_POLICE = "Marianne";

export const PDF_GRAISSE = { normale: 400, moyenne: 500, grasse: 700 } as const;

// Marges de page communes : l'en-tête et le pied de page sont posés en absolu dans ces marges
export const PDF_MARGES = { haut: 96, bas: 40, cotes: 40 } as const;

export const moisAnneeCourants = (): string =>
  new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
