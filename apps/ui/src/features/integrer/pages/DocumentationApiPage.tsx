import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  CanalIntegrateur,
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  MAX_PARCELLES_PAR_SITE_API,
  USAGE_LABELS,
} from "@mutafriches/shared-types";
import { DsfrAccordion } from "../../../shared/components/dsfr/DsfrAccordion";
import { DsfrTabs } from "../../../shared/components/dsfr/DsfrTabs";
import { ROUTES } from "../../../shared/config/routes.config";
import { ContactMultisitesModal } from "../../resultats/components/ContactMultisitesModal";
import { BlocCode } from "../components/BlocCode";
import { DeclarationModal } from "../components/DeclarationModal";
import { PageDocumentation, SectionDocumentation } from "../components/PageDocumentation";
import {
  CRITERES_TERRAIN,
  NOMBRE_CRITERES_AUTOMATIQUES,
  VALEUR_INCONNUE,
} from "../data/criteres-terrain";
import {
  ATTRIBUTAIRE_GEOJSON,
  ATTRIBUTAIRE_REPONSE,
  ATTRIBUTAIRE_REQUETE,
  CALCULER_REPONSE,
  CALCULER_REPONSE_COURTE,
  CALCULER_ENVOI_COURT,
  ENRICHIR_ENVOI_COURT,
  ENRICHIR_MULTI,
  ENRICHIR_REPONSE,
  ENRICHIR_REPONSE_COURTE,
  EXEMPLE_COMPLET_CURL,
  EXEMPLE_COMPLET_JS,
  EXEMPLE_ORIGINE,
  LIMITE_REQUETES_PAR_MINUTE,
  RELIRE_REPONSE,
  RELIRE_REQUETE,
  URL_PRODUCTION,
  URL_SWAGGER,
} from "../data/exemples-integration";

const CONTACT = "contact@mutafriches.beta.gouv.fr";
const MESSAGE_CONTACT =
  "Choisissez un créneau pour parler de votre intégration de l'API avec l'équipe.";

const NOMBRE_CRITERES_TERRAIN = CHAMPS_COMPLEMENTAIRES_REQUIS.length;
const NOMBRE_USAGES = Object.keys(USAGE_LABELS).length;

const SOMMAIRE = [
  { id: "comprendre", label: "Ce que fait l'API" },
  { id: "acces", label: "Avant de commencer" },
  { id: "premiere-analyse", label: "Votre première analyse" },
  { id: "resultat", label: "Lire le résultat" },
  { id: "exemple-complet", label: "Exemple complet à copier" },
  { id: "aller-plus-loin", label: "Aller plus loin" },
];

interface TempsParcours {
  acteur: "Vous" | "Mutafriches";
  titre: string;
  texte: string;
}

const PARCOURS: TempsParcours[] = [
  {
    acteur: "Vous",
    titre: "Vous envoyez les parcelles",
    texte: "Les identifiants cadastraux qui composent le site à étudier.",
  },
  {
    acteur: "Mutafriches",
    titre: "Mutafriches recueille les données",
    texte: `${NOMBRE_CRITERES_AUTOMATIQUES} critères automatiques (surfaces, dessertes, risques, zonages).`,
  },
  {
    acteur: "Vous",
    titre: "Vous ajoutez le terrain",
    texte: `${NOMBRE_CRITERES_TERRAIN} informations que seule la connaissance du site apporte.`,
  },
  {
    acteur: "Mutafriches",
    titre: "Vous recevez l'analyse",
    texte: `Un indice de mutabilité pour ${NOMBRE_USAGES} usages et un indice de fiabilité.`,
  },
];

interface ChampResultat {
  champ: string;
  sens: string;
}

