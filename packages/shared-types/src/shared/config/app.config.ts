import * as fs from "fs";
import * as path from "path";

interface PackageJson {
  version: string;
  name: string;
  versionAlgo?: string;
}

/**
 * Charge la configuration de l'application depuis le package.json racine.
 * Utilise une lecture dynamique pour garantir le bon chemin en production.
 */
function loadAppConfig() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;

  return {
    version: packageJson.version,
    name: packageJson.name,
    versionAlgo: "1.1",
  } as const;
}

export const APP_CONFIG = loadAppConfig();
