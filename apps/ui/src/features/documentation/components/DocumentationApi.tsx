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
              Tester l'enrichissement d'une parcelle (POST /enrichissement)
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
              <td>Enrichir les données d'une parcelle cadastrale</td>
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
          </tbody>
        </table>
      </div>

      <h3 className="fr-h5 fr-mt-4w">Flux d'intégration</h3>
      <div className="fr-stepper">
        <h3 className="fr-stepper__title">
          <span className="fr-stepper__state">Étape 1 sur 3</span>
          Enrichissement de la parcelle
        </h3>
        <div className="fr-stepper__steps" data-fr-current-step="1" data-fr-steps="3"></div>
        <p className="fr-stepper__details">
          Appelez <code>POST /enrichissement</code> avec l'identifiant cadastral pour récupérer les
          données automatiques.
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

      <h4 className="fr-h6 fr-mt-4w">1. Enrichissement d'une parcelle</h4>
      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json

{
  "identifiant": "490055000AI0001"
}

// Réponse
{
  "identifiantParcelle": "490055000AI0001",
  "commune": "Trélazé",
  "surfaceSite": 42780,
  "siteEnCentreVille": true,
  "distanceAutoroute": 1.5,
  "tauxLogementsVacants": 4.9,
  "presenceRisquesNaturels": "faible",
  "zonageEnvironnemental": "hors-zone",
  "champsManquants": [
    "presencePollution",
    "valeurArchitecturaleHistorique"
  ],
  "fiabilite": 8.5
}`}</code>
        </pre>
      </div>

      <h4 className="fr-h6 fr-mt-4w">2. Calcul de la mutabilité</h4>
      <div className="fr-highlight">
        <pre>
          <code>{`POST https://mutafriches.beta.gouv.fr/evaluation/calculer
Content-Type: application/json

{
  "donneesEnrichies": { /* données d'enrichissement */ },
  "donneesComplementaires": {
    "typeProprietaire": "prive",
    "raccordementEau": "oui",
    "etatBatiInfrastructure": "degradation-heterogene",
    "presencePollution": "ne-sait-pas",
    "valeurArchitecturaleHistorique": "interet-remarquable",
    "qualitePaysage": "ordinaire",
    "qualiteVoieDesserte": "accessible"
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
      "rang": 7,
      "usage": "residentiel",
      "indiceMutabilite": 68,
      "potentiel": "Favorable"
    }
  ],
  "evaluationId": "eval-uuid"
}`}</code>
        </pre>
      </div>

      <h4 className="fr-h6 fr-mt-4w">3. Récupération d'une évaluation</h4>
      <div className="fr-highlight">
        <pre>
          <code>{`GET https://mutafriches.beta.gouv.fr/evaluation/{id}

// Réponse
{
  "id": "eval-uuid",
  "identifiantParcelle": "490055000AI0001",
  "dateCreation": "2024-03-15T10:30:00Z",
  "enrichissement": { /* données enrichies */ },
  "donneesComplementaires": { /* données saisies */ },
  "mutabilite": { /* résultats de calcul */ }
}`}</code>
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
