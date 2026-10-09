import React, { useId } from "react";
import { TAG_COLORS, TagVariant } from "@shared/components/tag";
import "./DsfrAccordion.css";

/**
 * Suffixe d'un modifier DSFR de badge (couleur sémantique ou palette nommée).
 * Exemples : "info", "success", "warning", "error", "new",
 * "green-tilleul-verveine", "blue-ecume", "purple-glycine"...
 * Voir https://www.systeme-de-design.gouv.fr/composants-et-modeles/composants/badge/
 */
export type DsfrBadgeVariant = string;

export interface DsfrAccordionBadge {
  label: string;
  /** Modifier DSFR (suffixe sans "fr-badge--"). Ex. "info", "green-tilleul-verveine". */
  variant?: DsfrBadgeVariant;
  /** Classe d'icône DSFR complète. Ex. "fr-icon-edit-line". */
  icon?: string;
  /** Position de l'icône — défaut "left". */
  iconPosition?: "left" | "right";
  /** Teinte de la maquette (prioritaire sur `variant`, sans icône). */
  tag?: TagVariant;
  /** Si true, badge sans `fr-badge--sm`. */
  large?: boolean;
}

export interface DsfrAccordionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: DsfrAccordionBadge;
  headingLevel?: 3 | 4 | 5 | 6;
  highlight?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

function tagStyle(tag: TagVariant): React.CSSProperties {
  const { textColor, backgroundColor } = TAG_COLORS[tag];
  return { color: textColor, backgroundColor };
}

function buildBadgeClassName(badge: DsfrAccordionBadge): string {
  const classes = ["fr-badge"];
  if (!badge.large) classes.push("fr-badge--sm");
  if (badge.tag) {
    classes.push("fr-badge--no-icon");
  } else if (badge.variant) {
    classes.push(`fr-badge--${badge.variant}`);
  }
  if (badge.icon && !badge.tag) {
    classes.push(badge.icon, `fr-badge--icon-${badge.iconPosition ?? "left"}`);
  }
  return classes.join(" ");
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
          {badge && (
            <span
              className={`${buildBadgeClassName(badge)} fr-mr-2w`}
              style={badge.tag ? tagStyle(badge.tag) : undefined}
            >
              {badge.label}
            </span>
          )}
        </button>
      </Heading>
      <div className="fr-collapse" id={collapseId}>
        {children}
      </div>
    </section>
  );
};
