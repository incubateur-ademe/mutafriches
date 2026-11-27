import { ReactNode } from "react";

interface SolutionIntegrationCardProps {
  titre: string;
  accroche: string;
  tags: string[];
  image: string;
  children: ReactNode;
  action: ReactNode;
  // Horizontale : image à gauche sur toute la largeur. Verticale : image en haut, pour une grille.
  disposition?: "horizontale" | "verticale";
}

export function SolutionIntegrationCard({
  titre,
  accroche,
  tags,
  image,
  children,
  action,
  disposition = "horizontale",
}: SolutionIntegrationCardProps) {
  const horizontale = disposition === "horizontale";

  return (
    <div
      className={
        horizontale
          ? "fr-card fr-card--lg fr-card--horizontal fr-card--horizontal-half fr-mb-3w"
          : "fr-card"
      }
    >
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h2 className="fr-card__title fr-text-title--blue-france">
            {titre}
            <span className="fr-text--regular block">{accroche}</span>
          </h2>
          <p className={horizontale ? "fr-card__desc fr-text--lg" : "fr-card__desc"}>{children}</p>
          <div className="fr-card__start">
            <ul className="fr-tags-group">
              {tags.map((tag) => (
                <li key={tag}>
                  <p className={horizontale ? "fr-tag" : "fr-tag fr-tag--sm"}>{tag}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fr-card__footer">{action}</div>
      </div>
      <div className="fr-card__header">
        <div className="fr-card__img">
          {/* Visuels pré-recadrés au format du cadre ; sur cadre étroit, on garde la droite (tableaux de bord) */}
          <img className="fr-responsive-img object-right!" src={image} alt="" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
