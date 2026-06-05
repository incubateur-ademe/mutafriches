import { describe, it, expect } from "vitest";
import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  it("accepte un environnement vide (toutes les variables sont optionnelles)", () => {
    expect(() => validateEnvironment({})).not.toThrow();
  });

  it("accepte des valeurs valides", () => {
    const result = validateEnvironment({
      NODE_ENV: "production",
      PORT: "3000",
      MAIL_SENDER_EMAIL: "contact@example.com",
      SMTP_SECURE: "false",
    });
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe("production");
  });

  it("rejette un PORT non numérique", () => {
    expect(() => validateEnvironment({ PORT: "abc" })).toThrow(/PORT/);
  });

  it("rejette un NODE_ENV inconnu", () => {
    expect(() => validateEnvironment({ NODE_ENV: "prod" })).toThrow(/NODE_ENV/);
  });

  it("rejette un email expéditeur invalide", () => {
    expect(() => validateEnvironment({ MAIL_SENDER_EMAIL: "pas-un-email" })).toThrow(
      /MAIL_SENDER_EMAIL/,
    );
  });

  it("rejette un SMTP_SECURE hors true/false", () => {
    expect(() => validateEnvironment({ SMTP_SECURE: "oui" })).toThrow(/SMTP_SECURE/);
  });
});
