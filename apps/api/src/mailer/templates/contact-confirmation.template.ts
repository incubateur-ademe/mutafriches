import { BesoinMultisites } from "@mutafriches/shared-types";
import { heading, layout, paragraph } from "./kit";

const LIBELLES_BESOIN: Record<string, string> = {
  [BesoinMultisites.SUIVI_COMPARAISON]:
    "Suivre et comparer une liste de sites dans un espace dédié",
  [BesoinMultisites.INTEGRATION_OUTILS]:
    "Intégrer Mutafriches à vos outils métier (SIG, portail cartographique, etc.)",
};

export function libelleBesoin(besoin: BesoinMultisites | string): string {
  return LIBELLES_BESOIN[besoin] ?? String(besoin);
}

// Email de confirmation envoyé à l'utilisateur après une demande de contact multisites
export function contactConfirmationTemplate(besoin: BesoinMultisites | string): string {
  return layout({
    title: "Votre demande Mutafriches a bien été reçue",
    children: [
      heading("Merci !"),
      paragraph(
        "Votre demande a bien été envoyée. Nous reviendrons rapidement vers vous pour vous orienter vers la bonne solution.",
      ),
      paragraph(`Besoin exprimé : <strong>${libelleBesoin(besoin)}</strong>`),
      paragraph("À bientôt,<br />L'équipe Mutafriches"),
    ].join("\n"),
  });
}
