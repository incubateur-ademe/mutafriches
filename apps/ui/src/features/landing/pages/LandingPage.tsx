import { Layout } from "../../../shared/components/layout/Layout";
import { HeroSection } from "../components/HeroSection";
import { MutabiliteSection } from "../components/MutabiliteSection";
import { CommentCaMarcheSection } from "../components/CommentCaMarcheSection";
import { UsagesSection } from "../components/UsagesSection";
import { IntegrationSection } from "../components/IntegrationSection";
import { IntegrateursSection } from "../components/IntegrateursSection";

export function LandingPage() {
  return (
    <Layout fullWidth>
      <HeroSection />
      <MutabiliteSection />
      <CommentCaMarcheSection />
      <UsagesSection />
      <IntegrationSection />
      <IntegrateursSection />
    </Layout>
  );
}
