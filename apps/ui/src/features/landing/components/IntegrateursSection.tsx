interface LogoUtilisateur {
  nom: string;
  src: string;
  // Hauteur en em, adaptée au ratio de chaque logo pour un poids visuel homogène
  hauteur: number;
}

const DOSSIER = "/images/logos/utilisateurs";

const LOGOS: LogoUtilisateur[] = [
  { nom: "Bénéfriches", src: `${DOSSIER}/benefriches.png`, hauteur: 2.25 },
  { nom: "CCI Hauts-de-Seine", src: `${DOSSIER}/cci-hauts-de-seine.png`, hauteur: 2.25 },
  { nom: "UrbanVitaliz", src: `${DOSSIER}/urbanvitaliz.png`, hauteur: 2.25 },
  { nom: "L'Institut Paris Region", src: `${DOSSIER}/institut-paris-region.png`, hauteur: 4.25 },
  { nom: "EPFGE", src: `${DOSSIER}/epfge.png`, hauteur: 4.25 },
  { nom: "AURA", src: `${DOSSIER}/aura.png`, hauteur: 4.25 },
  { nom: "Préfet des Vosges", src: `${DOSSIER}/prefet-vosges.png`, hauteur: 5 },
  { nom: "SCET", src: `${DOSSIER}/scet.png`, hauteur: 3 },
];

export function IntegrateursSection() {
  return (
    <section className="fr-py-8w">
      {/* Hauteurs en em : la taille de police suit la largeur d'écran pour tenir sur une ligne */}
      <style>{`
        .logos-utilisateurs { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 2rem 1.5rem; }
        .logos-utilisateurs img { width: auto; max-width: none; }
        @media (min-width: 992px) {
          .logos-utilisateurs { font-size: min(16px, 1.4vw); flex-wrap: nowrap; justify-content: space-between; gap: 1.5em; }
        }
        @media (max-width: 991px) {
          .logos-utilisateurs { font-size: 12px; }
        }
      `}</style>
      <div className="fr-container">
        <h2 className="fr-mb-4w">Ils utilisent déjà Mutafriches</h2>

        <ul className="fr-raw-list logos-utilisateurs">
          {LOGOS.map((logo) => (
            <li key={logo.nom}>
              <img
                src={logo.src}
                alt={logo.nom}
                style={{ height: `${logo.hauteur}em` }}
                className="grayscale"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
