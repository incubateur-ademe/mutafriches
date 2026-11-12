import { ReactNode } from "react";

interface SolutionIntegrationCardProps {
  titre: string;
  accroche: string;
  tags: string[];
  image: string;
  children: ReactNode;
  action: ReactNode;
}

export function SolutionIntegrationCard({
  titre,
  accroche,
  tags,
  image,
  children,
  action,
}: SolutionIntegrationCardProps) {
  return (
    <div className="fr-card fr-card--horizontal fr-card--horizontal-half fr-mb-6w">
      <div className="fr-card__body">
        <div className="fr-card__content">
          <h2 className="fr-card__title">
            {titre}
            <span className="fr-text--lead fr-text--regular block">{accroche}</span>
          </h2>
          <p className="fr-card__desc">{children}</p>
          <div className="fr-card__start">
            <ul className="fr-tags-group">
              {tags.map((tag) => (
                <li key={tag}>
                  <p className="fr-tag">{tag}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="fr-card__footer">{action}</div>
      </div>
      <div className="fr-card__header">
        <div className="fr-card__img">
          <img className="fr-responsive-img" src={image} alt="" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
