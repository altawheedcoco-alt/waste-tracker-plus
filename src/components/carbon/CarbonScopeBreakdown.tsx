/**
 * CarbonScopeBreakdown — Visual Scope 1/2/3 breakdown with donut chart and insights
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Fuel, Zap, Truck, Lightbulb, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCarbonScopes, type ScopeBreakdown } from '@/hooks/useCarbonScopes';
import AnimatedCounter from '@/components/dashboard/shared/AnimatedCounter';
import { Skeleton } from '@/components/ui/skeleton';

interface CarbonScopeBreakdownProps {
  period?: 'month' | 'quarter' | 'year' | 'all';
}

const SCOPE_COLORS = {
  scope1: 'hsl(var(--destructive))',
  scope2: 'hsl(45, 93%, 47%)',
  scope3: 'hsl(var(--primary))',
};

const CarbonScopeBreakdown = ({ period = 'year' }: CarbonScopeBreakdownProps) => {
  const { data, isLoading } = useCarbonScopes(period);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const donutData = [
    { name: 'نطاق 1 — وقود مباشر', value: data.scope1.total, color: SCOPE_COLORS.scope1 },
    { name: 'نطاق 2 — كهرباء', value: data.scope2.total, color: SCOPE_COLORS.scope2 },
    { name: 'نطاق 3 — نقل ومعالجة', value: data.scope3.total, color: SCOPE_COLORS.scope3 },
  ].filter(d => d.value > 0);

  const isNetNegative = data.netEmissions < 0;

  return (
    <div className="space-y-4">
      {/* Scope Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Fuel className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نطاق 1 — وقود مباشر</p>
                <p className="text-xl font-bold"><AnimatedCounter value={data.scope1.total} /></p>
                <p className="text-[10px] text-muted-foreground">كجم CO₂ ({data.scopePercentages.scope1}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-300/50 dark:border-amber-700/50">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نطاق 2 — كهرباء</p>
                <p className="text-xl font-bold"><AnimatedCounter value={data.scope2.total} /></p>
                <p className="text-[10px] text-muted-foreground">كجم CO₂ ({data.scopePercentages.scope2}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نطاق 3 — نقل ومعالجة</p>
                <p className="text-xl font-bold"><AnimatedCounter value={data.scope3.total} /></p>
                <p className="text-[10px] text-muted-foreground">كجم CO₂ ({data.scopePercentages.scope3}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donut + Net Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base">توزيع النطاقات</CardTitle>
            <CardDescription>GHG Protocol Scopes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} كجم CO₂`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {donutData.map((d) => (
                <Badge key={d.name} variant="outline" className="text-[10px] gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={isNetNegative ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20' : ''}>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-end">
              {isNetNegative ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5" />}
              البصمة الكربونية الصافية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className={`text-4xl font-bold ${isNetNegative ? 'text-emerald-600' : 'text-destructive'}`}>
                {data.netEmissions > 0 ? '+' : ''}<AnimatedCounter value={data.netEmissions} />
              </p>
              <p className="text-sm text-muted-foreground">كجم CO₂ صافي</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-right">
                <p className="text-muted-foreground text-xs">إجمالي الانبعاثات</p>
                <p className="font-semibold text-destructive">{data.grandTotal.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">وفورات التدوير</p>
                <p className="font-semibold text-emerald-600">-{data.totalSavings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Scope Trend */}
      {data.monthlyScopes.length > 1 && (
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base">اتجاه الانبعاثات الشهري بالنطاقات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.monthlyScopes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} كجم`} />
                <Legend />
                <Area type="monotone" dataKey="scope1" name="نطاق 1" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                <Area type="monotone" dataKey="scope2" name="نطاق 2" stackId="1" stroke="hsl(45, 93%, 47%)" fill="hsl(45, 93%, 47%, 0.2)" />
                <Area type="monotone" dataKey="scope3" name="نطاق 3" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-end">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              رؤى وتوصيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-right">
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope 1 Details */}
      {data.scope1.details.length > 0 && (
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base">تفاصيل نطاق 1 — استهلاك الوقود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.scope1.details.map((d) => (
                <div key={d.type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <Badge variant="destructive">{d.kgCO2.toLocaleString()} كجم CO₂</Badge>
                  <div className="text-right">
                    <p className="font-medium text-sm capitalize">{d.type}</p>
                    <p className="text-xs text-muted-foreground">{d.liters.toLocaleString()} لتر</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope 3 Details */}
      <Card>
        <CardHeader className="text-right pb-2">
          <CardTitle className="text-base">تفاصيل نطاق 3 — سلسلة القيمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-right">
              <p className="text-xs text-muted-foreground">انبعاثات النقل</p>
              <p className="font-bold">{data.scope3.transport.toLocaleString()} <span className="text-xs font-normal">كجم</span></p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-right">
              <p className="text-xs text-muted-foreground">انبعاثات المعالجة</p>
              <p className="font-bold">{data.scope3.processing.toLocaleString()} <span className="text-xs font-normal">كجم</span></p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-right border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground">وفورات التدوير</p>
              <p className="font-bold text-emerald-600">-{data.scope3.savings.toLocaleString()} <span className="text-xs font-normal">كجم</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonScopeBreakdown;