const CHAMPS_RESULTAT: ChampResultat[] = [
  {
    champ: "resultats[].usage",
    sens: "L'usage évalué, parmi les sept du tableau ci-dessous.",
  },
  {
    champ: "resultats[].indiceMutabilite",
    sens: "La compatibilité entre le site et cet usage, de 0 à 100. Plus l'indice est élevé, plus le site s'y prête.",
  },
  {
    champ: "resultats[].rang",
    sens: "La place de l'usage dans le classement : 1 pour le plus compatible.",
  },
  {
    champ: "resultats[].potentiel",
    sens: "L'indice traduit en clair : Excellent, Très bon, Bon, Moyen, Faible ou Exclu.",
  },
  {
    champ: "resultats[].exclu",
    sens: "true quand une caractéristique du site rend l'usage impossible. Il passe en fin de classement, et criteresExcluants nomme les critères en cause.",
  },
  {
    champ: "fiabilite.note",
    sens: "La complétude des informations, de 0 à 10. Elle baisse quand une donnée manque ou vaut « ne-sait-pas ».",
  },
  {
    champ: "evaluationId",
    sens: "L'identifiant à conserver pour relire cette analyse plus tard.",
  },
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

interface SituationDomaine {
  cas: string;
  code?: string;
  reponse: string;
  action: string;
}

// Les trois refus possibles tiennent à l'en-tête Origin : le tableau dit lequel correspond à quoi.
const SITUATIONS_DOMAINE: SituationDomaine[] = [
  {
    cas: "Domaine déclaré, et envoyé tel quel dans Origin",
    reponse: "Appel accepté",
    action: "Rien : passez à votre première analyse.",
  },
  {
    cas: "Domaine jamais déclaré",
    code: "403 Origin not allowed",
    reponse: "Appel refusé",
    action: "Déclarez-le : l'appel suivant est accepté.",
  },
  {
    cas: "Domaine déclaré, mais en-tête différent (www. en plus ou en moins, http au lieu de https, sous-domaine)",
    code: "403 Origin not allowed",
    reponse: "Appel refusé",
    action: "Envoyez exactement le domaine déclaré, ou déclarez aussi celui-ci.",
  },
  {
    cas: "Aucun en-tête Origin, cas d'un appel depuis un serveur ou un script",
    code: "403 Origin required",
    reponse: "Appel refusé",
    action: "Ajoutez vous-même l'en-tête Origin, avec votre domaine déclaré.",
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
    solution: "Ajoutez l'en-tête Origin avec votre domaine déclaré.",
  },
  {
    code: "403",
    message: "Origin not allowed",
    cause: "Votre domaine n'a pas été déclaré, ou l'en-tête ne lui correspond pas exactement.",
    solution: "Déclarez-le dans le formulaire de la section « Avant de commencer ».",
  },
  {
    code: "400",
    message: "DONNEES_COMPLEMENTAIRES_INCOMPLETES",
    cause: `Un des ${NOMBRE_CRITERES_TERRAIN} critères de connaissance terrain est absent, vide ou null.`,
    solution: `Envoyez les ${NOMBRE_CRITERES_TERRAIN} critères ; la réponse nomme les champs manquants. Utilisez « ne-sait-pas » pour une information inconnue.`,
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

interface TableauProps {
  legende: string;
  colonnes: string[];
  children: ReactNode;
}

function Tableau({ legende, colonnes, children }: TableauProps) {
  return (
    <div className="fr-table fr-table--bordered">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{legende}</caption>
              <thead>
                <tr>
                  {colonnes.map((colonne) => (
                    <th key={colonne} scope="col">
                      {colonne}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{children}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EtapeProps {
  numero: number;
  titre: string;
  appel?: Pick<Appel, "methode" | "chemin">;
  children: ReactNode;
}

function Etape({ numero, titre, appel, children }: EtapeProps) {
  return (
    <div className="fr-mb-6w">
      <p className="fr-badge fr-badge--blue-ecume fr-badge--no-icon fr-mb-1w">Étape {numero}</p>
      <h3 className="fr-h5 fr-mb-1w">{titre}</h3>
      {appel ? (
        <p>
          <BadgeMethode methode={appel.methode} /> <code>{appel.chemin}</code>
        </p>
      ) : (
        <p className="fr-text--sm fr-text-mention--grey">
          Aucun appel : c'est vous qui renseignez.
        </p>
      )}
      {children}
    </div>
  );
}

function ARetenir({ children }: { children: ReactNode }) {
  return (
    <div className="fr-highlight fr-ml-0 fr-my-2w">
      <p className="fr-text--md">
        <strong>À retenir :</strong> {children}
      </p>
    </div>
  );
}

export function DocumentationApiPage() {
  const [contactOuvert, setContactOuvert] = useState(false);
  const [declarationOuverte, setDeclarationOuverte] = useState(false);

  return (
    <PageDocumentation
      id="api"
      titre="Utiliser l'API Mutafriches"
      libelleFil="API Mutafriches"
      chapo="Analysez la mutabilité de vos friches depuis vos propres outils : vous envoyez des parcelles, vous recevez les usages qui leur conviennent le mieux."
      sommaire={SOMMAIRE}
    >
      <SectionDocumentation id="comprendre" titre="Ce que fait l'API">
        <p>
          Une analyse se déroule en quatre temps. Vous n'intervenez que deux fois : pour désigner le
          site, puis pour dire ce que vous en savez.
        </p>
        <ol className="fr-grid-row fr-grid-row--gutters fr-raw-list fr-mb-4w">
          {PARCOURS.map((temps, index) => (
            <li key={temps.titre} className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
              <div
                className={`fr-p-2w h-full ${
                  temps.acteur === "Vous"
                    ? "fr-background-alt--blue-france"
                    : "fr-background-alt--grey"
                }`}
              >
                <p className="fr-text--xs fr-text--bold fr-mb-1w">
                  {index + 1}. {temps.acteur}
                </p>
                <p className="fr-text--md fr-text--bold fr-mb-1w">{temps.titre}</p>
                <p className="fr-text--sm fr-mb-0">{temps.texte}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3 className="fr-h6">Est-ce la bonne solution pour vous ?</h3>
        <Tableau legende="Choisir sa solution d'intégration" colonnes={["Vous avez", "Utilisez"]}>
          <tr>
            <td className="fr-cell--multiline">Un outil métier ou un service numérique à relier</td>
            <td className="fr-cell--multiline">
              <strong>L'API</strong>, décrite sur cette page
            </td>
          </tr>
          <tr>
            <td className="fr-cell--multiline">Un inventaire de friches dans un SIG</td>
            <td className="fr-cell--multiline">
              L'<Link to={ROUTES.TUTORIEL_QGIS}>extension QGIS</Link>, sans développement
            </td>
          </tr>
          <tr>
            <td className="fr-cell--multiline">
              Un site web où proposer l'analyse à vos utilisateurs
            </td>
            <td className="fr-cell--multiline">
              L'<Link to={ROUTES.DOCUMENTATION_IFRAME}>iframe</Link>, sans développement côté
              serveur
            </td>
          </tr>
          <tr>
            <td className="fr-cell--multiline">Quelques sites à étudier à la main</td>
            <td className="fr-cell--multiline">
              Le parcours <Link to={ROUTES.ANALYSER}>Tester Mutafriches</Link>
            </td>
          </tr>
        </Tableau>
      </SectionDocumentation>

      <SectionDocumentation id="acces" titre="Avant de commencer">
        <p>
          L'API fonctionne <strong>sans clé ni jeton</strong>. Elle reconnaît vos appels au domaine
          d'où ils partent, lu dans l'en-tête HTTP <code>Origin</code> (par exemple{" "}
          <code>Origin: https://mon-service.gouv.fr</code>). Une seule démarche : déclarer ce
          domaine, une fois. Il est autorisé dès la déclaration.
        </p>
        <button type="button" className="fr-btn" onClick={() => setDeclarationOuverte(true)}>
          Déclarer mon domaine
        </button>

        <h3 className="fr-h6 fr-mt-4w">Ce que répond l'API selon votre situation</h3>
        <Tableau
          legende="Réponse de l'API aux deux appels d'analyse selon le domaine envoyé"
          colonnes={["Votre situation", "Réponse de l'API", "Que faire"]}
        >
          {SITUATIONS_DOMAINE.map((situation) => (
            <tr key={situation.cas}>
              <td className="fr-cell--multiline">{situation.cas}</td>
              <td className="fr-cell--multiline">
                {situation.code ? <code>{situation.code}</code> : situation.reponse}
                {situation.code && (
                  <>
                    <br />
                    {situation.reponse}
                  </>
                )}
              </td>
              <td className="fr-cell--multiline">{situation.action}</td>
            </tr>
          ))}
        </Tableau>
        <p>
          Vous ne savez plus si votre domaine est déclaré ? Déclarez-le à nouveau : rien n'est créé
          en double, et le formulaire vous indique qu'il l'était déjà.
        </p>
        <ul className="fr-mt-2w">
          <li>
            Adresse de l'API : <code>{URL_PRODUCTION}</code>
          </li>
          <li>Les échanges se font en JSON.</li>
          <li>
            Seuls les deux appels d'analyse demandent un domaine déclaré ; les lectures restent
            ouvertes à tous.
          </li>
        </ul>
        <div className="fr-accordions-group fr-mt-3w">
          <DsfrAccordion id="acces-serveur" title="Vos appels partent d'un serveur ?">
            <p>
              Un navigateur indique tout seul le domaine d'où part l'appel, dans l'en-tête HTTP{" "}
              <code>Origin</code>. Un serveur ne le fait pas : ajoutez cet en-tête vous-même, avec
              votre domaine déclaré.
            </p>
            <BlocCode titre="Appel depuis un serveur">{EXEMPLE_ORIGINE}</BlocCode>
            <p className="fr-mt-2w">
              Ce domaine sert aussi à reconnaître vos appels dans nos statistiques : aucun autre
              identifiant n'est à transmettre.
            </p>
          </DsfrAccordion>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="premiere-analyse" titre="Votre première analyse">
        <p>
          Trois étapes, deux appels. L'exemple suit une parcelle de Trélazé (Maine-et-Loire),{" "}
          <code>49353000AV0202</code>.
        </p>

        <Etape
          numero={1}
          titre="Recueillir les données du site"
          appel={{ methode: "POST", chemin: "/enrichissement" }}
        >
          <p>
            Envoyez les identifiants cadastraux du site, de 14 caractères chacun. Mutafriches
            interroge les bases publiques et renvoie tout ce qu'il a trouvé.
          </p>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-lg-6">
              <BlocCode titre="Vous envoyez">{ENRICHIR_ENVOI_COURT}</BlocCode>
            </div>
            <div className="fr-col-12 fr-col-lg-6">
              <BlocCode titre="Vous recevez (extrait)">{ENRICHIR_REPONSE_COURTE}</BlocCode>
            </div>
          </div>
          <ARetenir>
            conservez la réponse entière, sans la modifier : vous la renverrez à l'étape 3.
          </ARetenir>
          <div className="fr-accordions-group">
            <DsfrAccordion
              id="enrichir-multi"
              title="Un site composé de plusieurs parcelles"
              headingLevel={4}
            >
              <p>
                Listez les parcelles dans <code>identifiants</code> (de 1 à{" "}
                {MAX_PARCELLES_PAR_SITE_API}). Elles forment un seul site : la réponse décrit le
                site entier, pas chaque parcelle.
              </p>
              <BlocCode titre="Vous envoyez">{ENRICHIR_MULTI}</BlocCode>
            </DsfrAccordion>
            <DsfrAccordion id="enrichir-reponse" title="Voir la réponse complète" headingLevel={4}>
              <BlocCode titre="Réponse (site de deux parcelles)">{ENRICHIR_REPONSE}</BlocCode>
              <p className="fr-mt-2w">
                <code>sourcesEchouees</code> et <code>champsManquants</code> signalent les données
                que Mutafriches n'a pas pu recueillir. Le calcul reste possible : l'indice de
                fiabilité en tient compte.
              </p>
              <p>
                <code>siteReferencePollue</code> vaut <code>true</code> quand une base nationale
                signale un risque de pollution près du site : site pollué ADEME ou installation
                classée (ICPE) à moins de 500 m, secteur d'information sur les sols (SIS) à moins de
                1 km, ancien site industriel ou activité de service (CASIAS) à moins de 100 m. Ce
                n'est pas une pollution avérée et il n'est pas noté : servez-vous-en pour proposer
                une réponse à <code>presencePollution</code>, que votre utilisateur confirme ou
                corrige.
              </p>
            </DsfrAccordion>
          </div>
        </Etape>

        <Etape numero={2} titre="Ajouter votre connaissance du terrain">
          <p>
            {NOMBRE_CRITERES_TERRAIN} informations ne figurent dans aucune base : l'état du bâti, la
            pollution, la qualité du paysage… C'est à votre utilisateur, ou à vos propres données,
            de les fournir. Pour chacune, choisissez une valeur dans la liste.
          </p>
          <Tableau
            legende="Les critères de connaissance terrain et leurs valeurs admises"
            colonnes={["Information", "Valeurs admises"]}
          >
            {CRITERES_TERRAIN.map((critere) => (
              <tr key={critere.cle}>
                <td className="fr-cell--multiline">
                  <strong>{critere.libelle}</strong>
                  <br />
                  <code>{critere.cle}</code>
                </td>
                <td className="fr-cell--multiline">
                  <ul className="fr-raw-list">
                    {critere.valeurs.map((valeur) => (
                      <li key={valeur.code}>
                        <code>{valeur.code}</code> : {valeur.libelle}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </Tableau>
          <div className="fr-alert fr-alert--info fr-alert--sm">
            <p>
              Les <strong>{NOMBRE_CRITERES_TERRAIN} informations sont obligatoires</strong>. Quand
              vous n'en connaissez pas une, envoyez <code>"{VALEUR_INCONNUE}"</code> : jamais{" "}
              <code>null</code>, une chaîne vide ou une clé absente.
            </p>
          </div>
          <ARetenir>
            chaque « {VALEUR_INCONNUE} » fait baisser l'indice de fiabilité, pas le calcul : mieux
            vaut une réponse honnête qu'une valeur devinée.
          </ARetenir>
        </Etape>

        <Etape
          numero={3}
          titre="Calculer la mutabilité"
          appel={{ methode: "POST", chemin: "/evaluation/calculer" }}
        >
          <p>
            Assemblez les deux : la réponse de l'étape 1 dans <code>donneesEnrichies</code>, vos{" "}
            {NOMBRE_CRITERES_TERRAIN} informations dans <code>donneesComplementaires</code>.
          </p>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-lg-6">
              <BlocCode titre="Vous envoyez">{CALCULER_ENVOI_COURT}</BlocCode>
            </div>
            <div className="fr-col-12 fr-col-lg-6">
              <BlocCode titre="Vous recevez (extrait)">{CALCULER_REPONSE_COURTE}</BlocCode>
            </div>
          </div>
          <ARetenir>
            gardez <code>evaluationId</code> si vous voulez relire cette analyse plus tard.
          </ARetenir>
          <div className="fr-accordions-group">
            <DsfrAccordion id="calculer-reponse" title="Voir la réponse complète" headingLevel={4}>
              <BlocCode titre="Réponse">{CALCULER_REPONSE}</BlocCode>
            </DsfrAccordion>
          </div>
        </Etape>
      </SectionDocumentation>

      <SectionDocumentation id="resultat" titre="Lire le résultat">
        <p>
          La réponse classe les {NOMBRE_USAGES} usages du plus au moins compatible avec le site, et
          dit quelle confiance accorder à ce classement.
        </p>
        <Tableau legende="Les champs de la réponse du calcul" colonnes={["Champ", "Ce qu'il dit"]}>
          {CHAMPS_RESULTAT.map((ligne) => (
            <tr key={ligne.champ}>
              <td>
                <code>{ligne.champ}</code>
              </td>
              <td className="fr-cell--multiline">{ligne.sens}</td>
            </tr>
          ))}
        </Tableau>
        <h3 className="fr-h6">Les {NOMBRE_USAGES} usages</h3>
        <p>
          La réponse désigne chaque usage par une clé technique. Affichez à vos utilisateurs le
          libellé correspondant.
        </p>
        <Tableau legende="Clé et libellé de chaque usage" colonnes={["Clé", "Libellé à afficher"]}>
          {Object.entries(USAGE_LABELS).map(([cle, libelle]) => (
            <tr key={cle}>
              <td>
                <code>{cle}</code>
              </td>
              <td>{libelle}</td>
            </tr>
          ))}
        </Tableau>
        <div className="fr-callout fr-callout--blue-ecume">
          <p className="fr-callout__title fr-h6">Comment présenter ces résultats</p>
          <p className="fr-callout__text fr-text--md">
            Un indice de mutabilité n'est pas une probabilité de réussite. Présentez-le comme une
            compatibilité entre un site et un usage : une première orientation, à croiser avec la
            connaissance du territoire. La page{" "}
            <Link to={ROUTES.COMPRENDRE_ANALYSES}>Comprendre les analyses</Link> détaille chaque
            critère et son poids.
          </p>
        </div>
      </SectionDocumentation>

      <SectionDocumentation id="exemple-complet" titre="Exemple complet à copier">
        <p>
          Les trois étapes enchaînées, prêtes à exécuter une fois votre domaine autorisé. Remplacez{" "}
          <code>https://mon-service.gouv.fr</code> par votre domaine.
        </p>
        <DsfrTabs
          ariaLabel="Langage de l'exemple complet"
          tabs={[
            {
              id: "exemple-javascript",
              label: "JavaScript",
              panel: <BlocCode titre="analyse.mjs">{EXEMPLE_COMPLET_JS}</BlocCode>,
            },
            {
              id: "exemple-curl",
              label: "curl",
              panel: <BlocCode titre="Terminal">{EXEMPLE_COMPLET_CURL}</BlocCode>,
            },
          ]}
        />
      </SectionDocumentation>

      <SectionDocumentation id="aller-plus-loin" titre="Aller plus loin">
        <div className="fr-accordions-group">
          <DsfrAccordion id="relire" title="Relire une analyse déjà faite">
            <p>
              <BadgeMethode methode="GET" /> <code>/evaluation/:id</code>
            </p>
            <p>
              L'identifiant est le <code>evaluationId</code> renvoyé par le calcul, ou transmis par
              l'iframe à la fin d'une analyse.
            </p>
            <BlocCode titre="Requête">{RELIRE_REQUETE}</BlocCode>
            <BlocCode titre="Réponse">{RELIRE_REPONSE}</BlocCode>
          </DsfrAccordion>

          <DsfrAccordion
            id="table-attributaire"
            title="Récupérer les sites déjà analysés d'une commune"
          >
            <p>
              <BadgeMethode methode="GET" /> <code>/api/attributaire/sites?codeInsee=</code>
            </p>
            <p>
              Renvoie, pour une commune, chaque site évalué dans Mutafriches ou inventorié par un
              partenaire : ses parcelles, ses critères enrichis, les critères saisis lors de sa
              dernière évaluation et ses indices de mutabilité. Un site est un ensemble de parcelles
              : deux ensembles qui se recoupent sont deux sites.
            </p>
            <BlocCode titre="Requête">{ATTRIBUTAIRE_REQUETE}</BlocCode>
            <BlocCode titre="Réponse">{ATTRIBUTAIRE_REPONSE}</BlocCode>
            <div className="fr-alert fr-alert--warning fr-alert--sm fr-mt-2w">
              <p>
                Les critères saisis sont <strong>déclaratifs</strong> (
                <code>saisieDeclarative</code>) : renseignés par les utilisateurs de Mutafriches,
                ils n'ont pas été vérifiés. Un site jamais qualifié a{" "}
                <code>criteresSaisis: null</code> et sa mutabilité est calculée avec{" "}
                <code>"{VALEUR_INCONNUE}"</code> pour chaque critère manuel.
              </p>
            </div>
            <ul className="fr-mt-2w">
              <li>
                Les indices sont recalculés avec la version courante de l'algorithme : tous les
                sites d'une commune sont comparables.
              </li>
              <li>
                Dans <code>criteresAutomatiques</code>, un critère absent était indisponible ;{" "}
                <code>null</code> signifie que la recherche n'a rien trouvé.
              </li>
              <li>
                Un site à cheval sur deux communes n'apparaît que dans sa commune prédominante.
              </li>
              <li>
                Un code INSEE invalide renvoie une erreur <code>400</code> ; une commune sans site,
                une liste vide.
              </li>
            </ul>
            <p>
              <strong>Pour un SIG</strong>, ajoutez <code>&amp;format=geojson</code> : chaque site
              devient une entité (emprise des parcelles) aux attributs à plat, un critère par
              colonne et <code>indice_&lt;usage&gt;</code> pour les {NOMBRE_USAGES} usages.
              L'adresse se charge directement comme couche vecteur dans QGIS ; pour analyser votre
              propre inventaire, voyez plutôt l'
              <Link to={ROUTES.TUTORIEL_QGIS}>extension QGIS</Link>.
            </p>
            <BlocCode titre="Terminal">{ATTRIBUTAIRE_GEOJSON}</BlocCode>
          </DsfrAccordion>

          <DsfrAccordion id="limites" title="Analyser beaucoup de sites">
            <p>
              Le débit est limité à{" "}
              <strong>{LIMITE_REQUETES_PAR_MINUTE} requêtes par minute et par adresse IP</strong>.
              Un site demande deux requêtes : pour un inventaire, traitez les sites l'un après
              l'autre plutôt qu'en parallèle.
            </p>
            <p>
              Au-delà de quelques centaines de sites, prévenez-nous : nous verrons ensemble comment
              étaler le traitement.
            </p>
          </DsfrAccordion>

          <DsfrAccordion id="erreurs" title="Un appel échoue">
            <Tableau
              legende="Erreurs courantes de l'API"
              colonnes={["Code", "Message", "Cause", "Que faire"]}
            >
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
            </Tableau>
          </DsfrAccordion>

          <DsfrAccordion id="reference" title="Référence de tous les appels">
            <Tableau
              legende="Appels de l'API Mutafriches"
              colonnes={["Méthode", "Chemin", "Rôle", "Domaine autorisé"]}
            >
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
            </Tableau>
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
          </DsfrAccordion>
        </div>

        <p className="fr-mt-4w">
          Une question technique ? Écrivez-nous à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </SectionDocumentation>

      <DeclarationModal
        canal={declarationOuverte ? CanalIntegrateur.API : null}
        onClose={() => setDeclarationOuverte(false)}
        onRendezVous={() => {
          setDeclarationOuverte(false);
          setContactOuvert(true);
        }}
        suiteApi={
          <a
            className="fr-btn"
            href="#premiere-analyse"
            onClick={() => setDeclarationOuverte(false)}
          >
            Lancer votre première analyse
          </a>
        }
      />

      <ContactMultisitesModal
        isOpen={contactOuvert}
        onClose={() => setContactOuvert(false)}
        message={MESSAGE_CONTACT}
      />
    </PageDocumentation>
  );
}
