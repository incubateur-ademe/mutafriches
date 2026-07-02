import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { LoadingCallout } from "@shared/components/common/LoadingCallout";
import { SITES_REFERENCE } from "../config/sites-reference";
import { useComparaisonCartofriches } from "../hooks/useComparaisonCartofriches";
import { SitesComparaisonTable } from "../components/SitesComparaisonTable";
import { SitesReferenceSidebar } from "../components/SitesReferenceSidebar";
import { AjoutSiteTabs } from "../components/AjoutSiteTabs";

/**
 * Page de test : comparer les données sources Mutafriches et Cartofriches (Cerema) sur une
 * liste de sites, pour instruire les écarts.
 *
 * Organisation : bandeau latéral des sites de référence à gauche, ajout (carte / collage) et
 * résultats à droite.
 */
export function ComparaisonCartofrichesPage() {
  const {
    sites,
    chargement,
    erreur,
    progression,
    ajouterSite,
    chargerSites,
    retirerSite,
    vider,
    estCompare,
  } = useComparaisonCartofriches();

  const resultatsRef = useRef<HTMLDivElement>(null);
  const chargementPrecedent = useRef(false);

  // Scroll vers les résultats dès qu'une comparaison se termine (utile surtout sur mobile)
  useEffect(() => {
    if (chargementPrecedent.current && !chargement && sites.length > 0) {
      resultatsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    chargementPrecedent.current = chargement;
  }, [chargement, sites.length]);

  const comparerTout = (): void => {
    void chargerSites(SITES_REFERENCE.map((site) => site.parcelles));
  };

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
          Comparez les données sources Mutafriches et Cartofriches (Cerema) sur une liste de sites,
          pour instruire les écarts.
        </p>
        <p className="fr-mb-4w fr-text--sm">
          La comparaison porte sur les données sources (surface, commune, pollution, ZAER, distance
          à une ITE fret). L'indice de mutabilité Cartofriches n'est affiché que lorsqu'il est servi
          par l'API (rarement, version beta).
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <SitesReferenceSidebar
              onComparerSite={(parcelles) => void ajouterSite(parcelles)}
              onComparerTout={comparerTout}
              estCompare={estCompare}
              desactive={chargement}
            />
          </div>

          <div className="fr-col-12 fr-col-md-8">
            <AjoutSiteTabs
              onAjouterSite={(identifiants) => void ajouterSite(identifiants)}
              onChargerListe={(listes) => void chargerSites(listes)}
              desactive={chargement}
            />

            {chargement ? (
              <LoadingCallout
                title="Comparaison en cours…"
                message={
                  progression
                    ? `Site ${progression.enCours} sur ${progression.total}`
                    : "Enrichissement Mutafriches et interrogation de Cartofriches"
                }
              />
            ) : null}

            {erreur ? (
              <div className="fr-alert fr-alert--error fr-mt-2w">
                <p>{erreur}</p>
              </div>
            ) : null}

            <div ref={resultatsRef}>
              <SitesComparaisonTable sites={sites} onRetirer={retirerSite} onVider={vider} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
