import { useState, useEffect } from 'react';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  FileText, 
  Leaf, 
  BarChart3,
  Package,
  Truck,
  Recycle,
  Users,
  Building2,
  MapPin,
  ClipboardList,
  Award,
  Shield,
  AlertTriangle,
  FileCheck,
  Settings,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  UserPlus,
  Car,
  ScrollText,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartRequestDialogProps {
  buttonText?: string;
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

// تصنيفات أنواع الطلبات
const REQUEST_CATEGORIES = [
  { id: 'shipments', label: 'الشحنات والنقل', icon: Package },
  { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3 },
  { id: 'registers', label: 'السجلات والوثائق', icon: ScrollText },
  { id: 'certificates', label: 'الشهادات والاعتمادات', icon: Award },
  { id: 'organization', label: 'المؤسسة والموظفين', icon: Building2 },
  { id: 'drivers', label: 'السائقين والمركبات', icon: Car },
  { id: 'partners', label: 'الجهات المرتبطة', icon: Users },
  { id: 'support', label: 'الدعم والمساعدة', icon: HelpCircle },
];

const REQUEST_TYPES = [
  // الشحنات والنقل
  { value: 'shipment_create', label: 'إنشاء شحنة جديدة', icon: Package, category: 'shipments' },
  { value: 'shipment_modify', label: 'تعديل شحنة قائمة', icon: Package, category: 'shipments' },
  { value: 'shipment_cancel', label: 'إلغاء شحنة', icon: Package, category: 'shipments' },
  { value: 'shipment_tracking', label: 'تتبع شحنة', icon: MapPin, category: 'shipments' },
  { value: 'bulk_shipments', label: 'شحنات متعددة', icon: ClipboardList, category: 'shipments' },
  { value: 'route_optimization', label: 'تحسين المسار', icon: Truck, category: 'shipments' },
  
  // التقارير والتحليلات
  { value: 'environmental_sustainability', label: 'تحليل الاستدامة البيئية', icon: Leaf, category: 'reports' },
  { value: 'carbon_footprint', label: 'تحليل البصمة الكربونية', icon: BarChart3, category: 'reports' },
  { value: 'shipment_report', label: 'تقرير الشحنات', icon: FileText, category: 'reports' },
  { value: 'aggregate_report', label: 'تقرير تجميعي', icon: Calculator, category: 'reports' },
  { value: 'performance_report', label: 'تقرير الأداء', icon: BarChart3, category: 'reports' },
  { value: 'waste_analysis', label: 'تحليل النفايات', icon: Recycle, category: 'reports' },
  
  // السجلات والوثائق
  { value: 'hazardous_register', label: 'سجل النفايات الخطرة', icon: AlertTriangle, category: 'registers' },
  { value: 'non_hazardous_register', label: 'سجل النفايات غير الخطرة', icon: ScrollText, category: 'registers' },
  { value: 'waste_register', label: 'طلب سجل نفايات', icon: FileText, category: 'registers' },
  { value: 'document_upload', label: 'رفع وثيقة', icon: FileCheck, category: 'registers' },
  { value: 'document_verification', label: 'التحقق من وثيقة', icon: Shield, category: 'registers' },
  
  // الشهادات والاعتمادات
  { value: 'recycling_certificate', label: 'شهادة تدوير', icon: Award, category: 'certificates' },
  { value: 'sustainability_certificate', label: 'شهادة استدامة', icon: Leaf, category: 'certificates' },
  { value: 'environmental_compliance', label: 'شهادة الامتثال البيئي', icon: Shield, category: 'certificates' },
  { value: 'aggregate_certificate', label: 'شهادة تجميعية', icon: Award, category: 'certificates' },
  
  // المؤسسة والموظفين
  { value: 'organization_update', label: 'تحديث بيانات المؤسسة', icon: Building2, category: 'organization' },
  { value: 'profile_update', label: 'تحديث البيانات الشخصية', icon: Users, category: 'organization' },
  { value: 'add_employee', label: 'إضافة موظف جديد', icon: UserPlus, category: 'organization' },
  { value: 'employee_permissions', label: 'صلاحيات الموظفين', icon: Shield, category: 'organization' },
  { value: 'location_management', label: 'إدارة المواقع', icon: MapPin, category: 'organization' },
  { value: 'stamp_signature', label: 'الختم والتوقيع', icon: FileCheck, category: 'organization' },
  
  // السائقين والمركبات
  { value: 'add_driver', label: 'إضافة سائق جديد', icon: UserPlus, category: 'drivers' },
  { value: 'driver_approval', label: 'اعتماد سائق', icon: Shield, category: 'drivers' },
  { value: 'driver_tracking', label: 'تتبع السائقين', icon: MapPin, category: 'drivers' },
  { value: 'vehicle_management', label: 'إدارة المركبات', icon: Truck, category: 'drivers' },
  { value: 'driver_assignment', label: 'تعيين سائق لشحنة', icon: Car, category: 'drivers' },
  
  // الشركاء
  { value: 'add_partner', label: 'إضافة شريك جديد', icon: UserPlus, category: 'partners' },
  { value: 'partner_approval', label: 'اعتماد شريك', icon: Shield, category: 'partners' },
  { value: 'partner_notes', label: 'ملاحظات للشريك', icon: MessageSquare, category: 'partners' },
  
  // الدعم والمساعدة
  { value: 'technical_support', label: 'دعم فني', icon: Settings, category: 'support' },
  { value: 'inquiry', label: 'استفسار عام', icon: HelpCircle, category: 'support' },
  { value: 'complaint', label: 'شكوى', icon: AlertTriangle, category: 'support' },
  { value: 'suggestion', label: 'اقتراح أو فكرة', icon: Lightbulb, category: 'support' },
  { value: 'training_request', label: 'طلب تدريب', icon: Users, category: 'support' },
  { value: 'general', label: 'طلب عام آخر', icon: FileText, category: 'support' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
];

const REPORT_PERIODS = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'semi_annual', label: 'نصف سنوي' },
  { value: 'annual', label: 'سنوي' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const SUSTAINABILITY_METRICS = [
  { id: 'recycling_rate', label: 'معدل التدوير' },
  { id: 'waste_reduction', label: 'تقليل النفايات' },
  { id: 'energy_efficiency', label: 'كفاءة الطاقة' },
  { id: 'carbon_reduction', label: 'خفض الكربون' },
  { id: 'environmental_compliance', label: 'الامتثال البيئي' },
  { id: 'sustainable_innovation', label: 'الابتكار المستدام' },
];

const CARBON_ANALYSIS_OPTIONS = [
  { id: 'transport_emissions', label: 'انبعاثات النقل' },
  { id: 'processing_emissions', label: 'انبعاثات المعالجة' },
  { id: 'recycling_savings', label: 'وفورات التدوير' },
  { id: 'carbon_equivalents', label: 'المكافئات البيئية' },
  { id: 'trends_analysis', label: 'تحليل الاتجاهات' },
  { id: 'recommendations', label: 'التوصيات' },
];

const SmartRequestDialog = ({
  buttonText = 'إرسال طلب للإدارة',
  buttonVariant = 'outline',
  buttonSize = 'default',
  className = '',
  children,
}: SmartRequestDialogProps) => {
  const { createRequest } = useApprovalRequests();
  const { streamChat, isLoading: aiLoading } = useAIAssistant();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  
  // Report-specific fields
  const [reportPeriod, setReportPeriod] = useState('quarterly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedCarbonOptions, setSelectedCarbonOptions] = useState<string[]>([]);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeCertificate, setIncludeCertificate] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // AI generation
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Reset form when type changes
  useEffect(() => {
    if (requestType === 'environmental_sustainability') {
      setTitle('طلب تقرير تحليل الاستدامة البيئية');
      setSelectedMetrics(['recycling_rate', 'waste_reduction', 'environmental_compliance']);
    } else if (requestType === 'carbon_footprint') {
      setTitle('طلب تقرير تحليل البصمة الكربونية');
      setSelectedCarbonOptions(['transport_emissions', 'recycling_savings', 'recommendations']);
    } else {
      setTitle('');
    }
    setAiSuggestion('');
  }, [requestType]);

  const generateWithAI = async () => {
    setAiGenerating(true);
    setAiSuggestion('');
    
    const typeLabel = REQUEST_TYPES.find(t => t.value === requestType)?.label || requestType;
    
    let prompt = `أنت مساعد ذكي لإعداد الطلبات. المستخدم يريد تقديم طلب من نوع "${typeLabel}".`;
    
    if (requestType === 'environmental_sustainability') {
      const metricsLabels = selectedMetrics.map(m => 
        SUSTAINABILITY_METRICS.find(sm => sm.id === m)?.label
      ).filter(Boolean).join('، ');
      prompt += `\n\nالمؤشرات المطلوبة: ${metricsLabels || 'جميع المؤشرات'}`;
      prompt += `\nالفترة الزمنية: ${REPORT_PERIODS.find(p => p.value === reportPeriod)?.label}`;
      prompt += `\nتضمين توصيات: ${includeRecommendations ? 'نعم' : 'لا'}`;
      prompt += `\nتضمين شهادة: ${includeCertificate ? 'نعم' : 'لا'}`;
    } else if (requestType === 'carbon_footprint') {
      const optionsLabels = selectedCarbonOptions.map(o => 
        CARBON_ANALYSIS_OPTIONS.find(co => co.id === o)?.label
      ).filter(Boolean).join('، ');
      prompt += `\n\nعناصر التحليل المطلوبة: ${optionsLabels || 'جميع العناصر'}`;
      prompt += `\nالفترة الزمنية: ${REPORT_PERIODS.find(p => p.value === reportPeriod)?.label}`;
    }
    
    prompt += `\n\nقم بكتابة وصف احترافي ومفصل لهذا الطلب يتضمن:
1. الهدف من الطلب
2. البيانات والتحليلات المطلوبة
3. الفترة الزمنية والتوقعات
4. أي متطلبات خاصة

اكتب الوصف بشكل مباشر دون مقدمات.`;

    try {
      await streamChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => {
          setAiSuggestion(prev => prev + chunk);
        },
        onDone: () => {
          setAiGenerating(false);
        },
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في توليد الوصف بالذكاء الاصطناعي',
        variant: 'destructive',
      });
      setAiGenerating(false);
    }
  };

  const applyAISuggestion = () => {
    setDescription(aiSuggestion);
    toast({
      title: 'تم التطبيق',
      description: 'تم تطبيق الوصف المُولَّد بالذكاء الاصطناعي',
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال عنوان الطلب',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Build request data based on type
    const requestData: Record<string, any> = {};
    
    if (requestType === 'environmental_sustainability') {
      requestData.report_type = 'environmental_sustainability';
      requestData.period = reportPeriod;
      requestData.metrics = selectedMetrics;
      requestData.include_recommendations = includeRecommendations;
      requestData.include_certificate = includeCertificate;
      requestData.export_format = exportFormat;
      if (reportPeriod === 'custom') {
        requestData.start_date = customStartDate;
        requestData.end_date = customEndDate;
      }
    } else if (requestType === 'carbon_footprint') {
      requestData.report_type = 'carbon_footprint';
      requestData.period = reportPeriod;
      requestData.analysis_options = selectedCarbonOptions;
      requestData.export_format = exportFormat;
      if (reportPeriod === 'custom') {
        requestData.start_date = customStartDate;
        requestData.end_date = customEndDate;
      }
    }

    const result = await createRequest({
      request_type: requestType,
      request_title: title,
      request_description: description || undefined,
      priority,
      request_data: requestData,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      resetForm();
      toast({
        title: 'تم إرسال الطلب',
        description: 'سيتم مراجعة طلبك وإعداد التقرير المطلوب في أقرب وقت',
      });
    }
  };

  const resetForm = () => {
    setRequestType('general');
    setTitle('');
    setDescription('');
    setPriority('normal');
    setReportPeriod('quarterly');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMetrics([]);
    setSelectedCarbonOptions([]);
    setIncludeRecommendations(true);
    setIncludeCertificate(false);
    setExportFormat('pdf');
    setAiSuggestion('');
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const toggleCarbonOption = (optionId: string) => {
    setSelectedCarbonOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(o => o !== optionId)
        : [...prev, optionId]
    );
  };

  const isReportType = requestType === 'environmental_sustainability' || requestType === 'carbon_footprint';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={buttonVariant} size={buttonSize} className={className}>
            <Send className="h-4 w-4 ml-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            إرسال طلب للإدارة
          </DialogTitle>
          <DialogDescription>
            اختر نوع الطلب وحدد متطلباتك، وسيقوم النظام بتلبية طلبك في أسرع وقت
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="form" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">تعبئة النموذج</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              مساعد الذكاء الاصطناعي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 mt-4">
            {/* Request Type Selection */}
            <div className="space-y-2">
              <Label>نوع الطلب</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطلب" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {REQUEST_CATEGORIES.map((category) => {
                    const CategoryIcon = category.icon;
                    const categoryTypes = REQUEST_TYPES.filter(t => t.category === category.id);
                    if (categoryTypes.length === 0) return null;
                    
                    return (
                      <div key={category.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 bg-muted/50 sticky top-0">
                          <CategoryIcon className="h-3.5 w-3.5" />
                          {category.label}
                        </div>
                        {categoryTypes.map((type) => {
                          const TypeIcon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-primary" />
                                {type.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>عنوان الطلب *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان واضح للطلب"
                className="text-right"
              />
            </div>

            {/* Report-specific fields */}
            {isReportType && (
              <>
                {/* Period Selection */}
                <div className="space-y-2">
                  <Label>الفترة الزمنية</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>من تاريخ</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>إلى تاريخ</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Sustainability Metrics */}
                {requestType === 'environmental_sustainability' && (
                  <div className="space-y-3">
                    <Label>المؤشرات المطلوبة</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUSTAINABILITY_METRICS.map((metric) => (
                        <div key={metric.id} className="flex items-center gap-2">
                          <Checkbox
                            id={metric.id}
                            checked={selectedMetrics.includes(metric.id)}
                            onCheckedChange={() => toggleMetric(metric.id)}
                          />
                          <label htmlFor={metric.id} className="text-sm cursor-pointer">
                            {metric.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="recommendations"
                          checked={includeRecommendations}
                          onCheckedChange={(checked) => setIncludeRecommendations(!!checked)}
                        />
                        <label htmlFor="recommendations" className="text-sm cursor-pointer">
                          تضمين توصيات AI
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="certificate"
                          checked={includeCertificate}
                          onCheckedChange={(checked) => setIncludeCertificate(!!checked)}
                        />
                        <label htmlFor="certificate" className="text-sm cursor-pointer">
                          إصدار شهادة استدامة
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carbon Analysis Options */}
                {requestType === 'carbon_footprint' && (
                  <div className="space-y-3">
                    <Label>عناصر التحليل</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CARBON_ANALYSIS_OPTIONS.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Checkbox
                            id={option.id}
                            checked={selectedCarbonOptions.includes(option.id)}
                            onCheckedChange={() => toggleCarbonOption(option.id)}
                          />
                          <label htmlFor={option.id} className="text-sm cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Format */}
                <div className="space-y-2">
                  <Label>صيغة التصدير</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="both">PDF + Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>تفاصيل الطلب</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح تفاصيل طلبك بوضوح..."
                rows={4}
                className="text-right"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>استخدم الذكاء الاصطناعي لتوليد وصف احترافي لطلبك</span>
              </div>
              
              <div className="space-y-2">
                <Label>نوع الطلب المحدد: {REQUEST_TYPES.find(t => t.value === requestType)?.label}</Label>
                {isReportType && (
                  <p className="text-sm text-muted-foreground">
                    سيتم توليد وصف مخصص بناءً على المؤشرات والخيارات المحددة في تبويب "تعبئة النموذج"
                  </p>
                )}
              </div>

              <Button 
                onClick={generateWithAI} 
                disabled={aiGenerating}
                className="w-full"
                variant="secondary"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    توليد وصف بالذكاء الاصطناعي
                  </>
                )}
              </Button>

              {aiSuggestion && (
                <div className="space-y-2">
                  <Label>الوصف المُولَّد:</Label>
                  <div className="bg-background rounded-md p-3 text-sm whitespace-pre-wrap border max-h-48 overflow-y-auto">
                    {aiSuggestion}
                  </div>
                  <Button 
                    onClick={applyAISuggestion} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    تطبيق هذا الوصف
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إرسال الطلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartRequestDialog;
