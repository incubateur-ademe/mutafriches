import { useState } from "react";
import { Link } from "react-router-dom";
import { MAX_PARCELLES_PAR_SITE_API } from "@mutafriches/shared-types";
import { ROUTES } from "../../../shared/config/routes.config";
import { ContactMultisitesModal } from "../../resultats/components/ContactMultisitesModal";
import { BlocCode } from "../components/BlocCode";
import { PageDocumentation, SectionDocumentation } from "../components/PageDocumentation";
import {
  ATTRIBUTAIRE_GEOJSON,
  ATTRIBUTAIRE_REPONSE,
  ATTRIBUTAIRE_REQUETE,
  CALCULER_REPONSE,
  CALCULER_REQUETE,
  ENRICHIR_MONO,
  ENRICHIR_MULTI,
  ENRICHIR_REPONSE,
  EXEMPLE_ORIGINE,
  LIMITE_REQUETES_PAR_MINUTE,
  RELIRE_REPONSE,
  RELIRE_REQUETE,
  URL_PRODUCTION,
  URL_SWAGGER,
} from "../data/exemples-integration";

const CONTACT = "contact@mutafriches.beta.gouv.fr";
const MESSAGE_CONTACT =
  "Choisissez un créneau pour demander un accès à l'API Mutafriches à l'équipe.";

const SOMMAIRE = [
  { id: "en-bref", label: "En bref" },
  { id: "acces", label: "Accès et limites" },
  { id: "enrichir", label: "1. Enrichir un site" },
  { id: "completer", label: "2. Compléter la connaissance terrain" },
  { id: "calculer", label: "3. Calculer la mutabilité" },
  { id: "relire", label: "Relire une évaluation" },
  { id: "table-attributaire", label: "Sites analysés d'une commune" },
  { id: "erreurs", label: "Erreurs courantes" },
  { id: "reference", label: "Référence des appels" },
];

const CRITERES_TERRAIN = [
  "typeProprietaire",
  "etatBatiInfrastructure",
  "presencePollution",
  "valeurArchitecturaleHistorique",
  "qualitePaysage",
  "qualiteVoieDesserte",
  "trameVerteEtBleue",
  "presenceEspecesProtegees",
  "presenceZoneHumide",
];

interface Appel {
  methode: "GET" | "POST";
  chemin: string;
  description: string;
  origine: boolean;
}

const APPELS: Appel[] = [
  {
    methode: "POST",
    chemin: "/enrichissement",
    description: `Recueillir les données automatiques d'un site (1 à ${MAX_PARCELLES_PAR_SITE_API} parcelles)`,
    origine: true,
  },
  {
    methode: "POST",
    chemin: "/evaluation/calculer",
    description: "Calculer les indices de mutabilité et l'indice de fiabilité",
    origine: true,
  },
  {
    methode: "GET",
    chemin: "/evaluation/:id",
    description: "Relire une évaluation complète",
    origine: false,
  },
  {
    methode: "GET",
    chemin: "/evaluation/metadata",
    description: "Lister les valeurs admises (énumérations) et les versions",
    origine: false,
  },
  {
    methode: "GET",
    chemin: "/api/attributaire/sites?codeInsee=",
    description: "Lister les sites déjà analysés d'une commune (JSON ou GeoJSON)",
    origine: false,
  },
];

interface ErreurCourante {
  code: string;
  message: string;
  cause: string;
  solution: string;
}

