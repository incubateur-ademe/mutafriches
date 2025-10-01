import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../layouts/Layout";
import { ParcelleSelectionMap } from "../../components/step1/parcelle-selection-map/ParcelleSelectionMap";
import { ParcelleDisplayData } from "../../types/parcelle.types";

export function TestCarteParcelle() {
  const [selectedIdu, setSelectedIdu] = useState<string | null>(null);
  const [parcelleData, setParcelleData] = useState<ParcelleDisplayData | null>(null);

  const handleParcelleSelected = useCallback((idu: string, data: ParcelleDisplayData) => {
    console.log("Parcelle sélectionnée:", { idu, data });
    setSelectedIdu(idu);
    setParcelleData(data);
  }, []);

  return (
    <Layout>
      <div className="fr-container">
        {/* En-tête */}
        <div className="fr-mb-6w">
          <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
            <button
              type="button"
              className="fr-breadcrumb__button"
              aria-expanded="false"
              aria-controls="breadcrumb-test"
            >
              Voir le Fil d'Ariane
            </button>
            <div className="fr-collapse" id="breadcrumb-test">
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
                    Tester la sélection de parcelle
                  </a>
                </li>
              </ol>
            </div>
          </nav>

          <h1>Test de la sélection de parcelle</h1>
          <p className="fr-text--lead">
            Cette page permet de vérifier que la sélection de parcelle cadastrale fonctionne
            correctement avec l'API IGN.
          </p>
        </div>

        {/* Instructions */}
        <div className="fr-alert fr-alert--info fr-mb-4w">
          <h3 className="fr-alert__title">Instructions</h3>
          <p>
            1. Utilisez la molette de la souris pour zoomer sur la carte
            <br />
            2. Cliquez sur une parcelle visible pour la sélectionner
            <br />
            3. Les informations de la parcelle s'affichent
          </p>
        </div>

        {/* Informations sur la parcelle sélectionnée */}
        {selectedIdu && parcelleData && (
          <div className="fr-callout  fr-callout--blue-ecume fr-mb-4w">
            <h3 className="fr-callout__title">Parcelle sélectionnée</h3>
            <div className="fr-callout__text">
              <dl className="fr-grid-row">
                <dt className="fr-col-12 fr-col-md-3">
                  <strong>IDU :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">
                  <code>{selectedIdu}</code>
                </dd>

                <dt className="fr-col-12 fr-col-md-3">
                  <strong>Commune :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">{parcelleData.commune}</dd>

                <dt className="fr-col-12 fr-col-md-3">
                  <strong>Code INSEE :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">{parcelleData.codeInsee}</dd>

                <dt className="fr-col-12 fr-col-md-3">
                  <strong>Section :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">{parcelleData.section}</dd>

                <dt className="fr-col-12 fr-col-md-3">
                  <strong>Numéro :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">{parcelleData.numero}</dd>

                <dt className="fr-col-12 fr-col-md-3">
                  <strong>Surface :</strong>
                </dt>
                <dd className="fr-col-12 fr-col-md-9">{parcelleData.surface}</dd>
              </dl>
            </div>
          </div>
        )}

        {/* Carte de sélection */}
        <div className="fr-mb-4w">
          <ParcelleSelectionMap
            onParcelleSelected={handleParcelleSelected}
            height="600px"
            initialZoom={17}
          />
        </div>
      </div>
    </Layout>
  );
}
