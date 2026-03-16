import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { normalizeShipments } from '@/lib/supabaseHelpers';
import SustainabilityCertificate from "@/components/sustainability/SustainabilityCertificate";
import BackButton from "@/components/ui/back-button";
import { 
  Leaf, 
  FileText, 
  Download, 
  TrendingUp, 
  Recycle, 
  Target, 
  Award,
  BarChart3,
  PieChart,
  Building2,
  Truck,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Medal,
  Eye
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import UnifiedDocumentPreview from '@/components/shared/UnifiedDocumentPreview';

// معاملات الاستدامة البيئية
const SUSTAINABILITY_METRICS = {
  recyclingRate: { weight: 0.25, name: "معدل إعادة التدوير" },
  wasteReduction: { weight: 0.20, name: "تقليل النفايات" },
  energyEfficiency: { weight: 0.15, name: "كفاءة الطاقة" },
  carbonReduction: { weight: 0.15, name: "تقليل الانبعاثات" },
  compliance: { weight: 0.15, name: "الامتثال البيئي" },
  innovation: { weight: 0.10, name: "الابتكار المستدام" }
};

// ألوان الرسوم البيانية
const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const EnvironmentalSustainability = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["generator", "transporter", "recycler"]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("all");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  // جلب المؤسسات
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations-sustainability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, organization_type")
        .eq("is_verified", true);
      if (error) throw error;
      return data || [];
    },
  });

  // جلب الشحنات للتحليل
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments-sustainability", dateFrom, dateTo, selectedTypes, selectedOrganization],
    queryFn: async () => {
      let query = supabase
        .from("shipments")
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(id, name, organization_type),
          transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type),
          recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type)
        `);

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Normalize the shipments data
      let filtered = normalizeShipments(data || []);
      
      // فلترة حسب نوع الجهة
      if (selectedOrganization !== "all") {
        filtered = filtered.filter((s: any) => 
          s.generator_id === selectedOrganization ||
          s.transporter_id === selectedOrganization ||
          s.recycler_id === selectedOrganization
        );
      }

      return filtered;
    },
  });

  // حساب مؤشرات الاستدامة
  const calculateSustainabilityMetrics = () => {
    const totalShipments = shipments.length;
    if (totalShipments === 0) {
      return {
        overallScore: 0,
        recyclingRate: 0,
        wasteReduction: 0,
        energyEfficiency: 0,
        carbonReduction: 0,
        compliance: 0,
        innovation: 0
      };
    }

    const completedShipments = shipments.filter(s => s.status === "confirmed" || s.status === "delivered").length;
    const recycledWaste = shipments.filter(s => s.disposal_method === "recycling" || s.disposal_method === "remanufacturing").length;
    
    // حساب المؤشرات
    const recyclingRate = Math.min(100, (recycledWaste / totalShipments) * 100);
    const wasteReduction = Math.min(100, (completedShipments / totalShipments) * 100);
    const energyEfficiency = Math.min(100, 70 + (recyclingRate * 0.3));
    const carbonReduction = Math.min(100, recyclingRate * 0.8);
    const compliance = Math.min(100, 85 + (completedShipments / totalShipments) * 15);
    const innovation = Math.min(100, 60 + (recyclingRate * 0.4));

    // حساب الدرجة الإجمالية
    const overallScore = 
      recyclingRate * SUSTAINABILITY_METRICS.recyclingRate.weight +
      wasteReduction * SUSTAINABILITY_METRICS.wasteReduction.weight +
      energyEfficiency * SUSTAINABILITY_METRICS.energyEfficiency.weight +
      carbonReduction * SUSTAINABILITY_METRICS.carbonReduction.weight +
      compliance * SUSTAINABILITY_METRICS.compliance.weight +
      innovation * SUSTAINABILITY_METRICS.innovation.weight;

    return {
      overallScore: Math.round(overallScore),
      recyclingRate: Math.round(recyclingRate),
      wasteReduction: Math.round(wasteReduction),
      energyEfficiency: Math.round(energyEfficiency),
      carbonReduction: Math.round(carbonReduction),
      compliance: Math.round(compliance),
      innovation: Math.round(innovation)
    };
  };

  const metrics = calculateSustainabilityMetrics();

  // بيانات الرادار
  const radarData = [
    { subject: "إعادة التدوير", value: metrics.recyclingRate, fullMark: 100 },
    { subject: "تقليل النفايات", value: metrics.wasteReduction, fullMark: 100 },
    { subject: "كفاءة الطاقة", value: metrics.energyEfficiency, fullMark: 100 },
    { subject: "تقليل الانبعاثات", value: metrics.carbonReduction, fullMark: 100 },
    { subject: "الامتثال البيئي", value: metrics.compliance, fullMark: 100 },
    { subject: "الابتكار", value: metrics.innovation, fullMark: 100 },
  ];

  // بيانات توزيع النفايات حسب النوع
  const wasteTypeDistribution = () => {
    const distribution: Record<string, number> = {};
    shipments.forEach(s => {
      const type = s.waste_type || "other";
      distribution[type] = (distribution[type] || 0) + Number(s.quantity || 0);
    });
    
    const typeNames: Record<string, string> = {
      plastic: "بلاستيك",
      paper: "ورق",
      metal: "معادن",
      glass: "زجاج",
      electronic: "إلكتروني",
      organic: "عضوي",
      chemical: "كيميائي",
      medical: "طبي",
      construction: "بناء",
      other: "أخرى"
    };

    return Object.entries(distribution).map(([type, value]) => ({
      name: typeNames[type] || type,
      value: Math.round(value),
      type
    }));
  };

  // بيانات الأداء الشهري
  const monthlyPerformance = () => {
    const months: Record<string, { recycled: number; total: number }> = {};
    
    shipments.forEach(s => {
      const date = new Date(s.created_at || "");
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { recycled: 0, total: 0 };
      }
      
      months[monthKey].total += Number(s.quantity || 0);
      if (s.disposal_method === "recycling" || s.disposal_method === "remanufacturing") {
        months[monthKey].recycled += Number(s.quantity || 0);
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        معاد_تدويره: Math.round(data.recycled),
        إجمالي: Math.round(data.total),
        معدل: data.total > 0 ? Math.round((data.recycled / data.total) * 100) : 0
      }));
  };

  // أداء المؤسسات
  const organizationPerformance = () => {
    const orgStats: Record<string, { name: string; type: string; total: number; recycled: number }> = {};
    
    shipments.forEach((s: any) => {
      // المولد
      if (s.generator && selectedTypes.includes("generator")) {
        const id = s.generator?.id;
        if (id && !orgStats[id]) {
          orgStats[id] = { name: s.generator?.name || 'غير محدد', type: "generator", total: 0, recycled: 0 };
        }
        if (id) {
          orgStats[id].total += Number(s.quantity || 0);
          if (s.disposal_method === "recycling" || s.disposal_method === "remanufacturing") {
            orgStats[id].recycled += Number(s.quantity || 0);
          }
        }
      }
      
      // الناقل
      if (s.transporter && selectedTypes.includes("transporter")) {
        const id = s.transporter?.id;
        if (id && !orgStats[id]) {
          orgStats[id] = { name: s.transporter?.name || 'غير محدد', type: "transporter", total: 0, recycled: 0 };
        }
        if (id) {
          orgStats[id].total += Number(s.quantity || 0);
        }
      }
      
      // المدور
      if (s.recycler && selectedTypes.includes("recycler")) {
        const id = s.recycler?.id;
        if (id && !orgStats[id]) {
          orgStats[id] = { name: s.recycler?.name || 'غير محدد', type: "recycler", total: 0, recycled: 0 };
        }
        if (id) {
          orgStats[id].total += Number(s.quantity || 0);
          orgStats[id].recycled += Number(s.quantity || 0);
        }
      }
    });

    return Object.values(orgStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(org => ({
        ...org,
        rate: org.total > 0 ? Math.round((org.recycled / org.total) * 100) : 0
      }));
  };

  // تحديد مستوى الاستدامة
  const getSustainabilityLevel = (score: number) => {
    if (score >= 90) return { level: "ممتاز", color: "text-green-600", bg: "bg-green-100", icon: Award };
    if (score >= 75) return { level: "جيد جداً", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle2 };
    if (score >= 60) return { level: "جيد", color: "text-yellow-600", bg: "bg-yellow-100", icon: TrendingUp };
    if (score >= 40) return { level: "متوسط", color: "text-orange-600", bg: "bg-orange-100", icon: AlertTriangle };
    return { level: "يحتاج تحسين", color: "text-red-600", bg: "bg-red-100", icon: Info };
  };

  const sustainabilityLevel = getSustainabilityLevel(metrics.overallScore);
  const LevelIcon = sustainabilityLevel.icon;

  // معاينة وطباعة
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const chartConfig = {
    معاد_تدويره: { label: "معاد تدويره", color: "hsl(142, 76%, 36%)" },
    إجمالي: { label: "إجمالي", color: "hsl(217, 91%, 60%)" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Leaf className="h-7 w-7 text-green-600" />
              تقارير الاستدامة البيئية
            </h1>
            <p className="text-muted-foreground mt-1">
              تحليل شامل للأداء البيئي والاستدامة
            </p>
          </div>
          <div className="flex gap-2">
            {metrics.overallScore >= 60 && selectedOrganization !== "all" && (
              <Button 
                onClick={() => setShowCertificate(true)} 
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Medal className="h-4 w-4 ml-2" />
                إصدار شهادة
              </Button>
            )}
            <Button onClick={() => setShowPrintPreview(true)} className="gradient-eco">
              <Eye className="h-4 w-4 ml-2" />
              معاينة وطباعة
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              معايير التقرير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <Label>الجهة</Label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الجهات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الجهات</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>أنواع الجهات</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id="generator"
                      checked={selectedTypes.includes("generator")}
                      onCheckedChange={() => handleTypeToggle("generator")}
                    />
                    <Label htmlFor="generator" className="text-sm cursor-pointer">مولدة</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id="transporter"
                      checked={selectedTypes.includes("transporter")}
                      onCheckedChange={() => handleTypeToggle("transporter")}
                    />
                    <Label htmlFor="transporter" className="text-sm cursor-pointer">ناقلة</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id="recycler"
                      checked={selectedTypes.includes("recycler")}
                      onCheckedChange={() => handleTypeToggle("recycler")}
                    />
                    <Label htmlFor="recycler" className="text-sm cursor-pointer">مدورة</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overall Score */}
            <Card className={`${sustainabilityLevel.bg} border-2`}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-right">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <LevelIcon className={`h-12 w-12 ${sustainabilityLevel.color}`} />
                      <div>
                        <h2 className="text-4xl font-bold">{metrics.overallScore}%</h2>
                        <p className={`text-lg font-semibold ${sustainabilityLevel.color}`}>
                          {sustainabilityLevel.level}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">درجة الاستدامة الإجمالية</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <Recycle className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p className="text-2xl font-bold">{metrics.recyclingRate}%</p>
                      <p className="text-xs text-muted-foreground">إعادة التدوير</p>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <Target className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold">{metrics.compliance}%</p>
                      <p className="text-xs text-muted-foreground">الامتثال</p>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-2xl font-bold">{metrics.carbonReduction}%</p>
                      <p className="text-xs text-muted-foreground">تقليل الانبعاثات</p>
                    </div>
                  </div>
                  
                  {/* Certificate Button */}
                  {metrics.overallScore >= 60 && selectedOrganization !== "all" && (
                    <Button 
                      onClick={() => setShowCertificate(true)}
                      className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Medal className="h-4 w-4 ml-2" />
                      إصدار شهادة الاستدامة
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SUSTAINABILITY_METRICS).map(([key, { name }]) => (
                <Card key={key}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{name}</span>
                      <Badge variant="outline">{metrics[key as keyof typeof metrics]}%</Badge>
                    </div>
                    <Progress value={metrics[key as keyof typeof metrics]} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div ref={reportRef}>
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                  <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                  <TabsTrigger value="waste">النفايات</TabsTrigger>
                  <TabsTrigger value="performance">الأداء</TabsTrigger>
                  <TabsTrigger value="organizations">المؤسسات</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Radar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">مؤشرات الاستدامة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar
                                name="الأداء"
                                dataKey="value"
                                stroke="#22c55e"
                                fill="#22c55e"
                                fillOpacity={0.5}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">الأداء الشهري</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-80">
                          <AreaChart data={monthlyPerformance()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="إجمالي"
                              stackId="1"
                              stroke="var(--color-إجمالي)"
                              fill="var(--color-إجمالي)"
                              fillOpacity={0.3}
                            />
                            <Area
                              type="monotone"
                              dataKey="معاد_تدويره"
                              stackId="2"
                              stroke="var(--color-معاد_تدويره)"
                              fill="var(--color-معاد_تدويره)"
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="waste" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Waste Distribution Pie */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">توزيع النفايات حسب النوع</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={wasteTypeDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {wasteTypeDistribution().map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Waste Type Bar */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">كميات النفايات (كجم)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={wasteTypeDistribution()} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={80} />
                              <ChartTooltip />
                              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معدل إعادة التدوير الشهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyPerformance()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip />
                            <Bar dataKey="معدل" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="معدل التدوير %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="organizations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">أداء المؤسسات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {organizationPerformance().map((org, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0">
                              {org.type === "generator" && <Factory className="h-5 w-5 text-orange-600" />}
                              {org.type === "transporter" && <Truck className="h-5 w-5 text-blue-600" />}
                              {org.type === "recycler" && <Recycle className="h-5 w-5 text-green-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{org.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {org.total.toLocaleString()} كجم
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={org.rate} className="w-24 h-2" />
                              <Badge variant={org.rate >= 70 ? "default" : "secondary"}>
                                {org.rate}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {organizationPerformance().length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            لا توجد بيانات للعرض
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  توصيات لتحسين الاستدامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.recyclingRate < 70 && (
                    <div className="flex gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">تحسين معدل إعادة التدوير</p>
                        <p className="text-sm text-muted-foreground">
                          يوصى بزيادة معدل إعادة التدوير من خلال تحسين عمليات الفرز
                        </p>
                      </div>
                    </div>
                  )}
                  {metrics.carbonReduction < 60 && (
                    <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">تقليل الانبعاثات الكربونية</p>
                        <p className="text-sm text-muted-foreground">
                          تحسين كفاءة النقل واستخدام مركبات صديقة للبيئة
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">المحافظة على الامتثال البيئي</p>
                      <p className="text-sm text-muted-foreground">
                        الاستمرار في الالتزام بالمعايير واللوائح البيئية
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">الابتكار في إعادة التصنيع</p>
                      <p className="text-sm text-muted-foreground">
                        استكشاف تقنيات جديدة لإعادة تصنيع النفايات
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Certificate Dialog */}
        <SustainabilityCertificate
          open={showCertificate}
          onOpenChange={setShowCertificate}
          organization={organizations.find(org => org.id === selectedOrganization) || null}
          metrics={metrics}
          level={sustainabilityLevel}
        />

        {/* Unified Print Preview */}
        <UnifiedDocumentPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title="تقرير الاستدامة البيئية"
          filename="تقرير-الاستدامة-البيئية"
        >
          {reportRef.current && (
            <div dangerouslySetInnerHTML={{ __html: reportRef.current.innerHTML }} />
          )}
        </UnifiedDocumentPreview>
      </div>
    </DashboardLayout>
  );
};

export default EnvironmentalSustainability;
