import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, CalendarIcon, X, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TransporterAggregateReport = () => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setWasteTypeFilter('all');
    setCompanyFilter('all');
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
                <SelectItem value="plastic">بلاستيك</SelectItem>
                <SelectItem value="paper">ورق</SelectItem>
                <SelectItem value="metal">معادن</SelectItem>
                <SelectItem value="glass">زجاج</SelectItem>
                <SelectItem value="electronic">إلكترونيات</SelectItem>
                <SelectItem value="organic">عضوية</SelectItem>
                <SelectItem value="chemical">كيميائية</SelectItem>
                <SelectItem value="medical">طبية</SelectItem>
                <SelectItem value="construction">مخلفات بناء</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 text-right">
            <Label>الشركة</Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger><SelectValue placeholder="جميع الشركات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشركات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={resetFilters}>
            <X className="ml-2 h-4 w-4" />
            إعادة تعيين الفلاتر
          </Button>
        </div>

        <Button variant="eco" className="w-full" size="lg">
          <Printer className="ml-2 h-5 w-5" />
          إنشاء وطباعة التقرير المجمع
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
