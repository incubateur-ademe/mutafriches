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
            Qu'est ce que la mutabilité ?
          </button>
        </h3>
        <div className="fr-collapse" id="accordion-mutabilite">
          <p>
            La mutabilité d'une friche, c'est l'estimation de son potentiel de reconversion vers
            différents usages en tenant compte des contraintes du site et des opportunités de son
            environnement.
          </p>
        </div>
      </section>
    </div>
  );
};
