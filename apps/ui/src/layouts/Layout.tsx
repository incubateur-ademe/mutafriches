import { ReactNode } from "react";
import { useIsIframeMode } from "../context";
import { Footer, Header, SimpleHeader } from "../components/layout";

interface LayoutProps {
  children: ReactNode;
  showSimpleHeader?: boolean;
}

export function Layout({ children, showSimpleHeader = false }: LayoutProps) {
  const isInIframe = useIsIframeMode();

  // Mode iframe : layout minimal
  if (isInIframe) {
    return (
      <div className="fr-container fr-py-4w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-lg-10">
            <div className="fade-in">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  // Mode standalone : layout complet
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="fr-container fr-py-4w">
          <div className="fade-in">
            {showSimpleHeader && <SimpleHeader />}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
