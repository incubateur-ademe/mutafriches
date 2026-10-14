export {
  getEnvironment,
  isProduction,
  isStaging,
  isDevelopment,
  isTest,
  isDeployed,
  isLocal,
  isEnvironnementNonDeclare,
} from "./environment.utils";
export type { Environment } from "./environment.utils";
export { APP_VERSION } from "./version.utils";
export { safeError } from "./safe-error";
export { estOrigineLocale, normaliserOrigine, normaliserOrigines } from "./origine.utils";
export { mapParLots } from "./lots.utils";
export {
  ORIGINES_MUTAFRICHES,
  ORIGINES_DASHBOARDS_ADEME,
  construireOriginesCors,
  estOrigineCorsAutorisee,
} from "./origines-autorisees";
