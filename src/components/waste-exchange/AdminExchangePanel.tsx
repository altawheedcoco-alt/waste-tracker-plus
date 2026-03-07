import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, BarChart3, Users, TrendingUp, Activity, Scale } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminExchangePanelProps {
  isRTL: boolean;
  stats: {
    totalListings: number;
    activeListings: number;
    totalBids: number;
    completedTransactions: number;
    totalVolumeTons: number;
    totalValueEGP: number;
  };
}

export const AdminExchangePanel = ({ isRTL, stats }: AdminExchangePanelProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('exchange.adminPanel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: t('exchange.totalListings'), value: stats.totalListings, icon: BarChart3, color: 'text-blue-500' },
              { label: t('exchange.activeListings'), value: stats.activeListings, icon: Activity, color: 'text-green-500' },
              { label: t('exchange.bidsCount'), value: stats.totalBids, icon: Users, color: 'text-amber-500' },
              { label: t('exchange.completed'), value: stats.completedTransactions, icon: TrendingUp, color: 'text-emerald-500' },
              { label: t('exchange.volumeTons'), value: stats.totalVolumeTons.toLocaleString(locale), icon: Scale, color: 'text-purple-500' },
              { label: t('exchange.valueEgp'), value: stats.totalValueEGP.toLocaleString(locale), icon: TrendingUp, color: 'text-primary' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-background border">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
