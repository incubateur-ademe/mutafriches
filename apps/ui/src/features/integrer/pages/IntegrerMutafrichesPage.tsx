import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CanalIntegrateur } from "@mutafriches/shared-types";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { ContactMultisitesModal } from "../../resultats/components/ContactMultisitesModal";
import { DeclarationModal, type CanalModale } from "../components/DeclarationModal";
import { SolutionIntegrationCard } from "../components/SolutionIntegrationCard";

const URL_BENEFRICHES = "https://benefriches.ademe.fr";
const URL_URBANVITALIZ = "https://urbanvitaliz.fr";

const IMAGES = {
  qgis: "/images/integrer/extension-qgis.webp",
  api: "/images/integrer/api-mutafriches.webp",
  page: "/images/integrer/page-personnalisee.webp",
  partenaires: "/images/integrer/services-partenaires.webp",
} as const;

const MESSAGES_CONTACT = {
  api: "Choisissez un créneau pour parler de votre intégration de l'API avec l'équipe.",
  page: "Choisissez un créneau pour présenter votre liste de sites à l'équipe.",
  aide: "Choisissez un créneau pour décrire vos outils et vos sites à l'équipe, qui vous orientera vers la solution adaptée.",
} as const;

type MotifContact = keyof typeof MESSAGES_CONTACT;

interface IntegrerMutafrichesPageProps {
  // Formulaire ouvert dès l'arrivée, pour une adresse partageable (cf. ROUTES.FORMULAIRE_PAGE_MULTISITES)
  formulaireOuvert?: CanalModale;
}

