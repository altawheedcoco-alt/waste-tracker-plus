import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2, RotateCcw, UserCircle, Globe, Palette,
  Shield, Building2, Bell, Lock, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeSettings } from '@/contexts/ThemeSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileCustomization from '@/components/settings/ProfileCustomization';
import LanguageSettings from '@/components/settings/LanguageSettings';
import AppearanceSettings from '@/components/settings/categories/AppearanceSettings';
import SecuritySettings from '@/components/settings/categories/SecuritySettings';
import OrganizationSettings from '@/components/settings/categories/OrganizationSettings';
import IntegrationSettings from '@/components/settings/categories/IntegrationSettings';
import DataPrivacySettings from '@/components/settings/categories/DataPrivacySettings';

interface SettingsCategory {
  id: string;
  label: string;
  labelEn: string;
  icon: typeof Settings2;
  description: string;
  color: string;
  visibleFor: string[];
}

const categories: SettingsCategory[] = [
  {
    id: 'profile', label: 'الملف الشخصي', labelEn: 'Profile',
    icon: UserCircle, description: 'الصورة والاسم والبيانات الشخصية',
    color: 'from-blue-500/20 to-indigo-500/20',
    visibleFor: ['all'],
  },
  {
    id: 'language', label: 'اللغة', labelEn: 'Language',
    icon: Globe, description: 'اللغة المفضلة وإعدادات العرض',
    color: 'from-emerald-500/20 to-teal-500/20',
    visibleFor: ['all'],
  },
  {
    id: 'appearance', label: 'المظهر', labelEn: 'Appearance',
    icon: Palette, description: 'الثيمات والألوان والخطوط ووضع العرض',
    color: 'from-purple-500/20 to-violet-500/20',
    visibleFor: ['all'],
  },
  {
    id: 'security', label: 'الأمان', labelEn: 'Security',
    icon: Lock, description: 'PIN والمصادقة الثنائية وحماية الصفحات',
    color: 'from-red-500/20 to-rose-500/20',
    visibleFor: ['all'],
  },
  {
    id: 'organization', label: 'إعدادات المؤسسة', labelEn: 'Organization',
    icon: Building2, description: 'الأتمتة والرؤية والشروط والقوالب',
    color: 'from-amber-500/20 to-orange-500/20',
    visibleFor: ['transporter', 'generator', 'recycler', 'disposal', 'consultant', 'consulting_office', 'transport_office'],
  },
  {
    id: 'integration', label: 'التكامل والإشعارات', labelEn: 'Integration',
    icon: Bell, description: 'قنوات الإشعارات والواتساب والأصوات',
    color: 'from-cyan-500/20 to-sky-500/20',
    visibleFor: ['all'],
  },
  {
    id: 'privacy', label: 'الخصوصية والبيانات', labelEn: 'Privacy',
    icon: ShieldCheck, description: 'حماية البيانات والتصدير وسجل النشاط',
    color: 'from-green-500/20 to-emerald-500/20',
    visibleFor: ['all'],
  },
];

const Settings = () => {
  const { t } = useLanguage();
  const { resetToDefaults } = useThemeSettings();
  const { organization } = useAuth();
  const orgType = organization?.organization_type || 'generator';
  const isTransporter = orgType === 'transporter';

  // Read tab from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get('tab') || '';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  const visibleCategories = categories.filter(
    c => c.visibleFor.includes('all') || c.visibleFor.includes(orgType)
  );

  const activeCat = visibleCategories.find(c => c.id === activeCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case 'profile': return <ProfileCustomization />;
      case 'language': return <LanguageSettings />;
      case 'appearance': return <AppearanceSettings showAdvanced={isTransporter} />;
      case 'security': return <SecuritySettings />;
      case 'organization': return <OrganizationSettings orgType={orgType} />;
      case 'integration': return <IntegrationSettings orgType={orgType} />;
      case 'privacy': return <DataPrivacySettings />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-l from-primary/5 via-background to-primary/10 p-3 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-0 sm:justify-between relative z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <BackButton />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold truncate">{t('settings.title')}</h1>
                <p className="text-muted-foreground text-[11px] sm:text-sm truncate">{t('settings.subtitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-auto">
            {activeCategory && (
              <Button variant="ghost" size="sm" onClick={() => setActiveCategory('')} className="gap-1.5 text-xs">
                <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                رجوع
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5 text-xs shrink-0">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('settings.resetDefault')}</span>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <AnimatePresence mode="wait">
        {!activeCategory ? (
          /* Categories Grid */
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {visibleCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className="relative group p-4 sm:p-5 rounded-2xl border-2 border-border/60 hover:border-primary/40 bg-card text-right transition-all overflow-hidden"
                >
                  <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br transition-opacity duration-300', cat.color)} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors rotate-180" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-1">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          /* Active Category Content */
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Category Header */}
            {activeCat && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <activeCat.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-sm">{activeCat.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeCat.description}</p>
                </div>
              </div>
            )}
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
