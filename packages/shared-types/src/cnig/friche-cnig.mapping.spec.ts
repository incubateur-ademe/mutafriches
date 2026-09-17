import { describe, expect, it } from "vitest";
import { ZonageReglementaire } from "../enrichissement/enums/zonage-reglementaire.enum";
import { ZoneAccelerationEnr } from "../enrichissement/enums/zone-acceleration-enr.enum";
import { EtatBatiInfrastructure } from "../evaluation/enums/etat-bati.enum";
import { PresencePollution } from "../evaluation/enums/presence-pollution.enum";
import { TypeProprietaire } from "../evaluation/enums/type-proprietaire.enum";
import { ValeurArchitecturale } from "../evaluation/enums/valeur-architecturale.enum";
import {
  batiEtatCnig,
  batiPatrimoineCnig,
  batiPollutionCnig,
  dateCnig,
  proprioPersonneCnig,
  siteIdCnig,
  solPollutionExisteCnig,
  urbaDocTypeCnig,
  urbaZaerCnig,
  urbaZoneTypeCnig,
} from "./friche-cnig.mapping";
import { geometrieVersWkt, pointWkt } from "./friche-cnig.wkt";

describe("Correspondances CNIG", () => {
  it("compose le site_id au format <INSEE>_<IdentifiantTechnique>", () => {
    expect(siteIdCnig("49020", "49020000AK0118")).toBe("49020_49020000AK0118");
  });

  it("code les dates en ISO 8601 étendu", () => {
    expect(dateCnig(new Date("2026-09-17T14:32:00Z"))).toBe("2026-09-17");
  });

  describe("bati_etat", () => {
    it("regroupe dégradation inexistante et faible", () => {
      expect(batiEtatCnig(EtatBatiInfrastructure.DEGRADATION_INEXISTANTE)).toBe(
        "dégradation inexistante ou faible",
      );
      expect(batiEtatCnig(EtatBatiInfrastructure.DEGRADATION_FAIBLE)).toBe(
        "dégradation inexistante ou faible",
      );
    });

    it("traduit l'absence de bâti par « sans objet »", () => {
      expect(batiEtatCnig(EtatBatiInfrastructure.PAS_DE_BATI)).toBe("sans objet");
    });

    it("retourne « inconnu » sans saisie ou sur « ne sait pas »", () => {
      expect(batiEtatCnig()).toBe("inconnu");
      expect(batiEtatCnig(EtatBatiInfrastructure.NE_SAIT_PAS)).toBe("inconnu");
    });
  });

  describe("bati_patrimoine", () => {
    it("ne retient que l'intérêt remarquable comme bâtiment d'intérêt", () => {
      expect(batiPatrimoineCnig(ValeurArchitecturale.INTERET_REMARQUABLE)).toBe(
        "présence d'un bâtiment d'intérêt",
      );
      expect(batiPatrimoineCnig(ValeurArchitecturale.ORDINAIRE)).toBe("aucun");
      expect(batiPatrimoineCnig(ValeurArchitecturale.SANS_INTERET)).toBe("aucun");
    });
  });

  describe("pollution", () => {
    it("ne déduit l'amiante du bâti que d'une réponse amiante", () => {
      expect(batiPollutionCnig(PresencePollution.OUI_AMIANTE)).toBe("amiante");
      expect(batiPollutionCnig(PresencePollution.OUI_AUTRES_COMPOSES)).toBe("inconnu");
    });

    it("traduit la saisie utilisateur en existence de pollution du sol", () => {
      expect(solPollutionExisteCnig(PresencePollution.NON)).toBe("pollution inexistante");
      expect(solPollutionExisteCnig(PresencePollution.DEJA_GEREE)).toBe("pollution traitée");
      expect(solPollutionExisteCnig(PresencePollution.OUI_COMPOSES_VOLATILS)).toBe(
        "pollution avérée",
      );
    });

    it("se rabat sur le référencement ADEME à défaut de saisie", () => {
      expect(solPollutionExisteCnig(undefined, true)).toBe("pollution supposée");
      expect(solPollutionExisteCnig(PresencePollution.NE_SAIT_PAS, true)).toBe(
        "pollution supposée",
      );
      expect(solPollutionExisteCnig(undefined, false)).toBe("inconnu");
    });

    it("laisse la saisie utilisateur primer sur le référencement ADEME", () => {
      expect(solPollutionExisteCnig(PresencePollution.NON, true)).toBe("pollution inexistante");
    });
  });

  describe("proprio_personne", () => {
    it("ne conclut « personne morale » que pour un propriétaire public", () => {
      expect(proprioPersonneCnig(TypeProprietaire.PUBLIC)).toBe("personne morale");
      expect(proprioPersonneCnig(TypeProprietaire.PRIVE)).toBe("inconnu");
      expect(proprioPersonneCnig(TypeProprietaire.MIXTE)).toBe("inconnu");
      expect(proprioPersonneCnig(TypeProprietaire.COPRO_INDIVISION)).toBe("inconnu");
    });
  });

  describe("urba_zaer", () => {
    it("classe une zone d'exclusion APER en « non »", () => {
      expect(urbaZaerCnig(ZoneAccelerationEnr.EXCLUSION)).toBe("non");
      expect(urbaZaerCnig(ZoneAccelerationEnr.NON)).toBe("non");
    });

    it("classe les zones d'accélération en « oui »", () => {
      expect(urbaZaerCnig(ZoneAccelerationEnr.OUI)).toBe("oui");
      expect(urbaZaerCnig(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE)).toBe("oui");
    });

    it("retourne « inconnu » quand l'enrichissement ZAER a échoué", () => {
      expect(urbaZaerCnig()).toBe("inconnu");
    });
  });

  describe("urba_zone_type", () => {
    it("ramène les sous-types de zone urbaine sur U", () => {
      expect(urbaZoneTypeCnig(ZonageReglementaire.ZONE_URBAINE_U_HABITAT)).toBe("U");
      expect(urbaZoneTypeCnig(ZonageReglementaire.ZONE_URBAINE_U_ACTIVITE)).toBe("U");
      expect(urbaZoneTypeCnig(ZonageReglementaire.ZONE_VOCATION_ACTIVITES)).toBe("U");
    });

    it("mappe les secteurs de carte communale et le RNU", () => {
      expect(urbaZoneTypeCnig(ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION)).toBe("Zc");
      expect(urbaZoneTypeCnig(ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION)).toBe(
        "ZnC",
      );
      expect(urbaZoneTypeCnig(ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME)).toBe("RNU");
    });

    it("n'arbitre pas entre AUc et AUs", () => {
      expect(urbaZoneTypeCnig(ZonageReglementaire.ZONE_A_URBANISER_AU)).toBe("inconnu");
    });
  });

  describe("urba_doc_type", () => {
    it("ne déduit le document que pour la carte communale et le RNU", () => {
      expect(urbaDocTypeCnig(ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION)).toBe("CC");
      expect(urbaDocTypeCnig(ZonageReglementaire.SECTEUR_REGLEMENT_URBANISME)).toBe("RNU");
      expect(urbaDocTypeCnig(ZonageReglementaire.ZONE_URBAINE_U)).toBe("inconnu");
    });
  });
});

