import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Plus, Scale, ClipboardList, AlertTriangle, FileText, ChevronDown,
} from 'lucide-react';

const QuickWasteLogEntry = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [expanded, setExpanded] = useState(false);

  const shortcuts = [
    {
      label: isAr ? 'سجل مخلفات غير خطرة' : 'Non-Hazardous Register',
      desc: isAr ? 'تسجيل يومي للمخلفات العادية' : 'Daily non-hazardous waste log',
      icon: ClipboardList,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      path: '/dashboard/non-hazardous-register',
    },
    {
      label: isAr ? 'سجل مخلفات خطرة' : 'Hazardous Register',
      desc: isAr ? 'تسجيل المخلفات الخطرة والطبية' : 'Hazardous & medical waste log',
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400',
      path: '/dashboard/hazardous-register',
    },
    {
      label: isAr ? 'إدخال وزن سريع' : 'Quick Weight Entry',
      desc: isAr ? 'تسجيل أوزان بسرعة' : 'Fast weight logging',
      icon: Scale,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      path: '/dashboard/quick-weight',
    },
    {
      label: isAr ? 'إدخال أوزان جماعي' : 'Bulk Weight Entry',
      desc: isAr ? 'إدخال عدة أوزان دفعة واحدة' : 'Enter multiple weights at once',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      path: '/dashboard/bulk-weight-entries',
    },
  ];

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full group">
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-sm bg-primary/[0.02]">
          <CardContent className="p-3 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary">
              {isAr ? 'تسجيل مخلفات سريع' : 'Quick Waste Log'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-primary/60" />
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className="border-primary/30 shadow-md overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => setExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold">{isAr ? 'تسجيل مخلفات' : 'Waste Logging'}</h4>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map(s => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all text-right bg-card"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{s.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickWasteLogEntry;
