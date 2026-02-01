import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Download, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { type WasteCategoryInfo } from '@/lib/wasteClassification';
import { useContractTemplates } from '@/hooks/useContractTemplates';

interface AIContractGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: WasteCategoryInfo | null;
  wasteCategories: WasteCategoryInfo[];
}

const AIContractGenerator = ({
  open,
  onOpenChange,
  selectedCategory,
  wasteCategories
}: AIContractGeneratorProps) => {
  const { createTemplate } = useContractTemplates();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');
  const [category, setCategory] = useState(selectedCategory?.id || '');
  const [partnerType, setPartnerType] = useState<'generator' | 'recycler'>('generator');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Update category when selectedCategory changes
  if (selectedCategory && category !== selectedCategory.id && !loading) {
    setCategory(selectedCategory.id);
  }

  const generateContract = async () => {
    if (!category) {
      toast.error('يرجى اختيار نوع المخلف');
      return;
    }

    setLoading(true);
    setGeneratedContract('');

    try {
      const selectedWasteCategory = wasteCategories.find(c => c.id === category);
      if (!selectedWasteCategory) {
        toast.error('لم يتم العثور على تصنيف المخلف');
        return;
      }

      const isHazardous = selectedWasteCategory.category === 'hazardous';
      const subcategoriesList = selectedWasteCategory.subcategories
        .map(s => `${s.code}: ${s.name}`)
        .join('، ');

      const prompt = `أنت خبير قانوني متخصص في عقود إدارة المخلفات وفقاً للقانون المصري.

أنشئ عقد ${partnerType === 'generator' ? 'جمع ونقل مخلفات من جهة مولدة' : 'تدوير ومعالجة مخلفات لجهة تدوير'} شامل ومفصل يتوافق مع:
- قانون البيئة المصري رقم 4 لسنة 1994 وتعديلاته
- قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
- لوائح جهاز تنظيم إدارة المخلفات (WMRA)

**تصنيف المخلف:** ${selectedWasteCategory.name}
**نوع المخلف:** ${isHazardous ? 'خطر' : 'غير خطر'}
**الحالة الفيزيائية:** ${selectedWasteCategory.wasteState}
**الأنواع الفرعية المشمولة:** ${subcategoriesList}

${additionalRequirements ? `**متطلبات إضافية:** ${additionalRequirements}` : ''}

**المطلوب في العقد (30 بند على الأقل):**

1. البند الأول - التعريفات والمصطلحات القانونية (لا يقل عن 4 فقرات)
2. البند الثاني - الإطار القانوني والمرجعية التشريعية
3. البند الثالث - التراخيص والتصاريح الإلزامية
4. البند الرابع - نطاق الخدمات ومواصفات ${selectedWasteCategory.name}
5. البند الخامس - المواصفات الفنية واشتراطات النقل
6. البند السادس - التوثيق والسجلات الإلزامية
7. البند السابع - السلامة والصحة المهنية
8. البند الثامن - المسؤولية البيئية والتعويضات
9. البند التاسع - التأمين والضمانات
10. البند العاشر - الأسعار وشروط الدفع
11. البند الحادي عشر - مدة العقد والتجديد
12. البند الثاني عشر - إنهاء العقد وفسخه
13. البند الثالث عشر - السرية وحماية المعلومات
14. البند الرابع عشر - القوة القاهرة
15. البند الخامس عشر - التعديلات والملاحق
16. البند السادس عشر - التنازل والتحويل
17. البند السابع عشر - الإخطارات والمراسلات
18. البند الثامن عشر - كامل الاتفاق
19. البند التاسع عشر - استقلالية البنود
20. البند العشرون - حل النزاعات والتحكيم
21. البند الحادي والعشرون - الاختصاص القضائي
22. البند الثاني والعشرون - اللغة المعتمدة
23. البند الثالث والعشرون - النسخ الأصلية
24. البند الرابع والعشرون - التزامات ${partnerType === 'generator' ? 'الجهة المولدة' : 'جهة التدوير'} الخاصة
25. البند الخامس والعشرون - التزامات شركة النقل الخاصة
26. البند السادس والعشرون - إجراءات الطوارئ والتسربات
27. البند السابع والعشرون - الرقابة والتفتيش
28. البند الثامن والعشرون - الجزاءات والغرامات
29. البند التاسع والعشرون - التعاون مع الجهات الرقابية
30. البند الثلاثون - الإقرارات والضمانات النهائية

${isHazardous ? `
**ملاحظات خاصة بالمخلفات الخطرة:**
- يجب تضمين اشتراطات إضافية للتعامل مع المخلفات الخطرة
- إضافة بنود خاصة بالتخزين المؤقت والعلامات التحذيرية
- تفصيل إجراءات الطوارئ والتسربات بشكل أكبر
- تضمين متطلبات التدريب المتخصص للعاملين
` : ''}

**تنسيق الإخراج:**
- كل بند لا يقل عن سطرين
- استخدم ترقيم واضح (أولاً، ثانياً، ثالثاً...)
- اجعل اللغة قانونية رسمية ومهنية
- أضف إشارات للمواد القانونية ذات الصلة`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'chat',
          messages: [{ role: 'user', content: prompt }]
        }
      });

      if (error) {
        // Check for rate limit or payment errors
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          toast.error('تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً');
        } else if (error.message?.includes('402') || error.message?.includes('payment')) {
          toast.error('يرجى إضافة رصيد لاستخدام خدمات الذكاء الاصطناعي');
        } else {
          throw error;
        }
        return;
      }

      // Handle streaming response
      if (data && typeof data === 'object' && 'body' in data) {
        const reader = data.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                result += content;
                setGeneratedContract(result);
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      } else if (data?.result) {
        setGeneratedContract(data.result);
      }

      toast.success('تم إنشاء العقد بنجاح');
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('حدث خطأ أثناء إنشاء العقد');
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!generatedContract || !category) {
      toast.error('لا يوجد عقد لحفظه');
      return;
    }

    setSaving(true);
    try {
      const selectedWasteCategory = wasteCategories.find(c => c.id === category);
      
      await createTemplate({
        name: `عقد ${partnerType === 'generator' ? 'جمع ونقل' : 'تدوير'} ${selectedWasteCategory?.name || ''} - AI`,
        description: `قالب عقد تم إنشاؤه بواسطة الذكاء الاصطناعي لـ ${selectedWasteCategory?.name}`,
        partner_type: partnerType,
        contract_category: partnerType === 'generator' ? 'collection_transport' : 'recycling',
        terms_template: generatedContract,
        include_stamp: true,
        include_signature: true,
        include_header_logo: true,
      });

      toast.success('تم حفظ القالب بنجاح');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('حدث خطأ أثناء حفظ القالب');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContract);
    toast.success('تم نسخ العقد');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            إنشاء عقد بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            أنشئ قالب عقد قانوني متكامل بناءً على تصنيف المخلف ونوع الشريك
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع المخلف</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر تصنيف المخلف" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 text-xs font-semibold text-red-500">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    مخلفات خطرة
                  </div>
                  {wasteCategories.filter(c => c.category === 'hazardous').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <Separator className="my-2" />
                  <div className="p-2 text-xs font-semibold text-green-500">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    مخلفات غير خطرة
                  </div>
                  {wasteCategories.filter(c => c.category === 'non_hazardous').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع الشريك</Label>
              <Select value={partnerType} onValueChange={(v) => setPartnerType(v as 'generator' | 'recycler')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generator">جهة مولدة للمخلفات</SelectItem>
                  <SelectItem value="recycler">جهة تدوير ومعالجة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>متطلبات إضافية (اختياري)</Label>
              <Textarea
                placeholder="أضف أي متطلبات أو بنود خاصة تريد تضمينها في العقد..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                rows={3}
              />
            </div>

            {/* Selected Category Info */}
            {category && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-2">معلومات التصنيف:</p>
                  {(() => {
                    const cat = wasteCategories.find(c => c.id === category);
                    if (!cat) return null;
                    return (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={cat.category === 'hazardous' ? 'destructive' : 'secondary'}>
                            {cat.category === 'hazardous' ? 'خطر' : 'غير خطر'}
                          </Badge>
                          <span className="text-muted-foreground">
                            {cat.subcategories.length} نوع فرعي
                          </span>
                        </div>
                        <p className="text-muted-foreground">{cat.description}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={generateContract} 
              disabled={loading || !category}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  إنشاء العقد
                </>
              )}
            </Button>
          </div>

          {/* Generated Contract Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>العقد المُنشأ</Label>
              {generatedContract && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-3">
              {generatedContract ? (
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-right" dir="rtl">
                  {generatedContract}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">سيظهر العقد هنا بعد الإنشاء</p>
                </div>
              )}
            </ScrollArea>

            {generatedContract && (
              <Button 
                onClick={saveAsTemplate} 
                disabled={saving}
                className="w-full gap-2"
                variant="secondary"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    حفظ كقالب جديد
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIContractGenerator;
