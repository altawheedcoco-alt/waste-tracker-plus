import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const systemCapabilities = [
  {
    title: "تتبع GPS مباشر للسائقين",
    description: "رقابة كاملة على مخلفاتك عبر تتبع ذكي يضمن لك التخلص النهائي الصحيح",
  },
  {
    title: "إدارة متكاملة للشحنات",
    description: "نظام شامل يسهل تتبع الشحنة من المصدر حتى التخلص النهائي",
  },
  {
    title: "تقارير بيئية شاملة",
    description: "تحليلات بيئية دقيقة تدعم اتخاذ القرار وتوفير الوقت",
  },
  {
    title: "نظام موافقات إلكتروني",
    description: "وداعاً للورق، اعتمد طلباتك بضغطة زر وبأمان عالٍ",
  },
  {
    title: "تنبيهات فورية بالبريد والهاتف",
    description: "ابقَ على اطلاع دائم بكل شحنة من خلال نظام الإشعارات الذكي",
  },
  {
    title: "تحليل البيانات",
    description: "توقعات دقيقة للكميات المستقبلية لتحسين إدارة الموارد",
  },
  {
    title: "توثيق بالصور والباركود",
    description: "ضمان جودة الاستلام والتسليم عبر مسح الرموز والتوثيق البصري",
  },
  {
    title: "دعم فني على مدار الساعة",
    description: "فريق متخصص لمساعدتك في حل المشاكل التقنية واللوجستية فوراً",
  },
  {
    title: "لوحة تحكم للمدراء",
    description: "راقب جميع العمليات من شاشة واحدة بكل سهولة",
  },
  {
    title: "ابدأ رحلة التحول الرقمي في إدارة المخلفات الآن",
    description: "",
  },
];

const FeaturesList = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemCapabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border-b border-border/30"
            >
              <div className="flex-shrink-0 mt-1">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right flex-1">
                <h3 className="font-bold text-foreground leading-relaxed">
                  {capability.title}
                  {capability.description && (
                    <span className="font-normal text-muted-foreground">
                      : "{capability.description}"
                    </span>
                  )}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesList;
