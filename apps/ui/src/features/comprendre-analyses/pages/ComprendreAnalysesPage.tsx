import { useEffect, useRef } from "react";
import { Layout } from "../../../shared/components/layout/Layout";
import { DsfrTabs } from "../../../shared/components/dsfr/DsfrTabs";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { DefinitionsCriteresTable } from "../components/DefinitionsCriteresTable";
import { SourcesCriteresTable } from "../components/SourcesCriteresTable";

export function ComprendreAnalysesPage() {
  const {
    trackConsultationComprendreAnalyses,
    trackOngletComprendreAnalyses,
    trackClicLienSourceCritere,
  } = useEventTracking();

  // Une seule consultation par affichage, y compris sous le double montage du mode strict
  const consultationTracee = useRef(false);
  useEffect(() => {
    if (consultationTracee.current) return;
    consultationTracee.current = true;
    void trackConsultationComprendreAnalyses();
  }, [trackConsultationComprendreAnalyses]);

  return (
    <Layout>
      <div className="fr-col-12">
        <h1>Comprendre les analyses</h1>
        <p className="fr-mb-4w">
          Le tableau ci-dessous détaille l'ensemble des critères utilisés par Mutafriches et leur
          poids dans l'évaluation de chaque usage. Pour examiner les sources de chaque critère et
          leur mise à jour, référez-vous à l'onglet « Sources des données ».
        </p>

        <DsfrTabs
          ongletsFiges
          onTabChange={(onglet) => void trackOngletComprendreAnalyses(onglet)}
          ariaLabel="Comprendre les analyses : sélection de l'onglet"
          tabs={[
            {
              id: "definitions",
              label: "Définitions et coef. des critères",
              panel: (
                <>
                  <p className="fr-text--sm">
                    Les critères sont classés par coefficient décroissant. Chaque valeur d'un
                    critère reçoit un score par usage, de −2 (très défavorable) à +2 (très
                    favorable) ; 0,5 est neutre. Ce score est multiplié par le coefficient du
                    critère. Un picto rouge signale une valeur qui rend l'usage incompatible, seule
                    ou combinée à une autre.
                  </p>
                  <DefinitionsCriteresTable />
                </>
              ),
            },
            {
              id: "sources",
              label: "Sources des données",
              panel: (
                <SourcesCriteresTable
                  onClicLienSource={(critere, source) =>
                    void trackClicLienSourceCritere(critere, source)
                  }
                />
              ),
            },
          ]}
        />
      </div>
    </Layout>
  );
}
