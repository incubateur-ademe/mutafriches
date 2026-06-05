import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppConfig, resetAppConfig } from "../config";
import { MailService } from "./mail.service";
import { EmailProvider, SendEmailParams } from "./mail.types";

describe("MailService", () => {
  const envInitial = { ...process.env };
  let mockProvider: { send: ReturnType<typeof vi.fn> };

  const creerService = (): MailService => {
    resetAppConfig();
    return new MailService(mockProvider as EmailProvider, new AppConfig());
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = { send: vi.fn().mockResolvedValue({ success: true, messageId: "abc" }) };
    delete process.env.EMAIL_DEV_INBOX;
  });

  afterEach(() => {
    process.env = { ...envInitial };
    resetAppConfig();
  });

  it("délègue au provider et renvoie son résultat", async () => {
    const result = await creerService().send({
      to: "user@example.com",
      subject: "Sujet",
      html: "<p>Bonjour</p>",
    });
    expect(result).toEqual({ success: true, messageId: "abc" });
    expect(mockProvider.send).toHaveBeenCalledOnce();
  });

  it("rejette un destinataire invalide sans appeler le provider", async () => {
    const result = await creerService().send({
      to: "pas-un-email",
      subject: "Sujet",
      html: "<p>x</p>",
    });
    expect(result.success).toBe(false);
    expect(mockProvider.send).not.toHaveBeenCalled();
  });

  it("génère un fallback texte depuis le HTML", async () => {
    await creerService().send({
      to: "user@example.com",
      subject: "Sujet",
      html: "<p>Bonjour <strong>Sam</strong></p>",
    });
    const params = mockProvider.send.mock.calls[0][0] as SendEmailParams;
    expect(params.text).toContain("Bonjour");
    expect(params.text).not.toContain("<strong>");
  });

  it("redirige vers EMAIL_DEV_INBOX et préfixe le sujet en staging", async () => {
    process.env.NODE_ENV = "staging";
    process.env.EMAIL_DEV_INBOX = "test@beta.gouv.fr";

    await creerService().send({
      to: "vrai-usager@example.com",
      subject: "Bienvenue",
      html: "<p>x</p>",
    });

    const params = mockProvider.send.mock.calls[0][0] as SendEmailParams;
    expect(params.to).toBe("test@beta.gouv.fr");
    expect(params.subject).toBe("[STAGING → vrai-usager@example.com] Bienvenue");
  });

  it("ne throw pas même si le provider échoue", async () => {
    mockProvider.send.mockResolvedValueOnce({ success: false, error: "boom" });
    const result = await creerService().send({
      to: "user@example.com",
      subject: "S",
      html: "<p>x</p>",
    });
    expect(result.success).toBe(false);
  });
});
