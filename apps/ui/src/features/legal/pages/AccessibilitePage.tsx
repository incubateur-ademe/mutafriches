import React from "react";
import { Layout } from "@shared/components/layout/Layout";

export const AccessibilitePage: React.FC = () => {
  return (
    <Layout>
      <div className="fr-mb-4w">
        <h1 className="fr-h3">Déclaration d'accessibilité</h1>
        <p className="fr-text--sm fr-mb-0">Établie le 24 juin 2026.</p>
      </div>

      <p>
        L'ADEME s'engage à rendre ses sites internet accessibles conformément à l'article 47 de la
        loi n° 2005-102 du 11 février 2005. Cette déclaration d'accessibilité s'applique au site
        Mutafriches.
      </p>

      <h2 className="fr-h5">État de conformité</h2>
      <p>
        En l'absence d'audit et dans l'attente de celui-ci, le site Mutafriches n'est{" "}
        <strong>pas en conformité</strong> avec le référentiel général d'amélioration de
        l'accessibilité (RGAA). Les non-conformités éventuelles n'ont pas encore été recensées.
      </p>

      <h2 className="fr-h5">Contenus non accessibles</h2>
      <p>
        Le site s'appuie sur le Système de design de l'État (DSFR), conçu pour respecter les
        critères d'accessibilité, mais aucun audit complet n'a encore été réalisé. Les contenus non
        conformes seront listés ici à l'issue de cet audit.
      </p>

      <h2 className="fr-h5">Établissement de cette déclaration</h2>
      <p>
        Cette déclaration a été établie le 24 juin 2026. Technologie utilisée pour la réalisation du
        site : React, avec le Système de design de l'État (DSFR). Aucun test utilisateur ni outil
        d'évaluation automatisé n'a encore été employé pour vérifier l'accessibilité.
      </p>

      <h2 className="fr-h5">Retour d'information et contact</h2>
      <p>
        Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter l'équipe
        Mutafriches pour être orienté vers une alternative accessible ou obtenir le contenu sous une
        autre forme.
      </p>

      <h2 className="fr-h5">Voie de recours</h2>
      <p>
        Si vous avez signalé un défaut d'accessibilité vous empêchant d'accéder à un contenu ou à un
        service et que vous n'avez pas obtenu de réponse satisfaisante, vous pouvez :
      </p>
      <ul>
        <li>
          écrire un message au{" "}
          <a
            href="https://formulaire.defenseurdesdroits.fr/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Défenseur des droits
          </a>{" "}
          ;
        </li>
        <li>contacter le délégué du Défenseur des droits dans votre région ;</li>
        <li>
          envoyer un courrier par la poste (gratuit, sans timbre) : Défenseur des droits, Libre
          réponse 71120, 75342 Paris CEDEX 07.
        </li>
      </ul>
    </Layout>
  );
};
