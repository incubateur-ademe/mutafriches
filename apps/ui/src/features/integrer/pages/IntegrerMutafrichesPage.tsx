import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { ContactMultisitesModal } from "../../resultats/components/ContactMultisitesModal";
import { SolutionIntegrationCard } from "../components/SolutionIntegrationCard";

const URL_BENEFRICHES = "https://benefriches.ademe.fr";

// Visuel provisoire des quatre cartes, en attendant les captures définitives
const IMAGE_PROVISOIRE = "/images/placeholder.16x9.png";

const MESSAGES_CONTACT = {
  api: "Choisissez un créneau pour demander un accès à l'API Mutafriches à l'équipe.",
  page: "Choisissez un créneau pour demander une page Mutafriches personnalisée à l'équipe.",
  aide: "Choisissez un créneau pour décrire vos outils et vos sites à l'équipe, qui vous orientera vers la solution adaptée.",
} as const;

type MotifContact = keyof typeof MESSAGES_CONTACT;

export function IntegrerMutafrichesPage() {
  const [motifContact, setMotifContact] = useState<MotifContact | null>(null);

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
          image={IMAGE_PROVISOIRE}
          action={
            // Lien à brancher quand l'extension sera publiée
            <button type="button" className="fr-btn" disabled>
              Utiliser l'extension
            </button>
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
          image={IMAGE_PROVISOIRE}
          action={
            <ul className="fr-btns-group fr-btns-group--inline-md">
              <li>
                <button type="button" className="fr-btn" onClick={() => setMotifContact("api")}>
                  Demander l'accès
                </button>
              </li>
              <li>
                <Link to={ROUTES.DOCUMENTATION_INTEGRATION} className="fr-btn fr-btn--secondary">
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

        <SolutionIntegrationCard
          titre="Page Mutafriches personnalisée"
          accroche="Retrouvez vos sites dans un espace dédié"
          tags={["Utilisation ponctuelle", "Nombre limité de sites"]}
          image={IMAGE_PROVISOIRE}
          action={
            <button type="button" className="fr-btn" onClick={() => setMotifContact("page")}>
              Demander une page personnalisée
            </button>
          }
        >
          Vous disposez déjà d'une liste de friches à étudier ? Retrouvez-les sur une page
          personnalisée pour les qualifier et analyser leurs usages possibles. Accédez à vos sites
          depuis une interface dédiée et partagez simplement les résultats avec vos partenaires.
        </SolutionIntegrationCard>

        <SolutionIntegrationCard
          titre="Nos services partenaires"
          accroche="Retrouvez Mutafriches dans les services que vous utilisez déjà"
          tags={["Sans SIG"]}
          image={IMAGE_PROVISOIRE}
          action={
            <a
              className="fr-btn"
              href={URL_BENEFRICHES}
              target="_blank"
              rel="noopener noreferrer"
              title="Accéder à Bénéfriches - nouvelle fenêtre"
            >
              Accéder à Bénéfriches
            </a>
          }
        >
          Accédez à l'analyse de mutabilité depuis Bénéfriches ou UrbanVitaliz. Croisez les
          résultats de Mutafriches avec les autres informations et services proposés par ces
          partenaires pour faire avancer vos projets de reconversion.
        </SolutionIntegrationCard>

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

      <ContactMultisitesModal
        isOpen={motifContact !== null}
        onClose={() => setMotifContact(null)}
        message={motifContact ? MESSAGES_CONTACT[motifContact] : undefined}
      />
    </Layout>
  );
}
