import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
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
// jsPDF & html2canvas loaded dynamically

// IPCC-based emission factors - loaded from database at runtime
// Fallback values based on IPCC 2006 + GHG Protocol
const CARBON_FACTORS_FALLBACK = {
  transport_per_km_ton: 0.062,
  waste_processing: {
    plastic: 2.5, paper: 0.8, metal: 1.2, glass: 0.5,
    electronic: 3.5, organic: 0.3, chemical: 4.0, medical: 5.0,
    construction: 0.4, other: 1.0,
  },
  recycling_savings: {
    plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
    electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
    construction: 0.2, other: 0.5, aluminum: 9.0, textile: 3.0,
  },
  landfill_emissions: {
    plastic: 0.021, paper: 0.46, organic: 0.58, mixed: 0.45,
    hazardous: 0.2, wood: 0.33, textile: 0.4,
  },
  diesel_per_liter: 2.68,
  egypt_grid_per_kwh: 0.489,
};

// Map DB factors to usable format
const buildFactorsFromDB = (dbFactors: any[]): typeof CARBON_FACTORS_FALLBACK => {
  const factors = { ...CARBON_FACTORS_FALLBACK };
  for (const f of dbFactors) {
    if (f.category === 'transport_fuel' && f.sub_category === 'diesel') {
      factors.diesel_per_liter = f.emission_factor;
    }
    if (f.category === 'electricity' && f.sub_category === 'egypt_grid') {
      factors.egypt_grid_per_kwh = f.emission_factor;
    }
    if (f.category === 'waste_recycling') {
      const keyMap: Record<string, string> = {
        plastic_recycling: 'plastic', paper_recycling: 'paper',
        metal_recycling: 'metal', aluminum_recycling: 'aluminum',
        glass_recycling: 'glass', organic_composting: 'organic',
        e_waste_recycling: 'electronic', textile_recycling: 'textile',
      };
      const k = keyMap[f.sub_category];
      if (k) (factors.recycling_savings as any)[k] = f.emission_factor / 1000; // convert kg/ton to ton
    }
    if (f.category === 'waste_landfill') {
      const keyMap: Record<string, string> = {
        plastic_landfill: 'plastic', paper_cardboard: 'paper',
        organic_waste: 'organic', mixed_msw: 'mixed',
        hazardous_waste: 'hazardous', wood_waste: 'wood',
        textile_waste: 'textile',
      };
      const k = keyMap[f.sub_category];
      if (k) (factors.landfill_emissions as any)[k] = f.emission_factor / 1000;
    }
  }
  return factors;
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface Organization {
  id: string;
  name: string;
  organization_type: string;
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
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['generator', 'transporter', 'recycler', 'disposal']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);
  const [dbFactors, setDbFactors] = useState<typeof CARBON_FACTORS_FALLBACK>(CARBON_FACTORS_FALLBACK);
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const wasteTypeLabels: Record<string, string> = {
    plastic: t('wasteTypes.plastic'),
    paper: t('wasteTypes.paper'),
    metal: t('wasteTypes.metal'),
    glass: t('wasteTypes.glass'),
    electronic: t('wasteTypes.electronic'),
    organic: t('wasteTypes.organic'),
    chemical: t('wasteTypes.chemical'),
    medical: t('wasteTypes.medical'),
    construction: t('wasteTypes.construction'),
    other: t('wasteTypes.other'),
  };

  useEffect(() => {
    fetchOrganizations();
    fetchEmissionFactors();
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    setDateFrom(yearAgo.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  }, []);

  const fetchEmissionFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_emission_factors')
        .select('*')
        .eq('is_active', true);
      if (!error && data && data.length > 0) {
        setDbFactors(buildFactorsFromDB(data));
      }
    } catch (err) {
      console.error('Error loading emission factors, using fallback:', err);
    }
  };

  useEffect(() => {
    if (dateFrom && dateTo) {
      calculateCarbonFootprint();
    }
  }, [selectedOrgs, selectedTypes, dateFrom, dateTo, dbFactors]);

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
          disposal_facility_id,
          disposal_method,
          pickup_latitude,
          pickup_longitude,
          delivery_latitude,
          delivery_longitude
        `);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data: shipments, error } = await query;
      if (error) throw error;

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type');

      const orgMap = new Map(orgs?.map(o => [o.id, o]) || []);

      let filteredShipments = shipments || [];
      
      if (selectedOrgs.length > 0) {
        filteredShipments = filteredShipments.filter(s =>
          selectedOrgs.includes(s.generator_id || '') ||
          selectedOrgs.includes(s.transporter_id || '') ||
          selectedOrgs.includes(s.recycler_id || '') ||
          selectedOrgs.includes(s.disposal_facility_id || '')
        );
      }

      if (selectedTypes.length < 4) {
        filteredShipments = filteredShipments.filter(s => {
          const generatorOrg = orgMap.get(s.generator_id || '');
          const transporterOrg = orgMap.get(s.transporter_id || '');
          const recyclerOrg = orgMap.get(s.recycler_id || '');
          const disposalOrg = orgMap.get(s.disposal_facility_id || '');
          
          return (
            (selectedTypes.includes('generator') && generatorOrg) ||
            (selectedTypes.includes('transporter') && transporterOrg) ||
            (selectedTypes.includes('recycler') && recyclerOrg) ||
            (selectedTypes.includes('disposal') && disposalOrg)
          );
        });
      }

      let totalEmissions = 0;
      let totalSavings = 0;
      let transportEmissions = 0;
      let processingEmissions = 0;
      const emissionsByWasteType: Record<string, { emissions: number; savings: number }> = {};
      const emissionsByOrg: Record<string, { emissions: number; type: string }> = {};
      const monthlyData: Record<string, { emissions: number; savings: number }> = {};

      filteredShipments.forEach(shipment => {
        const quantity = Number(shipment.quantity) || 0;
        const wasteType = shipment.waste_type as string || 'other';
        
        const processingFactor = (dbFactors.waste_processing as Record<string, number>)[wasteType] || 1.0;
        const shipmentProcessingEmissions = quantity * processingFactor;
        processingEmissions += shipmentProcessingEmissions;

        let distanceKm = 50;
        if (shipment.pickup_latitude && shipment.delivery_latitude) {
          const R = 6371;
          const dLat = ((shipment.delivery_latitude - shipment.pickup_latitude) * Math.PI) / 180;
          const dLon = ((shipment.delivery_longitude! - shipment.pickup_longitude!) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((shipment.pickup_latitude * Math.PI) / 180) *
            Math.cos((shipment.delivery_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        }
        const shipmentTransportEmissions = quantity * dbFactors.transport_per_km_ton * distanceKm / 1000;
        transportEmissions += shipmentTransportEmissions;

        const shipmentEmissions = shipmentProcessingEmissions + shipmentTransportEmissions;
        totalEmissions += shipmentEmissions;

        const isRecycled = shipment.disposal_method === 'recycling' || shipment.status === 'confirmed';
        const savingsFactor = (dbFactors.recycling_savings as Record<string, number>)[wasteType] || 0.5;
        const shipmentSavings = isRecycled ? quantity * savingsFactor : 0;
        totalSavings += shipmentSavings;

        if (!emissionsByWasteType[wasteType]) {
          emissionsByWasteType[wasteType] = { emissions: 0, savings: 0 };
        }
        emissionsByWasteType[wasteType].emissions += shipmentEmissions;
        emissionsByWasteType[wasteType].savings += shipmentSavings;

        const generatorOrg = orgMap.get(shipment.generator_id || '');
        if (generatorOrg) {
          if (!emissionsByOrg[generatorOrg.id]) {
            emissionsByOrg[generatorOrg.id] = { emissions: 0, type: generatorOrg.organization_type };
          }
          emissionsByOrg[generatorOrg.id].emissions += shipmentEmissions;
        }

        const month = new Date(shipment.created_at || '').toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { emissions: 0, savings: 0 };
        }
        monthlyData[month].emissions += shipmentEmissions;
        monthlyData[month].savings += shipmentSavings;
      });

      const emissionsByWasteTypeArr = Object.entries(emissionsByWasteType).map(([type, data]) => ({
        name: wasteTypeLabels[type] || type,
        emissions: Math.round(data.emissions * 100) / 100,
        savings: Math.round(data.savings * 100) / 100,
      }));

      const emissionsByOrgArr = Object.entries(emissionsByOrg)
        .map(([id, data]) => ({
          name: orgMap.get(id)?.name || t('carbonUnits.unknown'),
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

      const netCarbon = totalEmissions - totalSavings;
      const treesEquivalent = Math.round(netCarbon / 21);
      const carsEquivalent = Math.round(netCarbon / 4600);

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
        title: t('common.error'),
        description: t('carbon.errorCalc'),
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
    if (!carbonData) return;
    setGenerating(true);
    try {
      exportToPdf();
      toast({
        title: t('carbon.reportCreated'),
        description: t('carbon.reportCreatedDesc'),
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
        title: t('carbon.creatingPdf'),
        description: t('carbon.creatingPdfDesc'),
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129);
      pdf.text('Carbon Footprint Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.text(`Period: ${dateFrom} to ${dateTo}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

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

      pdf.save(`carbon-footprint-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: t('carbonExtra.pdfExported'),
        description: t('carbonExtra.pdfExportedDesc'),
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: t('common.error'),
        description: t('carbonExtra.pdfError'),
        variant: 'destructive',
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const exportReport = () => {
    if (!carbonData) return;

    const reportContent = `
${t('carbonExtra.title')}
=====================

${t('carbonExtra.fromDate')}: ${dateFrom} - ${t('carbonExtra.toDate')}: ${dateTo}

${t('carbonExtra.totalEmissions')}: ${carbonData.totalEmissions} ${t('carbonExtra.kgCo2')}
${t('carbonExtra.transportEmissions')}: ${carbonData.transportEmissions} ${t('carbonExtra.kgCo2')}
${t('carbonExtra.processingEmissions')}: ${carbonData.processingEmissions} ${t('carbonExtra.kgCo2')}
${t('carbonExtra.recyclingSavings')}: ${carbonData.totalSavings} ${t('carbonExtra.kgCo2')}
${t('carbonExtra.netFootprint')}: ${carbonData.netCarbon} ${t('carbonExtra.kgCo2')}

${carbonData.treesEquivalent} ${t('carbonExtra.treesNeeded')}
${carbonData.carsEquivalent} ${t('carbonExtra.carsEquiv')}

${t('carbonExtra.emissionsByWaste')}:
${carbonData.emissionsByWasteType.map(w => `- ${w.name}: ${w.emissions} ${t('carbonExtra.kgCo2')}`).join('\n')}
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
      title: t('carbonExtra.txtExported'),
      description: t('carbonExtra.txtExportedDesc'),
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
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={exportToPdf} variant="default" className="gap-2" disabled={!carbonData || exportingPdf}>
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {t('carbon.exportPdf')}
            </Button>
            <Button onClick={exportReport} variant="outline" className="gap-2" disabled={!carbonData}>
              <Download className="w-4 h-4" />
              {t('carbonExtra.exportTxt')}
            </Button>
            <Button onClick={generateReport} variant="outline" className="gap-2" disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {t('carbonExtra.detailedReport')}
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3 justify-end">
              <Leaf className="w-8 h-8 text-primary" />
              {t('carbonExtra.title')}
            </h1>
            <div className="flex items-center gap-2 justify-end mt-1">
              <Badge variant="outline" className="text-xs">IPCC 2006</Badge>
              <Badge variant="outline" className="text-xs">GHG Protocol</Badge>
              <Badge variant="outline" className="text-xs">IEA 2023</Badge>
              <p className="text-muted-foreground text-sm">{t('carbonExtra.officialDesc')}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="text-right pb-4">
            <CardTitle className="flex items-center gap-2 justify-end text-lg">
              <Filter className="w-5 h-5" />
              {t('carbonExtra.analysisCriteria')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>{t('carbonExtra.toDate')}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label>{t('carbonExtra.fromDate')}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-right">
              <Label>{t('carbonExtra.orgTypes')}</Label>
              <div className="flex flex-wrap gap-4 justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-generator" className="cursor-pointer">{t('carbonExtra.generatorOrgs')}</Label>
                  <Checkbox
                    id="type-generator"
                    checked={selectedTypes.includes('generator')}
                    onCheckedChange={() => handleTypeToggle('generator')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-transporter" className="cursor-pointer">{t('carbonExtra.transporterOrgs')}</Label>
                  <Checkbox
                    id="type-transporter"
                    checked={selectedTypes.includes('transporter')}
                    onCheckedChange={() => handleTypeToggle('transporter')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-recycler" className="cursor-pointer">{t('carbonExtra.recyclerOrgs')}</Label>
                  <Checkbox
                    id="type-recycler"
                    checked={selectedTypes.includes('recycler')}
                    onCheckedChange={() => handleTypeToggle('recycler')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="type-disposal" className="cursor-pointer">{t('carbonExtra.disposalOrgs')}</Label>
                  <Checkbox
                    id="type-disposal"
                    checked={selectedTypes.includes('disposal')}
                    onCheckedChange={() => handleTypeToggle('disposal')}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrgs([])}
                  className="text-xs"
                >
                  {t('carbonExtra.resetSelection')}
                </Button>
                <Label>{t('carbonExtra.specificOrgs')}</Label>
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
                  {t('carbonExtra.selectedCount')} {selectedOrgs.length} {t('carbonExtra.org')}
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.totalEmissions')}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {carbonData.totalEmissions.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('carbonExtra.kgCo2')}</p>
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.recyclingSavings')}</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {carbonData.totalSavings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('carbonExtra.kgCo2')}</p>
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.netFootprint')}</p>
                      <p className={`text-2xl font-bold ${carbonData.netCarbon > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {carbonData.netCarbon > 0 ? '+' : ''}{carbonData.netCarbon.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('carbonExtra.kgCo2')}</p>
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.treeEquivalent')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {carbonData.treesEquivalent.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('carbonExtra.treePerYear')}</p>
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.transportEmissions')}</p>
                      <p className="text-2xl font-bold">
                        {carbonData.transportEmissions.toLocaleString()} {t('carbonUnits.kg')}
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
                      <p className="text-sm text-muted-foreground">{t('carbonExtra.processingEmissions')}</p>
                      <p className="text-2xl font-bold">
                        {carbonData.processingEmissions.toLocaleString()} {t('carbonUnits.kg')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <TrendingDown className="w-5 h-5" />
                    {t('carbonExtra.emissionsTrend')}
                  </CardTitle>
                  <CardDescription>{t('carbonExtra.monthlyChange')}</CardDescription>
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
                        name={t('carbonExtra.emissions')}
                        stackId="1"
                        stroke="#EF4444"
                        fill="#FEE2E2"
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name={t('carbonExtra.savingsLabel')}
                        stackId="2"
                        stroke="#10B981"
                        fill="#D1FAE5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Calculator className="w-5 h-5" />
                    {t('carbonExtra.emissionsByWaste')}
                  </CardTitle>
                  <CardDescription>{t('carbonExtra.wasteDistribution')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={carbonData.emissionsByWasteType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="emissions" name={t('carbonExtra.emissions')} fill="#EF4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="savings" name={t('carbonExtra.savingsLabel')} fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Building2 className="w-5 h-5" />
                    {t('carbonExtra.topEmitters')}
                  </CardTitle>
                  <CardDescription>{t('carbonExtra.topEmittersDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {carbonData.emissionsByOrg.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('carbonExtra.noData')}</p>
                  ) : (
                    <div className="space-y-3">
                      {carbonData.emissionsByOrg.map((org, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <Badge variant="destructive">{org.emissions} {t('carbonExtra.kgCo2')}</Badge>
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

              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Wind className="w-5 h-5" />
                    {t('carbonExtra.envImpact')}
                  </CardTitle>
                  <CardDescription>{t('carbonExtra.envImpactDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TreePine className="w-10 h-10 text-emerald-500" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{carbonData.treesEquivalent}</p>
                          <p className="text-sm text-muted-foreground">{t('carbonExtra.treesNeeded')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="w-10 h-10 text-amber-500" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{carbonData.carsEquivalent}</p>
                          <p className="text-sm text-muted-foreground">{t('carbonExtra.carsEquiv')}</p>
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
                          <p className="text-sm text-muted-foreground">{t('carbonExtra.savingsPercent')}</p>
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
