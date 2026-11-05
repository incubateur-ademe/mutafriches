import { MAX_PARCELLES_PAR_SITE_API } from "@mutafriches/shared-types";

export function DocumentationApi() {
  return (
    <div>
      <div className="fr-callout fr-callout--blue-ecume fr-mb-4w">
        <h3 className="fr-callout__title">Intégration personnalisée</h3>
        <p className="fr-callout__text">
          L'API REST vous permet de créer votre propre interface utilisateur et d'intégrer
          Mutafriches dans vos processus métier.
        </p>
      </div>

      <h2 className="fr-h3 fr-mt-6w">Identification du partenaire</h2>
      <p>
        L'API ne nécessite <strong>ni clé ni token</strong>. Les appels d'écriture{" "}
        <code>(POST)</code> sont autorisés selon l'en-tête HTTP <code>Origin</code> (ou{" "}
        <code>Referer</code> en repli) : votre domaine doit figurer dans la liste autorisée par
        l'équipe Mutafriches, sinon la requête est rejetée (<code>403</code>). Cette origine sert
        aussi à reconnaître vos appels dans nos statistiques : aucun identifiant supplémentaire
        n'est à transmettre. Les lectures <code>(GET)</code> sont ouvertes, sans en-tête{" "}
        <code>Origin</code>.
      </p>

      <p className="fr-text--sm">
        Les navigateurs envoient automatiquement l'en-tête <code>Origin</code>. Pour des appels
        <strong> serveur à serveur</strong>, transmettez-le explicitement avec un domaine autorisé.
      </p>

      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json
Origin: https://mon-service.gouv.fr

{
  "identifiant": "49353000AV0202"
}`}</code>
        </pre>
      </div>

      <div className="fr-callout fr-callout--brown-caramel fr-mt-2w">
        <h3 className="fr-callout__title">Faire autoriser votre domaine</h3>
        <p className="fr-callout__text">
          Pour faire ajouter votre domaine à la liste autorisée, contactez l'équipe Mutafriches
          (voir en bas de page). Sans cette étape, vos appels en production seront refusés.
        </p>
      </div>

      <h2 className="fr-h3 fr-mt-6w">Démarrage rapide</h2>

      <fieldset
        className="fr-fieldset fr-mb-4w"
        id="checklist-api"
        aria-labelledby="checklist-api-legend"
      >
        <legend
          className="fr-fieldset__legend--regular fr-fieldset__legend"
          id="checklist-api-legend"
        >
          Checklist d'intégration
        </legend>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-api-doc"
              id="check-api-doc"
              type="checkbox"
              aria-describedby="check-api-doc-messages"
            />
            <label className="fr-label" htmlFor="check-api-doc">
              Consulter la documentation Swagger
            </label>
            <div className="fr-messages-group" id="check-api-doc-messages" aria-live="polite"></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-api-enrich"
              id="check-api-enrich"
              type="checkbox"
              aria-describedby="check-api-enrich-messages"
            />
            <label className="fr-label" htmlFor="check-api-enrich">
              Tester l'enrichissement d'un site (POST /enrichissement)
            </label>
            <div
              className="fr-messages-group"
              id="check-api-enrich-messages"
              aria-live="polite"
            ></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-api-eval"
              id="check-api-eval"
              type="checkbox"
              aria-describedby="check-api-eval-messages"
            />
            <label className="fr-label" htmlFor="check-api-eval">
              Tester le calcul de mutabilité (POST /evaluation/calculer)
            </label>
            <div
              className="fr-messages-group"
              id="check-api-eval-messages"
              aria-live="polite"
            ></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-api-get"
              id="check-api-get"
              type="checkbox"
              aria-describedby="check-api-get-messages"
            />
            <label className="fr-label" htmlFor="check-api-get">
              Récupérer une évaluation (GET /evaluation/:id)
            </label>
            <div className="fr-messages-group" id="check-api-get-messages" aria-live="polite"></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-api-contact"
              id="check-api-contact"
              type="checkbox"
              aria-describedby="check-api-contact-messages"
            />
            <label className="fr-label" htmlFor="check-api-contact">
              Contacter l'équipe pour la mise en production
            </label>
            <div
              className="fr-messages-group"
              id="check-api-contact-messages"
              aria-live="polite"
            ></div>
          </div>
        </div>
      </fieldset>

      <h3 className="fr-h5 fr-mt-4w">Endpoints principaux</h3>
      <div className="fr-table fr-table--bordered">
        <table>
          <thead>
            <tr>
              <th>Méthode</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="fr-badge fr-badge--success fr-badge--sm">POST</span>
              </td>
              <td>
                <code>/enrichissement</code>
              </td>
              <td>
                Enrichir les données d'un site (mono ou multi-parcelle, 1 à{" "}
                {MAX_PARCELLES_PAR_SITE_API})
              </td>
            </tr>
            <tr>
              <td>
                <span className="fr-badge fr-badge--success fr-badge--sm">POST</span>
              </td>
              <td>
                <code>/evaluation/calculer</code>
              </td>
              <td>Calculer les indices de mutabilité</td>
            </tr>
            <tr>
              <td>
                <span className="fr-badge fr-badge--info fr-badge--sm">GET</span>
              </td>
              <td>
                <code>/evaluation/:id</code>
              </td>
              <td>Récupérer une évaluation complète</td>
            </tr>
            <tr>
              <td>
                <span className="fr-badge fr-badge--info fr-badge--sm">GET</span>
              </td>
              <td>
                <code>/evaluation/metadata</code>
              </td>
              <td>Récupérer les métadonnées (enums, versions)</td>
            </tr>
            <tr>
              <td>
                <span className="fr-badge fr-badge--info fr-badge--sm">GET</span>
              </td>
              <td>
                <code>/api/attributaire/sites?codeInsee=</code>
              </td>
              <td>
                Lister les sites déjà analysés d'une commune, avec leurs critères et leur mutabilité
                (JSON ou GeoJSON)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="fr-h5 fr-mt-4w">Flux d'intégration</h3>
      <div className="fr-stepper">
        <h3 className="fr-stepper__title">
          <span className="fr-stepper__state">Étape 1 sur 3</span>
          Enrichissement du site
        </h3>
        <div className="fr-stepper__steps" data-fr-current-step="1" data-fr-steps="3"></div>
        <p className="fr-stepper__details">
          Appelez <code>POST /enrichissement</code> avec un ou plusieurs identifiants cadastraux (1
          à {MAX_PARCELLES_PAR_SITE_API}) pour récupérer les données automatiques.
        </p>
      </div>

      <div className="fr-stepper fr-mt-2w">
        <h3 className="fr-stepper__title">
          <span className="fr-stepper__state">Étape 2 sur 3</span>
          Collecte des données complémentaires
        </h3>
        <div className="fr-stepper__steps" data-fr-current-step="2" data-fr-steps="3"></div>
        <p className="fr-stepper__details">
          Demandez à l'utilisateur de renseigner les données non enrichies automatiquement (type de
          propriétaire, état du bâti, etc.).
        </p>
      </div>

      <div className="fr-stepper fr-mt-2w">
        <h3 className="fr-stepper__title">
          <span className="fr-stepper__state">Étape 3 sur 3</span>
          Calcul de la mutabilité
        </h3>
        <div className="fr-stepper__steps" data-fr-current-step="3" data-fr-steps="3"></div>
        <p className="fr-stepper__details">
          Appelez <code>POST /evaluation/calculer</code> avec les données enrichies et
          complémentaires pour obtenir les résultats.
        </p>
      </div>

      <h3 className="fr-h5 fr-mt-6w">Exemples de requêtes</h3>

      <h4 className="fr-h6 fr-mt-4w">1. Enrichissement d'un site</h4>

      <p className="fr-text--sm fr-mb-1w">
        <strong>Mono-parcelle</strong> (rétro-compatible) :
      </p>
      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json

{
  "identifiant": "49353000AV0202"
}`}</code>
        </pre>
      </div>

      <p className="fr-text--sm fr-mb-1w fr-mt-2w">
        <strong>Multi-parcelle</strong> (1 à {MAX_PARCELLES_PAR_SITE_API} parcelles) :
      </p>
      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json

