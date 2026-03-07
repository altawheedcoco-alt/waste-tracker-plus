import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, TrendingUp, PieChart, Activity,
  Calendar as CalendarIcon, RefreshCw,
  DollarSign, Leaf, Gauge
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import ShipmentsChart from './charts/ShipmentsChart';
import WasteTypeDistribution from './charts/WasteTypeDistribution';
import PartnerPerformanceChart from './charts/PartnerPerformanceChart';
import TrendAnalysisChart from './charts/TrendAnalysisChart';
import FinancialChart from './charts/FinancialChart';
import EnvironmentalChart from './charts/EnvironmentalChart';
import OperationalChart from './charts/OperationalChart';
import KPICards from './KPICards';
import AnalyticsFilters from './AnalyticsFilters';
import AIInsightsPanel from './AIInsightsPanel';
import ComparisonBanner from './ComparisonBanner';
import AnalyticsSummaryExport from './AnalyticsSummaryExport';
import BackButton from '@/components/ui/back-button';

type DateRange = { from: Date; to: Date };
type TimePreset = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

const AnalyticsDashboard = () => {
  const { organization } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [timePreset, setTimePreset] = useState<TimePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTimePresetChange = useCallback((preset: TimePreset) => {
    setTimePreset(preset);
    const now = new Date();
    const presetMap: Record<string, () => DateRange> = {
      '7d': () => ({ from: subDays(now, 7), to: now }),
      '30d': () => ({ from: subDays(now, 30), to: now }),
      '90d': () => ({ from: subDays(now, 90), to: now }),
      '6m': () => ({ from: subMonths(now, 6), to: now }),
      '1y': () => ({ from: subMonths(now, 12), to: now }),
    };
    if (presetMap[preset]) setDateRange(presetMap[preset]());
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    toast({ title: t('analytics.dataUpdated'), description: t('analytics.allDataUpdated') });
  };

  const orgId = organization?.id || null;

  const tabs = [
    { value: 'overview', label: t('analytics.overview'), icon: BarChart3 },
    { value: 'financial', label: t('analytics.financial'), icon: DollarSign },
    { value: 'operational', label: t('analytics.operational'), icon: Gauge },
    { value: 'environmental', label: t('analytics.environmental'), icon: Leaf },
    { value: 'trends', label: t('analytics.trends'), icon: TrendingUp },
    { value: 'distribution', label: t('analytics.distribution'), icon: PieChart },
    { value: 'performance', label: t('analytics.performance'), icon: Activity },
  ];

  const timePresets = [
    { value: '7d', label: t('analytics.days7') },
    { value: '30d', label: t('analytics.days30') },
    { value: '90d', label: t('analytics.months3') },
    { value: '6m', label: t('analytics.months6') },
    { value: '1y', label: t('analytics.year1') },
  ];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 ml-2 rtl:ml-2 ltr:mr-2", isRefreshing && "animate-spin")} />
            {t('analytics.refresh')}
          </Button>
          <AnalyticsSummaryExport organizationId={orgId} dateRange={dateRange} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t('analytics.period')}:</span>
              <div className="flex gap-1 flex-wrap">
                {timePresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={timePreset === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimePresetChange(preset.value as TimePreset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 ml-2 rtl:ml-2 ltr:mr-2" />
                  {format(dateRange.from, 'dd/MM/yyyy', { locale: ar })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ar })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                      setTimePreset('custom');
                    }
                  }}
                  locale={ar}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <ComparisonBanner organizationId={orgId} dateRange={dateRange} />
      <KPICards organizationId={orgId} dateRange={dateRange} />
      <AIInsightsPanel organizationId={orgId} dateRange={dateRange} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs md:text-sm py-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {['overview', 'trends', 'distribution', 'performance'].includes(activeTab) && (
          <AnalyticsFilters
            organizationId={orgId}
            selectedWasteTypes={selectedWasteTypes}
            onWasteTypesChange={setSelectedWasteTypes}
            selectedPartners={selectedPartners}
            onPartnersChange={setSelectedPartners}
          />
        )}

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ShipmentsChart organizationId={orgId} dateRange={dateRange} wasteTypes={selectedWasteTypes} />
            <WasteTypeDistribution organizationId={orgId} dateRange={dateRange} />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialChart organizationId={orgId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <OperationalChart organizationId={orgId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="environmental" className="space-y-4">
          <EnvironmentalChart organizationId={orgId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendAnalysisChart organizationId={orgId} dateRange={dateRange} wasteTypes={selectedWasteTypes} />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <WasteTypeDistribution organizationId={orgId} dateRange={dateRange} detailed />
            <Card>
              <CardContent className="pt-6">
                <ShipmentsChart organizationId={orgId} dateRange={dateRange} groupBy="status" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PartnerPerformanceChart organizationId={orgId} dateRange={dateRange} selectedPartners={selectedPartners} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
