import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { DsfrSideMenu, type DsfrSideMenuItem } from "../../../shared/components/dsfr/DsfrSideMenu";
import { ROUTES } from "../../../shared/config/routes.config";

interface PageDocumentationProps {
  /** Identifiant de la page, préfixe des identifiants du fil d'Ariane et du menu */
  id: string;
  titre: string;
  /** Libellé court de la page dans le fil d'Ariane */
  libelleFil: string;
  chapo: ReactNode;
  sommaire: DsfrSideMenuItem[];
  children: ReactNode;
}

/**
 * Gabarit des pages de détail de « Intégrer Mutafriches » : fil d'Ariane, titre, sommaire en
 * menu latéral collant et contenu. Chaque entrée du sommaire vise une section du contenu.
 */
export function PageDocumentation({
  id,
  titre,
  libelleFil,
  chapo,
  sommaire,
  children,
}: PageDocumentationProps) {
  return (
    <Layout>
      <div className="fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls={`breadcrumb-${id}`}
          >
            Voir le fil d'Ariane
          </button>
          <div className="fr-collapse" id={`breadcrumb-${id}`}>
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.HOME}>
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.INTEGRER}>
                  Intégrer Mutafriches
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  {libelleFil}
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>{titre}</h1>
        <p className="fr-text--lead">{chapo}</p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4 fr-col-lg-3">
            <DsfrSideMenu id={`sommaire-${id}`} titre="Sommaire" items={sommaire} />
          </div>
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-9">{children}</div>
        </div>
      </div>
    </Layout>
  );
}

interface SectionDocumentationProps {
  /** Ancre de la section, reprise dans le sommaire */
  id: string;
  titre: string;
  children: ReactNode;
}

/** Section d'une page de documentation, visée par une entrée du sommaire. */
export function SectionDocumentation({ id, titre, children }: SectionDocumentationProps) {
  return (
    <section id={id} className="fr-mb-8w" aria-labelledby={`${id}-titre`}>
      <h2 id={`${id}-titre`} className="fr-h3">
        {titre}
      </h2>
      {children}
    </section>
  );
}
