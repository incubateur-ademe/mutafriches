import { BesoinMultisites } from "@mutafriches/shared-types";
import { libelleBesoin } from "./contact-confirmation.template";

export interface ContactNotificationData {
  email: string;
  besoin: BesoinMultisites | string;
  date: Date;
  evaluationId?: string;
}

// Email de notification envoyé à l'équipe à chaque demande de contact multisites
export function contactNotificationTemplate(data: ContactNotificationData): string {
  const dateFormatee = data.date.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; color: #161616; line-height: 1.5;">
    <h1 style="font-size: 20px;">Nouvelle demande de contact multisites</h1>
    <table style="border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 12px 4px 0;"><strong>Email :</strong></td>
        <td style="padding: 4px 0;">${data.email}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><strong>Besoin :</strong></td>
        <td style="padding: 4px 0;">${libelleBesoin(data.besoin)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;"><strong>Date :</strong></td>
        <td style="padding: 4px 0;">${dateFormatee}</td>
      </tr>
      ${
        data.evaluationId
          ? `<tr>
        <td style="padding: 4px 12px 4px 0;"><strong>Évaluation :</strong></td>
        <td style="padding: 4px 0;">${data.evaluationId}</td>
      </tr>`
          : ""
      }
    </table>
  </body>
</html>`;
}
