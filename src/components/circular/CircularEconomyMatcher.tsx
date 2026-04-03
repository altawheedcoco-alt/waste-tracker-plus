/**
 * Circular Economy Symbiosis Matcher
 * Matches waste outputs from one org as potential inputs for another
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Recycle, ArrowRightLeft, Factory, Leaf, TrendingUp,
  Sparkles, ChevronLeft, Link2, Percent, Package
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Material compatibility matrix: what waste types can be inputs for which industries
const SYMBIOSIS_MATRIX: Record<string, { 
  matchableTypes: string[]; 
  industryLabel: string;
  savingsPercent: number;
}> = {
  plastic: { matchableTypes: ['plastic'], industryLabel: 'تصنيع بلاستيك معاد', savingsPercent: 65 },
  paper: { matchableTypes: ['paper', 'organic'], industryLabel: 'مصانع ورق / كرتون', savingsPercent: 70 },
  metal: { matchableTypes: ['metal'], industryLabel: 'مسابك / تصنيع معادن', savingsPercent: 85 },
  glass: { matchableTypes: ['glass'], industryLabel: 'مصانع زجاج', savingsPercent: 90 },
  organic: { matchableTypes: ['organic'], industryLabel: 'سماد عضوي / طاقة حيوية', savingsPercent: 55 },
  electronic: { matchableTypes: ['electronic', 'metal'], industryLabel: 'استخراج معادن نفيسة', savingsPercent: 75 },
  construction: { matchableTypes: ['construction'], industryLabel: 'إعادة استخدام مواد بناء', savingsPercent: 45 },
  chemical: { matchableTypes: ['chemical'], industryLabel: 'معالجة كيميائية متخصصة', savingsPercent: 40 },
  medical: { matchableTypes: ['medical'], industryLabel: 'تعقيم وإعادة تصنيع', savingsPercent: 30 },
};

interface SymbiosisMatch {
  wasteType: string;
  totalTons: number;
  matchCount: number;
  industryLabel: string;
  savingsPercent: number;
  circularityScore: number;
}

const CircularEconomyMatcher: React.FC = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: shipmentStats } = useQuery({
    queryKey: ['circular-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase
        .from('shipments' as any)
        .select('waste_type, quantity, unit, status, disposal_method')
        .eq('organization_id', organization.id) as any)
        .in('status', ['delivered', 'confirmed']);
      return (data || []) as any[];
    },
    enabled: !!organization?.id,
  });

  const matches = useMemo((): SymbiosisMatch[] => {
    if (!shipmentStats?.length) return [];

    const byType: Record<string, number> = {};
    for (const s of shipmentStats) {
      const wt = (s.waste_type as string) || 'other';
      const qty = Number(s.quantity) || 0;
      const tons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? qty / 1000 : qty;
      byType[wt] = (byType[wt] || 0) + tons;
    }

    return Object.entries(byType)
      .map(([type, tons]) => {
        const matrix = SYMBIOSIS_MATRIX[type];
        if (!matrix) return null;
        const recycled = shipmentStats.filter(
          s => s.waste_type === type && (s.disposal_method === 'recycling' || s.status === 'confirmed')
        ).length;
        const total = shipmentStats.filter(s => s.waste_type === type).length;
        const circularityScore = total > 0 ? Math.round((recycled / total) * 100) : 0;

        return {
          wasteType: type,
          totalTons: Math.round(tons * 100) / 100,
          matchCount: matrix.matchableTypes.length,
          industryLabel: matrix.industryLabel,
          savingsPercent: matrix.savingsPercent,
          circularityScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.totalTons - a!.totalTons) as SymbiosisMatch[];
  }, [shipmentStats]);

  const overallCircularity = useMemo(() => {
    if (!matches.length) return 0;
    return Math.round(matches.reduce((s, m) => s + m.circularityScore, 0) / matches.length);
  }, [matches]);

  const wasteTypeLabels: Record<string, string> = {
    plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
    organic: 'عضوي', electronic: 'إلكتروني', construction: 'بناء',
    chemical: 'كيميائي', medical: 'طبي', other: 'متنوع',
  };

  return (
    <div className="space-y-4">
      {/* Circularity Score */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm">مؤشر الاقتصاد الدائري</span>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-300">
              {overallCircularity}%
            </Badge>
          </div>
          <Progress value={overallCircularity} className="h-3 mb-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>خطي (0%)</span>
            <span>دائري بالكامل (100%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Symbiosis Matches */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            فرص التكافل الصناعي
            <Badge variant="secondary" className="text-[9px] mr-auto">{matches.length} تطابق</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <AnimatePresence>
            {matches.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد بيانات كافية لتحليل التكافل</p>
              </div>
            ) : (
              matches.slice(0, 8).map((m, i) => (
                <motion.div
                  key={m.wasteType}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">
                        {wasteTypeLabels[m.wasteType] || m.wasteType}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {m.totalTons} طن
                      </Badge>
                    </div>
                    <Badge 
                      variant={m.circularityScore >= 70 ? 'default' : m.circularityScore >= 40 ? 'secondary' : 'outline'}
                      className="text-[9px]"
                    >
                      {m.circularityScore}% دائرية
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
                    <Link2 className="w-3 h-3" />
                    <span>{m.industryLabel}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <Percent className="w-3 h-3 text-emerald-500" />
                      <span>وفورات {m.savingsPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-green-500" />
                      <span>{(m.totalTons * (m.savingsPercent / 100)).toFixed(1)} طن قابل للتحويل</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] h-7 mt-2"
            onClick={() => navigate('/dashboard/waste-exchange')}
          >
            <ChevronLeft className="h-3 w-3 ml-1" />
            بورصة المخلفات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CircularEconomyMatcher;