{
  "identifiants": ["49353000AV0202", "49353000AV0203"]
}`}</code>
        </pre>
      </div>

      <p className="fr-text--sm fr-mb-1w fr-mt-2w">
        <strong>Réponse</strong> (multi-parcelle) :
      </p>
      <div className="fr-highlight">
        <pre>
          <code>{`{
  "identifiantParcelle": "49353000AV0202,49353000AV0203",
  "identifiantsParcelles": ["49353000AV0202", "49353000AV0203"],
  "nombreParcelles": 2,
  "parcellePredominante": "49353000AV0203",
  "communePredominante": "Trélazé",
  "codeInsee": "49353",
  "commune": "Trélazé",
  "coordonnees": { "latitude": 47.4457, "longitude": -0.473 },
  "geometrie": { /* polygone GeoJSON du site */ },
  "surfaceSite": 1449,
  "surfaceBati": 297,
  "siteEnCentreVille": true,
  "distanceAutoroute": 2841,
  "distanceTransportCommun": 122,
  "proximiteCommercesServices": true,
  "distanceIte": "plus-1km",
  "distanceIteMetres": 1130,
  "distanceRaccordementElectrique": 23.25,
  "distanceReseauChaleur": 638,
  "tauxLogementsVacants": 5.1,
  "zonageAbcLogement": "b1",
  "risqueRetraitGonflementArgile": "faible-ou-moyen",
  "risqueCavitesSouterraines": "oui",
  "risqueInondation": "oui",
  "presenceRisquesTechnologiques": true,
  "siteReferencePollue": true,
  "zonageReglementaire": "zone-urbaine-u-habitat",
  "zonageEnvironnemental": "hors-zone",
  "zonagePatrimonial": "non-concerne",
  "zoneAccelerationEnr": "oui",
  "zaer": {
    "enZoneZaer": true,
    "enZoneExclusion": false,
    "nombreZones": 4,
    "filieres": ["SOLAIRE_PV", "GEOTHERMIE", "SOLAIRE_THERMIQUE"],
    "zones": [ /* détail par zone */ ]
  },
  "siteEnQpv": false,
  "saturationReseauEnr": false,
  "siteEnZae": false,
  "ilotChaleurUrbain": "non-couvert",
  "intensiteIlotChaleurC": null,
  "sourcesUtilisees": ["Cadastre", "BDNB", "Enedis-Raccordement", /* ... */],
  "sourcesEchouees": [],
  "champsManquants": []
}`}</code>
        </pre>
      </div>

      <h4 className="fr-h6 fr-mt-4w">2. Calcul de la mutabilité</h4>

      <div className="fr-alert fr-alert--info fr-alert--sm fr-mb-2w">
        <p>
          Les <strong>9 champs</strong> de <code>donneesComplementaires</code> ci-dessous sont tous
          obligatoires. Pour une information non connue, envoyer la valeur{" "}
          <code>&quot;ne-sait-pas&quot;</code> — jamais <code>null</code>, une chaîne vide ou une
          clé absente. Le raccordement à l&apos;eau n&apos;est plus à transmettre : il est déduit de
          la surface bâtie côté serveur.
        </p>
      </div>

      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/evaluation/calculer
Content-Type: application/json

{
  "donneesEnrichies": { /* réponse complète de l'étape 1, renvoyée telle quelle */ },
  "donneesComplementaires": {
    "typeProprietaire": "prive",
    "etatBatiInfrastructure": "degradation-heterogene",
    "presencePollution": "ne-sait-pas",
    "valeurArchitecturaleHistorique": "interet-remarquable",
    "qualitePaysage": "ordinaire",
    "qualiteVoieDesserte": "accessible",
    "trameVerteEtBleue": "hors-trame",
    "presenceEspecesProtegees": "non",
    "presenceZoneHumide": "non"
  }
}

// Réponse
{
  "fiabilite": {
    "note": 8.5,
    "text": "Très fiable"
  },
  "resultats": [
    {
      "rang": 1,
      "usage": "residentiel",
      "indiceMutabilite": 68,
      "potentiel": "Très bon",
      "exclu": false
    },
    /* ... */
    {
      "rang": 7,
      "usage": "photovoltaique",
      "indiceMutabilite": 58,
      "potentiel": "Exclu",
      "exclu": true,
      "criteresExcluants": ["zoneAccelerationEnr"]
    }
  ],
  "evaluationId": "eval-uuid"
}`}</code>
        </pre>
      </div>
      <p className="fr-mt-2w">
        Un usage rendu impossible par une caractéristique du site (zone d'exclusion des EnR, zone
        humide avec espèces protégées) porte <code>exclu: true</code> et la liste des{" "}
        <code>criteresExcluants</code>. Il est relégué en fin de classement : son indice reste
        renseigné mais n'est pas comparable à celui des autres usages.
      </p>

      <h4 className="fr-h6 fr-mt-4w">3. Récupération d'une évaluation</h4>
      <div className="fr-highlight">
        <pre>
          <code>{`GET https://mutafriches.beta.gouv.fr/evaluation/{id}

// Réponse
{
  "id": "eval-uuid",
  "identifiantParcelle": "49353000AV0202",
  "dateCreation": "2024-03-15T10:30:00Z",
  "enrichissement": { /* données enrichies */ },
  "donneesComplementaires": { /* données saisies */ },
  "mutabilite": { /* résultats de calcul */ }
}`}</code>
        </pre>
      </div>

      <h4 className="fr-h6 fr-mt-4w">4. Sites analysés d'une commune (table attributaire)</h4>
      <p>
        Renvoie, pour une commune, chaque site évalué dans Mutafriches ou inventorié par un
        partenaire : ses parcelles, ses critères enrichis, les critères saisis lors de sa dernière
        évaluation et ses indices de mutabilité. Un site est un ensemble de parcelles : deux
        ensembles qui se recoupent sont deux sites.
      </p>
      <div className="fr-highlight">
        <pre>
          <code>{`GET https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305

// Réponse
{
  "codeInsee": "77305",
  "commune": "Montereau-Fault-Yonne",
  "dateGeneration": "2026-11-03T10:00:00.000Z",
  "avertissement": "Les critères saisis sont déclaratifs : ...",
  "nombreSites": 27,
  "sites": [
    {
      "cleSite": "77305000AV0499,77305000AV0500",
      "parcelles": ["77305000AV0499", "77305000AV0500"],
      "codeInsee": "77305",
      "commune": "Montereau-Fault-Yonne",
      "nom": "Ex-bâtiment ORANGE",
      "partenaire": "scet",
      "centroide": { "latitude": 48.3895, "longitude": 2.9555 },
      "criteresAutomatiques": {
        "surfaceSite": 3415,
        "surfaceBati": 2512,
        "siteEnCentreVille": true,
        "zonageAbcLogement": null
        /* ... */
      },
      "saisieDeclarative": true,
      "criteresSaisis": {
        "typeProprietaire": "prive",
        "presencePollution": "non"
        /* ... les 9 critères manuels */
      },
      "nombreEvaluations": 2,
      "mutabilite": {
        "indices": { "residentiel": 72.3, "equipements": 68 /* ... */ },
        "usagePrioritaire": "residentiel",
        "usagesExclus": [],
        "fiabilite": { "note": 9, "niveau": "Très fiable" }
      },
      "versionAlgorithme": "v1.19"
    }
  ]
}`}</code>
        </pre>
      </div>

      <div className="fr-alert fr-alert--warning fr-alert--sm fr-mt-2w">
        <p>
          Les critères saisis sont <strong>déclaratifs</strong> (<code>saisieDeclarative</code>) :
          renseignés par les utilisateurs de Mutafriches, ils n'ont pas été vérifiés. Un site jamais
          qualifié a <code>criteresSaisis: null</code> et sa mutabilité est calculée avec{" "}
          <code>&quot;ne-sait-pas&quot;</code> pour chaque critère manuel.
        </p>
      </div>

      <ul className="fr-mt-2w">
        <li>
          Les indices sont recalculés avec la version courante de l'algorithme : tous les sites
          d'une commune sont comparables.
        </li>
        <li>
          Dans <code>criteresAutomatiques</code>, un critère absent était indisponible ;{" "}
          <code>null</code> signifie que la recherche n'a rien trouvé.
        </li>
        <li>Un site à cheval sur deux communes n'apparaît que dans sa commune prédominante.</li>
        <li>
          Un code INSEE invalide renvoie une erreur <code>400</code> ; une commune sans site, une
          liste vide.
        </li>
      </ul>

      <p className="fr-text--sm fr-mb-1w fr-mt-2w">
        <strong>Pour un SIG</strong>, ajoutez <code>&amp;format=geojson</code> : chaque site devient
        une entité (emprise des parcelles) aux attributs à plat, un critère par colonne et{" "}
        <code>indice_&lt;usage&gt;</code> pour les 7 usages. L'URL se charge directement comme
        couche vecteur dans QGIS.
      </p>
      <div className="fr-highlight">
        <pre>
          <code>{`curl "https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305&format=geojson" \\
  -o sites-77305.geojson`}</code>
        </pre>
      </div>

      <div className="fr-callout fr-callout--green-emeraude fr-mt-4w">
        <h3 className="fr-callout__title">URL de base</h3>
        <p className="fr-callout__text">
          <strong>Production :</strong> <code>https://mutafriches.beta.gouv.fr</code>
        </p>
      </div>

      <div className="fr-mt-6w">
        <a
          href="https://mutafriches.beta.gouv.fr/api"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-external-link-line"
        >
          Documentation Swagger de l'API
        </a>
      </div>
    </div>
  );
}
