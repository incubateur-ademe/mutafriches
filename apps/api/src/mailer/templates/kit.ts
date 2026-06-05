// Kit de composants pour les emails : HTML + styles 100% inline (compatibilité clients mail).
// Pas de React/MJML côté backend : de simples fonctions TS qui renvoient des chaînes HTML.

const COULEUR_TEXTE = "#161616";
const COULEUR_BLEU = "#000091"; // Bleu France
const COULEUR_GRIS = "#666666";

export function heading(texte: string): string {
  return `<h1 style="font-size: 20px; color: ${COULEUR_TEXTE}; margin: 0 0 16px;">${texte}</h1>`;
}

export function paragraph(html: string): string {
  return `<p style="font-size: 14px; line-height: 1.5; color: ${COULEUR_TEXTE}; margin: 0 0 16px;">${html}</p>`;
}

export function subheading(texte: string): string {
  return `<h2 style="font-size: 15px; color: ${COULEUR_TEXTE}; margin: 24px 0 8px;">${texte}</h2>`;
}

export function list(items: string[]): string {
  const elements = items.map((item) => `<li style="margin: 0 0 4px;">${item}</li>`).join("");
  return `<ul style="font-size: 14px; line-height: 1.5; color: ${COULEUR_TEXTE}; margin: 0 0 16px; padding-left: 20px;">${elements}</ul>`;
}

export function button(options: { href: string; label: string }): string {
  return `<p style="margin: 24px 0;">
    <a href="${options.href}" style="display: inline-block; background-color: ${COULEUR_BLEU}; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 14px; border-radius: 4px;">${options.label}</a>
  </p>`;
}

type AlertVariant = "info" | "success" | "warning";

const ALERT_COULEURS: Record<AlertVariant, { fond: string; bordure: string }> = {
  info: { fond: "#e8edff", bordure: "#000091" },
  success: { fond: "#dffee6", bordure: "#18753c" },
  warning: { fond: "#fff4e0", bordure: "#b34000" },
};

export function alert(options: { texte: string; variant?: AlertVariant }): string {
  const couleurs = ALERT_COULEURS[options.variant ?? "info"];
  return `<div style="background-color: ${couleurs.fond}; border-left: 4px solid ${couleurs.bordure}; padding: 12px 16px; margin: 0 0 16px; font-size: 14px; color: ${COULEUR_TEXTE};">${options.texte}</div>`;
}

// Layout commun : enveloppe HTML + conteneur centré. Pas de footer institutionnel par défaut.
export function layout(options: { title: string; children: string }): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Arial, Helvetica, sans-serif; color: ${COULEUR_TEXTE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px;">
            <tr>
              <td style="padding: 32px;">
                ${options.children}
                <p style="font-size: 12px; color: ${COULEUR_GRIS}; margin: 24px 0 0;">Mutafriches</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
