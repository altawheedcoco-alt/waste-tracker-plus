import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  FileText, BarChart3, Leaf, TrendingUp, Download,
  Calendar, PieChart, Scale, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GeneratorReportsTab = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const reports = [
    { label: isAr ? 'تقرير الشحنات الشهري' : 'Monthly Shipments Report', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', route: '/dashboard/reports' },
    { label: isAr ? 'تقرير الأثر البيئي' : 'Environmental Impact Report', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: '/dashboard/reports' },
    { label: isAr ? 'تقرير التكاليف والمصروفات' : 'Cost Analysis Report', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', route: '/dashboard/erp/accounting' },
    { label: isAr ? 'تقرير الامتثال الرقابي' : 'Compliance Report', icon: Scale, color: 'text-purple-500', bg: 'bg-purple-500/10', route: '/dashboard/reports' },
    { label: isAr ? 'تقرير أداء الشركاء' : 'Partners Performance Report', icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-500/10', route: '/dashboard/reports' },
    { label: isAr ? 'ملخص ربع سنوي' : 'Quarterly Summary', icon: PieChart, color: 'text-rose-500', bg: 'bg-rose-500/10', route: '/dashboard/reports' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/reports')}>
          <BarChart3 className="w-3.5 h-3.5" />
          {isAr ? 'مركز التقارير الشامل' : 'Reports Center'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/shipment-reports')}>
          <Calendar className="w-3.5 h-3.5" />
          {isAr ? 'تقارير الشحنات' : 'Shipment Reports'}
        </Button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reports.map(report => (
          <Card
            key={report.label}
            className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate(report.route)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", report.bg)}>
                <report.icon className={cn("w-5 h-5", report.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{report.label}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GeneratorReportsTab;
