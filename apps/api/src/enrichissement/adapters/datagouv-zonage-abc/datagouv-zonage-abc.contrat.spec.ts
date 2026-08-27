import { describe, it, expect } from "vitest";
import { HttpService } from "@nestjs/axios";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { DatagouvZonageAbcService, MOTIF_COLONNE_ZONAGE } from "./datagouv-zonage-abc.service";

/**
 * Test de contrat : vérifie que le dataset data.gouv.fr expose toujours une colonne
 * de zonage reconnaissable. Le nom porte le millésime et change à chaque publication,
 * ce qui a déjà cassé silencieusement l'enrichissement.
 *
 * Appel réseau réel : exclu par défaut, à lancer avec
 * `TEST_CONTRAT_RESEAU=1 pnpm --filter api test datagouv-zonage-abc.contrat`
 */
const RESOURCE_ID = "13f7282b-8a25-43ab-9713-8bb4e476df55";
const PROFILE_URL = `https://tabular-api.data.gouv.fr/api/resources/${RESOURCE_ID}/profile/`;

interface ProfilRessource {
  profile?: { columns?: Record<string, unknown> };
}

describe.skipIf(!process.env.TEST_CONTRAT_RESEAU)("Contrat dataset Zonage ABC", () => {
  it("expose une colonne correspondant au motif de zonage", async () => {
    const response = await fetch(PROFILE_URL);
    expect(response.ok).toBe(true);

    const profil = (await response.json()) as ProfilRessource;
    const colonnes = Object.keys(profil.profile?.columns ?? {});

    expect(colonnes).toContain("CODGEO");
    expect(colonnes.some((c) => MOTIF_COLONNE_ZONAGE.test(c))).toBe(true);
  }, 20000);

  it("résout un zonage réel de bout en bout", async () => {
    const service = new DatagouvZonageAbcService(new HttpService());

    const result = await service.getZonageByCommune("75056");

    expect(result).toMatchObject({ commune: "Paris", zonage: ZonageAbcLogement.ABIS });
  }, 20000);
});
