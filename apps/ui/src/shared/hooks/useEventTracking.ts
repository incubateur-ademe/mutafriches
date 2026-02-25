import { useCallback } from "react";
import {
  TypeEvenement,
  EvenementInputDto,
  ContexteEvenement,
  UsageType,
} from "@mutafriches/shared-types";
import { useIframe, useIsIframeMode } from "../iframe/useIframe";
import { evenementsService } from "../services/api/api.evenements.service";

export function useEventTracking() {
  const isIframeMode = useIsIframeMode();
  const { integrator } = useIframe();

  // Capture source et ref depuis l'URL ou le sessionStorage
  const captureSourceRef = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get("source");
    const refParam = urlParams.get("ref");

    // Stocker en sessionStorage si présent dans l'URL
    if (sourceParam) sessionStorage.setItem("mutafriches_source", sourceParam);
    if (refParam) sessionStorage.setItem("mutafriches_ref", refParam);

    // Récupérer depuis sessionStorage
    const source = sessionStorage.getItem("mutafriches_source");
    const ref = sessionStorage.getItem("mutafriches_ref");

    return { source, ref };
  }, []);

  // Fonction pour suivre les événements avec source et ref capturés
  const track = useCallback(
    async (
      typeEvenement: TypeEvenement,
      data?: Omit<EvenementInputDto, "typeEvenement" | "sessionId">,
    ) => {
      const { source, ref } = captureSourceRef();

      await evenementsService.enregistrerEvenement(
        {
          typeEvenement,
          evaluationId: data?.evaluationId,
          identifiantCadastral: data?.identifiantCadastral,
          donnees: {
            ...data?.donnees,
            page: window.location.pathname, // Ajouter la page courante aux données
          },
          sourceUtilisation: source || undefined,
          ref: ref || undefined,
        },
        {
          isIframe: isIframeMode,
          integrator: integrator || undefined,
        },
      );
    },
    [isIframeMode, integrator, captureSourceRef],
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
    (contexte?: ContexteEvenement) => {
      return track(TypeEvenement.INTERET_MULTI_PARCELLES, {
        donnees: { contexte },
      });
    },
    [track],
  );

  const trackInteretMiseEnRelation = useCallback(
    (evaluationId: string, usageConcerne?: UsageType) => {
      return track(TypeEvenement.INTERET_MISE_EN_RELATION, {
        evaluationId,
        donnees: { usageConcerne },
      });
    },
    [track],
  );

  const trackExporterResultats = useCallback(
    (evaluationId: string, usageConcerne?: UsageType) => {
      return track(TypeEvenement.INTERET_EXPORT_RESULTATS, {
        evaluationId,
        donnees: { usageConcerne },
      });
    },
    [track],
  );

  const trackEvaluationTerminee = useCallback(
    (evaluationId: string, identifiantCadastral?: string) => {
      return track(TypeEvenement.EVALUATION_TERMINEE, {
        evaluationId,
        identifiantCadastral,
      });
    },
    [track],
  );

  const trackParcelleAjoutee = useCallback(
    (nombreParcelles: number, surfaceTotaleM2: number) => {
      return track(TypeEvenement.PARCELLE_AJOUTEE, {
        donnees: { nombreParcelles, surfaceTotaleM2 },
      });
    },
    [track],
  );

  const trackParcelleSupprimee = useCallback(
    (nombreParcelles: number, surfaceTotaleM2: number) => {
      return track(TypeEvenement.PARCELLE_SUPPRIMEE, {
        donnees: { nombreParcelles, surfaceTotaleM2 },
      });
    },
    [track],
  );

  const trackJaugeDepassee = useCallback(
    (nombreParcelles: number, surfaceTotaleM2: number) => {
      return track(TypeEvenement.JAUGE_DEPASSEE, {
        donnees: { nombreParcelles, surfaceTotaleM2 },
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
    trackEvaluationTerminee,
    trackParcelleAjoutee,
    trackParcelleSupprimee,
    trackJaugeDepassee,
  };
}
