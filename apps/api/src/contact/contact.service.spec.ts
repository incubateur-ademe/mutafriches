import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BesoinMultisites } from "@mutafriches/shared-types";
import { ContactService } from "./contact.service";
import { resetAppConfig } from "../config";

describe("ContactService", () => {
  let service: ContactService;
  const envInitial = { ...process.env };

  const mockRepository = {
    enregistrerDemande: vi.fn().mockResolvedValue(undefined),
    marquerMailConfirmationEnvoye: vi.fn().mockResolvedValue(undefined),
  };

  const mockMailer = {
    send: vi.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAppConfig();
    service = new ContactService(mockRepository as never, mockMailer as never);
  });

  afterEach(() => {
    process.env = { ...envInitial };
    resetAppConfig();
  });

  it("persiste la demande et envoie confirmation + notification", async () => {
    process.env.CONTACT_NOTIFICATION_EMAIL = "equipe@example.com";

    await service.traiterDemande({
      email: "user@example.com",
      besoin: BesoinMultisites.SUIVI_COMPARAISON,
      evaluationId: "eval-1",
    });

    expect(mockRepository.enregistrerDemande).toHaveBeenCalledOnce();
    // Notification equipe + confirmation utilisateur
    expect(mockMailer.send).toHaveBeenCalledTimes(2);
    const destinataires = mockMailer.send.mock.calls.map((c) => c[0].to);
    expect(destinataires).toContain("equipe@example.com");
    expect(destinataires).toContain("user@example.com");
    expect(mockRepository.marquerMailConfirmationEnvoye).toHaveBeenCalledOnce();
  });

  it("ignore une demande avec email invalide", async () => {
    await service.traiterDemande({
      email: "pas-un-email",
      besoin: BesoinMultisites.SUIVI_COMPARAISON,
    });

    expect(mockRepository.enregistrerDemande).not.toHaveBeenCalled();
    expect(mockMailer.send).not.toHaveBeenCalled();
  });

  it("ignore une demande avec besoin invalide", async () => {
    await service.traiterDemande({
      email: "user@example.com",
      besoin: "besoin-inconnu",
    });

    expect(mockRepository.enregistrerDemande).not.toHaveBeenCalled();
  });

  it("n'envoie pas la notification équipe si CONTACT_NOTIFICATION_EMAIL absent", async () => {
    delete process.env.CONTACT_NOTIFICATION_EMAIL;

    await service.traiterDemande({
      email: "user@example.com",
      besoin: BesoinMultisites.INTEGRATION_OUTILS,
    });

    // Seulement la confirmation utilisateur
    expect(mockMailer.send).toHaveBeenCalledOnce();
    expect(mockMailer.send.mock.calls[0][0].to).toBe("user@example.com");
  });
});
