import { BesoinMultisites } from "@mutafriches/shared-types";
import { layout, list, paragraph, subheading } from "./kit";

const LIBELLES_BESOIN: Record<string, string> = {
  [BesoinMultisites.SUIVI_COMPARAISON]:
    "Suivre et comparer une liste de sites dans un espace dédié",
  [BesoinMultisites.INTEGRATION_OUTILS]:
    "Intégrer Mutafriches à vos outils métier (SIG, portail cartographique, etc.)",
};

export function libelleBesoin(besoin: BesoinMultisites | string): string {
  return LIBELLES_BESOIN[besoin] ?? String(besoin);
}

export const CONTACT_CONFIRMATION_SUBJECT =
  "Votre demande concernant l'analyse multi-sites a bien été prise en compte";

// Email de confirmation envoyé à l'utilisateur après une demande de contact multisites
export function contactConfirmationTemplate(): string {
  return layout({
    title: CONTACT_CONFIRMATION_SUBJECT,
    children: [
      paragraph("Bonjour,"),
      paragraph("Merci pour l'intérêt que vous portez à Mutafriches."),
      paragraph(
        "Nous avons bien reçu votre demande concernant l'analyse de plusieurs sites ou l'intégration des fonctionnalités Mutafriches dans vos outils. Un membre de notre équipe vous contactera sous peu afin de mieux comprendre votre besoin et de vous proposer la solution la plus adaptée à votre contexte.",
      ),
      paragraph(
        "Mutafriches est conçu pour s'intégrer au plus près des pratiques de ses utilisateurs. Vos retours et vos usages nous permettent de faire évoluer le service et d'optimiser notre intégration.",
      ),
      paragraph("Selon vos besoins, plusieurs solutions peuvent être envisagées :"),
      subheading("1. Analyse d'un portefeuille de sites"),
      list([
        "Transmission d'une liste de sites à analyser (via IDU)",
        "Espace dédié pour consulter, comparer et exploiter les résultats",
      ]),
      subheading("2. Connexion via l'API Mutafriches"),
      list([
        "Appels automatisés depuis vos applications ou services internes",
        "Intégration dans vos processus existants",
      ]),
      subheading("3. Intégration dans vos outils métier"),
      list([
        "Accédez aux fonctionnalités Mutafriches directement depuis les outils que vous utilisez déjà.",
        "Consultez, analysez et comparez des sites sans changer d'environnement de travail.",
        "Compatible avec de nombreux supports : SIG bureautiques, SIG en ligne, portails cartographiques, observatoires territoriaux ou applications métier.",
      ]),
      "<!-- TODO VISUEL : insérer un visuel illustrant les trois modes d'intégration -->",
      paragraph("Merci pour votre confiance."),
      paragraph("L'équipe Mutafriches"),
      paragraph(
        '<em style="color: #666666;">Au plaisir d\'échanger avec vous et de construire ensemble les usages de demain.</em>',
      ),
    ].join("\n"),
  });
}
