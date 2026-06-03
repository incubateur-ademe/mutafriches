import { BesoinMultisites } from "@mutafriches/shared-types";

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
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; color: #161616; line-height: 1.5;">
    <h1 style="font-size: 20px;">Merci !</h1>
    <p>Votre demande a bien été envoyée. Nous reviendrons rapidement vers vous pour vous orienter vers la bonne solution.</p>
    <p style="color: #666;">Besoin exprimé : <strong>${libelleBesoin(besoin)}</strong></p>
    <p>À bientôt,<br />L'équipe Mutafriches</p>
  </body>
</html>`;
}
