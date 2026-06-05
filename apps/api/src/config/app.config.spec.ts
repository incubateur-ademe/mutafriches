import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppConfig } from "./app.config";

describe("AppConfig", () => {
  const envInitial = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...envInitial };
  });

  it("expose les valeurs par défaut de la base locale", () => {
    delete process.env.SCALINGO_POSTGRESQL_URL;
    delete process.env.DB_HOST;
    const config = new AppConfig();
    expect(config.database.host).toBe("localhost");
    expect(config.database.port).toBe(5432);
    expect(config.database.user).toBe("mutafriches_user");
  });

  it("parse SCALINGO_POSTGRESQL_URL en priorité", () => {
    process.env.SCALINGO_POSTGRESQL_URL = "postgres://u:p@dbhost:6000/mabase";
    const config = new AppConfig();
    expect(config.database.host).toBe("dbhost");
    expect(config.database.port).toBe(6000);
    expect(config.database.user).toBe("u");
    expect(config.database.database).toBe("mabase");
    expect(config.database.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("applique les valeurs par défaut du mail et du dashboard", () => {
    delete process.env.MAIL_SENDER_EMAIL;
    delete process.env.CONTACT_DASHBOARD_URL;
    const config = new AppConfig();
    expect(config.mail.senderEmail).toBe("contact@mutafriches.beta.gouv.fr");
    expect(config.mail.dashboardUrl).toContain("/dashboard/10-demandes-de-contact");
  });

  it("convertit SMTP_SECURE en booléen", () => {
    process.env.SMTP_SECURE = "true";
    expect(new AppConfig().mail.smtpSecure).toBe(true);
    process.env.SMTP_SECURE = "false";
    expect(new AppConfig().mail.smtpSecure).toBe(false);
  });

  it("throw au constructeur si une variable est invalide", () => {
    process.env.PORT = "pas-un-nombre";
    expect(() => new AppConfig()).toThrow(/PORT/);
  });
});
