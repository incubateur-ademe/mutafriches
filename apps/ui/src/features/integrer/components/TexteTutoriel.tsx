import type { ParagrapheTutoriel } from "../data/tutoriel-qgis";

/** Texte du tutoriel, avec son lien externe éventuel. */
export function TexteTutoriel({ paragraphe }: { paragraphe: ParagrapheTutoriel }) {
  if (typeof paragraphe === "string") return <>{paragraphe}</>;
  return (
    <>
      {paragraphe.avant}
      <a
        href={paragraphe.lien.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${paragraphe.lien.libelle} - nouvelle fenêtre`}
      >
        {paragraphe.lien.libelle}
      </a>
      {paragraphe.apres}
    </>
  );
}
