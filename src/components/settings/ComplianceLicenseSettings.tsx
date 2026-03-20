import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Shield, FileCheck, Truck, Recycle, Factory, Trash2, Save, Loader2,
  AlertTriangle, CheckCircle2, Plus, X, Search, ChevronDown, ChevronRight,
  Flame, Droplets, Stethoscope, Leaf, Package, Filter, Brain
} from 'lucide-react';
import { useDocumentOCRExtractor, type OCRExtractedData } from '@/hooks/useDocumentOCRExtractor';
import {
  getAllWasteCategories, hazardousWasteCategories, nonHazardousWasteCategories,
  getTotalWasteTypesCount, searchWasteByCommonName,
  type WasteCategoryInfo, type WasteSubcategory
} from '@/lib/wasteClassification';

interface ComplianceData {
  licensed_waste_types: string[];
  wmra_license: string;
  wmra_license_issue_date: string;
  wmra_license_expiry_date: string;
  environmental_approval_number: string;
  env_approval_expiry: string;
  land_transport_license: string;
  hazardous_certified: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  chemical: <Flame className="h-4 w-4 text-red-500" />,
  electronic: <Package className="h-4 w-4 text-purple-500" />,
  medical: <Stethoscope className="h-4 w-4 text-pink-500" />,
  industrial: <Factory className="h-4 w-4 text-orange-500" />,
  organic: <Leaf className="h-4 w-4 text-green-500" />,
  plastic: <Recycle className="h-4 w-4 text-blue-500" />,
  paper: <Package className="h-4 w-4 text-amber-500" />,
  metal: <Package className="h-4 w-4 text-gray-500" />,
  glass: <Package className="h-4 w-4 text-cyan-500" />,
  construction: <Package className="h-4 w-4 text-orange-400" />,
  textile: <Package className="h-4 w-4 text-pink-400" />,
  liquid_non_hazardous: <Droplets className="h-4 w-4 text-blue-400" />,
  municipal: <Trash2 className="h-4 w-4 text-gray-400" />,
  extended: <Package className="h-4 w-4 text-primary" />,
};

