import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Printer,
  FileText,
  Loader2,
  Calendar,
  Package,
  Building2,
  Truck,
  Recycle,
  Stamp,
  PenTool,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BackButton from '@/components/ui/back-button';
import { usePDFExport } from '@/hooks/usePDFExport';

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  pickup_date: string | null;
  delivered_at: string | null;
  generator: {
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
  };
  transporter: {
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
  };
  recycler: {
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
  };
}

const AggregateShipmentReport = () => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [includeStamps, setIncludeStamps] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const { exportToPDF, isExporting: isExportingPDF } = usePDFExport({
    filename: 'تقرير-مجمع-الشحنات',
    orientation: 'landscape',
  });

  const handleExportPDF = async () => {
    await exportToPDF(printRef.current, 'تقرير-مجمع-الشحنات');
  };

  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['aggregate-shipments', organization?.id, startDate, endDate, statusFilter, wasteTypeFilter],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          status,
          pickup_address,
          delivery_address,
          created_at,
          pickup_date,
          delivered_at,
          generator:generator_id(name, logo_url, stamp_url, signature_url, client_code),
          transporter:transporter_id(name, logo_url, stamp_url, signature_url, client_code),
          recycler:recycler_id(name, logo_url, stamp_url, signature_url, client_code)
        `)
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'new' | 'approved' | 'collecting' | 'in_transit' | 'delivered' | 'confirmed');
      }
      if (wasteTypeFilter !== 'all') {
        query = query.eq('waste_type', wasteTypeFilter as 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'chemical' | 'medical' | 'construction' | 'other');
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return (data || []) as unknown as ShipmentData[];
    },
    enabled: !!organization?.id,
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'جديدة',
      approved: 'معتمدة',
      collecting: 'جاري التجميع',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      confirmed: 'مؤكدة',
    };
    return labels[status] || status;
  };

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plastic: 'بلاستيك',
      paper: 'ورق',
      metal: 'معادن',
      glass: 'زجاج',
      electronic: 'إلكترونيات',
      organic: 'عضوي',
      chemical: 'كيميائي',
      medical: 'طبي',
      construction: 'مخلفات بناء',
      other: 'أخرى',
    };
    return labels[type] || type;
  };

  const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Filters Card - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              فلترة التقرير المجمع
            </CardTitle>
            <CardDescription>حدد معايير التصفية لإنشاء التقرير المجمع للشحنات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>حالة الشحنة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="new">جديدة</SelectItem>
                    <SelectItem value="approved">معتمدة</SelectItem>
                    <SelectItem value="collecting">جاري التجميع</SelectItem>
                    <SelectItem value="in_transit">في الطريق</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع النفايات</Label>
                <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="plastic">بلاستيك</SelectItem>
                    <SelectItem value="paper">ورق</SelectItem>
                    <SelectItem value="metal">معادن</SelectItem>
                    <SelectItem value="glass">زجاج</SelectItem>
                    <SelectItem value="electronic">إلكترونيات</SelectItem>
                    <SelectItem value="organic">عضوي</SelectItem>
                    <SelectItem value="chemical">كيميائي</SelectItem>
                    <SelectItem value="medical">طبي</SelectItem>
                    <SelectItem value="construction">مخلفات بناء</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Print Options */}
            <div className="space-y-4">
              <h4 className="font-medium">خيارات الطباعة</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-stamps"
                    checked={includeStamps}
                    onCheckedChange={(checked) => setIncludeStamps(checked as boolean)}
                  />
                  <Label htmlFor="include-stamps" className="flex items-center gap-2 cursor-pointer">
                    <Stamp className="w-4 h-4" />
                    تضمين الأختام
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-signatures"
                    checked={includeSignatures}
                    onCheckedChange={(checked) => setIncludeSignatures(checked as boolean)}
                  />
                  <Label htmlFor="include-signatures" className="flex items-center gap-2 cursor-pointer">
                    <PenTool className="w-4 h-4" />
                    تضمين التوقيعات
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث البيانات
              </Button>
              <Button onClick={handlePrint} disabled={shipments.length === 0 || isPrinting} className="gap-2">
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                طباعة التقرير
              </Button>
              <Button onClick={handleExportPDF} disabled={shipments.length === 0 || isExportingPDF} className="gap-2">
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                تحميل PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview / Print Area */}
        <div ref={printRef} className="print:p-0">
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="print:pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-6 h-6" />
                    التقرير المجمع للشحنات
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {organization?.name} | تاريخ التقرير: {format(new Date(), 'dd/MM/yyyy', { locale: ar })}
                  </CardDescription>
                </div>
                <div className="text-left print:block hidden">
                  <p className="text-sm text-muted-foreground">عدد الشحنات: {shipments.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الكميات: {totalQuantity.toLocaleString()} كجم</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : shipments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد شحنات تطابق معايير البحث</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-2xl font-bold text-primary">{shipments.length}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{totalQuantity.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الكميات (كجم)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {shipments.filter(s => s.status === 'confirmed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">شحنات مؤكدة</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {shipments.filter(s => s.status === 'in_transit').length}
                      </p>
                      <p className="text-sm text-muted-foreground">في الطريق</p>
                    </div>
                  </div>

                  {/* Shipments Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border p-2 text-right">#</th>
                          <th className="border p-2 text-right">رقم الشحنة</th>
                          <th className="border p-2 text-right">نوع النفايات</th>
                          <th className="border p-2 text-right">الكمية</th>
                          <th className="border p-2 text-right">الحالة</th>
                          <th className="border p-2 text-right">الجهة المولدة</th>
                          <th className="border p-2 text-right">الجهة الناقلة</th>
                          <th className="border p-2 text-right">الجهة المدورة</th>
                          <th className="border p-2 text-right">تاريخ الإنشاء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipments.map((shipment, index) => (
                          <tr key={shipment.id} className="hover:bg-muted/30">
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2 font-mono text-xs">{shipment.shipment_number}</td>
                            <td className="border p-2">{getWasteTypeLabel(shipment.waste_type)}</td>
                            <td className="border p-2">{shipment.quantity} {shipment.unit || 'كجم'}</td>
                            <td className="border p-2">
                              <Badge variant="outline" className="text-xs">
                                {getStatusLabel(shipment.status)}
                              </Badge>
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.generator?.name || '-'}
                              {shipment.generator?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.generator.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.transporter?.name || '-'}
                              {shipment.transporter?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.transporter.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.recycler?.name || '-'}
                              {shipment.recycler?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.recycler.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">{formatDate(shipment.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Stamps and Signatures Section */}
                  {(includeStamps || includeSignatures) && (
                    <div className="mt-8 pt-6 border-t print:break-inside-avoid">
                      <h4 className="font-semibold mb-4 text-center">التوثيق والاعتماد</h4>
                      <div className="grid grid-cols-3 gap-6">
                        {/* Generator */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            <Building2 className="w-4 h-4" />
                            الجهة المولدة
                          </div>
                          <p className="text-sm text-muted-foreground">{organization?.name}</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && organization && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transporter */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            <Truck className="w-4 h-4" />
                            الجهة الناقلة
                          </div>
                          <p className="text-sm text-muted-foreground">_______________</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recycler */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            <Recycle className="w-4 h-4" />
                            الجهة المدورة
                          </div>
                          <p className="text-sm text-muted-foreground">_______________</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center">
                                  <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground print:mt-8">
                    <p>تم إنشاء هذا التقرير بواسطة نظام آي ريسايكل لإدارة النفايات</p>
                    <p className="mt-1">تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root > div > div > div > main > div > div:last-child,
          #root > div > div > div > main > div > div:last-child * {
            visibility: visible;
          }
          #root > div > div > div > main > div > div:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AggregateShipmentReport;
