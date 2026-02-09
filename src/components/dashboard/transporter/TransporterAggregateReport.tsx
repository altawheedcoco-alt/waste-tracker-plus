import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, CalendarIcon, X, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { useNavigate } from 'react-router-dom';

interface TransporterAggregateReportProps {
  shipments: TransporterShipment[];
}

const TransporterAggregateReport = ({ shipments }: TransporterAggregateReportProps) => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Extract unique partners from actual shipment data
  const partnerOptions = useMemo(() => {
    const partners = new Map<string, string>();
    shipments.forEach(s => {
      if (s.generator?.name) partners.set(`gen-${s.generator.name}`, s.generator.name);
      if (s.recycler?.name) partners.set(`rec-${s.recycler.name}`, s.recycler.name);
    });
    return Array.from(partners.entries()).map(([key, name]) => ({ value: key, label: name }));
  }, [shipments]);

  // Extract unique waste types from data
  const wasteTypeOptions = useMemo(() => {
    const types = new Set<string>();
    shipments.forEach(s => { if (s.waste_type) types.add(s.waste_type); });
    return Array.from(types);
  }, [shipments]);

  const wasteTypeLabels: Record<string, string> = {
    plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
    electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
    medical: 'طبية', construction: 'مخلفات بناء', other: 'أخرى',
  };

  // Count matching shipments
  const matchingCount = useMemo(() => {
    return shipments.filter(s => {
      if (fromDate && new Date(s.created_at) < fromDate) return false;
      if (toDate && new Date(s.created_at) > toDate) return false;
      if (wasteTypeFilter !== 'all' && s.waste_type !== wasteTypeFilter) return false;
      if (companyFilter !== 'all') {
        const partnerName = companyFilter.startsWith('gen-')
          ? companyFilter.replace('gen-', '')
          : companyFilter.replace('rec-', '');
        if (s.generator?.name !== partnerName && s.recycler?.name !== partnerName) return false;
      }
      return true;
    }).length;
  }, [shipments, fromDate, toDate, wasteTypeFilter, companyFilter]);

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setWasteTypeFilter('all');
    setCompanyFilter('all');
  };

  const handleGenerateReport = () => {
    // Navigate to the aggregate report page with filter params
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate.toISOString());
    if (toDate) params.set('to', toDate.toISOString());
    if (wasteTypeFilter !== 'all') params.set('wasteType', wasteTypeFilter);
    if (companyFilter !== 'all') params.set('company', companyFilter);
    navigate(`/dashboard/aggregate-report?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <FileText className="w-5 h-5" />
          التقرير المجمع للشحنات
        </CardTitle>
        <CardDescription className="text-primary">
          طباعة تقرير مجمع للشحنات مع التوقيعات والأختام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-right">
            <Label>من تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-right", !fromDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP", { locale: ar }) : "yyyy/شهر/يوم"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 text-right">
            <Label>إلى تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-right", !toDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP", { locale: ar }) : "yyyy/شهر/يوم"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 text-right">
            <Label>نوع المخلف</Label>
            <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
              <SelectTrigger><SelectValue placeholder="جميع الأنواع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {wasteTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>
                    {wasteTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 text-right">
            <Label>الشركة</Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger><SelectValue placeholder="جميع الشركات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشركات</SelectItem>
                {partnerOptions.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" onClick={resetFilters}>
            <X className="ml-2 h-4 w-4" />
            إعادة تعيين الفلاتر
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {matchingCount} شحنة مطابقة
          </Badge>
        </div>

        <Button
          variant="eco"
          className="w-full"
          size="lg"
          onClick={handleGenerateReport}
          disabled={matchingCount === 0}
        >
          <Printer className="ml-2 h-5 w-5" />
          إنشاء وطباعة التقرير المجمع ({matchingCount} شحنة)
        </Button>

        <div className="p-4 rounded-lg bg-muted/50 text-right">
          <p className="font-medium mb-2">ملاحظات:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>سيتم تضمين التوقيعات والأختام المحفوظة تلقائياً</li>
            <li>يمكن تصفية الشحنات حسب التاريخ، نوع المخلف، والشركة</li>
            <li>سيتم عرض معاينة العدد قبل الطباعة</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterAggregateReport;
