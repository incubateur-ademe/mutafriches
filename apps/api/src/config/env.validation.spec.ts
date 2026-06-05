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

  describe("garde-fou EMAIL_DEV_INBOX", () => {
    it("accepte une boîte de test sur un domaine autorisé hors production", () => {
      expect(() =>
        validateEnvironment({ NODE_ENV: "staging", EMAIL_DEV_INBOX: "test@beta.gouv.fr" }),
      ).not.toThrow();
    });

    it("interdit EMAIL_DEV_INBOX en production", () => {
      expect(() =>
        validateEnvironment({ NODE_ENV: "production", EMAIL_DEV_INBOX: "test@beta.gouv.fr" }),
      ).toThrow(/production/);
    });

    it("rejette un domaine non autorisé", () => {
      expect(() =>
        validateEnvironment({ NODE_ENV: "staging", EMAIL_DEV_INBOX: "test@gmail.com" }),
      ).toThrow(/domaine/i);
    });
  });
});
