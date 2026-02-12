import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Layout, Type, Table2, AlignCenter, AlignLeft, Columns2, Grid3X3 } from 'lucide-react';
import { LAYOUT_TEMPLATES, type LayoutTemplateId, type LayoutTemplate } from '@/lib/layoutTemplates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface LayoutTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateId: LayoutTemplateId) => void;
  selectedTemplate?: LayoutTemplateId;
  onSetDefault?: (templateId: LayoutTemplateId) => void;
}

const headerIcons: Record<string, React.ElementType> = {
  'centered': AlignCenter,
  'left-right': AlignLeft,
  'split-banner': Columns2,
  'minimal-top': Layout,
};

const LayoutCard = ({ template, isSelected, onClick }: { 
  template: LayoutTemplate; isSelected: boolean; onClick: () => void 
}) => {
  const HeaderIcon = headerIcons[template.headerLayout] || Layout;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative text-right rounded-xl border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Layout preview */}
      <div className="p-3 bg-muted/30">
        <div className="bg-background rounded-lg border p-2 space-y-1.5" style={{ minHeight: '80px' }}>
          {/* Header preview */}
          <div className={`flex items-center gap-1 p-1 rounded bg-primary/10 ${
            template.headerLayout === 'centered' ? 'justify-center' : 'justify-between'
          }`}>
            <div className="h-1.5 w-8 rounded bg-primary/40" />
            {template.headerLayout === 'left-right' && <div className="h-1.5 w-6 rounded bg-primary/30" />}
          </div>
          
          {/* Body preview */}
          <div className={`flex gap-1 ${template.bodyLayout === 'two-column' || template.bodyLayout === 'grid' ? '' : 'flex-col'}`}>
            {template.bodyLayout === 'two-column' ? (
              <>
                <div className="flex-1 space-y-0.5">
                  <div className="h-1 w-full rounded bg-muted-foreground/20" />
                  <div className="h-1 w-3/4 rounded bg-muted-foreground/15" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="h-1 w-full rounded bg-muted-foreground/20" />
                  <div className="h-1 w-2/3 rounded bg-muted-foreground/15" />
                </div>
              </>
            ) : template.bodyLayout === 'grid' ? (
              <div className="grid grid-cols-3 gap-0.5 w-full">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-3 rounded bg-muted-foreground/10" />
                ))}
              </div>
            ) : (
              <>
                <div className="h-1 w-full rounded bg-muted-foreground/20" />
                <div className="h-1 w-5/6 rounded bg-muted-foreground/15" />
                <div className="h-1 w-full rounded bg-muted-foreground/10" />
              </>
            )}
          </div>

          {/* Table preview */}
          <div className={`rounded overflow-hidden border ${
            template.tableStyle === 'modern-rounded' ? 'rounded-lg' : 
            template.tableStyle === 'minimal' ? 'border-0 border-b' : ''
          }`}>
            <div className="h-2 bg-primary/15" />
            <div className="h-1.5 bg-muted-foreground/5" />
            <div className="h-1.5 bg-muted-foreground/10" />
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-t bg-background">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{template.preview}</span>
          <p className="text-xs font-bold text-foreground">{template.name}</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{template.description}</p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          <Badge variant="outline" className="text-[8px] px-1 py-0">
            <HeaderIcon className="w-2.5 h-2.5 ml-0.5" />
            {template.headerLayout === 'centered' ? 'وسطي' : 
             template.headerLayout === 'left-right' ? 'جانبي' :
             template.headerLayout === 'split-banner' ? 'شريطي' : 'مصغر'}
          </Badge>
          <Badge variant="outline" className="text-[8px] px-1 py-0">
            {template.spacing === 'tight' ? 'مضغوط' : template.spacing === 'spacious' ? 'واسع' : 'عادي'}
          </Badge>
        </div>
      </div>
    </motion.button>
  );
};

const LayoutTemplateSelector = ({ open, onOpenChange, onSelect, selectedTemplate = 'standard', onSetDefault }: LayoutTemplateSelectorProps) => {
  const [selected, setSelected] = useState<LayoutTemplateId>(selectedTemplate);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleConfirm = () => {
    onSelect(selected);
    if (setAsDefault && onSetDefault) {
      onSetDefault(selected);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layout className="w-5 h-5 text-primary" />
            اختر تخطيط المستند
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            اختر أحد التخطيطات ({LAYOUT_TEMPLATES.length} نموذج) لتنظيم محتوى المستند
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {LAYOUT_TEMPLATES.map((template) => (
            <LayoutCard
              key={template.id}
              template={template}
              isSelected={selected === template.id}
              onClick={() => setSelected(template.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {LAYOUT_TEMPLATES.find(t => t.id === selected)?.preview} {LAYOUT_TEMPLATES.find(t => t.id === selected)?.name}
            </Badge>
            {onSetDefault && (
              <div className="flex items-center gap-2">
                <Switch id="set-default" checked={setAsDefault} onCheckedChange={setSetAsDefault} />
                <Label htmlFor="set-default" className="text-xs cursor-pointer">تعيين كافتراضي</Label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={handleConfirm}>
              <Layout className="w-4 h-4 ml-1" />
              تطبيق التخطيط
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayoutTemplateSelector;
