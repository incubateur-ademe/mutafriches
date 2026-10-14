import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getEnvironment,
  isDevelopment,
  isEnvironnementNonDeclare,
  isLocal,
  isProduction,
} from "./environment.utils";

describe("environment.utils", () => {
  let nodeEnvInitial: string | undefined;

  beforeEach(() => {
    nodeEnvInitial = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (nodeEnvInitial === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = nodeEnvInitial;
    }
  });

  it("isDevelopment n'est vrai que pour NODE_ENV=development", () => {
    process.env.NODE_ENV = "development";
    expect(isDevelopment()).toBe(true);
    process.env.NODE_ENV = "production";
    expect(isDevelopment()).toBe(false);
  });

  it("un NODE_ENV absent ne vaut pas développement (pas de bypass de sécurité)", () => {
    delete process.env.NODE_ENV;
    expect(isDevelopment()).toBe(false);
    expect(isLocal()).toBe(false);
    expect(isProduction()).toBe(false);
    expect(isEnvironnementNonDeclare()).toBe(true);
    expect(getEnvironment()).toBe("development");
  });

  it("isEnvironnementNonDeclare est faux dès que NODE_ENV est posé", () => {
    process.env.NODE_ENV = "staging";
    expect(isEnvironnementNonDeclare()).toBe(false);
  });
});
