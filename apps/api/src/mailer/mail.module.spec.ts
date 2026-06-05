import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppConfig, resetAppConfig } from "../config";
import { createEmailProvider } from "./mail.module";
import { SmtpProvider } from "./providers/smtp.provider";
import { BrevoProvider } from "./providers/brevo.provider";

describe("createEmailProvider (bascule de transport)", () => {
  const envInitial = { ...process.env };

  const provider = () => {
    resetAppConfig();
    return createEmailProvider(new AppConfig());
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BREVO_API_KEY;
  });

  afterEach(() => {
    process.env = { ...envInitial };
    resetAppConfig();
  });

  it("utilise SMTP (MailHog) en développement même avec une clé Brevo", () => {
    process.env.NODE_ENV = "development";
    process.env.BREVO_API_KEY = "cle-test";
    expect(provider()).toBeInstanceOf(SmtpProvider);
  });

  it("utilise Brevo en staging quand la clé est présente", () => {
    process.env.NODE_ENV = "staging";
    process.env.BREVO_API_KEY = "cle-test";
    expect(provider()).toBeInstanceOf(BrevoProvider);
  });

  it("retombe sur SMTP en staging si la clé Brevo est absente", () => {
    process.env.NODE_ENV = "staging";
    delete process.env.BREVO_API_KEY;
    expect(provider()).toBeInstanceOf(SmtpProvider);
  });

  it("retombe sur SMTP en staging si la clé Brevo est vide ou composée d'espaces", () => {
    process.env.NODE_ENV = "staging";
    process.env.BREVO_API_KEY = "   ";
    expect(provider()).toBeInstanceOf(SmtpProvider);
  });
});
