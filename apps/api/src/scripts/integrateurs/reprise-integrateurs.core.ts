import { v4 as uuidv4 } from "uuid";
import {
  CanalIntegrateur,
  StatutIntegrateur,
  type IntegrateurIframeConfig,
} from "@mutafriches/shared-types";
import type { NewIntegrateur } from "../../shared/database/schemas/integrateurs.schema";
import { normaliserOrigines, ORIGINES_MUTAFRICHES } from "../../shared/utils";

// Origine commune aux versions de l'extension QGIS antérieures à la déclaration par structure.
export const ORIGINE_QGIS_PARTAGEE = "https://qgis.mutafriches.beta.gouv.fr";
// Entrées du registre iframe qui ne sont pas des intégrateurs : nous-mêmes et les tests locaux.
const IFRAMES_INTERNES = ["mutafriches", "demo"];

export interface SourcesReprise {
  // Valeur de ALLOWED_INTEGRATOR_ORIGINS, séparée par des virgules
  originesVariable?: string;
  integrateursIframe: Record<string, IntegrateurIframeConfig>;
  partenaires: { slug: string; nom: string; departement: string }[];
}

function hote(origine: string): string | null {
  try {
    return new URL(origine).hostname || null;
  } catch {
    return null;
  }
}

// Lignes des intégrateurs antérieurs au registre (ADR-0055), toutes actives. Rejouer la
// reprise n'insère rien deux fois : l'unicité porte sur (canal, origine) et sur `cle_stats`.
export function construireLignesReprise(
  sources: SourcesReprise,
  maintenant: Date = new Date(),
): NewIntegrateur[] {
  const commun = {
    typeStructure: "autre" as const,
    statut: StatutIntegrateur.ACTIF,
    activeLe: maintenant,
  };
  const nosOrigines: readonly string[] = ORIGINES_MUTAFRICHES;

  const origines = [
    ...new Set(normaliserOrigines((sources.originesVariable ?? "").split(","))),
  ].filter((origine) => !nosOrigines.includes(origine));

  // Deux origines d'un même hôte (http et https, ou deux ports) écrivent la même valeur dans
  // `integrateur` : seule la première porte la clé de statistiques, unique en base. Les
  // suivantes restent autorisées, sans clé.
  const hotesDejaVus = new Set<string>();

  const lignesOrigines = origines.flatMap((origine): NewIntegrateur[] => {
    const nomHote = hote(origine);
    if (!nomHote) {
      return [];
    }
    const premiereDuHote = !hotesDejaVus.has(nomHote);
    hotesDejaVus.add(nomHote);
    const estQgis = origine === ORIGINE_QGIS_PARTAGEE;
    return [
      {
        ...commun,
        id: uuidv4(),
        canal: estQgis ? CanalIntegrateur.QGIS : CanalIntegrateur.API,
        // À renommer à la main après la reprise : la variable ne connaît que l'origine.
        structure: estQgis ? "QGIS non déclaré" : nomHote,
        origine,
        cleStats: premiereDuHote ? nomHote : null,
      },
    ];
  });

  const lignesIframe = Object.entries(sources.integrateursIframe)
    .filter(([identifiant]) => !IFRAMES_INTERNES.includes(identifiant))
    .map(([identifiant, config]): NewIntegrateur => ({
      ...commun,
      id: uuidv4(),
      canal: CanalIntegrateur.IFRAME,
      structure: config.name,
      origine: config.allowedDomains[0] ? `https://${config.allowedDomains[0]}` : null,
      cleStats: identifiant,
    }));

  const lignesPages = sources.partenaires.map((partenaire): NewIntegrateur => ({
    ...commun,
    id: uuidv4(),
    canal: CanalIntegrateur.PAGE,
    structure: partenaire.nom,
    origine: null,
    cleStats: `partenaire:${partenaire.slug}`,
    departement: partenaire.departement,
  }));

  return [...lignesOrigines, ...lignesIframe, ...lignesPages];
}
