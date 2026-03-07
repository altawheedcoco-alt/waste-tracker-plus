import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface PriceIndexProps {
  isRTL: boolean;
  priceData: Array<{
    waste_type: string;
    waste_subtype?: string;
    avg_price_per_ton: number;
    min_price?: number;
    max_price?: number;
    total_volume_tons?: number;
    total_transactions: number;
    trend: string;
    change_percent: number;
    price_date: string;
  }>;
}

const getWasteLabels = (t: (key: string) => string): Record<string, string> => ({
  metals: t('exchange.metals'),
  paper: t('exchange.paperCardboard'),
  plastics: t('exchange.plastics'),
  wood: t('exchange.wood'),
  organic: t('exchange.organic'),
  glass: t('exchange.glass'),
  textiles: t('exchange.textiles'),
  rdf: t('exchange.rdf'),
});

export const ExchangePriceIndex = ({ isRTL, priceData }: PriceIndexProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const WASTE_LABELS = getWasteLabels(t);

  const chartData = priceData.map(p => ({
    name: WASTE_LABELS[p.waste_type] || p.waste_type,
    price: p.avg_price_per_ton,
    min: p.min_price || 0,
    max: p.max_price || 0,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {t('exchange.priceIndex')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="price" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-start">{t('exchange.type')}</th>
                  <th className="p-3 text-start">{t('exchange.avgPrice')}</th>
                  <th className="p-3 text-start">{t('exchange.min')}</th>
                  <th className="p-3 text-start">{t('exchange.max')}</th>
                  <th className="p-3 text-start">{t('exchange.volume')}</th>
                  <th className="p-3 text-start">{t('exchange.trend')}</th>
                </tr>
              </thead>
              <tbody>
                {priceData.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{WASTE_LABELS[item.waste_type] || item.waste_type}</td>
                    <td className="p-3 font-bold">{item.avg_price_per_ton?.toLocaleString(locale)} {t('exchange.egp')}</td>
                    <td className="p-3 text-muted-foreground">{item.min_price?.toLocaleString(locale)}</td>
                    <td className="p-3 text-muted-foreground">{item.max_price?.toLocaleString(locale)}</td>
                    <td className="p-3">{item.total_volume_tons?.toLocaleString(locale)} {t('exchange.ton')}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`gap-1 ${
                        item.trend === 'rising' ? 'text-green-600 border-green-500/30' :
                        item.trend === 'falling' ? 'text-red-600 border-red-500/30' :
                        'text-yellow-600 border-yellow-500/30'
                      }`}>
                        {item.trend === 'rising' ? <TrendingUp className="w-3 h-3" /> :
                         item.trend === 'falling' ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {item.change_percent > 0 ? '+' : ''}{item.change_percent?.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
