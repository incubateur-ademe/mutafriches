/**
 * Exemples de payloads pour `POST /evaluation/calculer`.
 * Référencés depuis l'`@ApiBody` du controller pour le bouton "Try it out" de Swagger UI.
 *
 * Les `donneesEnrichies` sont le résultat typique d'un appel préalable à `POST /enrichissement`.
 * Les `donneesComplementaires` sont les 8 champs saisis manuellement par l'utilisateur.
 */

const DONNEES_ENRICHIES_BESANCON = {
  identifiantParcelle: "25056000HZ0346",
  codeInsee: "25056",
  commune: "Besançon",
  coordonnees: { latitude: 47.2378, longitude: 6.0241 },
  surfaceSite: 42780,
  surfaceBati: 6600,
  siteEnCentreVille: true,
  distanceAutoroute: 1500,
  distanceTransportCommun: 250,
  proximiteCommercesServices: true,
  distanceRaccordementElectrique: 300,
  tauxLogementsVacants: 4.9,
  presenceRisquesTechnologiques: false,
  risqueRetraitGonflementArgile: "faible-ou-moyen",
  risqueCavitesSouterraines: "non",
  risqueInondation: "non",
  zonageReglementaire: "zone-urbaine-u",
  zonageEnvironnemental: "hors-zone",
  zonagePatrimonial: "non-concerne",
  trameVerteEtBleue: "hors-trame",
  zoneAccelerationEnr: "non",
  sourcesUtilisees: ["Cadastre", "BDNB", "GeoRisques-RGA", "Enedis-Raccordement", "Lovac"],
  sourcesEchouees: [],
  champsManquants: [],
  siteReferencePollue: false,
};

export const CALCULER_MUTABILITE_BODY_EXAMPLES = {
  nominal: {
    summary: "Cas nominal — toutes les données complémentaires renseignées",
    description:
      "Appel typique avec un enrichissement complet et des données complémentaires entièrement renseignées par l'utilisateur. Indice de fiabilité maximal attendu.",
    value: {
      donneesEnrichies: DONNEES_ENRICHIES_BESANCON,
      donneesComplementaires: {
        typeProprietaire: "prive",
        raccordementEau: "oui",
        etatBatiInfrastructure: "degradation-heterogene",
        presencePollution: "non",
        valeurArchitecturaleHistorique: "interet-remarquable",
        qualitePaysage: "interet-remarquable",
        qualiteVoieDesserte: "accessible",
        trameVerteEtBleue: "hors-trame",
        presenceEspecesProtegees: "non",
        presenceZoneHumide: "non",
      },
    },
  },
  avecNeSaitPas: {
    summary: "Avec réponses `ne-sait-pas` — fiabilité dégradée",
    description:
      "L'utilisateur n'a pas pu répondre à certaines questions. Les champs `ne-sait-pas` ne contribuent ni aux avantages ni aux contraintes, et font baisser l'indice de fiabilité. **Aucune mise en cache** dans ce cas (résultat partiel).",
    value: {
      donneesEnrichies: DONNEES_ENRICHIES_BESANCON,
      donneesComplementaires: {
        typeProprietaire: "prive",
        raccordementEau: "ne-sait-pas",
        etatBatiInfrastructure: "degradation-heterogene",
        presencePollution: "ne-sait-pas",
        valeurArchitecturaleHistorique: "ne-sait-pas",
        qualitePaysage: "interet-remarquable",
        qualiteVoieDesserte: "accessible",
        trameVerteEtBleue: "hors-trame",
        presenceEspecesProtegees: "ne-sait-pas",
        presenceZoneHumide: "ne-sait-pas",
      },
    },
  },
  sansEnrichissement: {
    summary: "Mode `?sansEnrichissement=true` — données fournies par l'intégrateur",
    description:
      "À utiliser quand l'intégrateur dispose déjà des données enrichies (typiquement après un appel séparé à `POST /enrichissement` mis en cache de son côté). Permet de re-calculer la mutabilité sans relancer toutes les APIs externes.",
    value: {
      donneesEnrichies: DONNEES_ENRICHIES_BESANCON,
      donneesComplementaires: {
        typeProprietaire: "public",
        raccordementEau: "oui",
        etatBatiInfrastructure: "degradation-faible",
        presencePollution: "demontree-traitee",
        valeurArchitecturaleHistorique: "sans-interet",
        qualitePaysage: "ordinaire",
        qualiteVoieDesserte: "peu-accessible",
        trameVerteEtBleue: "corridor-ecologique",
        presenceEspecesProtegees: "non",
        presenceZoneHumide: "non",
      },
    },
  },
} as const;
