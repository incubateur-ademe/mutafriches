import React from "react";
import { Layout } from "@shared/components/layout/Layout";

export const MentionsLegalesPage: React.FC = () => {
  return (
    <Layout>
      <div className="fr-mb-4w">
        <h1 className="fr-h3">Mentions légales</h1>
        <p className="fr-text--sm fr-mb-0">Dernière mise à jour : 24 juin 2026.</p>
      </div>

      <h2 className="fr-h5">Éditeur</h2>
      <p>
        Mutafriches est édité par l'Agence de la transition écologique (ADEME), établissement public
        à caractère industriel et commercial, dont le siège est situé 20 avenue du Grésillé, BP
        90406, 49004 Angers Cedex 01.
      </p>
      <p>
        Le service est développé dans le cadre du programme beta.gouv de la Direction
        interministérielle du numérique (DINUM).
      </p>

      <h2 className="fr-h5">Directeur de la publication</h2>
      <p>Le directeur de la publication est le Président-directeur général de l'ADEME.</p>

      <h2 className="fr-h5">Hébergement</h2>
      <p>
        Le site est hébergé par Scalingo SAS, 3 place de Haguenau, 67000 Strasbourg, France. Les
        données sont hébergées au sein de l'Union européenne.
      </p>

      <h2 className="fr-h5">Contact</h2>
      <p>
        Pour toute question relative au service, vous pouvez écrire à l'équipe Mutafriches via les
        coordonnées indiquées sur le site de l'ADEME.
      </p>

      <h2 className="fr-h5">Propriété intellectuelle</h2>
      <p>
        Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce
        site sont proposés sous{" "}
        <a
          href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
          rel="noopener noreferrer"
          target="_blank"
        >
          licence Etalab 2.0
        </a>
        .
      </p>

      <h2 className="fr-h5">Données personnelles</h2>
      <p>
        Les modalités de traitement des données à caractère personnel sont décrites dans la{" "}
        <a href="/politique-de-confidentialite">politique de confidentialité</a>.
      </p>
    </Layout>
  );
};
