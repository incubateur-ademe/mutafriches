import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { ParcelleSelectionMap } from "../../../analyser/components/parcelle-map/ParcelleSelectionMap";
import { useComparaisonCartofriches } from "../hooks/useComparaisonCartofriches";
import { SitesComparaisonTable } from "../components/SitesComparaisonTable";

/**
 * Page de test : comparer les données sources Mutafriches et Cartofriches (Cerema) sur une
 * liste de sites, pour instruire les écarts. Sélection des parcelles via la carte existante.
 */
export function ComparaisonCartofrichesPage() {
  const { sites, chargement, erreur, ajouterSite, retirerSite, vider } =
    useComparaisonCartofriches();

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <div className="fr-collapse" id="breadcrumb">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to="/tests">
                  Tests
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Comparaison Cartofriches
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1 id="comparaison-cartofriches">Comparaison Mutafriches / Cartofriches</h1>
        <p className="fr-text--lead fr-mb-1w">
          Sélectionnez une parcelle sur la carte et lancez l'analyse : le site est enrichi par
          Mutafriches, confronté aux données sources Cartofriches (Cerema) et ajouté au comparatif.
        </p>
        <p className="fr-mb-4w fr-text--sm">
          La comparaison porte sur les données sources (surface, commune, pollution, ZAER, distance
          à une ITE fret). L'indice de mutabilité Cartofriches n'est affiché que lorsqu'il est servi
          par l'API (rarement, version beta).
        </p>

        <ParcelleSelectionMap onAnalyze={(identifiants) => void ajouterSite(identifiants)} />

        {chargement ? (
          <p className="fr-mt-2w">
            <span className="fr-icon-refresh-line" aria-hidden="true" /> Comparaison en cours…
          </p>
        ) : null}

        {erreur ? (
          <div className="fr-alert fr-alert--error fr-mt-2w">
            <p>{erreur}</p>
          </div>
        ) : null}

        <SitesComparaisonTable sites={sites} onRetirer={retirerSite} onVider={vider} />
      </div>
    </Layout>
  );
}
