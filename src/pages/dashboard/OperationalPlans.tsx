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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { usePDFExport } from '@/hooks/usePDFExport';
import { 
  Printer,
  FileText,
  Loader2,
  Package,
  Building2,
  Truck,
  Recycle,
  Stamp,
  PenTool,
  RefreshCw,
  ClipboardList,
  Scale,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
  X,
  MapPin,
  Calendar,
  Info,
  Biohazard,
  Leaf,
  Heart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BackButton from '@/components/ui/back-button';
// jsPDF & html2canvas loaded dynamically

// Waste category definitions
const HAZARDOUS_TYPES = ['chemical', 'electronic'];
const MEDICAL_TYPES = ['medical'];
const NON_HAZARDOUS_TYPES = ['plastic', 'paper', 'metal', 'glass', 'organic', 'construction', 'other'];

type WasteCategory = 'all' | 'hazardous' | 'non-hazardous' | 'medical';

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  waste_description: string | null;
  quantity: number;
  unit: string;
  status: string;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  pickup_date: string | null;
  delivered_at: string | null;
  generator: {
    name: string;
    name_en: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    address: string;
    city: string;
    phone: string;
    email: string;
    commercial_register: string | null;
    environmental_license: string | null;
  };
  transporter: {
    name: string;
    name_en: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    address: string;
    city: string;
    phone: string;
  };
  recycler: {
    name: string;
    name_en: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    address: string;
    city: string;
    phone: string;
  };
}

