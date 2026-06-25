import type { LigneEcart } from "./comparaison";

/**
 * Un site comparé, tel qu'accumulé dans le tableau de la page.
 */
export interface SiteCompare {
  identifiant: string;
  commune: string;
  trouveCartofriches: boolean;
  ficheUrl: string | null;
  scoreCartofriches: string;
  lignes: LigneEcart[];
}

/** Échappe une valeur pour insertion dans un CSV */
function echapper(valeur: string | number | boolean): string {
  const texte = String(valeur);
  if (/[";\n]/.test(texte)) {
    return `"${texte.replace(/"/g, '""')}"`;
  }
  return texte;
}

/**
 * Génère un CSV au format long : une ligne par champ comparé de chaque site.
 */
export function genererCsvEcarts(sites: SiteCompare[]): string {
  const entetes = [
    "identifiant",
    "commune",
    "trouve_cartofriches",
    "champ",
    "mutafriches",
    "cartofriches",
    "ecart",
    "magnitude",
    "note",
    "score_cartofriches",
    "fiche_url",
  ];

  const lignes: string[] = [entetes.join(";")];

  for (const site of sites) {
    if (site.lignes.length === 0) {
      lignes.push(
        [
          site.identifiant,
          site.commune,
          site.trouveCartofriches ? "oui" : "non",
          "",
          "",
          "",
          "",
          "",
          "non trouvé dans Cartofriches",
          site.scoreCartofriches,
          site.ficheUrl ?? "",
        ]
          .map(echapper)
          .join(";"),
      );
      continue;
    }

    for (const ligne of site.lignes) {
      lignes.push(
        [
          site.identifiant,
          site.commune,
          site.trouveCartofriches ? "oui" : "non",
          ligne.label,
          ligne.mutafriches,
          ligne.cartofriches,
          !ligne.comparable ? "non comparable" : ligne.ecart ? "oui" : "non",
          ligne.magnitude ?? "",
          ligne.note ?? "",
          site.scoreCartofriches,
          site.ficheUrl ?? "",
        ]
          .map(echapper)
          .join(";"),
      );
    }
  }

  return lignes.join("\n");
}

/** Déclenche le téléchargement d'un CSV dans le navigateur */
export function telechargerCsv(contenu: string, nomFichier: string): void {
  // BOM UTF-8 pour qu'Excel ouvre correctement les accents
  const bom = "\uFEFF";
  const blob = new Blob([`${bom}${contenu}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = nomFichier.endsWith(".csv") ? nomFichier : `${nomFichier}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
