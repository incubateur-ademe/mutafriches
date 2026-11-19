import { Link } from "react-router-dom";
import { DsfrAccordion } from "../../../shared/components/dsfr/DsfrAccordion";
import { ROUTES } from "../../../shared/config/routes.config";
import { BlocCode } from "../components/BlocCode";
import { PageDocumentation, SectionDocumentation } from "../components/PageDocumentation";
import {
  IFRAME_EXEMPLE_MINIMAL,
  IFRAME_MESSAGE_COMPLETED,
  IFRAME_MESSAGE_ERROR,
  IFRAME_VERIFIER_ORIGINE,
} from "../data/exemples-integration";

const CONTACT = "contact@mutafriches.beta.gouv.fr";
const URL_POSTMESSAGE = "https://developer.mozilla.org/fr/docs/Web/API/Window/postMessage";
const URL_DOC_GITHUB =
  "https://github.com/incubateur-ademe/mutafriches/blob/main/docs/integration/README.md";

const SOMMAIRE = [
  { id: "en-bref", label: "En bref" },
  { id: "mise-en-place", label: "Mise en place" },
  { id: "identifiant", label: "Identifiant d'intégrateur" },
  { id: "parametres", label: "Paramètres de l'iframe" },
  { id: "messages", label: "Messages reçus" },
  { id: "securite", label: "Sécurité" },
];

const PARAMETRES = [
  {
    nom: "integrator",
    description: "Identifiant unique fourni par Mutafriches (« demo » pour les tests)",
    requis: "Oui",
  },
  {
    nom: "callbackUrl",
    description: "Adresse où renvoyer l'utilisateur après l'analyse",
    requis: "Non",
  },
  { nom: "callbackLabel", description: "Texte du bouton de retour", requis: "Non" },
];