const ERREURS: ErreurCourante[] = [
  {
    code: "403",
    message: "Origin required",
    cause:
      "Un appel POST est parti sans en-tête Origin, cas habituel d'un appel serveur à serveur.",
    solution: "Ajoutez l'en-tête Origin avec votre domaine autorisé.",
  },
  {
    code: "403",
    message: "Origin not allowed",
    cause: "Votre domaine ne figure pas dans la liste autorisée.",
    solution: "Demandez son ajout à l'équipe Mutafriches.",
  },
  {
    code: "400",
    message: "DONNEES_COMPLEMENTAIRES_INCOMPLETES",
    cause: "Un des 9 critères de connaissance terrain est absent, vide ou null.",
    solution:
      "Envoyez les 9 critères ; la réponse nomme les champs manquants. Utilisez « ne-sait-pas » pour une information inconnue.",
  },
  {
    code: "400",
    message: "DONNEES_ENRICHIES_MANQUANTES ou DONNEES_ENRICHIES_INCOMPLETES",
    cause: "La réponse de l'enrichissement n'a pas été renvoyée entière au calcul.",
    solution: "Renvoyez telle quelle la réponse complète de POST /enrichissement.",
  },
  {
    code: "404",
    message: "Évaluation non trouvée",
    cause: "L'identifiant d'évaluation n'existe pas.",
    solution: "Vérifiez l'identifiant renvoyé par le calcul (evaluationId).",
  },
  {
    code: "429",
    message: "Too Many Requests",
    cause: `Plus de ${LIMITE_REQUETES_PAR_MINUTE} requêtes en une minute depuis la même adresse IP.`,
    solution: "Espacez vos appels et traitez vos sites l'un après l'autre.",
  },
  {
    code: "500",
    message: "Erreur lors de l'enrichissement",
    cause:
      "Le plus souvent, aucune parcelle du site n'existe au cadastre ; plus rarement, une source de données est indisponible.",
    solution:
      "Vérifiez les identifiants de parcelles (14 caractères, parcelles existantes), puis réessayez plus tard.",
  },
];

function BadgeMethode({ methode }: { methode: Appel["methode"] }) {
  const couleur = methode === "POST" ? "fr-badge--success" : "fr-badge--info";
  return <span className={`fr-badge fr-badge--sm fr-badge--no-icon ${couleur}`}>{methode}</span>;
}

