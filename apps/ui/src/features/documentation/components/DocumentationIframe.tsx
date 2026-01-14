import { ROUTES } from "../../../shared/config/routes.config";

export function DocumentationIframe() {
  return (
    <div>
      <div className="fr-callout fr-callout--blue-ecume">
        <h3 className="fr-callout__title">Intégration rapide</h3>
        <p className="fr-callout__text">
          L'intégration par iframe permet d'intégrer le formulaire Mutafriches directement dans
          votre site en 5 minutes, sans backend nécessaire.
        </p>
      </div>

      <h2 className="fr-h3 fr-mt-6w">Démarrage rapide</h2>

      <fieldset
        className="fr-fieldset fr-mb-4w"
        id="checklist-iframe"
        aria-labelledby="checklist-iframe-legend"
      >
        <legend className="fr-fieldset__legend" id="checklist-iframe-legend">
          Checklist d'intégration
        </legend>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-demo"
              id="check-demo"
              type="checkbox"
              aria-describedby="check-demo-messages"
            />
            <label className="fr-label" htmlFor="check-demo">
              1. Pour comprendre le fonctionnement tester avec l'intégrateur&nbsp;
              <strong>"Démo locale" </strong>&nbsp;
              <a
                id="link-4"
                href={ROUTES.TEST_IFRAME}
                target="_blank"
                className="fr-link"
                rel="noreferrer"
              >
                via la page de test
              </a>
            </label>
            <div className="fr-messages-group" id="check-demo-messages" aria-live="polite"></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-prod"
              id="check-prod"
              type="checkbox"
              aria-describedby="check-prod-messages"
            />
            <label className="fr-label" htmlFor="check-prod">
              2. Demander votre identifiant d'intégrateur officiel à l'équipe Mutafriches.
            </label>
            <div className="fr-messages-group" id="check-prod-messages" aria-live="polite"></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-iframe"
              id="check-iframe"
              type="checkbox"
              aria-describedby="check-iframe-messages"
            />
            <label className="fr-label" htmlFor="check-iframe">
              3. Ajouter l'iframe à votre page en remplaçant l'identifiant d'intégrateur&nbsp;
              <strong>demo</strong>&nbsp;par l'identifiant qui vous a été fourni.
            </label>
            <div className="fr-messages-group" id="check-iframe-messages" aria-live="polite"></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-callback"
              id="check-callback"
              type="checkbox"
              aria-describedby="check-callback-messages"
            />
            <label className="fr-label italic" htmlFor="check-callback">
              4. (Optionnel) Configurer une URL de callback et son libellé pour rediriger
              l'utilisateur après l'analyse via les paramètres&nbsp;
              <code>callbackUrl</code>&nbsp;et&nbsp;<code>callbackLabel</code>.
            </label>
            <div
              className="fr-messages-group"
              id="check-callback-messages"
              aria-live="polite"
            ></div>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="check-listener"
              id="check-listener"
              type="checkbox"
              aria-describedby="check-listener-messages"
            />
            <label className="fr-label italic" htmlFor="check-listener">
              5. (Optionnel mais recommandé) Configurer un script pour l'écoute et la vérification
              de l'origine des messages envoyés par l'iframe&nbsp;
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage"
                target="_blank"
                className="fr-link"
                rel="noreferrer"
              >
                via l'API Javascript postMessage
              </a>
              .
            </label>
            <div
              className="fr-messages-group"
              id="check-listener-messages"
              aria-live="polite"
            ></div>
          </div>
        </div>
      </fieldset>

      <h3 className="fr-h5 fr-mt-4w">Exemple minimal</h3>
      <div className="fr-highlight">
        <pre>
          <code>{`<!-- Iframe Mutafriches -->
<iframe 
  id="mutafriches"
  src="https://mutafriches.beta.gouv.fr/iframe?integrator=demo&callbackUrl=https://mon-site.fr&callbackLabel=Retour"
  style="width: 100%; height: 900px; border: none;">
</iframe>

<script>
  // Écouter les résultats
  window.addEventListener('message', (event) => {
    // Vérifier l'origine pour la sécurité
    if (event.origin !== 'https://mutafriches.beta.gouv.fr') return;
    
    if (event.data.type === 'mutafriches:completed') {
      console.log('Analyse terminée', event.data.data);
      // Traiter les résultats...
    }
  });
</script>`}</code>
        </pre>
      </div>

      <h3 className="fr-h5 fr-mt-4w">Paramètres de l'iframe</h3>
      <div className="fr-table fr-table--bordered">
        <table>
          <thead>
            <tr>
              <th>Paramètre</th>
              <th>Description</th>
              <th>Requis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>integrator</code>
              </td>
              <td>
                Identifiant unique fourni par Mutafriches (utilisez <code>demo</code> pour les
                tests)
              </td>
              <td>Oui</td>
            </tr>
            <tr>
              <td>
                <code>callbackUrl</code>
              </td>
              <td>URL où renvoyer l'utilisateur après l'analyse</td>
              <td>Non</td>
            </tr>
            <tr>
              <td>
                <code>callbackLabel</code>
              </td>
              <td>Texte du bouton de retour</td>
              <td>Non</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="fr-h5 fr-mt-4w">Messages reçus</h3>
      <p>L'iframe envoie des messages à votre page via l'API postMessage :</p>

      <div className="fr-accordions-group">
        <section className="fr-accordion">
          <h3 className="fr-accordion__title">
            <button
              type="button"
              className="fr-accordion__btn"
              aria-expanded="false"
              aria-controls="accordion-message-completed"
            >
              <code>mutafriches:completed</code>
            </button>
          </h3>
          <div className="fr-collapse" id="accordion-message-completed">
            <p>Envoyé quand l'analyse est terminée avec les résultats complets :</p>
            <div className="fr-highlight">
              <pre>
                <code>{`{
  type: 'mutafriches:completed',
  timestamp: 1758177708492,
  data: {
    evaluationId: "uuid-de-l-evaluation",
    identifiantParcelle: "490055000AI0001",
    retrieveUrl: "/evaluation/uuid",
    fiabilite: { note: 8.5, text: "Bonne" },
    usagePrincipal: {
      usage: "RESIDENTIEL_MIXTE",
      indiceMutabilite: 75.5,
      potentiel: "Excellent"
    },
    top3Usages: [...]
  }
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="fr-accordion">
          <h3 className="fr-accordion__title">
            <button
              type="button"
              className="fr-accordion__btn"
              aria-expanded="false"
              aria-controls="accordion-message-error"
            >
              <code>mutafriches:error</code>
            </button>
          </h3>
          <div className="fr-collapse" id="accordion-message-error">
            <p>Envoyé en cas d'erreur :</p>
            <div className="fr-highlight">
              <pre>
                <code>{`{
  type: "mutafriches:error",
  timestamp: 1758177708492,
  data: {
    error: "Description de l'erreur",
    code: "ERROR_CODE"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>

      <div className="fr-callout fr-callout--orange-terre-battue fr-mt-4w">
        <h3 className="fr-callout__title">Sécurité</h3>
        <p className="fr-callout__text">
          Vérifiez toujours l'origine des messages pour éviter les attaques XSS :
        </p>
        <div className="fr-highlight">
          <pre>
            <code>{`if (event.origin !== 'https://mutafriches.beta.gouv.fr') return;`}</code>
          </pre>
        </div>
      </div>

      <div className="fr-mt-6w">
        <a
          href="https://github.com/incubateur-ademe/mutafriches/blob/main/docs/integration/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-external-link-line"
        >
          Documentation complète sur GitHub
        </a>
      </div>
    </div>
  );
}
