export function SimpleHeader() {
  return (
    <>
      {/* Titre et logo */}
      <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
        <div className="fr-col">
          <h1 className="fr-mb-0">
            <img
              src="/images/logo-mutafriches.svg"
              alt="Mutafriches"
              style={{ height: "6rem", width: "auto" }}
            />
          </h1>
        </div>
        <div className="fr-col-auto">
          <img
            src="/images/logo-ademe.svg"
            alt="Logo ADEME"
            className="fr-responsive-img"
            style={{ maxHeight: "6rem" }}
          />
        </div>
      </div>

      <p>Trouvez le meilleur usage pour votre site en friche</p>
      <hr />
    </>
  );
}