describe("Géométries WKT", () => {
  it("écrit le point en latitude puis longitude, comme le fichier de référence CNIG", () => {
    expect(pointWkt({ latitude: 49.2527, longitude: 3.9815 })).toBe("POINT(49.2527 3.9815)");
  });

  it("arrondit à six décimales", () => {
    expect(pointWkt({ latitude: 47.123456789, longitude: -0.987654321 })).toBe(
      "POINT(47.123457 -0.987654)",
    );
  });

  it("rejette des coordonnées non finies", () => {
    expect(pointWkt({ latitude: Number.NaN, longitude: 3 })).toBeNull();
  });

  it("convertit un polygone GeoJSON en inversant l'ordre des coordonnées", () => {
    const wkt = geometrieVersWkt({
      type: "Polygon",
      coordinates: [
        [
          [3.95, 49.33],
          [3.89, 49.38],
          [3.96, 49.42],
          [3.95, 49.33],
        ],
      ],
    });
    expect(wkt).toBe("POLYGON((49.33 3.95, 49.38 3.89, 49.42 3.96, 49.33 3.95))");
  });

  it("convertit un multipolygone", () => {
    const anneau = [
      [3.95, 49.33],
      [3.89, 49.38],
      [3.96, 49.42],
      [3.95, 49.33],
    ];
    expect(geometrieVersWkt({ type: "MultiPolygon", coordinates: [[anneau], [anneau]] })).toBe(
      "MULTIPOLYGON(((49.33 3.95, 49.38 3.89, 49.42 3.96, 49.33 3.95)), " +
        "((49.33 3.95, 49.38 3.89, 49.42 3.96, 49.33 3.95)))",
    );
  });

  it("referme un anneau que la source a laissé ouvert", () => {
    const wkt = geometrieVersWkt({
      type: "Polygon",
      coordinates: [
        [
          [3.95, 49.33],
          [3.89, 49.38],
          [3.96, 49.42],
        ],
      ],
    });
    expect(wkt).toBe("POLYGON((49.33 3.95, 49.38 3.89, 49.42 3.96, 49.33 3.95))");
  });

  it("rejette l'emprise entière si une position est invalide, plutôt que de la déformer", () => {
    const wkt = geometrieVersWkt({
      type: "Polygon",
      coordinates: [
        [
          [3.95, 49.33],
          [Number.NaN, 49.38],
          [3.96, 49.42],
          [3.9, 49.4],
          [3.95, 49.33],
        ],
      ],
    });
    expect(wkt).toBeNull();
  });

  it("rejette un polygone dont un trou est invalide, pour ne pas publier ses seuls trous", () => {
    const contour = [
      [3.95, 49.33],
      [3.89, 49.38],
      [3.96, 49.42],
      [3.95, 49.33],
    ];
    const trouInvalide = [
      [3.93, 49.35],
      [3.92, 49.36],
    ];
    expect(geometrieVersWkt({ type: "Polygon", coordinates: [contour, trouInvalide] })).toBeNull();
  });

  it("ignore un anneau qui ne ferme pas une surface", () => {
    expect(
      geometrieVersWkt({
        type: "Polygon",
        coordinates: [
          [
            [3.95, 49.33],
            [3.89, 49.38],
          ],
        ],
      }),
    ).toBeNull();
  });

  it("retourne null sans géométrie", () => {
    expect(geometrieVersWkt()).toBeNull();
  });
});
