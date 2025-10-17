import React from "react";

interface PartnerCardProps {
  logo: string;
  logoAlt: string;
  title: string;
  description: string;
  url: string;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
  logo,
  logoAlt,
  title,
  description,
  url,
}) => {
  return (
    <div className="fr-col-12 fr-col-md-4">
      <div className="fr-mb-2w">
        <img src={logo} alt={logoAlt} className="fr-responsive-img" style={{ maxWidth: "200px" }} />
      </div>
      <div className="fr-mb-2w">
        <strong>{title}</strong>
      </div>
      <p className="fr-text--sm fr-mb-2w">{description}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="fr-link">
        {new URL(url).hostname}
      </a>
    </div>
  );
};
