import { useCallback } from "react";
import { TypeEvenement, EvenementInputDto } from "@mutafriches/shared-types";
import { useIframe, useIsIframeMode } from "../iframe/useIframe";
import { evenementsService } from "../services/api/api.evenements.service";

export function useEventTracking() {
  const isIframeMode = useIsIframeMode();
  const { integrator } = useIframe();

  const track = useCallback(
    async (
      typeEvenement: TypeEvenement,
      data?: Omit<EvenementInputDto, "typeEvenement" | "sessionId">,
    ) => {
      await evenementsService.enregistrerEvenement(
        {
          typeEvenement,
          evaluationId: data?.evaluationId,
          identifiantCadastral: data?.identifiantCadastral,
          donnees: data?.donnees,
        },
        {
          isIframe: isIframeMode,
          integrator: integrator || undefined,
        },
      );
    },
    [isIframeMode, integrator],
  );

  const trackFeedback = useCallback(
    (evaluationId: string, pertinent: boolean, commentaire?: string) => {
      return track(TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT, {
        evaluationId,
        donnees: { pertinent, commentaire },
      });
    },
    [track],
  );

  const trackInteretMultiParcelles = useCallback(
    (contexte?: string) => {
      return track(TypeEvenement.INTERET_MULTI_PARCELLES, {
        donnees: { contexte },
      });
    },
    [track],
  );

  const trackInteretMiseEnRelation = useCallback(
    (evaluationId: string, usageConcerne?: string) => {
      return track(TypeEvenement.INTERET_MISE_EN_RELATION, {
        evaluationId,
        donnees: { usageConcerne },
      });
    },
    [track],
  );

  const trackExporterResultats = useCallback(
    (evaluationId: string, usageConcerne?: string) => {
      return track(TypeEvenement.INTERET_EXPORT_RESULTATS, {
        evaluationId,
        donnees: { usageConcerne },
      });
    },
    [track],
  );

  return {
    track,
    trackFeedback,
    trackInteretMultiParcelles,
    trackInteretMiseEnRelation,
    trackExporterResultats,
  };
}
