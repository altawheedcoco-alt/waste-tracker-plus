import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import FeaturesList from "@/components/FeaturesList";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import DocumentVerification from "@/components/DocumentVerification";
import LandingWrapper from "@/components/LandingWrapper";

const Index = () => {
  return (
    <LandingWrapper>
      <div className="min-h-screen bg-[hsl(140,20%,98%)]">
        <Header />
        <main>
          <Hero />
          <DocumentVerification />
          <Stats />
          <FeaturesList />
          <Features />
          <Services />
          <CTA />
        </main>
        <Footer />
      </div>
    </LandingWrapper>
  );
};

export default Index;
