import {
  EnrichissementOutputDto,
  MutabiliteOutputDto,
  VERSION_ALGO,
} from "@mutafriches/shared-types";
import { API_CONFIG } from "../../../shared/services/api/api.config";
import { IframeEvaluationSummaryDto } from "../../../shared/iframe/iframe.types";
import { getUsagesPodium } from "./usagesLabels.utils";

// Payload de `mutafriches:completed`, contrat public décrit dans docs/integration/README.md
export function buildIframeEvaluationSummary(
  results: MutabiliteOutputDto,
  enrichmentData: EnrichissementOutputDto | undefined,
  identifiantSite: string | undefined,
): IframeEvaluationSummaryDto {
  const identifiantParcelle = identifiantSite ?? "";
  const usagePrincipal = results.resultats[0];

  return {
    evaluationId: results.evaluationId || "",
    identifiantParcelle,
    // L'enrichissement fait foi : c'est la liste que renvoie GET /evaluation/:id
    identifiantsParcelles:
      enrichmentData?.identifiantsParcelles ?? identifiantParcelle.split(",").filter(Boolean),
    retrieveUrl: results.evaluationId
      ? API_CONFIG.endpoints.evaluation.recuperer(results.evaluationId)
      : undefined,
    fiabilite: {
      note: results.fiabilite.note,
      text: results.fiabilite.text,
    },
    usagePrincipal: {
      usage: usagePrincipal.usage,
      indiceMutabilite: usagePrincipal.indiceMutabilite,
      potentiel: usagePrincipal.potentiel || "",
    },
    top3Usages: getUsagesPodium(results.resultats).map((r) => ({
      usage: r.usage,
      indiceMutabilite: r.indiceMutabilite,
      rang: r.rang,
    })),
    metadata: {
      dateAnalyse: new Date().toISOString(),
      versionAlgorithme: VERSION_ALGO,
    },
  };
}