export default function ComplianceLicenseSettings() {
  const { organization } = useAuth();
  const { extractFromFile, applyToOrganization, extracting, progress, extractedResult, setExtractedResult } = useDocumentOCRExtractor();
  const [showOCRPreview, setShowOCRPreview] = useState(false);
  const [uploadedFileRef, setUploadedFileRef] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customWaste, setCustomWaste] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('hazardous');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [data, setData] = useState<ComplianceData>({
    licensed_waste_types: [],
    wmra_license: '',
    wmra_license_issue_date: '',
    wmra_license_expiry_date: '',
    environmental_approval_number: '',
    env_approval_expiry: '',
    land_transport_license: '',
    hazardous_certified: false,
  });

  const orgType = (organization as any)?.organization_type || '';
  const orgId = organization?.id;

  const totalCount = useMemo(() => getTotalWasteTypesCount(), []);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const { data: org } = await supabase
        .from('organizations')
        .select('licensed_waste_types, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified')
        .eq('id', orgId)
        .single();
      if (org) {
        setData({
          licensed_waste_types: (org.licensed_waste_types as string[]) || [],
          wmra_license: org.wmra_license || '',
          wmra_license_issue_date: org.wmra_license_issue_date || '',
          wmra_license_expiry_date: org.wmra_license_expiry_date || '',
          environmental_approval_number: org.environmental_approval_number || '',
          env_approval_expiry: org.env_approval_expiry || '',
          land_transport_license: org.land_transport_license || '',
          hazardous_certified: org.hazardous_certified || false,
        });
      }
      setLoading(false);
    })();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase
      .from('organizations')
      .update({
        licensed_waste_types: data.licensed_waste_types,
        wmra_license: data.wmra_license || null,
        wmra_license_issue_date: data.wmra_license_issue_date || null,
        wmra_license_expiry_date: data.wmra_license_expiry_date || null,
        environmental_approval_number: data.environmental_approval_number || null,
        env_approval_expiry: data.env_approval_expiry || null,
        land_transport_license: data.land_transport_license || null,
        hazardous_certified: data.hazardous_certified,
      })
      .eq('id', orgId);

    if (error) {
      toast.error('فشل في حفظ البيانات');
    } else {
      toast.success('تم حفظ بيانات التراخيص والامتثال');
    }
    setSaving(false);
  };

  const toggleWasteType = (code: string) => {
    setData(prev => ({
      ...prev,
      licensed_waste_types: prev.licensed_waste_types.includes(code)
        ? prev.licensed_waste_types.filter(t => t !== code)
        : [...prev.licensed_waste_types, code],
    }));
  };

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectAllInCategory = (subs: WasteSubcategory[]) => {
    const codes = subs.map(s => s.code);
    setData(prev => ({
      ...prev,
      licensed_waste_types: [...new Set([...prev.licensed_waste_types, ...codes])],
    }));
  };

  const deselectAllInCategory = (subs: WasteSubcategory[]) => {
    const codes = new Set(subs.map(s => s.code));
    setData(prev => ({
      ...prev,
      licensed_waste_types: prev.licensed_waste_types.filter(t => !codes.has(t)),
    }));
  };

  const addCustomWaste = () => {
    const trimmed = customWaste.trim();
    if (trimmed && !data.licensed_waste_types.includes(trimmed)) {
      setData(prev => ({ ...prev, licensed_waste_types: [...prev.licensed_waste_types, trimmed] }));
      setCustomWaste('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('يرجى رفع صورة أو ملف PDF');
      e.target.value = '';
      return;
    }

    setUploadedFileRef(file);
    const result = await extractFromFile(file);
    if (result) {
      setShowOCRPreview(true);
    }
    e.target.value = '';
  };

  const handleApplyOCR = async () => {
    if (!extractedResult || !orgId) return;

    try {
      // 1. Upload original file to storage (preserve as-is)
      let fileUrl = '';
      if (uploadedFileRef) {
        const timestamp = Date.now();
        const safeName = uploadedFileRef.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const storagePath = `${orgId}/compliance/${timestamp}-${safeName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('organization-documents')
          .upload(storagePath, uploadedFileRef, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadErr) {
          console.error('File upload error:', uploadErr);
          toast.error('فشل في رفع الملف الأصلي');
        } else {
          const { data: urlData } = supabase.storage
            .from('organization-documents')
            .getPublicUrl(uploadData.path);
          fileUrl = urlData.publicUrl;
        }
      }

      // 2. Save extracted data to entity_documents
      const aiDocType = extractedResult.detected_fields.document_type || 'other';
      // Map AI-detected type to allowed DB values
      const typeMap: Record<string, string> = {
        wmra_license: 'license', environmental_approval: 'certificate',
        transport_license: 'license', compliance_document: 'certificate',
      };
      const docType = typeMap[aiDocType] || 'other';
      const title = extractedResult.detected_fields.license_number
        ? `${docType} - ${extractedResult.detected_fields.license_number}`
        : `مستند امتثال - ${new Date().toLocaleDateString('ar-EG')}`;

      const { error: docErr } = await supabase
        .from('entity_documents')
        .insert({
          organization_id: orgId,
          document_type: docType,
          document_category: 'legal',
          title,
          file_url: fileUrl,
          file_name: uploadedFileRef?.name || 'unknown',
          file_type: uploadedFileRef?.type || 'application/octet-stream',
          file_size: uploadedFileRef?.size || 0,
          reference_number: extractedResult.detected_fields.license_number || null,
          tags: ['ai-extracted', 'compliance', docType],
          ocr_extracted_data: extractedResult as any,
          ocr_confidence: extractedResult.confidence,
          ai_extracted: true,
        });

      if (docErr) {
        console.error('Save document error:', docErr);
        toast.warning('تم استخراج البيانات لكن فشل حفظ المستند في الأرشيف');
      } else {
        toast.success('تم حفظ المستند والبيانات المستخرجة في الأرشيف');
      }

      // 3. Apply fields to organization
      const success = await applyToOrganization(orgId, extractedResult.detected_fields);
      if (success) {
        const { data: org } = await supabase
          .from('organizations')
          .select('licensed_waste_types, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified')
          .eq('id', orgId)
          .single();
        if (org) {
          setData({
            licensed_waste_types: (org.licensed_waste_types as string[]) || [],
            wmra_license: org.wmra_license || '',
            wmra_license_issue_date: org.wmra_license_issue_date || '',
            wmra_license_expiry_date: org.wmra_license_expiry_date || '',
            environmental_approval_number: org.environmental_approval_number || '',
            env_approval_expiry: org.env_approval_expiry || '',
            land_transport_license: org.land_transport_license || '',
            hazardous_certified: org.hazardous_certified || false,
          });
        }
      }
      
      setShowOCRPreview(false);
      setExtractedResult(null);
      setUploadedFileRef(null);
    } catch (err) {
      console.error('Apply OCR error:', err);
      toast.error('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getOrgLabel = () => {
    const labels: Record<string, string> = {
      generator: 'المولّد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص النهائي',
    };
    return labels[orgType] || 'الجهة';
  };

  const getWasteLabel = () => {
    const labels: Record<string, string> = {
      generator: 'أنواع المخلفات المولّدة', transporter: 'أنواع المخلفات المنقولة',
      recycler: 'أنواع المخلفات المعالجة/المدورة', disposal: 'أنواع المخلفات للتخلص النهائي',
    };
    return labels[orgType] || 'أنواع المخلفات المرخصة';
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return searchWasteByCommonName(searchQuery).slice(0, 50);
  }, [searchQuery]);

  // Filter categories by tab
  const filteredCategories = useMemo(() => {
    const all = getAllWasteCategories();
    if (activeTab === 'hazardous') return all.filter(c => c.category === 'hazardous');
    if (activeTab === 'non_hazardous') return all.filter(c => c.category === 'non_hazardous');
    return all.filter(c => c.category === 'all');
  }, [activeTab]);

  // Count selected per category
  const getSelectedCount = (cat: WasteCategoryInfo) => {
    return cat.subcategories.filter(s => data.licensed_waste_types.includes(s.code)).length;
  };

  const hazardousCount = useMemo(() => {
    return hazardousWasteCategories.reduce((sum, c) =>
      sum + c.subcategories.filter(s => data.licensed_waste_types.includes(s.code)).length, 0);
  }, [data.licensed_waste_types]);

  const nonHazardousCount = useMemo(() => {
    return nonHazardousWasteCategories.reduce((sum, c) =>
      sum + c.subcategories.filter(s => data.licensed_waste_types.includes(s.code)).length, 0);
  }, [data.licensed_waste_types]);

  if (loading) {
    return <Card><CardContent className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* OCR Document Upload */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">استخراج البيانات تلقائياً بالذكاء الاصطناعي</p>
              <p className="text-xs text-muted-foreground mt-1">
                ارفع صورة أو ملف PDF (ترخيص، موافقة بيئية، تصريح) وسيتم استخراج البيانات تلقائياً بالذكاء الاصطناعي
              </p>
              {extracting && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">جارٍ التحليل... {progress}%</p>
                </div>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*,.pdf,application/pdf" onChange={handleFileUpload} disabled={extracting} />
                  <Button variant="outline" size="sm" className="gap-2" asChild disabled={extracting}>
                    <span>
                      {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                      {extracting ? 'جارٍ التحليل...' : 'رفع صورة أو PDF'}
                    </span>
                  </Button>
                </label>
                <Button
                  variant="secondary" size="sm" className="gap-1.5"
                  onClick={() => {
                    // Navigate to the AI extracted data tab in parent
                    const tabTrigger = document.querySelector('[data-state][value="ai-extracted"]') as HTMLElement;
                    if (tabTrigger) tabTrigger.click();
                  }}
                >
                  <Brain className="h-3.5 w-3.5" />
                  عرض البيانات المستخرجة
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR Preview Result */}
      {showOCRPreview && extractedResult && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              نتائج الاستخراج — دقة {Math.round(extractedResult.confidence)}% {extractedResult.pages_count && extractedResult.pages_count > 1 ? `(${extractedResult.pages_count} صفحات)` : ''}
            </CardTitle>
            <CardDescription className="text-xs">راجع البيانات المستخرجة قبل الحفظ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {extractedResult.detected_fields.document_type && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">نوع المستند:</span>
                <Badge variant="outline">
                  {extractedResult.detected_fields.document_type === 'wmra_license' ? 'تصريح WMRA' :
                   extractedResult.detected_fields.document_type === 'environmental_approval' ? 'موافقة بيئية' :
                   extractedResult.detected_fields.document_type === 'transport_license' ? 'ترخيص نقل' : 'غير محدد'}
                </Badge>
              </div>
            )}
            {extractedResult.detected_fields.license_number && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رقم الترخيص:</span>
                <span className="font-mono">{extractedResult.detected_fields.license_number}</span>
              </div>
            )}
            {extractedResult.detected_fields.issue_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تاريخ الإصدار:</span>
                <span>{extractedResult.detected_fields.issue_date}</span>
              </div>
            )}
            {extractedResult.detected_fields.expiry_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                <span>{extractedResult.detected_fields.expiry_date}</span>
              </div>
            )}
            {extractedResult.detected_fields.issuing_authority && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الجهة المصدرة:</span>
                <span>{extractedResult.detected_fields.issuing_authority}</span>
              </div>
            )}
            
            {/* Raw text collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                  عرض النص الخام المستخرج
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-muted p-3 rounded text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap" dir="auto">
                  {extractedResult.raw_text || 'لم يتم استخراج نص'}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowOCRPreview(false); setExtractedResult(null); }}>
                <X className="h-4 w-4 ml-1" /> تجاهل
              </Button>
              <Button size="sm" onClick={handleApplyOCR} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> تأكيد وحفظ البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{data.licensed_waste_types.length}</p>
            <p className="text-xs text-muted-foreground">نوع محدد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{hazardousCount}</p>
            <p className="text-xs text-muted-foreground">خطرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{nonHazardousCount}</p>
            <p className="text-xs text-muted-foreground">غير خطرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">إجمالي القاعدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste Types Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {orgType === 'transporter' ? <Truck className="h-4 w-4 text-primary" /> :
             orgType === 'recycler' ? <Recycle className="h-4 w-4 text-primary" /> :
             orgType === 'disposal' ? <Trash2 className="h-4 w-4 text-primary" /> :
             <Factory className="h-4 w-4 text-primary" />}
            {getWasteLabel()}
          </CardTitle>
          <CardDescription className="text-xs">
            حدد أنواع المخلفات المرخص لجهة {getOrgLabel()} التعامل معها — قاعدة بيانات تضم {totalCount}+ نوع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في أنواع المخلفات (مثال: بطاريات، أسبستوس، شرش لبن...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 text-sm"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  <Filter className="h-3 w-3 inline ml-1" />
                  نتائج البحث: {searchResults.length} نتيجة
                </p>
                <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                    {searchResults.map(item => (
                      <div
                        key={item.code}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                          data.licensed_waste_types.includes(item.code) 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleWasteType(item.code)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {data.licensed_waste_types.includes(item.code) && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                          <span className="truncate">{item.name}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.code}</Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 mr-2 ${
                            item.hazardLevel === 'critical' ? 'border-red-500 text-red-500' :
                            item.hazardLevel === 'high' ? 'border-orange-500 text-orange-500' :
                            item.hazardLevel === 'medium' ? 'border-amber-500 text-amber-500' :
                            'border-green-500 text-green-500'
                          }`}
                        >
                          {item.hazardLevel === 'critical' ? 'حرج' : item.hazardLevel === 'high' ? 'عالي' : item.hazardLevel === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                    ))}
                    {searchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">لا توجد نتائج</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="hazardous" className="text-xs gap-1">
                <Flame className="h-3 w-3" /> خطرة
              </TabsTrigger>
              <TabsTrigger value="non_hazardous" className="text-xs gap-1">
                <Leaf className="h-3 w-3" /> غير خطرة
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs gap-1">
                <Package className="h-3 w-3" /> موسّعة
              </TabsTrigger>
            </TabsList>

            {['hazardous', 'non_hazardous', 'all'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-3">
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin space-y-2">
                    {filteredCategories.map(cat => {
                      const selected = getSelectedCount(cat);
                      const isOpen = openCategories.has(cat.id);
                      return (
                        <Collapsible key={cat.id} open={isOpen} onOpenChange={() => toggleCategory(cat.id)}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                              <div className="flex items-center gap-2">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                {categoryIcons[cat.id] || <Package className="h-4 w-4" />}
                                <span className="text-sm font-medium">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {cat.subcategories.length} نوع
                                </Badge>
                                {selected > 0 && (
                                  <Badge className="text-[10px] bg-primary">{selected} محدد</Badge>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pr-8 pt-2 pb-1 space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                              {/* Select/Deselect All */}
                              <div className="flex gap-2 mb-2">
                                <Button
                                  variant="ghost" size="sm" className="text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); selectAllInCategory(cat.subcategories); }}
                                >
                                  تحديد الكل
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); deselectAllInCategory(cat.subcategories); }}
                                >
                                  إلغاء الكل
                                </Button>
                              </div>
                              {cat.subcategories.map(sub => (
                                <div
                                  key={sub.code}
                                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                                    data.licensed_waste_types.includes(sub.code) ? 'bg-primary/10' : 'hover:bg-muted/30'
                                  }`}
                                  onClick={() => toggleWasteType(sub.code)}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    data.licensed_waste_types.includes(sub.code)
                                      ? 'bg-primary border-primary text-primary-foreground'
                                      : 'border-border'
                                  }`}>
                                    {data.licensed_waste_types.includes(sub.code) && <CheckCircle2 className="h-3 w-3" />}
                                  </div>
                                  <span className="flex-1 truncate">{sub.name}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">{sub.code}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Separator />

          {/* Custom waste type */}
          <div className="flex gap-2">
            <Input
              placeholder="أضف نوع مخلف مخصص..."
              value={customWaste}
              onChange={e => setCustomWaste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomWaste()}
              className="text-sm"
            />
            <Button variant="outline" size="sm" onClick={addCustomWaste} disabled={!customWaste.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected custom types (not in system) */}
          {data.licensed_waste_types.filter(t => !t.match(/^[A-Z]{2,3}-\d/)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
              <p className="text-xs text-muted-foreground w-full mb-1">أنواع مخصصة:</p>
              {data.licensed_waste_types.filter(t => !t.match(/^[A-Z]{2,3}-\d/)).map(type => (
                <Badge key={type} variant="default" className="cursor-pointer text-xs py-0.5 px-2" onClick={() => toggleWasteType(type)}>
                  <X className="h-3 w-3 mr-1" />{type}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{data.licensed_waste_types.length} نوع محدد من إجمالي {totalCount}</p>
        </CardContent>
      </Card>

      {/* Hazardous */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold">اعتماد المخلفات الخطرة</p>
                <p className="text-xs text-muted-foreground">هل الجهة معتمدة للتعامل مع المخلفات الخطرة؟</p>
              </div>
            </div>
            <Switch checked={data.hazardous_certified} onCheckedChange={v => setData(p => ({ ...p, hazardous_certified: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Environmental Approval */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />الموافقة البيئية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">رقم الموافقة البيئية</Label>
              <Input value={data.environmental_approval_number} onChange={e => setData(p => ({ ...p, environmental_approval_number: e.target.value }))} placeholder="أدخل الرقم" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ انتهاء الموافقة</Label>
              <Input type="date" value={data.env_approval_expiry} onChange={e => setData(p => ({ ...p, env_approval_expiry: e.target.value }))} className="mt-1" />
              {isExpired(data.env_approval_expiry) && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />منتهية الصلاحية</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WMRA License */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />تصريح WMRA — جهاز تنظيم إدارة المخلفات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">رقم التصريح</Label>
              <Input value={data.wmra_license} onChange={e => setData(p => ({ ...p, wmra_license: e.target.value }))} placeholder="رقم WMRA" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ الإصدار</Label>
              <Input type="date" value={data.wmra_license_issue_date} onChange={e => setData(p => ({ ...p, wmra_license_issue_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ الانتهاء</Label>
              <Input type="date" value={data.wmra_license_expiry_date} onChange={e => setData(p => ({ ...p, wmra_license_expiry_date: e.target.value }))} className="mt-1" />
              {isExpired(data.wmra_license_expiry_date) && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />منتهي الصلاحية</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport License */}
      {(orgType === 'transporter' || orgType === 'transport_office') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />ترخيص النقل البري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-xs">رقم ترخيص النقل البري</Label>
              <Input value={data.land_transport_license} onChange={e => setData(p => ({ ...p, land_transport_license: e.target.value }))} placeholder="أدخل رقم الترخيص" className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        حفظ بيانات التراخيص والامتثال
      </Button>
    </div>
  );
}
