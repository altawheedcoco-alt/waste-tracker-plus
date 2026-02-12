import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const languageOptions: { value: Language; label: string; nativeLabel: string; flag: string; desc: string; descEn: string }[] = [
  { value: 'ar', label: 'العربية', nativeLabel: 'Arabic', flag: '🇸🇦', desc: 'واجهة عربية كاملة مع دعم RTL', descEn: 'Full Arabic interface with RTL support' },
  { value: 'en', label: 'English', nativeLabel: 'الإنجليزية', flag: '🇺🇸', desc: 'Full English interface with LTR support', descEn: 'واجهة إنجليزية كاملة مع دعم LTR' },
];

const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('settings.languageTitle')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languageOptions.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLanguage(option.value)}
              className={cn(
                'relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all',
                language === option.value
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="text-5xl">{option.flag}</span>
              <div className="text-center">
                <h3 className="font-bold text-xl">{option.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? option.desc : option.descEn}
                </p>
              </div>
              {language === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground text-center">
            {t('settings.languageChangeNote')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSettings;
