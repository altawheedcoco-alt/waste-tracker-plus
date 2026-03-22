import { memo } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, PiggyBank, ShieldAlert, TrendingUp, Receipt } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WalletFinanceShowcase = memo(() => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const items = [
    { icon: Wallet, titleAr: "محفظة إلكترونية ذكية", titleEn: "Smart Digital Wallet", descAr: "كل سائق وجهة لها محفظة رقمية — إيداع وسحب وتتبع فوري لكل المعاملات", descEn: "Every driver & company has a digital wallet — instant deposits, withdrawals & tracking", gradient: "from-emerald-500 to-teal-600" },
    { icon: CreditCard, titleAr: "حجز الرصيد المعلق", titleEn: "Escrow Hold System", descAr: "عند قبول الشحنة يُحجز المبلغ تلقائياً ويُحرر عند تأكيد التسليم — حماية كاملة", descEn: "Amount auto-held on acceptance, released on delivery confirmation — full protection", gradient: "from-blue-500 to-cyan-600" },
    { icon: PiggyBank, titleAr: "تسوية أرباح تلقائية", titleEn: "Auto Earnings Settlement", descAr: "حساب الأرباح تلقائياً حسب نوع العقد (رحلة/ساعة/يوم) مع كشف حساب مفصّل", descEn: "Auto earnings calculation by contract type with detailed statements", gradient: "from-violet-500 to-purple-600" },
    { icon: ShieldAlert, titleAr: "كشف احتيال بالذكاء الاصطناعي", titleEn: "AI Fraud Detection", descAr: "رصد المعاملات المشبوهة والأنماط غير الطبيعية فوراً — حماية مالية استباقية", descEn: "Instant detection of suspicious transactions & unusual patterns", gradient: "from-rose-500 to-red-600" },
    { icon: TrendingUp, titleAr: "تسعير ديناميكي", titleEn: "Dynamic Pricing", descAr: "أسعار تتكيف مع المسافة ونوع المخلفات والوقت — عدالة لجميع الأطراف", descEn: "Prices adapt to distance, waste type & timing — fair for all parties", gradient: "from-amber-500 to-orange-600" },
    { icon: Receipt, titleAr: "فواتير إلكترونية", titleEn: "E-Invoicing", descAr: "إصدار فواتير آلية لكل شحنة وعملية مالية — أرشيف محاسبي رقمي كامل", descEn: "Auto-generated invoices for every shipment & transaction", gradient: "from-indigo-500 to-blue-600" },
  ];

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">
              {isAr ? "المنظومة المالية الذكية" : "Smart Financial System"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
            {isAr ? "محفظة رقمية" : "Digital Wallet"}
            <span className="text-primary"> {isAr ? "وتسعير ذكي" : "& Smart Pricing"}</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? "منظومة مالية متكاملة تدير المدفوعات والأرباح والمحافظ الإلكترونية بشفافية وأمان كاملين"
              : "Complete financial ecosystem managing payments, earnings & digital wallets with full transparency"}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.titleAr}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-card border border-border/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2.5 sm:mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors leading-tight">
                {isAr ? item.titleAr : item.titleEn}
              </h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
                {isAr ? item.descAr : item.descEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

WalletFinanceShowcase.displayName = "WalletFinanceShowcase";
export default WalletFinanceShowcase;
