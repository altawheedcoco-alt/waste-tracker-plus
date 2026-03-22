import { memo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Gavel, TrendingDown, Shield, Package, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MarketplacePreview = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      titleAr: "سوق الشحنات المفتوح",
      titleEn: "Open Shipment Marketplace",
      descAr: "السائقون المستقلون يتصفحون الشحنات المتاحة ويختارون ما يناسبهم — حرية كاملة",
      descEn: "Independent drivers browse available shipments and choose freely",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Gavel,
      titleAr: "نظام المزايدة العكسية",
      titleEn: "Reverse Auction System",
      descAr: "الشحنة تُطرح والسائقون يتنافسون بأفضل سعر — أقل تكلفة وأعلى جودة",
      descEn: "Shipment posted, drivers compete with best price — lowest cost, highest quality",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: TrendingDown,
      titleAr: "تسعير ديناميكي ذكي",
      titleEn: "Smart Dynamic Pricing",
      descAr: "أسعار تتكيف مع العرض والطلب والمسافة ونوع المخلفات — عدالة للجميع",
      descEn: "Prices adapt to supply, demand, distance & waste type — fair for all",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: Shield,
      titleAr: "حماية وضمان",
      titleEn: "Protection & Guarantee",
      descAr: "حجز الرصيد المعلق تلقائياً وتحريره عند التسليم — لا مخاطرة",
      descEn: "Auto-escrow on acceptance, released on delivery — zero risk",
      gradient: "from-blue-500 to-cyan-600",
    },
  ];

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden bg-muted/20">
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/[0.04] rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? "سوق الشحنات والمزايدة" : "Shipment Marketplace & Auction"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? "سوق رقمي" : "A Digital Market"}
            <span className="text-primary"> {isAr ? "للشحنات والنقل" : "for Shipments & Transport"}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "منصة تبادل تربط مولّدي المخلفات بالسائقين المستقلين وجهات النقل — بشفافية كاملة وتنافسية عادلة"
              : "An exchange platform connecting waste generators with independent drivers & transporters — full transparency"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8">
          {features.map((f, i) => (
            <motion.div
              key={f.titleAr}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card border border-border/50 rounded-2xl p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                {isAr ? f.titleAr : f.titleEn}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isAr ? f.descAr : f.descEn}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            variant="default"
            size="lg"
            className="gap-2 font-bold shadow-lg"
            onClick={() => navigate("/auth?mode=register&type=transporter")}
          >
            {isAr ? "انضم كسائق مستقل" : "Join as Independent Driver"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
});

MarketplacePreview.displayName = "MarketplacePreview";
export default MarketplacePreview;
