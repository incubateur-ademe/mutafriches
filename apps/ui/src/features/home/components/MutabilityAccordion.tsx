import React from "react";

export const MutabilityAccordion: React.FC = () => {
  return (
    <div className="fr-mt-8w fr-mb-4w">
      <section className="fr-accordion">
        <h3 className="fr-accordion__title">
          <button
            type="button"
            className="fr-accordion__btn"
            aria-expanded="true"
            aria-controls="accordion-mutabilite"
          >
            Qu'est ce que la mutabilite ?
          </button>
        </h3>
        <div className="fr-collapse" id="accordion-mutabilite">
          <p>
            La mutabilite d'une friche, c'est l'estimation de son potentiel de reconversion vers
            differents usages en tenant compte des contraintes du site et des opportunites de son
            environnement.
          </p>
        </div>
      </section>
    </div>
  );
};
