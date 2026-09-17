import { describe, it, expect } from "vitest";
import { normaliserOrigine, normaliserOrigines } from "./origine.utils";

describe("normaliserOrigine", () => {
  it("devrait retirer le slash final", () => {
    expect(normaliserOrigine("https://vmap-ofriches.data.arnia-bfc.fr/")).toBe(
      "https://vmap-ofriches.data.arnia-bfc.fr",
    );
  });

  it("devrait retirer plusieurs slashs finaux", () => {
    expect(normaliserOrigine("https://partenaire.fr//")).toBe("https://partenaire.fr");
  });

  it("devrait retirer les espaces autour de la valeur", () => {
    expect(normaliserOrigine("  https://partenaire.fr/  ")).toBe("https://partenaire.fr");
  });

  it("devrait ramener le schema et l'hote en casse basse", () => {
    expect(normaliserOrigine("HTTPS://Partenaire.FR")).toBe("https://partenaire.fr");
  });

  it("devrait retirer le port par defaut", () => {
    expect(normaliserOrigine("https://partenaire.fr:443")).toBe("https://partenaire.fr");
  });

  it("devrait conserver un port non standard", () => {
    expect(normaliserOrigine("https://partenaire.fr:8443/")).toBe("https://partenaire.fr:8443");
  });

  it("devrait retirer un chemin residuel", () => {
    expect(normaliserOrigine("https://partenaire.fr/app")).toBe("https://partenaire.fr");
  });

  it("devrait retourner null pour une entree vide", () => {
    expect(normaliserOrigine("")).toBeNull();
    expect(normaliserOrigine("   ")).toBeNull();
    expect(normaliserOrigine("/")).toBeNull();
  });

  it("devrait conserver la chaine nettoyee si la valeur n'est pas parsable", () => {
    expect(normaliserOrigine(" partenaire.fr/ ")).toBe("partenaire.fr");
  });

  // Une origine opaque donne la chaine "null" via new URL().origin : la renvoyer
  // autoriserait toutes les requetes portant `Origin: null` (iframes sandboxees).
  it("ne devrait jamais produire la chaine null pour une origine opaque", () => {
    expect(normaliserOrigine("file:///opt/app/")).toBe("file:///opt/app");
    expect(normaliserOrigine("data:text/plain,x")).not.toBe("null");
  });
});

describe("normaliserOrigines", () => {
  it("devrait normaliser chaque entree et ecarter les entrees vides", () => {
    expect(
      normaliserOrigines(["https://partenaire.fr/", "", " ", "/", " https://autre.fr "]),
    ).toEqual(["https://partenaire.fr", "https://autre.fr"]);
  });

  it("devrait journaliser uniquement les entrees reecrites", () => {
    const messages: string[] = [];
    const logger = { log: (message: string) => messages.push(message) };

    normaliserOrigines(
      ["https://partenaire.fr", "https://autre.fr/"],
      logger as unknown as Parameters<typeof normaliserOrigines>[1],
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("https://autre.fr");
  });

  it("devrait fonctionner sans logger", () => {
    expect(normaliserOrigines(["https://partenaire.fr/"])).toEqual(["https://partenaire.fr"]);
  });
});
