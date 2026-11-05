import { Font } from "@react-pdf/renderer";
import marianneRegular from "./polices/Marianne-Regular.ttf?url";
import marianneMedium from "./polices/Marianne-Medium.ttf?url";
import marianneBold from "./polices/Marianne-Bold.ttf?url";
import { PDF_GRAISSE, PDF_POLICE } from "./pdfTheme";

let policesEnregistrees = false;

// TTF convertis des WOFF de @gouvfr/dsfr : dans le navigateur, react-pdf échoue à décompresser
// le WOFF (« Buffer is not defined »). Téléchargés au premier export seulement.
export function enregistrerPolicesPdf(): void {
  if (policesEnregistrees) return;
  Font.register({
    family: PDF_POLICE,
    fonts: [
      { src: marianneRegular, fontWeight: PDF_GRAISSE.normale },
      { src: marianneMedium, fontWeight: PDF_GRAISSE.moyenne },
      { src: marianneBold, fontWeight: PDF_GRAISSE.grasse },
    ],
  });
  // Sans ce rappel, react-pdf coupe les mots à l'anglaise (« dé-gradé »)
  Font.registerHyphenationCallback((mot: string) => [mot]);
  policesEnregistrees = true;
}
