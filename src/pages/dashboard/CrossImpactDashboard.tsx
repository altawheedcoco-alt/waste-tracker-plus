/**
 * لوحة الأثر المركزية — تعرض كل الآثار المتقاطعة بين الجهات
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, ArrowDownRight, ArrowUpRight, BookOpen, DollarSign,
  FileText, Filter, Leaf, Link2, Package, Search, Shield, TrendingUp, Zap
} from 'lucide-react';
import { useCrossImpactLog, useCrossImpactStats } from '@/hooks/useCrossImpactLog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const IMPACT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; labelAr: string; labelEn: string }> = {
  update_ledger: { icon: DollarSign, color: 'text-emerald-600 bg-emerald-100', labelAr: 'تحديث حسابات', labelEn: 'Ledger Update' },
  send_notification: { icon: Zap, color: 'text-blue-600 bg-blue-100', labelAr: 'إشعار', labelEn: 'Notification' },
  update_kpi: { icon: TrendingUp, color: 'text-purple-600 bg-purple-100', labelAr: 'تحديث مؤشرات', labelEn: 'KPI Update' },
  log_audit: { icon: BookOpen, color: 'text-amber-600 bg-amber-100', labelAr: 'سجل تدقيق', labelEn: 'Audit Log' },
  update_inventory: { icon: Package, color: 'text-orange-600 bg-orange-100', labelAr: 'تحديث مخزون', labelEn: 'Inventory Update' },
  trigger_chain: { icon: Link2, color: 'text-indigo-600 bg-indigo-100', labelAr: 'تشغيل سلسلة', labelEn: 'Chain Trigger' },
  update_compliance: { icon: Shield, color: 'text-teal-600 bg-teal-100', labelAr: 'تحديث امتثال', labelEn: 'Compliance Update' },
  recalculate_esg: { icon: Leaf, color: 'text-green-600 bg-green-100', labelAr: 'تحديث ESG', labelEn: 'ESG Recalculation' },
  custom: { icon: Activity, color: 'text-gray-600 bg-gray-100', labelAr: 'مخصص', labelEn: 'Custom' },
};

const ORG_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  transporter: { ar: 'ناقل', en: 'Transporter' },
  generator: { ar: 'مولّد', en: 'Generator' },
  recycler: { ar: 'مدوّر', en: 'Recycler' },
  disposal: { ar: 'تخلص', en: 'Disposal' },
  consultant: { ar: 'مستشار', en: 'Consultant' },
  consulting_office: { ar: 'مكتب استشاري', en: 'Consulting Office' },
  driver: { ar: 'سائق', en: 'Driver' },
  employee: { ar: 'موظف', en: 'Employee' },
  regulator: { ar: 'رقابي', en: 'Regulator' },
  admin: { ar: 'مدير', en: 'Admin' },
};

export default function CrossImpactDashboard() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [filterType, setFilterType] = useState<string>('all');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: impacts = [], isLoading } = useCrossImpactLog({
    impactType: filterType !== 'all' ? filterType : undefined,
    resourceType: filterResource !== 'all' ? filterResource : undefined,
    limit: 200,
  });

  const { data: stats } = useCrossImpactStats();

  const filteredImpacts = useMemo(() => {
    if (!searchTerm) return impacts;
    const term = searchTerm.toLowerCase();
    return impacts.filter(i =>
      i.impact_label_ar?.toLowerCase().includes(term) ||
      i.impact_label_en?.toLowerCase().includes(term) ||
      i.resource_id?.toLowerCase().includes(term) ||
      i.resource_label?.toLowerCase().includes(term)
    );
  }, [impacts, searchTerm]);

  const resourceTypes = useMemo(() => {
    const types = new Set(impacts.map(i => i.resource_type));
    return Array.from(types);
  }, [impacts]);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          {isAr ? 'لوحة الأثر المتقاطع' : 'Cross-Impact Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAr ? 'تتبع كل أثر ونتيجة مترتبة على الربط بين الجهات في المنظومة' : 'Track every impact and result from entity linkages across the system'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl font-bold text-primary">{stats?.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{isAr ? 'إجمالي الآثار' : 'Total Impacts'}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl font-bold text-emerald-600">{stats?.completedCount || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{isAr ? 'مكتملة' : 'Completed'}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl font-bold text-amber-600">{stats?.pendingCount || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{isAr ? 'معلّقة' : 'Pending'}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalFinancial ? `${(stats.totalFinancial / 1000).toFixed(1)}K` : '0'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{isAr ? 'الأثر المالي (ج.م)' : 'Financial Impact (EGP)'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="timeline">{isAr ? 'الجدول الزمني' : 'Timeline'}</TabsTrigger>
          <TabsTrigger value="by-type">{isAr ? 'حسب النوع' : 'By Type'}</TabsTrigger>
          <TabsTrigger value="by-resource">{isAr ? 'حسب المورد' : 'By Resource'}</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث في الآثار...' : 'Search impacts...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 me-1" />
              <SelectValue placeholder={isAr ? 'نوع الأثر' : 'Impact Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(IMPACT_TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{isAr ? cfg.labelAr : cfg.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResource} onValueChange={setFilterResource}>
            <SelectTrigger className="w-[180px]">
              <Package className="h-4 w-4 me-1" />
              <SelectValue placeholder={isAr ? 'نوع المورد' : 'Resource Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {resourceTypes.map(rt => (
                <SelectItem key={rt} value={rt}>{rt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isAr ? 'سلسلة الآثار الحية' : 'Live Impact Chain'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
              ) : filteredImpacts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{isAr ? 'لا توجد آثار مسجلة بعد — سيتم تسجيلها تلقائياً عند تنفيذ العمليات' : 'No impacts recorded yet — they will be logged automatically during operations'}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {filteredImpacts.map(impact => {
                        const cfg = IMPACT_TYPE_CONFIG[impact.impact_type] || IMPACT_TYPE_CONFIG.custom;
                        const Icon = cfg.icon;
                        const orgLabel = ORG_TYPE_LABELS[impact.source_org_type];
                        const targetLabel = impact.target_org_type ? ORG_TYPE_LABELS[impact.target_org_type] : null;
                        const isOutgoing = true; // From current org perspective

                        return (
                          <div key={impact.id} className="relative ps-12">
                            {/* Node dot */}
                            <div className={`absolute start-2 top-2 w-5 h-5 rounded-full flex items-center justify-center ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <Card className="border-border/50 hover:border-primary/30 transition-colors">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm">
                                        {isAr ? impact.impact_label_ar : (impact.impact_label_en || impact.impact_label_ar)}
                                      </span>
                                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                                        {isAr ? cfg.labelAr : cfg.labelEn}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      {orgLabel && (
                                        <span className="inline-flex items-center gap-1">
                                          <ArrowUpRight className="h-3 w-3" />
                                          {isAr ? orgLabel.ar : orgLabel.en}
                                        </span>
                                      )}
                                      {targetLabel && (
                                        <>
                                          <span>→</span>
                                          <span className="inline-flex items-center gap-1">
                                            <ArrowDownRight className="h-3 w-3" />
                                            {isAr ? targetLabel.ar : targetLabel.en}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                      <span className="inline-flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {impact.resource_type}: {impact.resource_label || impact.resource_id.slice(0, 8)}
                                      </span>
                                      {impact.financial_amount && (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                          <DollarSign className="h-3 w-3" />
                                          {impact.financial_amount.toLocaleString()} {impact.financial_currency}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {format(new Date(impact.created_at), 'dd MMM HH:mm', { locale: isAr ? ar : undefined })}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Type Tab */}
        <TabsContent value="by-type">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats?.byType || {}).map(([type, count]) => {
              const cfg = IMPACT_TYPE_CONFIG[type] || IMPACT_TYPE_CONFIG.custom;
              const Icon = cfg.icon;
              return (
                <Card key={type} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setFilterType(type)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{count as number}</div>
                      <div className="text-sm text-muted-foreground">{isAr ? cfg.labelAr : cfg.labelEn}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {Object.keys(stats?.byType || {}).length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                {isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
              </div>
            )}
          </div>
        </TabsContent>

        {/* By Resource Tab */}
        <TabsContent value="by-resource">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats?.byResource || {}).map(([resource, count]) => (
              <Card key={resource} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setFilterResource(resource)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent">
                    <Package className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-sm text-muted-foreground capitalize">{resource}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(stats?.byResource || {}).length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                {isAr ? 'لا توجد بيانات بعد' : 'No data yet'}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
