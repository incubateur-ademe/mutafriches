import { describe, expect, it } from "vitest";
import { CALENDRIER_RDV_CONFIG, construireParametresEmbed } from "./calendrier-rdv.config";

describe("construireParametresEmbed", () => {
  it("dérive l'origine, le script et le chemin du calendrier de l'URL de réservation", () => {
    const parametres = construireParametresEmbed(
      "https://rdv.incubateur.ademe.fr/equipe.mutafriches/45min",
    );

    expect(parametres.origine).toBe("https://rdv.incubateur.ademe.fr");
    expect(parametres.scriptUrl).toBe("https://rdv.incubateur.ademe.fr/embed/embed.js");
    expect(parametres.calLink).toBe("equipe.mutafriches/45min");
  });

  it("transmet les paramètres de l'URL à l'embed, en thème clair", () => {
    const parametres = construireParametresEmbed(
      "https://rdv.incubateur.ademe.fr/equipe.mutafriches/45min?overlayCalendar=true",
    );

    expect(parametres.config).toEqual({
      overlayCalendar: "true",
      layout: "month_view",
      theme: "light",
    });
  });

  it("ignore une barre finale dans le chemin", () => {
    const parametres = construireParametresEmbed("https://rdv.exemple.fr/equipe/30min/");

    expect(parametres.calLink).toBe("equipe/30min");
  });

  it("pointe par défaut sur l'instance de l'incubateur ADEME", () => {
    expect(new URL(CALENDRIER_RDV_CONFIG.bookingUrl).origin).toBe(
      "https://rdv.incubateur.ademe.fr",
    );
  });
});
