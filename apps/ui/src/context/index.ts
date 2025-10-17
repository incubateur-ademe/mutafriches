// Ce fichier sera supprimé une fois la migration terminée
// Les imports doivent maintenant se faire directement depuis les features ou shared

// FormContext est maintenant dans features/donnees-complementaires/context/
export { FormContext } from "../features/donnees-complementaires/context/FormContext";
export * from "../features/donnees-complementaires/context/FormProvider";
export * from "../features/donnees-complementaires/context/useFormContext";
export * from "../features/donnees-complementaires/context/FormContext.types";

// IframeContext est maintenant dans shared/context/iframe/
export { IframeProvider } from "../shared/context/iframe/IframeProvider";
export {
  useIframe,
  useIsIframeMode,
  useIframeCallback,
  useIntegrator,
} from "../shared/context/iframe/useIframe";
export type {
  IframeContextValue,
  IntegratorConfig,
} from "../shared/context/iframe/IframeContext.types";
export { INTEGRATORS } from "../shared/context/iframe/IframeContext.constants";
