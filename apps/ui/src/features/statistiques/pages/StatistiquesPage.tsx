import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isVueStatistiques, type VueStatistiques } from "@mutafriches/shared-types";
import { Layout } from "../../../shared/components/layout/Layout";
import { metabaseService } from "../../../shared/services/api/api.metabase.service";

const LIBELLES_VUES: Record<VueStatistiques, string> = {
  usage: "Statistiques d'usage",
  matrice: "Matrice d'impact",
};

// Hauteur de la barre d'onglets Metabase, masquée car remplacée par notre bouton
const HAUTEUR_BARRE_ONGLETS_PX = 56;
const HAUTEUR_DASHBOARD_PX = 800;

export function StatistiquesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vueParam = searchParams.get("vue");
  const vue: VueStatistiques = isVueStatistiques(vueParam) ? vueParam : "usage";
  const vueAlternative: VueStatistiques = vue === "usage" ? "matrice" : "usage";

  // Le résultat est rattaché à sa vue : changer de vue repasse en chargement sans setState dans l'effet
  const [resultat, setResultat] = useState<{
    vue: VueStatistiques;
    url: string | null;
    erreur: boolean;
  } | null>(null);

  useEffect(() => {
    let annule = false;
    metabaseService
      .getEmbedUrl(vue)
      .then((url: string) => {
        if (!annule) setResultat({ vue, url, erreur: false });
      })
      .catch(() => {
        if (!annule) setResultat({ vue, url: null, erreur: true });
      });
    return () => {
      annule = true;
    };
  }, [vue]);

  const resultatCourant = resultat?.vue === vue ? resultat : null;
  const loading = resultatCourant === null;
  const iframeUrl = resultatCourant?.url ?? null;
  const error = resultatCourant?.erreur ? "Impossible de charger le dashboard statistiques." : null;

  const basculerVue = (): void => {
    setSearchParams(vueAlternative === "usage" ? {} : { vue: vueAlternative });
  };

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <div className="flex items-center justify-between gap-4">
          <nav role="navigation" className="fr-breadcrumb" aria-label="vous etes ici :">
            <button
              type="button"
              className="fr-breadcrumb__button"
              aria-expanded="false"
              aria-controls="breadcrumb-statistiques"
            >
              Voir le Fil d'Ariane
            </button>
            <div className="fr-collapse" id="breadcrumb-statistiques">
              <ol className="fr-breadcrumb__list">
                <li>
                  <Link className="fr-breadcrumb__link" to="/">
                    Accueil
                  </Link>
                </li>
                <li>
                  <a className="fr-breadcrumb__link" aria-current="page">
                    Statistiques
                  </a>
                </li>
              </ol>
            </div>
          </nav>
          <button
            type="button"
            className={vueAlternative === "matrice" ? "fr-btn" : "fr-btn fr-btn--secondary"}
            onClick={basculerVue}
          >
            {LIBELLES_VUES[vueAlternative]}
          </button>
        </div>

        <h1 className="fr-h3">{LIBELLES_VUES[vue]}</h1>

        {loading && (
          <div className="fr-callout">
            <p className="fr-callout__text">Chargement du dashboard statistiques...</p>
          </div>
        )}

        {error && (
          <div className="fr-alert fr-alert--error fr-mb-4w">
            <h3 className="fr-alert__title">Erreur</h3>
            <p>{error}</p>
          </div>
        )}

        {iframeUrl && (
          <div
            // Rognage de la barre d'onglets Metabase (non masquable via l'embed), hors DSFR
            style={{ height: HAUTEUR_DASHBOARD_PX, overflow: "hidden" }}
          >
            <iframe
              key={vue}
              src={iframeUrl}
              title={`${LIBELLES_VUES[vue]} - dashboard Mutafriches`}
              width="100%"
              style={{
                border: "none",
                height: HAUTEUR_DASHBOARD_PX + HAUTEUR_BARRE_ONGLETS_PX,
                marginTop: -HAUTEUR_BARRE_ONGLETS_PX,
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