const OperationalPlans = () => {
  const { organization, roles } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [generatorFilter, setGeneratorFilter] = useState<string>('all');
  const [recyclerFilter, setRecyclerFilter] = useState<string>('all');
  const [transporterFilter, setTransporterFilter] = useState<string>('all');
  const [includeStamps, setIncludeStamps] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [excludedShipments, setExcludedShipments] = useState<Set<string>>(new Set());
  const [selectedShipment, setSelectedShipment] = useState<ShipmentData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [wasteCategory, setWasteCategory] = useState<WasteCategory>('all');
  
  // Print exclusion options
  const [hidePhoneInPrint, setHidePhoneInPrint] = useState(false);
  const [hidePercentageInPrint, setHidePercentageInPrint] = useState(false);
  const [hideHazardLevelInPrint, setHideHazardLevelInPrint] = useState(false);

  const { printContent } = usePDFExport({ filename: 'خطة-تشغيلية' });
  const isAdmin = roles.includes('admin');

  // Filter shipments by waste category
  const filterByCategory = (shipments: ShipmentData[], category: WasteCategory) => {
    if (category === 'all') return shipments;
    if (category === 'hazardous') return shipments.filter(s => HAZARDOUS_TYPES.includes(s.waste_type));
    if (category === 'medical') return shipments.filter(s => MEDICAL_TYPES.includes(s.waste_type));
    if (category === 'non-hazardous') return shipments.filter(s => NON_HAZARDOUS_TYPES.includes(s.waste_type));
    return shipments;
  };

  const getCategoryTitle = (category: WasteCategory) => {
    const titles: Record<WasteCategory, string> = {
      'all': 'الخطة التشغيلية الشاملة',
      'hazardous': 'الخطة التشغيلية للمخلفات الخطرة',
      'non-hazardous': 'الخطة التشغيلية للمخلفات غير الخطرة',
      'medical': 'الخطة التشغيلية للنفايات الطبية',
    };
    return titles[category];
  };

  const getCategoryIcon = (category: WasteCategory) => {
    const icons: Record<WasteCategory, React.ReactNode> = {
      'all': <ClipboardList className="w-5 h-5" />,
      'hazardous': <Biohazard className="w-5 h-5" />,
      'non-hazardous': <Leaf className="w-5 h-5" />,
      'medical': <Heart className="w-5 h-5" />,
    };
    return icons[category];
  };

  // Fetch organizations for filters
  const { data: generators = [] } = useQuery({
    queryKey: ['generators-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, client_code')
        .eq('organization_type', 'generator')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: recyclers = [] } = useQuery({
    queryKey: ['recyclers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, client_code')
        .eq('organization_type', 'recycler')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: transporters = [] } = useQuery({
    queryKey: ['transporters-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, client_code')
        .eq('organization_type', 'transporter')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: allShipments = [], isLoading, refetch } = useQuery({
    queryKey: ['operational-plan-shipments', organization?.id, startDate, endDate, statusFilter, wasteTypeFilter, generatorFilter, recyclerFilter, transporterFilter, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          waste_description,
          quantity,
          unit,
          status,
          hazard_level,
          packaging_method,
          disposal_method,
          pickup_address,
          delivery_address,
          created_at,
          pickup_date,
          delivered_at,
          generator:generator_id(name, name_en, logo_url, stamp_url, signature_url, client_code, address, city, phone, email, commercial_register, environmental_license),
          transporter:transporter_id(name, name_en, logo_url, stamp_url, signature_url, client_code, address, city, phone),
          recycler:recycler_id(name, name_en, logo_url, stamp_url, signature_url, client_code, address, city, phone)
        `)
        .order('created_at', { ascending: false });

      // For non-admin users, filter by organization
      if (!isAdmin && organization?.id) {
        query = query.or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);
      }

      // Apply filters for admin
      if (isAdmin) {
        if (generatorFilter !== 'all') {
          query = query.eq('generator_id', generatorFilter);
        }
        if (recyclerFilter !== 'all') {
          query = query.eq('recycler_id', recyclerFilter);
        }
        if (transporterFilter !== 'all') {
          query = query.eq('transporter_id', transporterFilter);
        }
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'new' | 'approved' | 'in_transit' | 'delivered' | 'confirmed');
      }
      if (wasteTypeFilter !== 'all') {
        query = query.eq('waste_type', wasteTypeFilter as 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'chemical' | 'medical' | 'construction' | 'other');
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      return (data || []) as unknown as ShipmentData[];
    },
    enabled: isAdmin || !!organization?.id,
  });

  // Filter out excluded shipments and apply category filter
  const filteredByCategory = filterByCategory(allShipments, wasteCategory);
  const shipments = filteredByCategory.filter(s => !excludedShipments.has(s.id));

  const toggleExcludeShipment = (shipmentId: string) => {
    setExcludedShipments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId);
      } else {
        newSet.add(shipmentId);
      }
      return newSet;
    });
  };

  const clearExclusions = () => {
    setExcludedShipments(new Set());
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'جديدة',
      approved: 'معتمدة',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      confirmed: 'مؤكدة',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      confirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const getWasteTypeCode = (type: string) => {
    const codes: Record<string, string> = {
      plastic: 'PL-01',
      paper: 'PP-01',
      metal: 'MT-01',
      glass: 'GL-01',
      electronic: 'EL-01',
      organic: 'OR-01',
      chemical: 'CH-01',
      medical: 'MD-01',
      construction: 'CN-01',
      other: 'OT-01',
    };
    return codes[type] || 'XX-00';
  };

  const getHazardLabel = (level: string | null) => {
    if (!level) return 'غير محدد';
    const labels: Record<string, string> = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'مرتفع',
      critical: 'حرج',
      none: 'غير خطر',
    };
    return labels[level] || level;
  };

  const getHazardColor = (level: string | null) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      none: 'bg-green-100 text-green-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  
  // Group by waste type
  const wasteTypeSummary = shipments.reduce((acc, s) => {
    const type = s.waste_type;
    if (!acc[type]) {
      acc[type] = { count: 0, quantity: 0 };
    }
    acc[type].count += 1;
    acc[type].quantity += s.quantity || 0;
    return acc;
  }, {} as Record<string, { count: number; quantity: number }>);

  // Group by generator
  const generatorSummary = shipments.reduce((acc, s) => {
    const name = s.generator?.name || 'غير محدد';
    if (!acc[name]) {
      acc[name] = { count: 0, quantity: 0, clientCode: s.generator?.client_code, city: s.generator?.city, phone: s.generator?.phone };
    }
    acc[name].count += 1;
    acc[name].quantity += s.quantity || 0;
    return acc;
  }, {} as Record<string, { count: number; quantity: number; clientCode?: string | null; city?: string; phone?: string }>);

  // Group by transporter
  const transporterSummary = shipments.reduce((acc, s) => {
    const name = s.transporter?.name || 'غير محدد';
    if (!acc[name]) {
      acc[name] = { count: 0, quantity: 0, clientCode: s.transporter?.client_code, city: s.transporter?.city, phone: s.transporter?.phone };
    }
    acc[name].count += 1;
    acc[name].quantity += s.quantity || 0;
    return acc;
  }, {} as Record<string, { count: number; quantity: number; clientCode?: string | null; city?: string; phone?: string }>);

  // Group by recycler
  const recyclerSummary = shipments.reduce((acc, s) => {
    const name = s.recycler?.name || 'غير محدد';
    if (!acc[name]) {
      acc[name] = { count: 0, quantity: 0, clientCode: s.recycler?.client_code, city: s.recycler?.city, phone: s.recycler?.phone };
    }
    acc[name].count += 1;
    acc[name].quantity += s.quantity || 0;
    return acc;
  }, {} as Record<string, { count: number; quantity: number; clientCode?: string | null; city?: string; phone?: string }>);

  const handlePrint = () => {
    if (printRef.current) {
      setIsPrinting(true);
      printContent(printRef.current);
      setTimeout(() => setIsPrinting(false), 500);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    setIsExportingPDF(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `operational-plan-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.success('تم تصدير الخطة التشغيلية بنجاح');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('حدث خطأ أثناء تصدير PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  const confirmedCount = shipments.filter(s => s.status === 'confirmed').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length;
  const hazardousCount = shipments.filter(s => s.hazard_level && s.hazard_level !== 'none').length;

  const openShipmentDetails = (shipment: ShipmentData) => {
    setSelectedShipment(shipment);
    setShowDetailsDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Filters Card - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              الخطة التشغيلية
            </CardTitle>
            <CardDescription>
              ملخص شامل لكميات المخلفات المنقولة ونوعيتها والجهات المعنية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Tabs */}
            <Tabs value={wasteCategory} onValueChange={(v) => setWasteCategory(v as WasteCategory)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">الكل</span>
                </TabsTrigger>
                <TabsTrigger value="hazardous" className="gap-2">
                  <Biohazard className="w-4 h-4" />
                  <span className="hidden sm:inline">خطرة</span>
                </TabsTrigger>
                <TabsTrigger value="non-hazardous" className="gap-2">
                  <Leaf className="w-4 h-4" />
                  <span className="hidden sm:inline">غير خطرة</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">طبية</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Stats Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">الكل</p>
                <p className="text-lg font-bold">{allShipments.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Biohazard className="w-3 h-3 text-red-500" />
                  خطرة
                </p>
                <p className="text-lg font-bold text-red-600">{filterByCategory(allShipments, 'hazardous').length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Leaf className="w-3 h-3 text-green-500" />
                  غير خطرة
                </p>
                <p className="text-lg font-bold text-green-600">{filterByCategory(allShipments, 'non-hazardous').length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-pink-500" />
                  طبية
                </p>
                <p className="text-lg font-bold text-pink-600">{filterByCategory(allShipments, 'medical').length}</p>
              </div>
            </div>

            <Separator />
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
                    <SelectItem value="in_transit">في الطريق</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع المخلفات</Label>
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

            {/* Admin-only organization filters */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الجهة المولدة</Label>
                  <Select value={generatorFilter} onValueChange={setGeneratorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الجهات المولدة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الجهات المولدة</SelectItem>
                      {generators.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} {g.client_code && `(${g.client_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الجهة الناقلة</Label>
                  <Select value={transporterFilter} onValueChange={setTransporterFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الجهات الناقلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الجهات الناقلة</SelectItem>
                      {transporters.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {t.client_code && `(${t.client_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>جهة التدوير</Label>
                  <Select value={recyclerFilter} onValueChange={setRecyclerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع جهات التدوير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع جهات التدوير</SelectItem>
                      {recyclers.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} {r.client_code && `(${r.client_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            {/* Print Options */}
            <div className="space-y-4">
              <h4 className="font-medium">خيارات الطباعة والتصدير</h4>
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
              
              {/* Column Exclusion Options */}
              <div className="p-3 rounded-lg bg-muted/30 space-y-3">
                <h5 className="text-sm font-medium text-muted-foreground">إخفاء من الطباعة/PDF</h5>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide-phone"
                      checked={hidePhoneInPrint}
                      onCheckedChange={(checked) => setHidePhoneInPrint(checked as boolean)}
                    />
                    <Label htmlFor="hide-phone" className="text-sm cursor-pointer">
                      إخفاء الهاتف
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide-percentage"
                      checked={hidePercentageInPrint}
                      onCheckedChange={(checked) => setHidePercentageInPrint(checked as boolean)}
                    />
                    <Label htmlFor="hide-percentage" className="text-sm cursor-pointer">
                      إخفاء النسبة
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide-hazard"
                      checked={hideHazardLevelInPrint}
                      onCheckedChange={(checked) => setHideHazardLevelInPrint(checked as boolean)}
                    />
                    <Label htmlFor="hide-hazard" className="text-sm cursor-pointer">
                      إخفاء مستوى الخطورة
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Excluded shipments info */}
            {excludedShipments.size > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <EyeOff className="w-4 h-4" />
                    <span>تم استبعاد {excludedShipments.size} شحنة من الخطة التشغيلية</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearExclusions} className="text-amber-800 dark:text-amber-400">
                    <X className="w-4 h-4 ml-1" />
                    إلغاء الاستبعاد
                  </Button>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={async () => {
                  try {
                    await refetch();
                    toast.success('تم تحديث البيانات بنجاح');
                  } catch (error) {
                    toast.error('حدث خطأ أثناء تحديث البيانات');
                  }
                }} 
                variant="outline" 
                className="gap-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                تحديث البيانات
              </Button>
              <Button onClick={handlePrint} disabled={shipments.length === 0 || isPrinting} variant="outline" className="gap-2">
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                طباعة
              </Button>
              <Button onClick={handleExportPDF} disabled={shipments.length === 0 || isExportingPDF} className="gap-2">
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                تصدير PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview / Print Area */}
        <div ref={printRef} className="print:p-0 bg-white dark:bg-background">
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="print:pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {getCategoryIcon(wasteCategory)}
                    {getCategoryTitle(wasteCategory)}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {organization?.name || 'نظام إدارة المخلفات'} | تاريخ التقرير: {format(new Date(), 'dd/MM/yyyy', { locale: ar })}
                    {startDate && endDate && (
                      <span className="block mt-1">
                        الفترة: من {formatDate(startDate)} إلى {formatDate(endDate)}
                      </span>
                    )}
                    {wasteCategory !== 'all' && (
                      <span className="block mt-1">
                        <Badge variant="outline" className="text-xs">
                          {wasteCategory === 'hazardous' && 'المخلفات الخطرة'}
                          {wasteCategory === 'non-hazardous' && 'المخلفات غير الخطرة'}
                          {wasteCategory === 'medical' && 'النفايات الطبية'}
                        </Badge>
                      </span>
                    )}
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
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:grid-cols-5">
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{shipments.length}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                      <Scale className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-2xl font-bold text-emerald-600">{totalQuantity.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الكميات (كجم)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-teal-500/10 text-center">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                      <p className="text-2xl font-bold text-teal-600">{confirmedCount}</p>
                      <p className="text-sm text-muted-foreground">شحنات مؤكدة</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 text-center">
                      <Truck className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-600">{inTransitCount}</p>
                      <p className="text-sm text-muted-foreground">في الطريق</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                      <p className="text-2xl font-bold text-amber-600">{hazardousCount}</p>
                      <p className="text-sm text-muted-foreground">مخلفات خطرة</p>
                    </div>
                  </div>

                  {/* Waste Types Summary */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      ملخص أنواع المخلفات
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-right">نوع المخلفات</th>
                            <th className="border p-2 text-right">الكود البيئي</th>
                            <th className="border p-2 text-right">عدد الشحنات</th>
                            <th className="border p-2 text-right">إجمالي الكمية (كجم)</th>
                            <th className={`border p-2 text-right ${hidePercentageInPrint ? 'print:hidden' : ''}`}>النسبة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(wasteTypeSummary).map(([type, data]) => (
                            <tr key={type} className="hover:bg-muted/30">
                              <td className="border p-2 font-medium">{getWasteTypeLabel(type)}</td>
                              <td className="border p-2 font-mono text-xs">{getWasteTypeCode(type)}</td>
                              <td className="border p-2">{data.count}</td>
                              <td className="border p-2">{data.quantity.toLocaleString()}</td>
                              <td className={`border p-2 ${hidePercentageInPrint ? 'print:hidden' : ''}`}>
                                {totalQuantity > 0 ? ((data.quantity / totalQuantity) * 100).toFixed(1) : 0}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50 font-bold">
                            <td className="border p-2">الإجمالي</td>
                            <td className="border p-2">-</td>
                            <td className="border p-2">{shipments.length}</td>
                            <td className="border p-2">{totalQuantity.toLocaleString()}</td>
                            <td className={`border p-2 ${hidePercentageInPrint ? 'print:hidden' : ''}`}>100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Generator Summary */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      ملخص الجهات المولدة
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-right">اسم الجهة المولدة</th>
                            <th className="border p-2 text-right">كود العميل</th>
                            <th className="border p-2 text-right">المدينة</th>
                            <th className={`border p-2 text-right ${hidePhoneInPrint ? 'print:hidden' : ''}`}>الهاتف</th>
                            <th className="border p-2 text-right">عدد الشحنات</th>
                            <th className="border p-2 text-right">إجمالي الكمية (كجم)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(generatorSummary).map(([name, data]) => (
                            <tr key={name} className="hover:bg-muted/30">
                              <td className="border p-2 font-medium">{name}</td>
                              <td className="border p-2 font-mono text-xs">{data.clientCode || '-'}</td>
                              <td className="border p-2 text-xs">{data.city || '-'}</td>
                              <td className={`border p-2 text-xs font-mono ${hidePhoneInPrint ? 'print:hidden' : ''}`}>{data.phone || '-'}</td>
                              <td className="border p-2">{data.count}</td>
                              <td className="border p-2">{data.quantity.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Transporter Summary */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      ملخص الجهات الناقلة
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-right">اسم الجهة الناقلة</th>
                            <th className="border p-2 text-right">كود العميل</th>
                            <th className="border p-2 text-right">المدينة</th>
                            <th className={`border p-2 text-right ${hidePhoneInPrint ? 'print:hidden' : ''}`}>الهاتف</th>
                            <th className="border p-2 text-right">عدد الشحنات</th>
                            <th className="border p-2 text-right">إجمالي الكمية (كجم)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(transporterSummary).map(([name, data]) => (
                            <tr key={name} className="hover:bg-muted/30">
                              <td className="border p-2 font-medium">{name}</td>
                              <td className="border p-2 font-mono text-xs">{data.clientCode || '-'}</td>
                              <td className="border p-2 text-xs">{data.city || '-'}</td>
                              <td className={`border p-2 text-xs font-mono ${hidePhoneInPrint ? 'print:hidden' : ''}`}>{data.phone || '-'}</td>
                              <td className="border p-2">{data.count}</td>
                              <td className="border p-2">{data.quantity.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recycler Summary */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Recycle className="w-5 h-5" />
                      ملخص جهات التدوير
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-right">اسم جهة التدوير</th>
                            <th className="border p-2 text-right">كود العميل</th>
                            <th className="border p-2 text-right">المدينة</th>
                            <th className={`border p-2 text-right ${hidePhoneInPrint ? 'print:hidden' : ''}`}>الهاتف</th>
                            <th className="border p-2 text-right">عدد الشحنات</th>
                            <th className="border p-2 text-right">إجمالي الكمية (كجم)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(recyclerSummary).map(([name, data]) => (
                            <tr key={name} className="hover:bg-muted/30">
                              <td className="border p-2 font-medium">{name}</td>
                              <td className="border p-2 font-mono text-xs">{data.clientCode || '-'}</td>
                              <td className="border p-2 text-xs">{data.city || '-'}</td>
                              <td className={`border p-2 text-xs font-mono ${hidePhoneInPrint ? 'print:hidden' : ''}`}>{data.phone || '-'}</td>
                              <td className="border p-2">{data.count}</td>
                              <td className="border p-2">{data.quantity.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detailed Shipments Table */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      تفاصيل الشحنات
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-right print:hidden">تضمين</th>
                            <th className="border p-2 text-right">#</th>
                            <th className="border p-2 text-right">رقم الشحنة</th>
                            <th className="border p-2 text-right">نوع المخلفات</th>
                            <th className="border p-2 text-right">الكود</th>
                            <th className="border p-2 text-right">الكمية</th>
                            <th className={`border p-2 text-right ${hideHazardLevelInPrint ? 'print:hidden' : ''}`}>مستوى الخطورة</th>
                            <th className="border p-2 text-right">الحالة</th>
                            <th className="border p-2 text-right">الجهة المولدة</th>
                            <th className="border p-2 text-right">الجهة الناقلة</th>
                            <th className="border p-2 text-right">جهة التدوير</th>
                            <th className="border p-2 text-right">التاريخ</th>
                            <th className="border p-2 text-right print:hidden">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allShipments.map((shipment, index) => {
                            const isExcluded = excludedShipments.has(shipment.id);
                            return (
                              <tr 
                                key={shipment.id} 
                                className={`hover:bg-muted/30 ${isExcluded ? 'opacity-40 bg-muted/20 print:hidden' : ''}`}
                              >
                                <td className="border p-2 print:hidden">
                                  <Checkbox
                                    checked={!isExcluded}
                                    onCheckedChange={() => toggleExcludeShipment(shipment.id)}
                                  />
                                </td>
                                <td className="border p-2">{index + 1}</td>
                                <td className="border p-2 font-mono text-xs">{shipment.shipment_number}</td>
                                <td className="border p-2">{getWasteTypeLabel(shipment.waste_type)}</td>
                                <td className="border p-2 font-mono text-xs">{getWasteTypeCode(shipment.waste_type)}</td>
                                <td className="border p-2">{shipment.quantity} {shipment.unit || 'كجم'}</td>
                                <td className={`border p-2 ${hideHazardLevelInPrint ? 'print:hidden' : ''}`}>
                                  <Badge className={getHazardColor(shipment.hazard_level)}>
                                    {getHazardLabel(shipment.hazard_level)}
                                  </Badge>
                                </td>
                                <td className="border p-2">
                                  <Badge className={getStatusColor(shipment.status)}>
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
                                <td className="border p-2 print:hidden">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openShipmentDetails(shipment)}
                                    className="gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stamps and Signatures Section */}
                  {(includeStamps || includeSignatures) && (
                    <div className="print:break-inside-avoid mt-8 pt-8 border-t">
                      <h3 className="text-lg font-semibold mb-6 text-center">التوقيعات والأختام</h3>
                      <div className="grid grid-cols-3 gap-8">
                        {/* Generator Stamp/Signature */}
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Building2 className="w-5 h-5" />
                            <span className="font-medium">الجهة المولدة</span>
                          </div>
                          {includeStamps && (
                            <div className="h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">الختم</span>
                            </div>
                          )}
                          {includeSignatures && (
                            <div className="h-16 border-b-2 border-muted-foreground/30 flex items-end justify-center pb-2">
                              <span className="text-xs text-muted-foreground">التوقيع</span>
                            </div>
                          )}
                        </div>

                        {/* Transporter Stamp/Signature */}
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Truck className="w-5 h-5" />
                            <span className="font-medium">الجهة الناقلة</span>
                          </div>
                          {includeStamps && (
                            <div className="h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">الختم</span>
                            </div>
                          )}
                          {includeSignatures && (
                            <div className="h-16 border-b-2 border-muted-foreground/30 flex items-end justify-center pb-2">
                              <span className="text-xs text-muted-foreground">التوقيع</span>
                            </div>
                          )}
                        </div>

                        {/* Recycler Stamp/Signature */}
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Recycle className="w-5 h-5" />
                            <span className="font-medium">جهة التدوير</span>
                          </div>
                          {includeStamps && (
                            <div className="h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">الختم</span>
                            </div>
                          )}
                          {includeSignatures && (
                            <div className="h-16 border-b-2 border-muted-foreground/30 flex items-end justify-center pb-2">
                              <span className="text-xs text-muted-foreground">التوقيع</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="print:block hidden text-center text-[8px] text-muted-foreground pt-4 border-t mt-4">
                    <p className="leading-relaxed mb-2">
                      هذا المستند صدر آلياً من منصة iRecycle. البيانات الواردة به تم إدخالها بواسطة المستخدم وتحت مسؤوليته الكاملة.
                      لا تتحمل إدارة المنصة أي مسؤولية قانونية أو مدنية تجاه الغير بخصوص صحة هذه البيانات.
                    </p>
                    <p>تم إنشاء هذه الخطة التشغيلية بواسطة نظام إدارة المخلفات</p>
                    <p className="mt-1">تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}</p>
                    <p className="text-[7px] mt-1 text-gray-400">مستند صادر آلياً من نظام iRecycle ولا يُعتد به بدون رمز التحقق الرقمي</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل الشحنة
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.shipment_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedShipment && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-1">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">نوع المخلفات</Label>
                    <p className="font-medium">{getWasteTypeLabel(selectedShipment.waste_type)}</p>
                    <p className="text-xs font-mono text-muted-foreground">{getWasteTypeCode(selectedShipment.waste_type)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">الكمية</Label>
                    <p className="font-medium">{selectedShipment.quantity} {selectedShipment.unit || 'كجم'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">مستوى الخطورة</Label>
                    <Badge className={getHazardColor(selectedShipment.hazard_level)}>
                      {getHazardLabel(selectedShipment.hazard_level)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">الحالة</Label>
                    <Badge className={getStatusColor(selectedShipment.status)}>
                      {getStatusLabel(selectedShipment.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">تاريخ الإنشاء</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedShipment.created_at)}
                    </p>
                  </div>
                  {selectedShipment.pickup_date && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">تاريخ الاستلام</Label>
                      <p className="font-medium">{formatDate(selectedShipment.pickup_date)}</p>
                    </div>
                  )}
                </div>

                {selectedShipment.waste_description && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">وصف المخلفات</Label>
                    <p className="text-sm">{selectedShipment.waste_description}</p>
                  </div>
                )}

                <Separator />

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      عنوان الاستلام
                    </Label>
                    <p className="text-sm">{selectedShipment.pickup_address}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      عنوان التسليم
                    </Label>
                    <p className="text-sm">{selectedShipment.delivery_address}</p>
                  </div>
                </div>

                <Separator />

                {/* Organizations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Generator */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 className="w-4 h-4" />
                      الجهة المولدة
                    </div>
                    <p className="text-sm font-medium">{selectedShipment.generator?.name || '-'}</p>
                    {selectedShipment.generator?.client_code && (
                      <p className="text-xs font-mono text-muted-foreground">{selectedShipment.generator.client_code}</p>
                    )}
                    {selectedShipment.generator?.city && (
                      <p className="text-xs text-muted-foreground">{selectedShipment.generator.city}</p>
                    )}
                    {selectedShipment.generator?.phone && (
                      <p className="text-xs font-mono">{selectedShipment.generator.phone}</p>
                    )}
                  </div>

                  {/* Transporter */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Truck className="w-4 h-4" />
                      الجهة الناقلة
                    </div>
                    <p className="text-sm font-medium">{selectedShipment.transporter?.name || '-'}</p>
                    {selectedShipment.transporter?.client_code && (
                      <p className="text-xs font-mono text-muted-foreground">{selectedShipment.transporter.client_code}</p>
                    )}
                    {selectedShipment.transporter?.city && (
                      <p className="text-xs text-muted-foreground">{selectedShipment.transporter.city}</p>
                    )}
                    {selectedShipment.transporter?.phone && (
                      <p className="text-xs font-mono">{selectedShipment.transporter.phone}</p>
                    )}
                  </div>

                  {/* Recycler */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Recycle className="w-4 h-4" />
                      جهة التدوير
                    </div>
                    <p className="text-sm font-medium">{selectedShipment.recycler?.name || '-'}</p>
                    {selectedShipment.recycler?.client_code && (
                      <p className="text-xs font-mono text-muted-foreground">{selectedShipment.recycler.client_code}</p>
                    )}
                    {selectedShipment.recycler?.city && (
                      <p className="text-xs text-muted-foreground">{selectedShipment.recycler.city}</p>
                    )}
                    {selectedShipment.recycler?.phone && (
                      <p className="text-xs font-mono">{selectedShipment.recycler.phone}</p>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                {(selectedShipment.packaging_method || selectedShipment.disposal_method) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {selectedShipment.packaging_method && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">طريقة التغليف</Label>
                          <p className="text-sm">{selectedShipment.packaging_method}</p>
                        </div>
                      )}
                      {selectedShipment.disposal_method && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">طريقة التخلص</Label>
                          <p className="text-sm">{selectedShipment.disposal_method}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OperationalPlans;
