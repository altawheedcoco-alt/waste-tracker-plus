import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CreateTemplateInput, useReportTemplates } from '@/hooks/useReportTemplates';
import { toast } from 'sonner';
import { Loader2, Plus, FileText, X } from 'lucide-react';
import { wasteTypeLabels, wasteCategoryLabels } from '@/lib/wasteClassification';


interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CreateTemplateDialog = ({ isOpen, onClose, onCreated }: CreateTemplateDialogProps) => {
  const { createTemplate } = useReportTemplates();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: '',
    description: '',
    waste_category: 'all',
    waste_types: [],
    opening_declaration: '',
    processing_details_template: '',
    closing_declaration: '',
    include_qr_code: true,
    include_barcode: true,
    include_stamp: true,
    include_signature: true,
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTemplate(formData);
      if (result) {
        onCreated?.();
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          waste_category: 'all',
          waste_types: [],
          opening_declaration: '',
          processing_details_template: '',
          closing_declaration: '',
          include_qr_code: true,
          include_barcode: true,
          include_stamp: true,
          include_signature: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWasteType = (type: string) => {
    const current = formData.waste_types || [];
    if (current.includes(type)) {
      setFormData({ ...formData, waste_types: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, waste_types: [...current, type] });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إنشاء قالب تقرير جديد
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-1">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم القالب *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: تقرير البلاستيك المعاد تدويره"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>وصف القالب</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للقالب..."
                  dir="rtl"
                />
              </div>
            </div>

            {/* Waste Category */}
            <div className="space-y-2">
              <Label>تصنيف المخلفات</Label>
              <Select
                value={formData.waste_category}
                onValueChange={(value: any) => setFormData({ ...formData, waste_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(wasteCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Waste Types */}
            <div className="space-y-2">
              <Label>أنواع المخلفات المحددة (اختياري)</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(wasteTypeLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={formData.waste_types?.includes(key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleWasteType(key)}
                  >
                    {label}
                    {formData.waste_types?.includes(key) && (
                      <X className="w-3 h-3 mr-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                اختر أنواع المخلفات المحددة التي يطبق عليها هذا القالب، أو اتركها فارغة ليطبق على التصنيف المحدد
              </p>
            </div>

            {/* Declarations */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الإقرار الافتتاحي</Label>
                <Textarea
                  value={formData.opening_declaration || ''}
                  onChange={(e) => setFormData({ ...formData, opening_declaration: e.target.value })}
                  placeholder="نص الإقرار الذي يظهر في بداية التقرير..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>قالب تفاصيل المعالجة</Label>
                <Textarea
                  value={formData.processing_details_template || ''}
                  onChange={(e) => setFormData({ ...formData, processing_details_template: e.target.value })}
                  placeholder="وصف افتراضي لعملية المعالجة والتدوير..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>الإقرار الختامي</Label>
                <Textarea
                  value={formData.closing_declaration || ''}
                  onChange={(e) => setFormData({ ...formData, closing_declaration: e.target.value })}
                  placeholder="نص الإقرار الذي يظهر في نهاية التقرير..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium">إعدادات التقرير</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>رمز QR</Label>
                  <Switch
                    checked={formData.include_qr_code}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_qr_code: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>الباركود</Label>
                  <Switch
                    checked={formData.include_barcode}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_barcode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>الختم</Label>
                  <Switch
                    checked={formData.include_stamp}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_stamp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>التوقيع</Label>
                  <Switch
                    checked={formData.include_signature}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_signature: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            إنشاء القالب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateDialog;