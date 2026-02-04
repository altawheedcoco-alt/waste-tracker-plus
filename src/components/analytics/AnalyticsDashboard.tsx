import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import ShipmentsChart from './charts/ShipmentsChart';
import WasteTypeDistribution from './charts/WasteTypeDistribution';
import PartnerPerformanceChart from './charts/PartnerPerformanceChart';
import TrendAnalysisChart from './charts/TrendAnalysisChart';
import KPICards from './KPICards';
import AnalyticsFilters from './AnalyticsFilters';

type DateRange = {
  from: Date;
  to: Date;
};

type TimePreset = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

const AnalyticsDashboard = () => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timePreset, setTimePreset] = useState<TimePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTimePresetChange = (preset: TimePreset) => {
    setTimePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case '7d':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
      case '6m':
        setDateRange({ from: subMonths(now, 6), to: now });
        break;
      case '1y':
        setDateRange({ from: subMonths(now, 12), to: now });
        break;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger refetch in child components
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Export functionality will be implemented
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التحليلات المتقدمة</h1>
          <p className="text-muted-foreground">
            رؤى شاملة وتقارير تفاعلية لأداء العمليات
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 ml-2", isRefreshing && "animate-spin")} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">الفترة:</span>
              <div className="flex gap-1">
                {[
                  { value: '7d', label: '7 أيام' },
                  { value: '30d', label: '30 يوم' },
                  { value: '90d', label: '3 أشهر' },
                  { value: '6m', label: '6 أشهر' },
                  { value: '1y', label: 'سنة' },
                ].map((preset) => (
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

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 ml-2" />
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
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <KPICards 
        organizationId={organization?.id || null}
        dateRange={dateRange}
      />

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            الاتجاهات
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            التوزيع
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            الأداء
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <AnalyticsFilters
          organizationId={organization?.id || null}
          selectedWasteTypes={selectedWasteTypes}
          onWasteTypesChange={setSelectedWasteTypes}
          selectedPartners={selectedPartners}
          onPartnersChange={setSelectedPartners}
        />

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ShipmentsChart
              organizationId={organization?.id || null}
              dateRange={dateRange}
              wasteTypes={selectedWasteTypes}
            />
            <WasteTypeDistribution
              organizationId={organization?.id || null}
              dateRange={dateRange}
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendAnalysisChart
            organizationId={organization?.id || null}
            dateRange={dateRange}
            wasteTypes={selectedWasteTypes}
          />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <WasteTypeDistribution
              organizationId={organization?.id || null}
              dateRange={dateRange}
              detailed
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  توزيع حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentsChart
                  organizationId={organization?.id || null}
                  dateRange={dateRange}
                  groupBy="status"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PartnerPerformanceChart
            organizationId={organization?.id || null}
            dateRange={dateRange}
            selectedPartners={selectedPartners}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
