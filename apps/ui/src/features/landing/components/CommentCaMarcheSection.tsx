import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

const SOURCES_PRINCIPALES: { nom: string; src: string }[] = [
  { nom: "BDNB", src: "/images/logos/sources/bdnb.png" },
  { nom: "cadastre.data.gouv.fr", src: "/images/logos/sources/cadastre.png" },
  { nom: "Géorisques", src: "/images/logos/sources/georisques.png" },
  { nom: "BD TOPO", src: "/images/logos/sources/bd-topo.png" },
];

// Numéro en colonne : les lignes suivantes du titre s'alignent sur le texte, pas sous le numéro.
function TitreEtape({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <h3
      className="fr-mb-2w flex gap-[0.4em]"
      style={{ color: "var(--text-action-high-blue-france)" }}
    >
      <span>{numero}.</span>
      <span>{children}</span>
    </h3>
  );
}

export function CommentCaMarcheSection() {
  return (
    <section className="fr-py-8w">
      <div className="fr-container">
        <h2 className="fr-mb-4w">Comment ça marche ?</h2>

        {/* Bloc 1 : qualification */}
        <div
          className="fr-mb-4w"
          style={{ padding: "2.5rem", backgroundColor: "#f1f7ff", borderRadius: "24px" }}
        >
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-7">
              <TitreEtape numero={1}>
                Mutafriches qualifie vos sites à partir de bases de données nationales
              </TitreEtape>
              <p className="fr-mb-2w">
                Une fois les parcelles de vos sites définies, Mutafriches interroge plus de{" "}
                <strong>19 critères déterminants</strong> issus des bases de données ouvertes
                nationales.
              </p>
              <p className="fr-mb-3w">
                Pour fiabiliser l&apos;analyse, vous pouvez{" "}
                <strong>renseigner des critères plus subjectifs</strong> (intérêt du paysage par
                ex.) et ne relevant pas de la donnée ouverte (type de propriétaire par ex.).
              </p>
              <ul
                className="fr-raw-list flex flex-wrap items-center gap-x-[0.75rem] gap-y-[0.75rem] fr-mb-3w"
                aria-label="Principales sources de données"
              >
                {SOURCES_PRINCIPALES.map((source) => (
                  <li
                    key={source.nom}
                    className="fr-background-default--grey"
                    style={{ padding: "0.25rem 0.5rem", borderRadius: "12px" }}
                  >
                    <img
                      src={source.src}
                      alt={source.nom}
                      className="h-[1.75rem] w-auto block"
                      loading="lazy"
                    />
                  </li>
                ))}
              </ul>
              <Link to={ROUTES.COMPRENDRE_ANALYSES_SOURCES} className="fr-btn fr-btn--secondary">
                Découvrir toutes nos sources
              </Link>
            </div>
            <div className="fr-col-12 fr-col-md-5">
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/illustrations/landing/commentcamarche-1.png"
                  alt="Capture d'écran de l'étape de qualification"
                  className="fr-responsive-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloc 2 : évaluation */}
        <div style={{ padding: "2.5rem", backgroundColor: "#f1f7ff", borderRadius: "24px" }}>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-7">
              <TitreEtape numero={2}>
                Mutafriches évalue la mutabilité de vos sites pour 7 usages
              </TitreEtape>
              <p className="fr-mb-3w">
                Sur la base des critères de qualification, une{" "}
                <strong>analyse de mutabilité</strong> permet d&apos;évaluer la compatibilité de vos
                sites pour 7 usages de reconversion.
              </p>
              <Link to={ROUTES.ANALYSER} className="fr-btn">
                Tester sur un site
              </Link>
            </div>
            <div className="fr-col-12 fr-col-md-5">
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/illustrations/landing/commentcamarche-2.png"
                  alt="Capture d'écran des résultats d'analyse"
                  className="fr-responsive-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