export function DocumentationIframePage() {
  return (
    <PageDocumentation
      id="iframe"
      titre="Intégrer l'iframe Mutafriches"
      libelleFil="Iframe"
      chapo="Embarquez le parcours d'analyse Mutafriches dans votre site, sans développement côté serveur, et récupérez les résultats dans votre page."
      sommaire={SOMMAIRE}
    >
      <SectionDocumentation id="en-bref" titre="En bref">
        <p>
          L'iframe affiche dans votre page le même parcours que le site Mutafriches : choix du site,
          qualification, puis résultats. À la fin de l'analyse, elle transmet les résultats à votre
          page et peut proposer un bouton de retour vers votre service.
        </p>
        <BlocCode titre="Exemple minimal">{IFRAME_EXEMPLE_MINIMAL}</BlocCode>
        <ul className="fr-btns-group fr-btns-group--inline-md fr-mt-3w">
          <li>
            <a
              href={ROUTES.TEST_IFRAME}
              target="_blank"
              rel="noopener noreferrer"
              className="fr-btn"
              title="Page de test de l'iframe - nouvelle fenêtre"
            >
              Essayer sur la page de test
            </a>
          </li>
        </ul>
      </SectionDocumentation>

      <SectionDocumentation id="mise-en-place" titre="Mise en place">
        <ol>
          <li>
            Essayez l'intégrateur « Démo locale » sur la page de test, pour comprendre le
            fonctionnement.
          </li>
          <li>Demandez votre identifiant d'intégrateur officiel à l'équipe Mutafriches.</li>
          <li>
            Ajoutez l'iframe à votre page en remplaçant <code>demo</code> par votre identifiant.
          </li>
          <li>
            Facultatif : renvoyez l'utilisateur vers votre service après l'analyse, avec{" "}
            <code>callbackUrl</code> et <code>callbackLabel</code>.
          </li>
          <li>
            Recommandé : écoutez les messages envoyés par l'iframe pour récupérer les résultats, en
            vérifiant leur origine.
          </li>
        </ol>
      </SectionDocumentation>

      <SectionDocumentation id="identifiant" titre="Identifiant d'intégrateur">
        <p>
          Chaque partenaire dispose d'un <strong>identifiant d'intégrateur</strong> unique (par
          exemple <code>benefriches</code>). Transmis dans l'adresse de l'iframe par le paramètre{" "}
          <code>integrator</code>, il permet à Mutafriches de reconnaître votre plateforme : suivi
          statistique, libellé du bouton de retour, validation du domaine de retour.
        </p>
        <ul>
          <li>
            L'identifiant <code>demo</code> fonctionne depuis un hôte local (<code>localhost</code>
            ), sans autorisation préalable.
          </li>
          <li>
            Votre identifiant officiel est associé à votre domaine, déclaré par l'équipe
            Mutafriches.
          </li>
        </ul>
        <div className="fr-callout fr-callout--brown-caramel">
          <p className="fr-callout__title fr-h6">À savoir</p>
          <p className="fr-callout__text fr-text--md">
            Un identifiant non déclaré est ignoré : l'iframe retombe sur la configuration par
            défaut. Côté requêtes, l'iframe s'identifie d'elle-même : vous n'avez rien à gérer en
            plus.
          </p>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="parametres" titre="Paramètres de l'iframe">
        <div className="fr-table fr-table--bordered">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption className="fr-sr-only">Paramètres de l'adresse de l'iframe</caption>
                  <thead>
                    <tr>
                      <th scope="col">Paramètre</th>
                      <th scope="col">Description</th>
                      <th scope="col">Requis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARAMETRES.map((parametre) => (
                      <tr key={parametre.nom}>
                        <td>
                          <code>{parametre.nom}</code>
                        </td>
                        <td className="fr-cell--multiline">{parametre.description}</td>
                        <td>{parametre.requis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="messages" titre="Messages reçus">
        <p>
          L'iframe envoie des messages à votre page par l'
          <a
            href={URL_POSTMESSAGE}
            target="_blank"
            rel="noopener noreferrer"
            title="API postMessage sur MDN - nouvelle fenêtre"
          >
            API postMessage
          </a>
          .
        </p>
        <div className="fr-accordions-group">
          <DsfrAccordion
            id="message-completed"
            title="mutafriches:completed, à la fin de l'analyse"
            defaultOpen
          >
            <p>Envoyé quand l'analyse est terminée, avec les résultats :</p>
            <BlocCode>{IFRAME_MESSAGE_COMPLETED}</BlocCode>
            <p className="fr-text--sm fr-mt-2w fr-mb-0">
              Pour un site de plusieurs parcelles, <code>identifiantParcelle</code> joint les
              identifiants par des virgules et <code>identifiantsParcelles</code> en donne la liste.{" "}
              <code>retrieveUrl</code> est le chemin de <code>GET /evaluation/:id</code>, à préfixer
              par le domaine Mutafriches pour relire l'évaluation complète par l'
              <Link to={ROUTES.DOCUMENTATION_API}>API</Link>.
            </p>
          </DsfrAccordion>
          <DsfrAccordion id="message-error" title="mutafriches:error, en cas d'erreur">
            <BlocCode>{IFRAME_MESSAGE_ERROR}</BlocCode>
          </DsfrAccordion>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="securite" titre="Sécurité">
        <p>
          Vérifiez toujours l'origine des messages avant de les traiter : n'importe quelle page peut
          en envoyer à la vôtre.
        </p>
        <BlocCode>{IFRAME_VERIFIER_ORIGINE}</BlocCode>
        <p className="fr-mt-4w">
          Une question technique ?
          <br />
          Écrivez-nous à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          <br />
          La{" "}
          <a
            href={URL_DOC_GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            title="Documentation complète sur GitHub - nouvelle fenêtre"
          >
            documentation complète
          </a>{" "}
          est sur GitHub ; pour bâtir votre propre interface, consultez l'
          <Link to={ROUTES.DOCUMENTATION_API}>API Mutafriches</Link>.
        </p>
      </SectionDocumentation>
    </PageDocumentation>
  );
}
