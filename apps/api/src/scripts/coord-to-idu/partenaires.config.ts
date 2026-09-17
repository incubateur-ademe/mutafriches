/**
 * Descripteurs d'onboarding : ce qu'il faut savoir d'un partenaire pour générer ses fichiers
 * de données à partir d'un inventaire brut (cf. resolve-idu-partenaire).
 *
 * Un descripteur ne vit que le temps de l'onboarding : une fois les fichiers générés et
 * commités, il ne sert plus qu'à rejouer la résolution (nouveau millésime d'inventaire).
 */
export interface DescripteurResolution {
  /** Slug du partenaire : nomme le dossier UI, le fichier backend et le fichier d'entrée. */
  slug: string;
  /** Préfixe des idtup générés (ex. "scet" donne "scet-28"). */
  prefixeIdtup: string;
  /** Nom de la constante exportée côté UI (ex. PARCELLES_SCET). */
  constanteParcelles: string;
  /** Nom de la constante exportée côté backend (ex. SCET_SITES). */
  constanteSites: string;
  /** Département, utilisé quand l'inventaire ne porte pas le code INSEE. */
  departement?: string;
  /** Une ligne décrivant la source, reprise en en-tête des fichiers générés. */
  source: string;
}

export const DESCRIPTEURS: Record<string, DescripteurResolution> = {
  scet: {
    slug: "scet",
    prefixeIdtup: "scet",
    constanteParcelles: "PARCELLES_SCET",
    constanteSites: "SCET_SITES",
    departement: "77",
    source: "inventaire SCET 2025 (friches de la CC du Pays de Montereau, 77)",
  },
  "petr-sologne": {
    slug: "petr-sologne",
    prefixeIdtup: "petr45",
    constanteParcelles: "PARCELLES_PETR_SOLOGNE",
    constanteSites: "PETR_SOLOGNE_SITES",
    departement: "45",
    source: "inventaire EODD 2025 (friches du PETR, Loiret)",
  },
  ccpeidf: {
    slug: "ccpeidf",
    prefixeIdtup: "ccpeidf",
    constanteParcelles: "PARCELLES_CCPEIDF",
    constanteSites: "CCPEIDF_SITES",
    departement: "28",
    source: "inventaire EODD 2025 (friches de la CCPEIDF, Eure-et-Loir)",
  },
};