export function IntegrerMutafrichesPage({ formulaireOuvert }: IntegrerMutafrichesPageProps) {
  const navigate = useNavigate();
  const [motifContact, setMotifContact] = useState<MotifContact | null>(null);
  const [declaration, setDeclaration] = useState<CanalModale | null>(formulaireOuvert ?? null);

  // D'une adresse de formulaire à l'autre, la page n'est pas remontée : la modale suit l'adresse
  const [formulairePrecedent, setFormulairePrecedent] = useState(formulaireOuvert);
  if (formulaireOuvert !== formulairePrecedent) {
    setFormulairePrecedent(formulaireOuvert);
    if (formulaireOuvert) setDeclaration(formulaireOuvert);
  }

  // Depuis l'adresse partageable, on revient à la page : un rechargement ne rouvre pas le formulaire
  const fermerDeclaration = () => {
    setDeclaration(null);
    if (formulaireOuvert) navigate(ROUTES.INTEGRER, { replace: true });
  };

  return (
    <Layout>
      <div className="fr-col-12">
        <h1>Intégrer Mutafriches</h1>
        <p className="fr-mb-6w">
          Passez de l'analyse d'un site à l'étude de plusieurs sites à l'échelle de votre
          territoire. Nos solutions d'intégration vous permettent de retrouver l'analyse de
          mutabilité dans vos outils métiers et au sein des services publics que vous utilisez déjà.
          De quoi explorer les possibilités de reconversion de vos friches et éclairer votre
          stratégie d'aménagement, dans la continuité de vos pratiques.
        </p>

        <SolutionIntegrationCard
          titre="Extension QGIS"
          accroche="Analysez vos friches sans quitter votre SIG"
          tags={["Utilisation fréquente", "Large stock de sites"]}
          image={IMAGES.qgis}
          action={
            <Link to={ROUTES.TUTORIEL_QGIS} className="fr-btn">
              Utiliser l'extension
            </Link>
          }
        >
          Chargez les sites à étudier depuis vos données géographiques et analysez leur mutabilité
          directement dans QGIS. Visualisez les résultats à l'échelle de votre territoire et
          croisez-les avec vos autres couches pour enrichir vos analyses.
        </SolutionIntegrationCard>

        <SolutionIntegrationCard
          titre="API Mutafriches"
          accroche="L'analyse de mutabilité dans vos propres outils"
          tags={["Utilisation fréquente", "Large stock de sites"]}
          image={IMAGES.api}
          action={
            <ul className="fr-btns-group fr-btns-group--inline-md">
              <li>
                <button
                  type="button"
                  className="fr-btn"
                  onClick={() => setDeclaration(CanalIntegrateur.API)}
                >
                  Utiliser l'API
                </button>
              </li>
              <li>
                <Link to={ROUTES.DOCUMENTATION_API} className="fr-btn fr-btn--secondary">
                  Lire la documentation
                </Link>
              </li>
            </ul>
          }
        >
          Connectez vos outils à Mutafriches pour automatiser la récupération des données de
          qualification et intégrer l'analyse de mutabilité à vos services. Exploitez les résultats
          dans votre environnement de travail et croisez-les avec vos propres données pour éclairer
          vos choix de reconversion.
        </SolutionIntegrationCard>

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-1w">
          <div className="fr-col-12 fr-col-md-6">
            <SolutionIntegrationCard
              disposition="verticale"
              titre="Page Mutafriches personnalisée"
              accroche="Retrouvez vos sites dans un espace dédié"
              tags={["Utilisation ponctuelle", "Nombre de sites limité"]}
              image={IMAGES.page}
              action={
                <button
                  type="button"
                  className="fr-btn"
                  onClick={() => setDeclaration(CanalIntegrateur.PAGE)}
                >
                  Demander une page personnalisée
                </button>
              }
            >
              Vous disposez déjà d'une liste de friches à étudier ? Retrouvez-les sur une page
              personnalisée pour les qualifier et analyser leurs usages possibles. Accédez à vos
              sites depuis une interface dédiée et partagez simplement les résultats avec vos
              partenaires.
            </SolutionIntegrationCard>
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <SolutionIntegrationCard
              disposition="verticale"
              titre="Nos services partenaires"
              accroche="Retrouvez Mutafriches dans les services que vous utilisez déjà"
              tags={["Sans SIG"]}
              image={IMAGES.partenaires}
              action={
                <ul className="fr-btns-group fr-btns-group--inline-md">
                  <li>
                    <a
                      className="fr-btn"
                      href={URL_BENEFRICHES}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Accéder à Bénéfriches - nouvelle fenêtre"
                    >
                      Accéder à Bénéfriches
                    </a>
                  </li>
                  <li>
                    <a
                      className="fr-btn fr-btn--secondary"
                      href={URL_URBANVITALIZ}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Accéder à UrbanVitaliz - nouvelle fenêtre"
                    >
                      Accéder à UrbanVitaliz
                    </a>
                  </li>
                </ul>
              }
            >
              Accédez à l'analyse de mutabilité depuis Bénéfriches ou UrbanVitaliz. Croisez les
              résultats de Mutafriches avec les autres informations et services proposés par ces
              partenaires pour faire avancer vos projets de reconversion.
            </SolutionIntegrationCard>
          </div>
        </div>

        <div className="fr-my-6w text-center">
          <h2 className="fr-h6">Besoin d'aide pour choisir votre solution ?</h2>
          <p>
            Décrivez-nous vos outils et les sites que vous souhaitez analyser : notre équipe
            <br className="fr-hidden fr-unhidden-md" /> vous accompagne pour identifier la solution
            adaptée à vos besoins.
          </p>
          <button type="button" className="fr-btn" onClick={() => setMotifContact("aide")}>
            Être accompagné vers la solution adaptée
          </button>
        </div>
      </div>

      <DeclarationModal
        canal={declaration}
        onClose={fermerDeclaration}
        onRendezVous={() => {
          setMotifContact(declaration === CanalIntegrateur.PAGE ? "page" : "api");
          fermerDeclaration();
        }}
      />

      <ContactMultisitesModal
        isOpen={motifContact !== null}
        onClose={() => setMotifContact(null)}
        message={motifContact ? MESSAGES_CONTACT[motifContact] : undefined}
      />
    </Layout>
  );
}
