import React from "react";
import { Layout } from "@shared/components/layout/Layout";

export const PolitiqueConfidentialitePage: React.FC = () => {
  return (
    <Layout>
      <div className="fr-mb-4w">
        <h1 className="fr-h3">Politique de confidentialité</h1>
        <p className="fr-text--sm fr-mb-0">Dernière mise à jour : 25 novembre 2026.</p>
      </div>

      <p className="fr-text--lg">
        Mutafriches est un service public, édité par l'ADEME, qui aide les collectivités et acteurs
        de l'aménagement à analyser la mutabilité des friches urbaines. Cette politique décrit, de
        façon simple, quelles données sont traitées et pourquoi.
      </p>

      <h2 className="fr-h5">1. Responsable de traitement</h2>
      <p>
        Le responsable de traitement est l'Agence de la transition écologique (ADEME), établissement
        public dont le siège est situé 20 avenue du Grésillé, BP 90406, 49004 Angers Cedex 01.
        L'ADEME a désigné un délégué à la protection des données (DPO), point de contact privilégié
        de la Commission nationale de l'informatique et des libertés (CNIL).
      </p>

      <h2 className="fr-h5">2. Quelles données sont collectées ?</h2>
      <p>Mutafriches fonctionne sans création de compte ni authentification. Sont traités :</p>
      <ul>
        <li>
          les <strong>identifiants cadastraux</strong> et données de localisation des parcelles que
          vous analysez (données publiques, non personnelles dans la majorité des cas) ;
        </li>
        <li>
          un <strong>identifiant visiteur anonyme</strong> stocké dans votre navigateur, qui ne
          contient aucune donnée personnelle et sert uniquement à mesurer la récurrence d'usage ;
        </li>
        <li>
          des <strong>données techniques</strong> liées à la navigation (type de navigateur,
          journaux de connexion) ;
        </li>
        <li>
          votre <strong>adresse e-mail</strong>, uniquement si vous nous l'indiquez via une demande
          de contact ; elle sert à vous répondre et n'est pas conservée dans nos statistiques ;
        </li>
        <li>
          vos <strong>prénom</strong>, <strong>nom</strong> et <strong>adresse e-mail</strong>,
          ainsi que le nom de votre structure, son type et votre nom de domaine, uniquement si vous
          déclarez utiliser l'API, l'extension QGIS ou l'iframe, ou si vous demandez une page
          personnalisée. Vos prénom, nom et adresse e-mail sont conservés dans notre outil
          d'e-mailing, pas dans la base de Mutafriches.
        </li>
      </ul>

      <h2 className="fr-h5">3. Pourquoi ces données sont-elles traitées ?</h2>
      <ul>
        <li>fournir l'analyse de mutabilité des friches demandée ;</li>
        <li>
          mesurer l'usage du service et l'améliorer (statistiques anonymes, dont la part
          d'utilisateurs récurrents et leur provenance) ;
        </li>
        <li>répondre aux demandes de contact que vous nous adressez ;</li>
        <li>
          suivre l'accès au service que vous avez déclaré utiliser, et vous contacter au sujet de
          son fonctionnement ;
        </li>
        <li>
          si vous l'avez accepté en cochant la case prévue à cet effet, recueillir vos retours
          d'expérience et vous informer des évolutions du service.
        </li>
      </ul>

      <h2 className="fr-h5">4. Sur quelle base légale ?</h2>
      <p>
        Les traitements reposent sur l'exécution d'une <strong>mission d'intérêt public</strong>{" "}
        dont est investie l'ADEME. La mesure d'audience est réalisée à des fins strictement internes
        d'amélioration du service. Les demandes de retours d'expérience et l'information sur les
        évolutions du service reposent sur votre <strong>consentement</strong>, que vous pouvez
        retirer à tout moment, par le lien de désinscription de nos e-mails ou en nous écrivant.
      </p>

      <h2 className="fr-h5">5. Combien de temps sont-elles conservées ?</h2>
      <p>
        Les données d'usage (analyses, événements et identifiant visiteur anonyme) sont conservées
        pendant une durée maximale de <strong>36 mois</strong>. Les adresses e-mail des demandes de
        contact sont conservées le temps nécessaire au traitement de la demande, puis archivées
        conformément aux délais légaux applicables. Les prénom, nom et adresse e-mail d'une
        déclaration d'utilisation sont conservés au plus <strong>36 mois</strong> après cette
        déclaration ; vous pouvez demander leur retrait à tout moment.
      </p>
      <p className="fr-text--sm fr-mb-2w">
        Cette durée est provisoire et fera l'objet d'une politique de purge dédiée.
      </p>

      <h2 className="fr-h5">6. Qui a accès aux données ?</h2>
      <p>
        Seules les personnes habilitées de l'équipe Mutafriches et de l'ADEME accèdent aux données,
        pour les finalités décrites ci-dessus. L'hébergement est assuré par Scalingo (France, Union
        européenne). Les prénoms, noms et adresses e-mail des déclarations d'utilisation sont
        confiés à Brevo, sous-traitant chargé de l'envoi de nos e-mails. Aucune donnée n'est cédée à
        des tiers à des fins commerciales ni transférée hors de l'Union européenne.
      </p>

      <h2 className="fr-h5">7. Cookies et traceurs</h2>
      <p>
        Mutafriches n'utilise <strong>aucun cookie publicitaire ni traceur tiers</strong>. Seul un
        identifiant anonyme est stocké localement dans votre navigateur (clé
        <code> mutafriches_visitor_id</code>) à des fins de mesure d'audience interne. Vous pouvez
        le supprimer à tout moment en vidant les données de site de votre navigateur.
      </p>

      <h2 className="fr-h5">8. Vos droits</h2>
      <p>
        Conformément au RGPD et à la loi « Informatique et libertés », vous disposez d'un droit
        d'accès, de rectification, d'effacement, de limitation et d'opposition sur vos données. Pour
        les exercer, contactez le délégué à la protection des données de l'ADEME. Si vous estimez,
        après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une
        réclamation à la{" "}
        <a href="https://www.cnil.fr/" rel="noopener noreferrer" target="_blank">
          CNIL
        </a>
        .
      </p>
    </Layout>
  );
};
