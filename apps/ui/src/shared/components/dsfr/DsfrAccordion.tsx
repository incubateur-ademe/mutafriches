import React, { useId } from "react";
import "./DsfrAccordion.css";

export type DsfrBadgeVariant = "info" | "success" | "warning" | "new";

export interface DsfrAccordionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: { label: string; variant?: DsfrBadgeVariant };
  headingLevel?: 3 | 4 | 5 | 6;
  highlight?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const DsfrAccordion: React.FC<DsfrAccordionProps> = ({
  title,
  defaultOpen = false,
  badge,
  headingLevel = 3,
  highlight = false,
  id,
  className,
  children,
}) => {
  const generatedId = useId();
  const collapseId = id ?? `dsfr-accordion-${generatedId.replace(/:/g, "")}`;

  const sectionClass = [
    "fr-accordion",
    highlight ? "dsfr-accordion--highlight" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const badgeClass = badge?.variant
    ? `fr-badge fr-badge--sm fr-badge--${badge.variant}`
    : "fr-badge fr-badge--sm";

  const Heading = `h${headingLevel}` as "h3" | "h4" | "h5" | "h6";

  return (
    <section className={sectionClass}>
      <Heading className="fr-accordion__title">
        <button
          type="button"
          className="fr-accordion__btn"
          aria-expanded={defaultOpen ? "true" : "false"}
          aria-controls={collapseId}
        >
          <span className="dsfr-accordion__label">{title}</span>
          {badge && <span className={`${badgeClass} fr-mr-2w`}>{badge.label}</span>}
        </button>
      </Heading>
      <div className="fr-collapse" id={collapseId}>
        {children}
      </div>
    </section>
  );
};
