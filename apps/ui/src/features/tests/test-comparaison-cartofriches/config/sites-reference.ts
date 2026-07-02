/**
 * Liste de sites de référence à précharger dans la page de comparaison Cartofriches.
 *
 * Éditez ce tableau pour ajouter les sites à comparer. Chaque site peut être mono-parcelle
 * (un seul identifiant) ou multi-parcelle (plusieurs identifiants formant une même unité foncière).
 */
export interface SiteReference {
  /** Libellé indicatif (nom du site), affiché dans l'UI */
  label?: string;
  /** Commune du site (affichage) */
  commune?: string;
  /** Identifiants cadastraux composant le site */
  parcelles: string[];
}

export const SITES_REFERENCE: SiteReference[] = [
  {
    label: "CAVAL (Coopérative agricole Vienne Anjou Loire)",
    commune: "Trélazé",
    parcelles: ["49353000AC0628"],
  },
  {
    label: "STATION SERVICE / DLI",
    commune: "Candé",
    parcelles: ["490540000A1264"],
  },
  {
    label: "THOMSON TELEVISION",
    commune: "Angers",
    parcelles: ["49007000CE0205"],
  },
  {
    label: "Rennaise du meuble (travail du bois)",
    commune: "Le Rheu",
    parcelles: [
      "35240000ZE0097",
      "35240000ZE0188",
      "35240000ZE0251",
      "35240000ZE0577",
      "35240000ZE0579",
    ],
  },
  {
    label: "Friche 35240_13761",
    commune: "Le Rheu",
    parcelles: [
      "35240000AE0011",
      "35240000AE0012",
      "35240000AE0023",
      "35240000AE0024",
      "35240000AE0025",
      "35240000AE0105",
      "35240000AE0138",
    ],
  },
];
