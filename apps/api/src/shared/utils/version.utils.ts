import { readFileSync } from "fs";
import { join } from "path";

// En dev: __dirname = apps/api/src/shared/utils, en prod: __dirname = apps/api/dist/src/shared/utils
const packageJsonPath = join(
  __dirname,
  __dirname.includes("dist") ? "../../../../../../package.json" : "../../../../../package.json",
);

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
  version: string;
};

export const APP_VERSION = packageJson.version;
