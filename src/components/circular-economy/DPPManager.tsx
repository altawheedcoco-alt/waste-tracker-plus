import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileCheck, Plus, QrCode, Leaf, Recycle, ShieldCheck,
  Eye, Calendar, BarChart3, ArrowRight, Globe
} from 'lucide-react';

const productCategories = [
  { value: 'recycled_plastic', label: 'بلاستيك مُعاد تدويره' },
  { value: 'recycled_metal', label: 'معادن مُعاد تدويرها' },
  { value: 'recycled_paper', label: 'ورق مُعاد تدويره' },
  { value: 'recycled_glass', label: 'زجاج مُعاد تدويره' },
  { value: 'compost', label: 'سماد عضوي' },
  { value: 'rdf', label: 'وقود بديل RDF' },
  { value: 'recycled_textile', label: 'منسوجات مُعاد تدويرها' },
  { value: 'other', label: 'أخرى' },
];

const qualityGrades = [
  { value: 'premium', label: 'ممتاز Premium' },
  { value: 'standard', label: 'قياسي Standard' },
  { value: 'economy', label: 'اقتصادي Economy' },
];

const DPPManager = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDPP, setSelectedDPP] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: passports, isLoading } = useQuery({
    queryKey: ['dpp-passports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_passports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userData.user?.id || '')
        .eq('is_active', true)
        .single();

      if (!userOrg) throw new Error('لم يتم العثور على المنظمة');

      const passportNumber = `DPP-${Date.now().toString(36).toUpperCase()}`;
      const qrHash = btoa(`${passportNumber}-${Date.now()}`).slice(0, 32);

      const { data, error } = await supabase
        .from('digital_product_passports')
        .insert({
          ...formData,
          passport_number: passportNumber,
          organization_id: userOrg.organization_id,
          qr_code_hash: qrHash,
          verification_url: `${window.location.origin}/verify?type=dpp&code=${qrHash}`,
          created_by: userData.user?.id,
          recycled_content_percent: Number(formData.recycled_content_percent) || 0,
          virgin_content_percent: 100 - (Number(formData.recycled_content_percent) || 0),
          mci_score: (Number(formData.recycled_content_percent) || 0) / 100,
          recyclability_score: Number(formData.recyclability_score) || 75,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial lifecycle event
      await supabase.from('dpp_lifecycle_events').insert({
        passport_id: data.id,
        event_type: 'created',
        event_date: new Date().toISOString(),
        actor_organization_id: userOrg.organization_id,
        details: { action: 'تم إنشاء جواز المنتج الرقمي' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dpp-passports'] });
      setShowCreate(false);
      toast.success('تم إنشاء جواز المنتج الرقمي بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      product_name: fd.get('product_name'),
      product_name_en: fd.get('product_name_en'),
      product_category: fd.get('product_category'),
      product_description: fd.get('product_description'),
      batch_number: fd.get('batch_number'),
      source_waste_type: fd.get('source_waste_type'),
      quality_grade: fd.get('quality_grade'),
      recycled_content_percent: fd.get('recycled_content_percent'),
      recyclability_score: fd.get('recyclability_score'),
      status: 'active',
    });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    expired: 'bg-amber-500/10 text-amber-600',
    revoked: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            جواز المنتج الرقمي (DPP)
          </h2>
          <p className="text-xs text-muted-foreground">Digital Product Passport - متوافق مع تشريعات الاتحاد الأوروبي</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              إنشاء جواز جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء جواز منتج رقمي جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>اسم المنتج</Label>
                  <Input name="product_name" required placeholder="بلاستيك PET مُعاد" />
                </div>
                <div>
                  <Label>Product Name (EN)</Label>
                  <Input name="product_name_en" placeholder="Recycled PET" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>فئة المنتج</Label>
                  <Select name="product_category" required>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      {productCategories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع المخلف المصدري</Label>
                  <Input name="source_waste_type" required placeholder="PET bottles" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>رقم الدُفعة</Label>
                  <Input name="batch_number" placeholder="B-2026-001" />
                </div>
                <div>
                  <Label>درجة الجودة</Label>
                  <Select name="quality_grade">
                    <SelectTrigger><SelectValue placeholder="الجودة" /></SelectTrigger>
                    <SelectContent>
                      {qualityGrades.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>محتوى مُعاد %</Label>
                  <Input name="recycled_content_percent" type="number" min="0" max="100" defaultValue="80" />
                </div>
              </div>
              <div>
                <Label>قابلية إعادة التدوير %</Label>
                <Input name="recyclability_score" type="number" min="0" max="100" defaultValue="75" />
              </div>
              <div>
                <Label>وصف المنتج</Label>
                <Textarea name="product_description" placeholder="وصف تفصيلي للمنتج ومواصفاته..." rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الجواز'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FileCheck, label: 'إجمالي الجوازات', value: passports?.length || 0, color: 'text-blue-500' },
          { icon: ShieldCheck, label: 'نشطة', value: passports?.filter(p => p.status === 'active').length || 0, color: 'text-emerald-500' },
          { icon: Leaf, label: 'متوسط المحتوى المُعاد', value: `${Math.round((passports?.reduce((s, p) => s + Number(p.recycled_content_percent || 0), 0) || 0) / Math.max(passports?.length || 1, 1))}%`, color: 'text-green-500' },
          { icon: Globe, label: 'متوافق EU DPP', value: passports?.filter(p => p.eu_dpp_compliant).length || 0, color: 'text-purple-500' },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Passports List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : !passports?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Recycle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد جوازات منتجات بعد</p>
            <p className="text-xs">أنشئ أول جواز منتج رقمي لتتبع دورة حياة المواد المُعاد تدويرها</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {passports.map((p) => (
            <Card key={p.id} className="hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => setSelectedDPP(p)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm">{p.product_name}</h3>
                    <p className="text-[10px] text-muted-foreground">{p.product_name_en} • {p.passport_number}</p>
                  </div>
                  <Badge className={statusColors[p.status || 'draft'] || ''} variant="outline">
                    {p.status === 'active' ? 'نشط' : p.status === 'draft' ? 'مسودة' : p.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 rounded-lg bg-emerald-500/5">
                    <p className="text-lg font-bold text-emerald-600">{Number(p.recycled_content_percent || 0)}%</p>
                    <p className="text-[9px] text-muted-foreground">محتوى مُعاد</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/5">
                    <p className="text-lg font-bold text-blue-600">{Math.round(Number(p.mci_score || 0) * 100)}%</p>
                    <p className="text-[9px] text-muted-foreground">MCI</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-500/5">
                    <p className="text-lg font-bold text-purple-600">{Number(p.recyclability_score || 0)}%</p>
                    <p className="text-[9px] text-muted-foreground">قابلية التدوير</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(p.production_date).toLocaleDateString('ar-EG')}
                  <span>•</span>
                  <span>{p.quality_grade === 'premium' ? 'ممتاز' : p.quality_grade === 'standard' ? 'قياسي' : 'اقتصادي'}</span>
                  {p.batch_number && <><span>•</span><span>دُفعة: {p.batch_number}</span></>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DPP Detail Dialog */}
      <Dialog open={!!selectedDPP} onOpenChange={() => setSelectedDPP(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          {selectedDPP && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  {selectedDPP.product_name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                <QRCodeSVG
                  value={selectedDPP.verification_url || `DPP:${selectedDPP.passport_number}`}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="text-center">
                <p className="text-xs font-mono text-muted-foreground">{selectedDPP.passport_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">فئة المنتج</p>
                  <p className="font-medium">{productCategories.find(c => c.value === selectedDPP.product_category)?.label || selectedDPP.product_category}</p>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">المخلف المصدري</p>
                  <p className="font-medium">{selectedDPP.source_waste_type}</p>
                </div>
                <div className="p-2 rounded bg-emerald-500/5">
                  <p className="text-[10px] text-muted-foreground">محتوى مُعاد تدويره</p>
                  <p className="font-bold text-emerald-600">{Number(selectedDPP.recycled_content_percent)}%</p>
                </div>
                <div className="p-2 rounded bg-blue-500/5">
                  <p className="text-[10px] text-muted-foreground">مؤشر الدائرية MCI</p>
                  <p className="font-bold text-blue-600">{Math.round(Number(selectedDPP.mci_score || 0) * 100)}%</p>
                </div>
              </div>

              {selectedDPP.product_description && (
                <div className="p-2 rounded bg-muted/30 text-xs">
                  <p className="text-[10px] text-muted-foreground mb-1">الوصف</p>
                  {selectedDPP.product_description}
                </div>
              )}

              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div className="text-xs">
                  <p className="font-medium">سلسلة الحيازة مُوثقة</p>
                  <p className="text-muted-foreground">يمكن التحقق عبر مسح رمز QR</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DPPManager;