export function DocumentationApiPage() {
  const [contactOuvert, setContactOuvert] = useState(false);

  return (
    <PageDocumentation
      id="api"
      titre="Utiliser l'API Mutafriches"
      libelleFil="API Mutafriches"
      chapo="Connectez vos outils à Mutafriches pour automatiser la récupération des données de qualification et intégrer l'analyse de mutabilité à vos services."
      sommaire={SOMMAIRE}
    >
      <SectionDocumentation id="en-bref" titre="En bref">
        <p>
          L'API REST analyse un site, composé d'une ou plusieurs parcelles cadastrales, en trois
          temps : elle recueille ses données automatiques, vous les complétez par votre connaissance
          terrain, puis elle calcule l'indice de mutabilité de sept usages et l'indice de fiabilité
          associé.
        </p>
        <ul>
          <li>
            Adresse de base : <code>{URL_PRODUCTION}</code>
          </li>
          <li>Échanges en JSON, sans clé ni jeton.</li>
          <li>
            Appels d'écriture réservés aux domaines autorisés par l'équipe Mutafriches ; lectures
            ouvertes.
          </li>
        </ul>
        <ul className="fr-btns-group fr-btns-group--inline-md fr-mt-3w">
          <li>
            <button type="button" className="fr-btn" onClick={() => setContactOuvert(true)}>
              Demander l'accès
            </button>
          </li>
          <li>
            <a
              href={URL_SWAGGER}
              target="_blank"
              rel="noopener noreferrer"
              className="fr-btn fr-btn--secondary"
              title="Documentation Swagger - nouvelle fenêtre"
            >
              Documentation Swagger
            </a>
          </li>
        </ul>
      </SectionDocumentation>

      <SectionDocumentation id="acces" titre="Accès et limites">
        <p>
          L'API ne nécessite <strong>ni clé ni jeton</strong>. Les appels d'écriture (
          <code>POST</code>) sont autorisés selon l'en-tête HTTP <code>Origin</code> (ou{" "}
          <code>Referer</code> en repli) : votre domaine doit figurer dans la liste autorisée par
          l'équipe Mutafriches. Cette origine sert aussi à reconnaître vos appels dans nos
          statistiques : aucun identifiant supplémentaire n'est à transmettre. Les lectures (
          <code>GET</code>) sont ouvertes, sans en-tête <code>Origin</code>.
        </p>
        <p>
          Les navigateurs envoient automatiquement cet en-tête. Pour des appels{" "}
          <strong>serveur à serveur</strong>, transmettez-le explicitement :
        </p>
        <BlocCode>{EXEMPLE_ORIGINE}</BlocCode>
        <p className="fr-mt-3w">
          Le débit est limité à{" "}
          <strong>{LIMITE_REQUETES_PAR_MINUTE} requêtes par minute et par adresse IP</strong>. Un
          site demande deux requêtes : pour un inventaire, traitez les sites l'un après l'autre
          plutôt qu'en parallèle.
        </p>
        <div className="fr-callout fr-callout--brown-caramel">
          <p className="fr-callout__title fr-h6">Faire autoriser votre domaine</p>
          <p className="fr-callout__text fr-text--md">
            Sans cette étape, vos appels d'écriture sont refusés. Écrivez-nous à{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a> ou utilisez le bouton « Demander l'accès ».
          </p>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="enrichir" titre="1. Enrichir un site">
        <p>
          <BadgeMethode methode="POST" /> <code>/enrichissement</code>
        </p>
        <p>
          Transmettez un ou plusieurs identifiants cadastraux (1 à {MAX_PARCELLES_PAR_SITE_API}{" "}
          parcelles, 14 caractères chacun). Plusieurs parcelles forment un seul site : la réponse
          décrit le site entier, pas chaque parcelle.
        </p>
        <BlocCode titre="Requête, une parcelle">{ENRICHIR_MONO}</BlocCode>
        <BlocCode titre="Requête, plusieurs parcelles">{ENRICHIR_MULTI}</BlocCode>
        <BlocCode titre="Réponse (site de deux parcelles)">{ENRICHIR_REPONSE}</BlocCode>
        <p className="fr-mt-2w">
          <code>sourcesEchouees</code> et <code>champsManquants</code> signalent les données que
          Mutafriches n'a pas pu recueillir : le calcul reste possible, l'indice de fiabilité en
          tient compte.
        </p>
      </SectionDocumentation>

      <SectionDocumentation id="completer" titre="2. Compléter la connaissance terrain">
        <p>
          Neuf critères ne peuvent pas être recueillis automatiquement : c'est à votre utilisateur,
          ou à vos propres données, de les renseigner.
        </p>
        <ul>
          {CRITERES_TERRAIN.map((critere) => (
            <li key={critere}>
              <code>{critere}</code>
            </li>
          ))}
        </ul>
        <p>
          Les valeurs admises pour chacun sont listées par <code>GET /evaluation/metadata</code>.
        </p>
        <div className="fr-alert fr-alert--info fr-alert--sm">
          <p>
            Les <strong>9 critères</strong> sont tous obligatoires. Pour une information non connue,
            envoyez la valeur <code>"ne-sait-pas"</code>, jamais <code>null</code>, une chaîne vide
            ou une clé absente.
          </p>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="calculer" titre="3. Calculer la mutabilité">
        <p>
          <BadgeMethode methode="POST" /> <code>/evaluation/calculer</code>
        </p>
        <p>
          Renvoyez telle quelle la réponse de l'enrichissement dans <code>donneesEnrichies</code>,
          avec les neuf critères dans <code>donneesComplementaires</code>.
        </p>
        <BlocCode titre="Requête">{CALCULER_REQUETE}</BlocCode>
        <BlocCode titre="Réponse">{CALCULER_REPONSE}</BlocCode>
        <ul className="fr-mt-2w">
          <li>
            <code>resultats</code> classe les sept usages du plus au moins compatible.
          </li>
          <li>
            Un usage rendu impossible par une caractéristique du site (zone d'exclusion des EnR,
            zone humide avec espèces protégées) porte <code>exclu: true</code> et la liste des{" "}
            <code>criteresExcluants</code>. Il est relégué en fin de classement : son indice reste
            renseigné mais n'est pas comparable à celui des autres usages.
          </li>
          <li>
            <code>fiabilite</code> reflète la complétude des informations concernant la friche :
            elle baisse si des données manquent ou si un critère vaut <code>"ne-sait-pas"</code>.
          </li>
        </ul>
        <div className="fr-callout fr-callout--blue-ecume">
          <p className="fr-callout__title fr-h6">À savoir</p>
          <p className="fr-callout__text fr-text--md">
            Ces résultats constituent une première orientation. Un indice de mutabilité n'est pas
            une probabilité de réussite : présentez-le comme une compatibilité entre un site et un
            usage, à croiser avec la connaissance du territoire.
          </p>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="relire" titre="Relire une évaluation">
        <p>
          <BadgeMethode methode="GET" /> <code>/evaluation/:id</code>
        </p>
        <p>
          L'identifiant est le <code>evaluationId</code> renvoyé par le calcul, ou transmis par
          l'iframe à la fin d'une analyse.
        </p>
        <BlocCode titre="Requête">{RELIRE_REQUETE}</BlocCode>
        <BlocCode titre="Réponse">{RELIRE_REPONSE}</BlocCode>
      </SectionDocumentation>

      <SectionDocumentation id="table-attributaire" titre="Sites analysés d'une commune">
        <p>
          <BadgeMethode methode="GET" /> <code>/api/attributaire/sites?codeInsee=</code>
        </p>
        <p>
          Renvoie, pour une commune, chaque site évalué dans Mutafriches ou inventorié par un
          partenaire : ses parcelles, ses critères enrichis, les critères saisis lors de sa dernière
          évaluation et ses indices de mutabilité. Un site est un ensemble de parcelles : deux
          ensembles qui se recoupent sont deux sites.
        </p>
        <BlocCode titre="Requête">{ATTRIBUTAIRE_REQUETE}</BlocCode>
        <BlocCode titre="Réponse">{ATTRIBUTAIRE_REPONSE}</BlocCode>
        <div className="fr-alert fr-alert--warning fr-alert--sm fr-mt-2w">
          <p>
            Les critères saisis sont <strong>déclaratifs</strong> (<code>saisieDeclarative</code>) :
            renseignés par les utilisateurs de Mutafriches, ils n'ont pas été vérifiés. Un site
            jamais qualifié a <code>criteresSaisis: null</code> et sa mutabilité est calculée avec{" "}
            <code>"ne-sait-pas"</code> pour chaque critère manuel.
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
        <p>
          <strong>Pour un SIG</strong>, ajoutez <code>&amp;format=geojson</code> : chaque site
          devient une entité (emprise des parcelles) aux attributs à plat, un critère par colonne et{" "}
          <code>indice_&lt;usage&gt;</code> pour les 7 usages. L'adresse se charge directement comme
          couche vecteur dans QGIS ; pour analyser votre propre inventaire, voyez plutôt l'
          <Link to={ROUTES.TUTORIEL_QGIS}>extension QGIS</Link>.
        </p>
        <BlocCode>{ATTRIBUTAIRE_GEOJSON}</BlocCode>
      </SectionDocumentation>

      <SectionDocumentation id="erreurs" titre="Erreurs courantes">
        <div className="fr-table fr-table--bordered">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption className="fr-sr-only">Erreurs courantes de l'API</caption>
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Message</th>
                      <th scope="col">Cause</th>
                      <th scope="col">Que faire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ERREURS.map((erreur) => (
                      <tr key={`${erreur.code}-${erreur.message}`}>
                        <td>{erreur.code}</td>
                        <td className="fr-cell--multiline">
                          <code>{erreur.message}</code>
                        </td>
                        <td className="fr-cell--multiline">{erreur.cause}</td>
                        <td className="fr-cell--multiline">{erreur.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="reference" titre="Référence des appels">
        <div className="fr-table fr-table--bordered">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption className="fr-sr-only">Appels de l'API Mutafriches</caption>
                  <thead>
                    <tr>
                      <th scope="col">Méthode</th>
                      <th scope="col">Chemin</th>
                      <th scope="col">Rôle</th>
                      <th scope="col">En-tête Origin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {APPELS.map((appel) => (
                      <tr key={appel.chemin}>
                        <td>
                          <BadgeMethode methode={appel.methode} />
                        </td>
                        <td>
                          <code>{appel.chemin}</code>
                        </td>
                        <td className="fr-cell--multiline">{appel.description}</td>
                        <td>{appel.origine ? "Obligatoire" : "Non"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <p>
          Le détail de chaque champ se trouve dans la{" "}
          <a
            href={URL_SWAGGER}
            target="_blank"
            rel="noopener noreferrer"
            title="Documentation Swagger - nouvelle fenêtre"
          >
            documentation Swagger
          </a>
          .
        </p>
        <p>
          Une question technique ?
          <br />
          Écrivez-nous à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          <br />
          Pour embarquer le parcours Mutafriches sans développement, consultez l'
          <Link to={ROUTES.DOCUMENTATION_IFRAME}>intégration par iframe</Link>.
        </p>
      </SectionDocumentation>

      <ContactMultisitesModal
        isOpen={contactOuvert}
        onClose={() => setContactOuvert(false)}
        message={MESSAGE_CONTACT}
      />
    </PageDocumentation>
  );
}
