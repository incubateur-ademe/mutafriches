import { EnrichissementOutputDto } from "@mutafriches/shared-types";

/**
 * Identifiant cadastral acceptable par le DTO d'événement (20 caractères, alphanumérique
 * majuscule). En multi-parcelle, `identifiantSite` est la liste jointe par virgules : la
 * transmettre telle quelle fait rejeter l'événement en 400, et l'échec est avalé côté UI —
 * le parcours continue, l'événement disparaît.
 *
 * Signature en deux champs plutôt qu'en `FormState` entier : les effets de tracking gardent
 * ainsi des dépendances granulaires et ne se relancent pas à chaque changement de formulaire.
 */
export function identifiantCadastralTracking(
  enrichmentData: EnrichissementOutputDto | undefined,
  identifiantSite: string | undefined,
): string | undefined {
  if (enrichmentData?.parcellePredominante) return enrichmentData.parcellePredominante;

  return identifiantSite?.split(",")[0] || undefined;
}
