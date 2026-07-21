import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { LoadingCallout } from "@shared/components/common/LoadingCallout";
import { DsfrTabs } from "@shared/components/dsfr/DsfrTabs";
import { ParcelleSelectionMap } from "../../../analyser/components/parcelle-map/ParcelleSelectionMap";
import { useComparaisonCartofriches } from "../hooks/useComparaisonCartofriches";
import { SiteComparaisonDetail } from "../components/SiteComparaisonDetail";
import { SitesReferencePanel } from "../components/SitesReferencePanel";
import { CollageIdentifiantsPanel } from "../components/CollageIdentifiantsPanel";
import { CartofrichesSelectionPanel } from "../components/CartofrichesSelectionPanel";

/**
 * Page de test : comparer les données sources Mutafriches et Cartofriches (Cerema) pour un
 * site à la fois.
 *
 * On sélectionne un site (Cartofriches, référence, collage ou carte Mutafriches) ; la
 * comparaison remplace le résultat courant et un panneau complet s'affiche.
 */
export function ComparaisonCartofrichesPage() {
  const { site, chargement, erreur, comparerSite } = useComparaisonCartofriches();

  const resultatRef = useRef<HTMLDivElement>(null);
  const chargementPrecedent = useRef(false);

  // Scroll vers le panneau de résultat dès qu'une comparaison se termine
  useEffect(() => {
    if (chargementPrecedent.current && !chargement && site) {
      resultatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    chargementPrecedent.current = chargement;
  }, [chargement, site]);

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
          Comparez les données sources Mutafriches et Cartofriches (Cerema) pour un site, en
          cliquant sur celui que vous souhaitez comparer.
        </p>
        <p className="fr-mb-4w fr-text--sm">
          La comparaison porte sur les données sources (surface, commune, pollution, ZAER, distance
          à une ITE fret). L'indice de mutabilité Cartofriches n'est affiché que lorsqu'il est servi
          par l'API (rarement, version beta).
        </p>

        <DsfrTabs
          ariaLabel="Choisir un site à comparer"
          tabs={[
            {
              id: "cartofriches",
              label: "Depuis Cartofriches",
              panel: (
                <CartofrichesSelectionPanel
                  onComparer={(refcad) => void comparerSite(refcad)}
                  desactive={chargement}
                />
              ),
            },
            {
              id: "reference",
              label: "Sites de référence",
              panel: (
                <SitesReferencePanel
                  onComparerSite={(parcelles) => void comparerSite(parcelles)}
                  desactive={chargement}
                />
              ),
            },
            {
              id: "coller",
              label: "Coller des identifiants",
              panel: (
                <CollageIdentifiantsPanel
                  onComparer={(identifiants) => void comparerSite(identifiants)}
                  desactive={chargement}
                />
              ),
            },
            {
              id: "mutafriches",
              label: "Depuis Mutafriches",
              panel: (
                <ParcelleSelectionMap
                  height="640px"
                  onAnalyze={(identifiants) => void comparerSite(identifiants)}
                />
              ),
            },
          ]}
        />

        {chargement ? (
          <LoadingCallout
            title="Comparaison en cours…"
            message="Enrichissement Mutafriches et interrogation de Cartofriches"
          />
        ) : null}

        {erreur ? (
          <div className="fr-alert fr-alert--error fr-mt-2w">
            <p>{erreur}</p>
          </div>
        ) : null}

        <div ref={resultatRef}>{site ? <SiteComparaisonDetail site={site} /> : null}</div>
      </div>
    </Layout>
  );
}
