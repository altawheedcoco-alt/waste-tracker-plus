import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Save, 
  Loader2, 
  Building2, 
  Eye, 
  FileText, 
  MapPin, 
  Briefcase,
  Plus,
  Trash2,
  Target,
  Shield,
  GitBranch
} from 'lucide-react';

interface Branch {
  name: string;
  address: string;
  city: string;
  phone?: string;
}

interface OrganizationPortfolioProps {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  currentData: {
    description?: string | null;
    vision?: string | null;
    policy?: string | null;
    headquarters?: string | null;
    branches?: Branch[] | null;
    field_of_work?: string | null;
    address?: string;
    city?: string;
    activity_type?: string | null;
  };
  isEditable: boolean;
  onUpdate: () => void;
}

const OrganizationPortfolio = ({
  organizationId,
  organizationName,
  organizationType,
  currentData,
  isEditable,
  onUpdate
}: OrganizationPortfolioProps) => {
  const [formData, setFormData] = useState({
    description: currentData.description || '',
    vision: currentData.vision || '',
    policy: currentData.policy || '',
    headquarters: currentData.headquarters || '',
    field_of_work: currentData.field_of_work || '',
    branches: (currentData.branches as Branch[]) || []
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const getOrganizationTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'جهة مولدة للنفايات';
      case 'transporter': return 'جهة ناقلة للنفايات';
      case 'recycler': return 'جهة تدوير النفايات';
      default: return type;
    }
  };

  const handleGenerateWithAI = async (field: 'description' | 'vision' | 'policy' | 'headquarters' | 'field_of_work') => {
    setGenerating(field);
    
    try {
      const prompts: Record<string, string> = {
        description: `اكتب وصفاً احترافياً مختصراً (3-4 جمل) لشركة "${organizationName}" التي تعمل في مجال ${getOrganizationTypeLabel(organizationType)} في مصر. الوصف يجب أن يكون رسمياً ومهنياً.`,
        vision: `اكتب رؤية ورسالة مختصرة (2-3 جمل) لشركة "${organizationName}" التي تعمل في مجال ${getOrganizationTypeLabel(organizationType)}. يجب أن تكون ملهمة وتعكس الالتزام بالاستدامة البيئية.`,
        policy: `اكتب سياسة عمل مختصرة (3-4 نقاط) لشركة "${organizationName}" التي تعمل في مجال ${getOrganizationTypeLabel(organizationType)}. يجب أن تتضمن الالتزام بالمعايير البيئية والجودة.`,
        headquarters: `اكتب وصفاً مختصراً للمقر الرئيسي لشركة "${organizationName}" الموجود في ${currentData.city || 'مصر'}، ${currentData.address || ''}. الوصف يجب أن يكون مهنياً.`,
        field_of_work: `اكتب وصفاً مختصراً (2-3 جمل) لمجال عمل شركة "${organizationName}" التي تعمل في ${getOrganizationTypeLabel(organizationType)}${currentData.activity_type ? ` ونشاطها: ${currentData.activity_type}` : ''}.`
      };

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          type: 'chat', 
          messages: [
            { role: 'user', content: prompts[field] }
          ]
        }
      });

      if (error) throw error;

      const generatedText = data.result || data.choices?.[0]?.message?.content || '';
      
      setFormData(prev => ({
        ...prev,
        [field]: generatedText.trim()
      }));

      toast.success('تم توليد المحتوى بنجاح');
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('حدث خطأ في توليد المحتوى');
    } finally {
      setGenerating(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          description: formData.description || null,
          vision: formData.vision || null,
          policy: formData.policy || null,
          headquarters: formData.headquarters || null,
          field_of_work: formData.field_of_work || null,
          branches: formData.branches as any
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('تم حفظ البيانات بنجاح');
      onUpdate();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const addBranch = () => {
    setFormData(prev => ({
      ...prev,
      branches: [...prev.branches, { name: '', address: '', city: '', phone: '' }]
    }));
  };

  const removeBranch = (index: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index)
    }));
  };

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => 
        i === index ? { ...branch, [field]: value } : branch
      )
    }));
  };

  const renderField = (
    field: 'description' | 'vision' | 'policy' | 'headquarters' | 'field_of_work',
    label: string,
    icon: React.ReactNode,
    placeholder: string,
    isTextarea: boolean = true
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {label}
        </Label>
        {isEditable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateWithAI(field)}
            disabled={generating === field}
            className="gap-2"
          >
            {generating === field ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            توليد تلقائي
          </Button>
        )}
      </div>
      {isTextarea ? (
        <Textarea
          value={formData[field]}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          disabled={!isEditable}
          className="min-h-[100px] resize-none"
        />
      ) : (
        <Input
          value={formData[field]}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          disabled={!isEditable}
        />
      )}
    </div>
  );

  // View mode for non-editable
  if (!isEditable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            بورتفوليو الشركة
          </CardTitle>
          <CardDescription>نبذة عن الشركة ورؤيتها وسياستها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {formData.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="w-4 h-4" />
                نبذة عن الشركة
              </div>
              <p className="text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                {formData.description}
              </p>
            </div>
          )}

          {/* Vision */}
          {formData.vision && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Target className="w-4 h-4" />
                الرؤية والرسالة
              </div>
              <p className="text-foreground leading-relaxed bg-primary/5 p-4 rounded-lg border border-primary/10">
                {formData.vision}
              </p>
            </div>
          )}

          {/* Policy */}
          {formData.policy && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Shield className="w-4 h-4" />
                السياسة
              </div>
              <div className="text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                {formData.policy}
              </div>
            </div>
          )}

          {/* Field of Work */}
          {formData.field_of_work && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                مجال العمل
              </div>
              <p className="text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                {formData.field_of_work}
              </p>
            </div>
          )}

          {/* Headquarters */}
          {formData.headquarters && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="w-4 h-4" />
                المقر الرئيسي
              </div>
              <p className="text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                {formData.headquarters}
              </p>
            </div>
          )}

          {/* Branches */}
          {formData.branches && formData.branches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <GitBranch className="w-4 h-4" />
                الفروع ({formData.branches.length})
              </div>
              <div className="grid gap-3">
                {formData.branches.map((branch, index) => (
                  <div key={index} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{branch.name || `فرع ${index + 1}`}</Badge>
                      <span className="text-sm text-muted-foreground">{branch.city}</span>
                    </div>
                    <p className="text-sm">{branch.address}</p>
                    {branch.phone && (
                      <p className="text-sm text-muted-foreground mt-1" dir="ltr">{branch.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!formData.description && !formData.vision && !formData.policy && !formData.field_of_work && !formData.headquarters && (!formData.branches || formData.branches.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إضافة معلومات البورتفوليو بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          بورتفوليو الشركة
        </CardTitle>
        <CardDescription>
          أضف معلومات عن شركتك ليراها الشركاء. يمكنك استخدام الذكاء الاصطناعي لتوليد المحتوى تلقائياً.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderField(
          'description',
          'نبذة عن الشركة',
          <FileText className="w-4 h-4" />,
          'اكتب نبذة مختصرة عن شركتك وتاريخها وإنجازاتها...'
        )}

        <Separator />

        {renderField(
          'vision',
          'الرؤية والرسالة',
          <Target className="w-4 h-4" />,
          'اكتب رؤية ورسالة شركتك...'
        )}

        <Separator />

        {renderField(
          'policy',
          'السياسة',
          <Shield className="w-4 h-4" />,
          'اكتب سياسة العمل والمبادئ التي تلتزم بها شركتك...'
        )}

        <Separator />

        {renderField(
          'field_of_work',
          'مجال العمل',
          <Briefcase className="w-4 h-4" />,
          'صف مجال عمل شركتك بالتفصيل...'
        )}

        <Separator />

        {renderField(
          'headquarters',
          'المقر الرئيسي',
          <MapPin className="w-4 h-4" />,
          'صف موقع ومميزات المقر الرئيسي...'
        )}

        <Separator />

        {/* Branches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <GitBranch className="w-4 h-4" />
              الفروع
            </Label>
            <Button variant="outline" size="sm" onClick={addBranch} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة فرع
            </Button>
          </div>

          {formData.branches.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد فروع مضافة</p>
              <Button variant="ghost" size="sm" onClick={addBranch} className="mt-2">
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول فرع
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.branches.map((branch, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 text-destructive hover:text-destructive"
                    onClick={() => removeBranch(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الفرع</Label>
                      <Input
                        value={branch.name}
                        onChange={(e) => updateBranch(index, 'name', e.target.value)}
                        placeholder="مثال: الفرع الرئيسي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Input
                        value={branch.city}
                        onChange={(e) => updateBranch(index, 'city', e.target.value)}
                        placeholder="مثال: القاهرة"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان</Label>
                      <Input
                        value={branch.address}
                        onChange={(e) => updateBranch(index, 'address', e.target.value)}
                        placeholder="العنوان التفصيلي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف (اختياري)</Label>
                      <Input
                        value={branch.phone || ''}
                        onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                        placeholder="01xxxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ البورتفوليو
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationPortfolio;
