import { BesoinMultisites } from "@mutafriches/shared-types";
import { libelleBesoin } from "./contact-confirmation.template";
import { button, heading, layout, paragraph } from "./kit";

export interface ContactNotificationData {
  email: string;
  besoin: BesoinMultisites | string;
  date: Date;
  evaluationId?: string;
  dashboardUrl?: string;
}

// Email de notification envoyé à l'équipe à chaque demande de contact multisites
export function contactNotificationTemplate(data: ContactNotificationData): string {
  const dateFormatee = data.date.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const lignes = [
    `<strong>Email :</strong> ${data.email}`,
    `<strong>Besoin :</strong> ${libelleBesoin(data.besoin)}`,
    `<strong>Date :</strong> ${dateFormatee}`,
  ];
  if (data.evaluationId) {
    lignes.push(`<strong>Évaluation :</strong> ${data.evaluationId}`);
  }

  return layout({
    title: "Nouvelle demande de contact multisites",
    children: [
      heading("Nouvelle demande de contact multisites"),
      paragraph(lignes.join("<br />")),
      data.dashboardUrl
        ? button({ href: data.dashboardUrl, label: "Voir toutes les demandes sur Metabase" })
        : "",
    ].join("\n"),
  });
}
