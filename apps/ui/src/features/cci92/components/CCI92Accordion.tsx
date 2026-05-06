import React from "react";

export type CCI92AccordionTagVariant = "automatique" | "saisie" | "calcule";

interface CCI92AccordionProps {
  title: string;
  tag: { label: string; variant: CCI92AccordionTagVariant };
  defaultOpen?: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}

export const CCI92Accordion: React.FC<CCI92AccordionProps> = ({
  title,
  tag,
  defaultOpen = false,
  highlight = false,
  children,
}) => {
  const className = ["cci92-accordion", highlight ? "cci92-accordion--highlight" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <details className={className} open={defaultOpen}>
      <summary className="cci92-accordion__summary">
        <span className="cci92-accordion__title">{title}</span>
        <span
          className={`fr-tag fr-tag--sm cci92-accordion__tag cci92-accordion__tag--${tag.variant}`}
        >
          {tag.label}
        </span>
      </summary>
      <div className="cci92-accordion__content">{children}</div>
    </details>
  );
};
