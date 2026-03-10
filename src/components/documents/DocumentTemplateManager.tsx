import { useState } from 'react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useOrgStructure } from '@/hooks/useOrgStructure';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Users,
  CheckCircle2,
  Clock,
  ArrowDownUp,
  Layers,
  Building2,
  Truck,
  Recycle,
  UserCheck,
  Loader2,
  Power,
  Zap,
} from 'lucide-react';

interface NewSignatory {
  role_title: string;
  signatory_type: 'internal' | 'external';
  party_type?: string;
  is_required: boolean;
  sign_order: number;
}

const partyTypes = [
  { value: 'generator_staff', label: 'موظف المولّد', icon: Building2 },
  { value: 'driver', label: 'السائق', icon: Truck },
  { value: 'transporter', label: 'ممثل الناقل', icon: Truck },
  { value: 'recycler', label: 'ممثل المدوّر', icon: Recycle },
  { value: 'external', label: 'طرف خارجي', icon: UserCheck },
];

const DocumentTemplateManager = () => {
  const { templates, isLoading, createTemplate, deleteTemplate, toggleTemplate } = useDocumentTemplates();
  const { positions } = useOrgStructure();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);
  const [autoAttach, setAutoAttach] = useState(false);
  const [signatories, setSignatories] = useState<NewSignatory[]>([]);

  const addSignatory = () => {
    setSignatories(prev => [
      ...prev,
      {
        role_title: '',
        signatory_type: 'internal',
        party_type: 'generator_staff',
        is_required: true,
        sign_order: prev.length,
      },
    ]);
  };

  const removeSignatory = (index: number) => {
    setSignatories(prev => prev.filter((_, i) => i !== index));
  };

  const updateSignatory = (index: number, updates: Partial<NewSignatory>) => {
    setSignatories(prev =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const handleCreate = () => {
    if (!newName.trim() || signatories.length === 0) return;
    createTemplate.mutate(
      {
        name: newName,
        description: newDescription,
        is_sequential: isSequential,
        is_mandatory: isMandatory,
        auto_attach: autoAttach,
        signatories: signatories.filter(s => s.role_title.trim()),
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setIsSequential(false);
    setIsMandatory(false);
    setAutoAttach(false);
    setSignatories([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            قوالب مستندات التوقيع المتعدد
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ قوالب مستندات تتطلب توقيعات من عدة مسؤولين قبل خروج الشحنة
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء قالب جديد
        </Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا توجد قوالب بعد</h3>
            <p className="text-sm text-muted-foreground mb-4">
              أنشئ قالب مستند يتطلب توقيعات من مسؤولين محددين
            </p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              إنشاء أول قالب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      {template.is_mandatory && (
                        <Badge variant="destructive" className="text-[10px]">إلزامي</Badge>
                      )}
                      {template.is_sequential && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <ArrowDownUp className="w-3 h-3" />
                          تسلسلي
                        </Badge>
                      )}
                      {template.auto_attach && (
                        <Badge className="bg-primary/10 text-primary text-[10px] gap-1">
                          <Zap className="w-3 h-3" />
                          تلقائي
                        </Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="outline" className="text-[10px]">معطّل</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => toggleTemplate.mutate({ id: template.id, is_active: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => deleteTemplate.mutate(template.id)}
                    >
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    الموقّعون ({(template.signatories || []).length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(template.signatories || []).map((sig, i) => {
                    const party = partyTypes.find(p => p.value === sig.party_type);
                    const Icon = party?.icon || UserCheck;
                    return (
                      <Badge
                        key={sig.id}
                        variant="outline"
                        className="gap-1 py-1"
                      >
                        {template.is_sequential && (
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                        )}
                        <Icon className="w-3 h-3" />
                        {sig.role_title}
                        {!sig.is_required && (
                          <span className="text-[9px] text-muted-foreground">(اختياري)</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              إنشاء قالب مستند جديد
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم القالب *</Label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="مثال: إذن خروج شحنة"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="وصف مختصر للقالب والغرض منه..."
                    dir="rtl"
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">إعدادات القالب</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">تسلسلي</p>
                      <p className="text-[11px] text-muted-foreground">التوقيعات بالترتيب</p>
                    </div>
                    <Switch checked={isSequential} onCheckedChange={setIsSequential} />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">إلزامي</p>
                      <p className="text-[11px] text-muted-foreground">يمنع تقدم الشحنة</p>
                    </div>
                    <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">إرفاق تلقائي</p>
                      <p className="text-[11px] text-muted-foreground">مع كل شحنة جديدة</p>
                    </div>
                    <Switch checked={autoAttach} onCheckedChange={setAutoAttach} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signatories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    الموقّعون المطلوبون
                  </h3>
                  <Button variant="outline" size="sm" onClick={addSignatory} className="gap-1">
                    <Plus className="w-3 h-3" />
                    إضافة موقّع
                  </Button>
                </div>

                {signatories.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                    أضف الموقّعين المطلوبين لهذا المستند
                  </div>
                ) : (
                  <div className="space-y-3">
                    {signatories.map((sig, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 rounded-lg border bg-muted/20">
                        {isSequential && (
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-1">
                            {index + 1}
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            value={sig.role_title}
                            onChange={e => updateSignatory(index, { role_title: e.target.value })}
                            placeholder="المسمى الوظيفي (مثل: مدير المخازن)"
                            dir="rtl"
                            className="text-sm"
                          />
                          <Select
                            value={sig.party_type || 'generator_staff'}
                            onValueChange={v => updateSignatory(index, {
                              party_type: v,
                              signatory_type: v === 'generator_staff' ? 'internal' : 'external',
                            })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {partyTypes.map(p => (
                                <SelectItem key={p.value} value={p.value}>
                                  <div className="flex items-center gap-2">
                                    <p.icon className="w-3 h-3" />
                                    {p.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={sig.is_required}
                              onCheckedChange={v => updateSignatory(index, { is_required: v })}
                            />
                            <span className="text-xs">{sig.is_required ? 'إلزامي' : 'اختياري'}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive mr-auto"
                              onClick={() => removeSignatory(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || signatories.length === 0 || createTemplate.isPending}
              className="gap-2"
            >
              {createTemplate.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء القالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentTemplateManager;
