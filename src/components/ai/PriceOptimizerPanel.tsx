import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { usePriceOptimizer } from '@/hooks/usePriceOptimizer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PriceOptimizerPanel = () => {
  const { isOptimizing, result, error, optimizePrices, clearResults } = usePriceOptimizer();
  const [optimizationGoal, setOptimizationGoal] = useState<'balanced' | 'profit_maximize' | 'market_share' | 'customer_retention'>('balanced');
  const [pricingData, setPricingData] = useState<any[]>([]);
  const { user } = useAuth();

  // جلب بيانات التسعير الفعلية من الشحنات
  useEffect(() => {
    const fetchPricing = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, total_price, estimated_weight')
        .not('waste_type', 'is', null)
        .not('total_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      if (data && data.length > 0) {
        const byType = new Map<string, { totalPrice: number; totalWeight: number; count: number }>();
        data.forEach(s => {
          const t = s.waste_type || 'غير مصنف';
          const prev = byType.get(t) || { totalPrice: 0, totalWeight: 0, count: 0 };
          byType.set(t, {
            totalPrice: prev.totalPrice + (s.total_price || 0),
            totalWeight: prev.totalWeight + (s.estimated_weight || 0),
            count: prev.count + 1,
          });
        });
        setPricingData(Array.from(byType.entries()).map(([wasteType, v]) => ({
          wasteType,
          currentPrice: v.totalWeight > 0 ? Math.round(v.totalPrice / v.totalWeight) : 0,
          averageCost: v.totalWeight > 0 ? Math.round((v.totalPrice / v.totalWeight) * 0.6) : 0,
          demand: v.count > 10 ? 'high' as const : v.count > 3 ? 'medium' as const : 'low' as const,
          volume: Math.round(v.totalWeight),
        })));
      }
    };
    fetchPricing();
  }, [user]);

  const handleOptimize = () => {
    if (pricingData.length > 0) {
      optimizePrices(pricingData, optimizationGoal);
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getPositionBadge = (position: string | undefined) => {
    switch (position) {
      case 'below_market':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">أقل من السوق</Badge>;
      case 'above_market':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">أعلى من السوق</Badge>;
      default:
        return <Badge variant="outline" className="text-green-500 border-green-500">بسعر السوق</Badge>;
    }
  };

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'profit_maximize':
        return 'تعظيم الأرباح';
      case 'market_share':
        return 'زيادة الحصة السوقية';
      case 'customer_retention':
        return 'الحفاظ على العملاء';
      default:
        return 'متوازن';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">تحسين الأسعار الذكي</CardTitle>
                <p className="text-sm text-muted-foreground">
                  اقتراح أسعار مثلى بناءً على السوق والتكاليف
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={optimizationGoal}
                onChange={(e) => setOptimizationGoal(e.target.value as any)}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="balanced">متوازن</option>
                <option value="profit_maximize">تعظيم الأرباح</option>
                <option value="market_share">الحصة السوقية</option>
                <option value="customer_retention">الحفاظ على العملاء</option>
              </select>
              <Button onClick={handleOptimize} disabled={isOptimizing}>
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                    جاري التحسين...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 ml-2" />
                    تحسين الأسعار
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isOptimizing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isOptimizing && (
        <>
          {/* Revenue Impact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">تغيير الإيرادات المتوقع</p>
                <div className="flex items-center gap-2 mt-1">
                  {(result.revenueImpact?.estimatedRevenueChange || 0) >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-2xl font-bold ${
                    (result.revenueImpact?.estimatedRevenueChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(result.revenueImpact?.estimatedRevenueChange || 0) >= 0 ? '+' : ''}
                    {result.revenueImpact?.estimatedRevenueChange || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">تغيير الأرباح المتوقع</p>
                <div className="flex items-center gap-2 mt-1">
                  {(result.revenueImpact?.estimatedProfitChange || 0) >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-2xl font-bold ${
                    (result.revenueImpact?.estimatedProfitChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(result.revenueImpact?.estimatedProfitChange || 0) >= 0 ? '+' : ''}
                    {result.revenueImpact?.estimatedProfitChange || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">مستوى المخاطر</p>
                <div className="mt-1">
                  <Badge 
                    variant="outline"
                    className={
                      result.revenueImpact?.riskLevel === 'high' ? 'border-red-500 text-red-500' :
                      result.revenueImpact?.riskLevel === 'medium' ? 'border-yellow-500 text-yellow-500' :
                      'border-green-500 text-green-500'
                    }
                  >
                    {result.revenueImpact?.riskLevel === 'high' ? 'مرتفع' :
                     result.revenueImpact?.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Optimized Prices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الأسعار المحسّنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.optimizedPrices?.map((price, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{price.itemName}</h4>
                          {getPositionBadge(price.competitivePosition)}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through text-sm">
                              {price.currentPrice} ج.م
                            </span>
                            {getChangeIcon(price.changePercent)}
                          </div>
                          <div className="text-xl font-bold text-primary">
                            {price.suggestedPrice} ج.م
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                        <div>
                          <span className="block text-xs">التغيير</span>
                          <span className={price.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {price.changePercent >= 0 ? '+' : ''}{price.changePercent}%
                          </span>
                        </div>
                        {price.profitMargin && (
                          <div>
                            <span className="block text-xs">هامش الربح</span>
                            <span>{price.profitMargin}%</span>
                          </div>
                        )}
                        {price.minPrice && price.maxPrice && (
                          <div>
                            <span className="block text-xs">النطاق</span>
                            <span>{price.minPrice} - {price.maxPrice}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                        💡 {price.rationale}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Strategies */}
          {result.strategies && result.strategies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">استراتيجيات التسعير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.strategies.map((strategy, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium">{strategy.strategy}</span>
                        <Badge 
                          variant="outline"
                          className={
                            strategy.priority === 'high' ? 'border-red-500 text-red-500' :
                            strategy.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                            'border-green-500 text-green-500'
                          }
                        >
                          {strategy.priority === 'high' ? 'عالي' : strategy.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                      {strategy.expectedImpact && (
                        <p className="text-xs text-muted-foreground mt-2">
                          الأثر المتوقع: {strategy.expectedImpact}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Summary */}
          {result.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-sm">{result.summary}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isOptimizing && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">ابدأ التحسين</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على "تحسين الأسعار" للحصول على اقتراحات أسعار محسّنة
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PriceOptimizerPanel;
