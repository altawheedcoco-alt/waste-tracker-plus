import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import FeaturesList from "@/components/FeaturesList";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import DocumentVerification from "@/components/DocumentVerification";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
  );
};

export default Index;
