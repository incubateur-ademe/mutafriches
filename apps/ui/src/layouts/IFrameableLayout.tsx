import { ReactNode } from "react";
import { useIsIframeMode } from "../context";
import { SimpleHeader } from "../components/layout";

interface SimpleIframeLayoutProps {
  children: ReactNode;
}

export function IFrameableLayout({ children }: SimpleIframeLayoutProps) {
  const isInIframe = useIsIframeMode();

  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-lg-10">
          <div className="fade-in">
            {!isInIframe && <SimpleHeader />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
