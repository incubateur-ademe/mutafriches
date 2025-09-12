import { ReactNode } from "react";

interface SimpleIframeLayoutProps {
  children: ReactNode;
}

export function SimpleIframeLayout({ children }: SimpleIframeLayoutProps) {
  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-lg-10">
          <div className="fade-in">
            <div className="fr-notice fr-notice--warning fr-mb-4w">
              <div className="fr-container">
                <div className="fr-notice__body">
                  <p>
                    <span className="fr-notice__title">
                      Plateforme en cours de construction, les données ne sont pas encore toutes
                      disponibles.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
