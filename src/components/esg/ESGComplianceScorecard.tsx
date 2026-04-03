/**
 * ESG Compliance Scorecard Widget
 * Compact scorecard showing Scope 1/2/3 emissions and compliance status
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, AlertTriangle, FileCheck, TrendingDown,
  ChevronLeft, Globe, Factory, Truck, Zap, Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ScopeData {
  label: string;
  icon: React.ElementType;
  color: string;
  tonsCO2: number;
  description: string;
}

const ESGComplianceScorecard: React.FC = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: shipments } = useQuery({
    queryKey: ['esg-scorecard-data', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, quantity, unit, status, disposal_method, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude')
        .eq('organization_id', organization.id)
        .in('status', ['delivered', 'confirmed']);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: licenses } = useQuery({
    queryKey: ['esg-licenses', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { total: 0, expiring: 0, expired: 0 };
      const { data } = await supabase
        .from('organization_licenses')
        .select('id, expiry_date, status')
        .eq('organization_id', organization.id);
      if (!data) return { total: 0, expiring: 0, expired: 0 };

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return {
        total: data.length,
        expiring: data.filter(l => {
          const exp = new Date(l.expiry_date);
          return exp > now && exp <= thirtyDays;
        }).length,
        expired: data.filter(l => new Date(l.expiry_date) < now).length,
      };
    },
    enabled: !!organization?.id,
  });

  const scopes = useMemo((): ScopeData[] => {
    if (!shipments?.length) return [
      { label: 'النطاق 1', icon: Factory, color: 'text-red-500', tonsCO2: 0, description: 'انبعاثات مباشرة (معالجة)' },
      { label: 'النطاق 2', icon: Zap, color: 'text-yellow-500', tonsCO2: 0, description: 'انبعاثات غير مباشرة (طاقة)' },
      { label: 'النطاق 3', icon: Truck, color: 'text-blue-500', tonsCO2: 0, description: 'سلسلة القيمة (نقل)' },
    ];

    let scope1 = 0; // Direct processing emissions
    let scope3 = 0; // Transport emissions

    const processingFactors: Record<string, number> = {
      plastic: 2.5, paper: 0.8, metal: 1.2, glass: 0.5,
      electronic: 3.5, organic: 0.3, chemical: 4.0, medical: 5.0,
      construction: 0.4, other: 1.0,
    };

    for (const s of shipments) {
      const qty = Number(s.quantity) || 0;
      const tons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? qty / 1000 : qty;
      const wt = (s.waste_type as string) || 'other';

      scope1 += tons * (processingFactors[wt] || 1.0);

      if (s.pickup_latitude && s.delivery_latitude) {
        const R = 6371;
        const dLat = ((s.delivery_latitude - s.pickup_latitude) * Math.PI) / 180;
        const dLon = ((s.delivery_longitude! - s.pickup_longitude!) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos((s.pickup_latitude * Math.PI) / 180) *
          Math.cos((s.delivery_latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        scope3 += tons * 0.000062 * km;
      }
    }

    // Scope 2 estimate (electricity for processing) ~15% of Scope 1
    const scope2 = scope1 * 0.15;

    return [
      { label: 'النطاق 1', icon: Factory, color: 'text-red-500', tonsCO2: Math.round(scope1 * 100) / 100, description: 'انبعاثات مباشرة (معالجة)' },
      { label: 'النطاق 2', icon: Zap, color: 'text-yellow-500', tonsCO2: Math.round(scope2 * 100) / 100, description: 'انبعاثات غير مباشرة (طاقة)' },
      { label: 'النطاق 3', icon: Truck, color: 'text-blue-500', tonsCO2: Math.round(scope3 * 1000) / 1000, description: 'سلسلة القيمة (نقل)' },
    ];
  }, [shipments]);

  const totalEmissions = scopes.reduce((s, sc) => s + sc.tonsCO2, 0);

  // ESG Grade
  const esgGrade = useMemo(() => {
    const recycled = shipments?.filter(s => s.disposal_method === 'recycling' || s.status === 'confirmed').length || 0;
    const total = shipments?.length || 1;
    const recyclingRate = (recycled / total) * 100;
    const licenseHealth = licenses ? ((licenses.total - licenses.expired) / Math.max(licenses.total, 1)) * 100 : 100;
    const score = (recyclingRate * 0.6 + licenseHealth * 0.4);

    if (score >= 90) return { grade: 'A+', label: 'ممتاز+', color: 'text-emerald-700 bg-emerald-100' };
    if (score >= 80) return { grade: 'A', label: 'ممتاز', color: 'text-emerald-600 bg-emerald-50' };
    if (score >= 70) return { grade: 'B', label: 'جيد جداً', color: 'text-blue-600 bg-blue-50' };
    if (score >= 50) return { grade: 'C', label: 'جيد', color: 'text-yellow-600 bg-yellow-50' };
    return { grade: 'D', label: 'ضعيف', color: 'text-red-600 bg-red-50' };
  }, [shipments, licenses]);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <Badge className={`text-[10px] h-5 px-2 font-bold ${esgGrade.color}`}>
            {esgGrade.grade} — {esgGrade.label}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span>بطاقة ESG</span>
            <Globe className="h-4 w-4 text-primary" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* Scope Breakdown */}
        <div className="space-y-2">
          {scopes.map((scope) => {
            const pct = totalEmissions > 0 ? (scope.tonsCO2 / totalEmissions) * 100 : 0;
            return (
              <div key={scope.label} className="flex items-center gap-2">
                <scope.icon className={`w-4 h-4 shrink-0 ${scope.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="font-medium">{scope.label}</span>
                    <span className="text-muted-foreground">{scope.tonsCO2} طن CO₂</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium">إجمالي الانبعاثات</span>
          </div>
          <span className="font-bold text-sm">{totalEmissions.toFixed(2)} طن CO₂</span>
        </div>

        {/* License Compliance */}
        {licenses && licenses.total > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px]">التراخيص</span>
            </div>
            <div className="flex items-center gap-1.5">
              {licenses.expired > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1">
                  {licenses.expired} منتهية
                </Badge>
              )}
              {licenses.expiring > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                  {licenses.expiring} قرب الانتهاء
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                {licenses.total} ترخيص
              </Badge>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-[10px] h-7"
          onClick={() => navigate('/dashboard/esg-reports')}
        >
          <ChevronLeft className="h-3 w-3 ml-1" />
          تقارير ESG التفصيلية
        </Button>
      </CardContent>
    </Card>
  );
};

export default ESGComplianceScorecard;
