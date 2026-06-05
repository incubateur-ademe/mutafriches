import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as nodemailer from "nodemailer";
import { MailerService } from "./mailer.service";
import { resetAppConfig } from "../config";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
}));

describe("MailerService", () => {
  let service: MailerService;
  const envInitial = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAppConfig();
    service = new MailerService();
  });

  afterEach(() => {
    process.env = { ...envInitial };
    resetAppConfig();
  });

  it("envoie un email quand SMTP_HOST est configuré", async () => {
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_PORT = "1026";
    sendMailMock.mockResolvedValueOnce({ messageId: "1" });

    const result = await service.envoyer({
      to: "user@example.com",
      subject: "Sujet",
      html: "<p>Bonjour</p>",
    });

    expect(result.success).toBe(true);
    expect(sendMailMock).toHaveBeenCalledOnce();
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  it("ne throw pas et retourne success=false si SMTP_HOST absent", async () => {
    delete process.env.SMTP_HOST;

    const result = await service.envoyer({
      to: "user@example.com",
      subject: "Sujet",
      html: "<p>Bonjour</p>",
    });

    expect(result.success).toBe(false);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("ne throw pas si l'envoi échoue", async () => {
    process.env.SMTP_HOST = "localhost";
    sendMailMock.mockRejectedValueOnce(new Error("Connexion refusée"));

    const result = await service.envoyer({
      to: "user@example.com",
      subject: "Sujet",
      html: "<p>Bonjour</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Connexion refusée");
  });
});
