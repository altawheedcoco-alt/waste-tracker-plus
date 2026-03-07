/**
 * RegistrationTypeSelector — اختيار نوع الحساب بتصميم احترافي
 */
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, Building2, Truck, Recycle, Factory, User,
  Briefcase, ClipboardCheck, BookOpen, Award, ArrowLeft,
  Sparkles, Users, Shield,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type RegistrationType = 'company' | 'driver' | 'jobseeker' | 'consultant' | 'consulting_office' | 'iso_body';

interface RegistrationTypeSelectorProps {
  onSelect: (type: RegistrationType) => void;
}

const registrationCategories = [
  {
    title: 'أفراد',
    titleEn: 'Individuals',
    icon: Users,
    items: [
      {
        value: 'jobseeker' as RegistrationType,
        label: 'باحث عن عمل',
        description: 'سجل ببساطة وتصفح الوظائف وقدم عليها',
        icon: Briefcase,
        gradient: 'from-sky-500 to-blue-600',
        bgLight: 'bg-sky-50 dark:bg-sky-950/30',
        badge: 'سريع',
      },
      {
        value: 'driver' as RegistrationType,
        label: 'سائق مستقل',
        description: 'انضم كسائق نقل مخلفات محترف',
        icon: User,
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      },
    ],
  },
  {
    title: 'شركات ومؤسسات',
    titleEn: 'Organizations',
    icon: Building2,
    items: [
      {
        value: 'company' as RegistrationType,
        label: 'شركة / مصنع',
        description: 'مولد، ناقل، مدور، أو جهة تخلص آمن',
        icon: Building2,
        gradient: 'from-primary to-primary/80',
        bgLight: 'bg-primary/5',
        badge: 'الأكثر طلباً',
      },
      {
        value: 'consultant' as RegistrationType,
        label: 'استشاري بيئي',
        description: 'تسجيل كاستشاري بيئي مستقل',
        icon: ClipboardCheck,
        gradient: 'from-teal-500 to-teal-600',
        bgLight: 'bg-teal-50 dark:bg-teal-950/30',
      },
      {
        value: 'consulting_office' as RegistrationType,
        label: 'مكتب استشاري',
        description: 'تسجيل مكتب استشارات بيئية',
        icon: BookOpen,
        gradient: 'from-indigo-500 to-indigo-600',
        bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
      },
      {
        value: 'iso_body' as RegistrationType,
        label: 'جهة مانحة للأيزو',
        description: 'جهة اعتماد ومنح شهادات ISO',
        icon: Award,
        gradient: 'from-emerald-600 to-green-700',
        bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      },
    ],
  },
];

const RegistrationTypeSelector = ({ onSelect }: RegistrationTypeSelectorProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      key="registration-type"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20 rounded-xl">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          {t('auth.allRequestsReviewed')}
        </AlertDescription>
      </Alert>

      {registrationCategories.map((category, catIdx) => (
        <div key={catIdx} className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <category.icon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category.title}</h3>
          </div>

          <div className="space-y-2">
            {category.items.map((type, idx) => (
              <motion.button
                key={type.value}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (catIdx * 0.15) + (idx * 0.05) }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(type.value)}
                className={`w-full p-3.5 rounded-xl border-2 transition-all text-right flex items-center gap-3.5 border-border/60 hover:border-primary/40 hover:shadow-md ${type.bgLight} group`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform`}>
                  <type.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{type.label}</h3>
                    {type.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                        <Sparkles className="w-2.5 h-2.5 ml-0.5" />
                        {type.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.description}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default RegistrationTypeSelector;
