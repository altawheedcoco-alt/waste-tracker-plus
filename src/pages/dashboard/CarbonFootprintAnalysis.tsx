import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Leaf,
  Download,
  Loader2,
  Building2,
  Truck,
  Recycle,
  Factory,
  TrendingDown,
  Calendar,
  FileText,
  Calculator,
  TreePine,
  Wind,
  Droplets,
  Zap,
  Filter,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Carbon emission factors (kg CO2 per unit)
const CARBON_FACTORS = {
  // Transport emissions per km per ton
  transport_per_km_ton: 0.062,
  // Waste type processing emissions (kg CO2 per kg waste)
  waste_processing: {
    plastic: 2.5,
    paper: 0.8,
    metal: 1.2,
    glass: 0.5,
    electronic: 3.5,
    organic: 0.3,
    chemical: 4.0,
    medical: 5.0,
    construction: 0.4,
    other: 1.0,
  },
  // Recycling savings (kg CO2 saved per kg recycled)
  recycling_savings: {
    plastic: 1.5,
    paper: 0.9,
    metal: 2.0,
    glass: 0.3,
    electronic: 2.5,
    organic: 0.2,
    chemical: 1.0,
    medical: 1.5,
    construction: 0.2,
    other: 0.5,
  },
};

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'بناء',
  other: 'أخرى',
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface Organization {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler';
}

interface CarbonData {
  totalEmissions: number;
  totalSavings: number;
  netCarbon: number;
  emissionsByWasteType: { name: string; emissions: number; savings: number }[];
  emissionsByOrg: { name: string; emissions: number; type: string }[];
  monthlyTrend: { month: string; emissions: number; savings: number }[];
  transportEmissions: number;
  processingEmissions: number;
  treesEquivalent: number;
  carsEquivalent: number;
}

const CarbonFootprintAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['generator', 'transporter', 'recycler']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrganizations();
    // Set default date range (last 12 months)
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    setDateFrom(yearAgo.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      calculateCarbonFootprint();
    }
  }, [selectedOrgs, selectedTypes, dateFrom, dateTo]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('is_verified', true)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const calculateCarbonFootprint = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('shipments')
        .select(`
          id,
          waste_type,
          quantity,
          unit,
          created_at,
          status,
          generator_id,
          transporter_id,
          recycler_id,
          disposal_method
        `);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data: shipments, error } = await query;
      if (error) throw error;

      // Fetch organizations for names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type');

      const orgMap = new Map(orgs?.map(o => [o.id, o]) || []);

      // Filter shipments based on selected organizations and types
      let filteredShipments = shipments || [];
      
      if (selectedOrgs.length > 0) {
        filteredShipments = filteredShipments.filter(s =>
          selectedOrgs.includes(s.generator_id) ||
          selectedOrgs.includes(s.transporter_id) ||
          selectedOrgs.includes(s.recycler_id)
        );
      }

      if (selectedTypes.length < 3) {
        filteredShipments = filteredShipments.filter(s => {
          const generatorOrg = orgMap.get(s.generator_id);
          const transporterOrg = orgMap.get(s.transporter_id);
          const recyclerOrg = orgMap.get(s.recycler_id);
          
          return (
            (selectedTypes.includes('generator') && generatorOrg) ||
            (selectedTypes.includes('transporter') && transporterOrg) ||
            (selectedTypes.includes('recycler') && recyclerOrg)
          );
        });
      }

      // Calculate emissions
      let totalEmissions = 0;
      let totalSavings = 0;
      let transportEmissions = 0;
      let processingEmissions = 0;
      const emissionsByWasteType: Record<string, { emissions: number; savings: number }> = {};
      const emissionsByOrg: Record<string, { emissions: number; type: string }> = {};
      const monthlyData: Record<string, { emissions: number; savings: number }> = {};

      filteredShipments.forEach(shipment => {
        const quantity = Number(shipment.quantity) || 0;
        const wasteType = shipment.waste_type as keyof typeof CARBON_FACTORS.waste_processing;
        
        // Calculate processing emissions
        const processingFactor = CARBON_FACTORS.waste_processing[wasteType] || 1.0;
        const shipmentProcessingEmissions = quantity * processingFactor;
        processingEmissions += shipmentProcessingEmissions;

        // Estimate transport emissions (assuming average 50km distance)
        const estimatedDistance = 50; // km
        const shipmentTransportEmissions = quantity * CARBON_FACTORS.transport_per_km_ton * estimatedDistance / 1000;
        transportEmissions += shipmentTransportEmissions;

        const shipmentEmissions = shipmentProcessingEmissions + shipmentTransportEmissions;
        totalEmissions += shipmentEmissions;

        // Calculate savings if recycled
        const isRecycled = shipment.disposal_method === 'recycling' || shipment.status === 'confirmed';
        const savingsFactor = CARBON_FACTORS.recycling_savings[wasteType] || 0.5;
        const shipmentSavings = isRecycled ? quantity * savingsFactor : 0;
        totalSavings += shipmentSavings;

        // Aggregate by waste type
        if (!emissionsByWasteType[wasteType]) {
          emissionsByWasteType[wasteType] = { emissions: 0, savings: 0 };
        }
        emissionsByWasteType[wasteType].emissions += shipmentEmissions;
        emissionsByWasteType[wasteType].savings += shipmentSavings;

        // Aggregate by organization (generator)
        const generatorOrg = orgMap.get(shipment.generator_id);
        if (generatorOrg) {
          if (!emissionsByOrg[generatorOrg.id]) {
            emissionsByOrg[generatorOrg.id] = { emissions: 0, type: generatorOrg.organization_type };
          }
          emissionsByOrg[generatorOrg.id].emissions += shipmentEmissions;
        }

        // Monthly trend
        const month = new Date(shipment.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { emissions: 0, savings: 0 };
        }
        monthlyData[month].emissions += shipmentEmissions;
        monthlyData[month].savings += shipmentSavings;
      });

      // Format data for charts
      const emissionsByWasteTypeArr = Object.entries(emissionsByWasteType).map(([type, data]) => ({
        name: wasteTypeLabels[type] || type,
        emissions: Math.round(data.emissions * 100) / 100,
        savings: Math.round(data.savings * 100) / 100,
      }));

      const emissionsByOrgArr = Object.entries(emissionsByOrg)
        .map(([id, data]) => ({
          name: orgMap.get(id)?.name || 'غير معروف',
          emissions: Math.round(data.emissions * 100) / 100,
          type: data.type,
        }))
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 10);

      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          emissions: Math.round(data.emissions * 100) / 100,
          savings: Math.round(data.savings * 100) / 100,
        }))
        .slice(-12);

      // Calculate equivalents
      const netCarbon = totalEmissions - totalSavings;
      const treesEquivalent = Math.round(netCarbon / 21); // One tree absorbs ~21 kg CO2/year
      const carsEquivalent = Math.round(netCarbon / 4600); // Average car emits ~4600 kg CO2/year

      setCarbonData({
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        netCarbon: Math.round(netCarbon * 100) / 100,
        emissionsByWasteType: emissionsByWasteTypeArr,
        emissionsByOrg: emissionsByOrgArr,
        monthlyTrend,
        transportEmissions: Math.round(transportEmissions * 100) / 100,
        processingEmissions: Math.round(processingEmissions * 100) / 100,
        treesEquivalent: Math.abs(treesEquivalent),
        carsEquivalent: Math.abs(carsEquivalent),
      });
    } catch (error) {
      console.error('Error calculating carbon footprint:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حساب البصمة الكربونية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم إعداد تقرير البصمة الكربونية بنجاح',
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportToPdf = async () => {
    if (!carbonData || !reportRef.current) return;
    
    setExportingPdf(true);
    
    try {
      toast({
        title: 'جاري إنشاء PDF',
        description: 'يرجى الانتظار بينما يتم إنشاء التقرير...',
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Add title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129); // Emerald color
      pdf.text('Carbon Footprint Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.text(`Period: ${dateFrom} to ${dateTo}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Summary section
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Emissions Summary', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      const summaryData = [
        ['Total Emissions:', `${carbonData.totalEmissions.toLocaleString()} kg CO2`],
        ['Transport Emissions:', `${carbonData.transportEmissions.toLocaleString()} kg CO2`],
        ['Processing Emissions:', `${carbonData.processingEmissions.toLocaleString()} kg CO2`],
        ['Recycling Savings:', `${carbonData.totalSavings.toLocaleString()} kg CO2`],
        ['Net Carbon Footprint:', `${carbonData.netCarbon.toLocaleString()} kg CO2`],
      ];

      summaryData.forEach(([label, value]) => {
        pdf.text(label, margin, yPosition);
        pdf.text(value, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });

      yPosition += 10;

      // Environmental equivalents
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Environmental Equivalents', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Trees needed to absorb: ${carbonData.treesEquivalent.toLocaleString()} trees/year`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Equivalent car emissions: ${carbonData.carsEquivalent.toLocaleString()} cars/year`, margin, yPosition);
      yPosition += 15;

      // Emissions by waste type
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Emissions by Waste Type', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      carbonData.emissionsByWasteType.forEach((item) => {
        pdf.text(`${item.name}:`, margin, yPosition);
        pdf.text(`Emissions: ${item.emissions} kg | Savings: ${item.savings} kg`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 5;
      });

      yPosition += 10;

      // Capture charts as images
      const chartsContainer = reportRef.current;
      if (chartsContainer) {
        const canvas = await html2canvas(chartsContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if we need a new page
        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Charts & Analytics', margin, yPosition);
        yPosition += 8;

        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, pageHeight - yPosition - margin));
      }

      // Add footer to all pages
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      pdf.save(`carbon-footprint-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'تم تصدير PDF',
        description: 'تم تحميل تقرير البصمة الكربونية بصيغة PDF بنجاح',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التقرير بصيغة PDF',
        variant: 'destructive',
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const exportReport = () => {
    if (!carbonData) return;

    const reportContent = `
تقرير البصمة الكربونية
=====================

الفترة: من ${dateFrom} إلى ${dateTo}

ملخص الانبعاثات:
- إجمالي الانبعاثات: ${carbonData.totalEmissions} كجم CO₂
- انبعاثات النقل: ${carbonData.transportEmissions} كجم CO₂
- انبعاثات المعالجة: ${carbonData.processingEmissions} كجم CO₂

الوفورات من إعادة التدوير:
- إجمالي الوفورات: ${carbonData.totalSavings} كجم CO₂

صافي البصمة الكربونية: ${carbonData.netCarbon} كجم CO₂

المكافئات:
- يعادل ${carbonData.treesEquivalent} شجرة لامتصاص هذه الكمية سنوياً
- يعادل انبعاثات ${carbonData.carsEquivalent} سيارة سنوياً

الانبعاثات حسب نوع النفايات:
${carbonData.emissionsByWasteType.map(w => `- ${w.name}: ${w.emissions} كجم CO₂`).join('\n')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-footprint-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'تم تصدير التقرير',
      description: 'تم تحميل تقرير البصمة الكربونية',
    });
  };

  const filteredOrganizations = organizations.filter(org =>
    selectedTypes.includes(org.organization_type)
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={exportToPdf} variant="default" className="gap-2" disabled={!carbonData || exportingPdf}>
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              تصدير PDF
            </Button>
            <Button onClick={exportReport} variant="outline" className="gap-2" disabled={!carbonData}>
              <Download className="w-4 h-4" />
              تصدير TXT
            </Button>
            <Button onClick={generateReport} variant="outline" className="gap-2" disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              إنشاء تقرير مفصل
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-end">
              <Leaf className="w-8 h-8 text-emerald-500" />
              تحليل البصمة الكربونية
            </h1>
            <p className="text-muted-foreground">تحليل شامل للانبعاثات والوفورات البيئية</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="text-right pb-4">
            <CardTitle className="flex items-center gap-2 justify-end text-lg">
              <Filter className="w-5 h-5" />
              معايير التحليل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <Separator />

            {/* Organization Types */}
            <div className="space-y-3 text-right">
              <Label>نوع الجهات</Label>
              <div className="flex flex-wrap gap-4 justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-generator" className="cursor-pointer">جهات مولدة</Label>
                  <Checkbox
                    id="type-generator"
                    checked={selectedTypes.includes('generator')}
                    onCheckedChange={() => handleTypeToggle('generator')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-transporter" className="cursor-pointer">ناقلون</Label>
                  <Checkbox
                    id="type-transporter"
                    checked={selectedTypes.includes('transporter')}
                    onCheckedChange={() => handleTypeToggle('transporter')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-recycler" className="cursor-pointer">معيدو تدوير</Label>
                  <Checkbox
                    id="type-recycler"
                    checked={selectedTypes.includes('recycler')}
                    onCheckedChange={() => handleTypeToggle('recycler')}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Specific Organizations */}
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrgs([])}
                  className="text-xs"
                >
                  إعادة تعيين
                </Button>
                <Label>جهات محددة (اختياري)</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {filteredOrganizations.map(org => (
                  <div key={org.id} className="flex items-center gap-2 justify-end">
                    <Label htmlFor={`org-${org.id}`} className="cursor-pointer text-sm truncate">
                      {org.name}
                    </Label>
                    <Checkbox
                      id={`org-${org.id}`}
                      checked={selectedOrgs.includes(org.id)}
                      onCheckedChange={() => handleOrgToggle(org.id)}
                    />
                  </div>
                ))}
              </div>
              {selectedOrgs.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  تم اختيار {selectedOrgs.length} جهة
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : carbonData && (
          <>
            {/* Charts Container for PDF Export */}
            <div ref={reportRef} className="space-y-6 bg-background">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Factory className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الانبعاثات</p>
                      <p className="text-2xl font-bold text-red-600">
                        {carbonData.totalEmissions.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">كجم CO₂</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Recycle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">وفورات التدوير</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {carbonData.totalSavings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">كجم CO₂</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={carbonData.netCarbon > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'}>
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${carbonData.netCarbon > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                      <Leaf className={`w-6 h-6 ${carbonData.netCarbon > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">صافي البصمة</p>
                      <p className={`text-2xl font-bold ${carbonData.netCarbon > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {carbonData.netCarbon > 0 ? '+' : ''}{carbonData.netCarbon.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">كجم CO₂</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <TreePine className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">معادل الأشجار</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {carbonData.treesEquivalent.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">شجرة / سنة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emission Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">انبعاثات النقل</p>
                      <p className="text-2xl font-bold">
                        {carbonData.transportEmissions.toLocaleString()} كجم
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-right">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">انبعاثات المعالجة</p>
                      <p className="text-2xl font-bold">
                        {carbonData.processingEmissions.toLocaleString()} كجم
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <TrendingDown className="w-5 h-5" />
                    اتجاه الانبعاثات والوفورات
                  </CardTitle>
                  <CardDescription>التغير الشهري في البصمة الكربونية</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={carbonData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="emissions"
                        name="الانبعاثات"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#FEE2E2"
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="الوفورات"
                        stackId="2"
                        stroke="#10B981"
                        fill="#D1FAE5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emissions by Waste Type */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Calculator className="w-5 h-5" />
                    الانبعاثات حسب نوع النفايات
                  </CardTitle>
                  <CardDescription>توزيع البصمة الكربونية على أنواع النفايات</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={carbonData.emissionsByWasteType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="emissions" name="الانبعاثات" fill="#EF4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="savings" name="الوفورات" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Emitting Organizations */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Building2 className="w-5 h-5" />
                    أعلى الجهات انبعاثاً
                  </CardTitle>
                  <CardDescription>الجهات الأكثر مساهمة في البصمة الكربونية</CardDescription>
                </CardHeader>
                <CardContent>
                  {carbonData.emissionsByOrg.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                  ) : (
                    <div className="space-y-3">
                      {carbonData.emissionsByOrg.map((org, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <Badge variant="destructive">{org.emissions} كجم CO₂</Badge>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm truncate max-w-[200px]">{org.name}</span>
                            <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environmental Impact */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Wind className="w-5 h-5" />
                    الأثر البيئي
                  </CardTitle>
                  <CardDescription>معادلات بيئية للبصمة الكربونية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TreePine className="w-10 h-10 text-emerald-500" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{carbonData.treesEquivalent}</p>
                          <p className="text-sm text-muted-foreground">شجرة مطلوبة للامتصاص سنوياً</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="w-10 h-10 text-amber-500" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{carbonData.carsEquivalent}</p>
                          <p className="text-sm text-muted-foreground">سيارة معادلة للانبعاثات سنوياً</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <Droplets className="w-10 h-10 text-blue-500" />
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {Math.round(carbonData.totalSavings / carbonData.totalEmissions * 100) || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground">نسبة الوفورات من إجمالي الانبعاثات</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default CarbonFootprintAnalysis;
