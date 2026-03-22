import { memo } from "react";
import { motion } from "framer-motion";
import { Star, Award, TrendingUp, ShieldCheck, Users, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const levels = [
  { titleAr: "جديد", titleEn: "New", minTrips: 0, color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300", icon: "🌱" },
  { titleAr: "صاعد", titleEn: "Rising", minTrips: 10, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: "⭐" },
  { titleAr: "موثوق", titleEn: "Trusted", minTrips: 50, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", icon: "🏆" },
  { titleAr: "نخبة", titleEn: "Elite", minTrips: 200, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: "👑" },
];

const RatingTrustSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden bg-muted/20">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? "نظام التقييم والسمعة" : "Rating & Reputation System"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? "ثقة مبنية" : "Trust Built"}
            <span className="text-primary"> {isAr ? "على البيانات" : "on Data"}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "نظام تقييم ثنائي الاتجاه يبني سمعة حقيقية — الجهة تقيّم السائق والسائق يقيّم الجهة"
              : "Dual-direction rating system building real reputation — companies rate drivers & drivers rate companies"}
          </p>
        </motion.div>

        {/* Reputation Levels */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-10 sm:mb-14">
          {levels.map((level, i) => (
            <motion.div
              key={level.titleAr}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-2.5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl ${level.color} border border-border/30 shadow-sm`}
            >
              <span className="text-xl sm:text-2xl">{level.icon}</span>
              <div>
                <p className="text-sm sm:text-base font-black">{isAr ? level.titleAr : level.titleEn}</p>
                <p className="text-[10px] sm:text-xs opacity-70">+{level.minTrips} {isAr ? "رحلة" : "trips"}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 max-w-4xl mx-auto">
          {[
            { icon: ThumbsUp, ar: "تقييم بعد كل مهمة", en: "Rate after every mission" },
            { icon: TrendingUp, ar: "معدل قبول تراكمي", en: "Cumulative acceptance rate" },
            { icon: Award, ar: "شارات إنجاز رقمية", en: "Digital achievement badges" },
            { icon: ShieldCheck, ar: "توثيق ومراجعة إدارية", en: "Admin verification & review" },
            { icon: Users, ar: "ملف عام لكل سائق", en: "Public driver profile" },
            { icon: Star, ar: "أولوية بالتقييم الأعلى", en: "Priority for top-rated" },
          ].map((item, i) => (
            <motion.div
              key={item.ar}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2.5 p-3 sm:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors"
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">{isAr ? item.ar : item.en}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

RatingTrustSection.displayName = "RatingTrustSection";
export default RatingTrustSection;
