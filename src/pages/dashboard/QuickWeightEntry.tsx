import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Scale, Camera, Upload, Loader2, Check, Search, Plus,
  User, Package, Calendar, Zap, ArrowLeft, ImageIcon,
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';

interface PartnerOption {
  id: string;
  name: string;
  type: 'organization' | 'external';
  phone?: string;
}

const wasteTypes = [
  'ورق وكرتون', 'بلاستيك', 'حديد وصلب', 'ألومنيوم', 'نحاس',
  'زجاج', 'خشب', 'مخلفات عضوية', 'مخلفات إلكترونية', 'مخلفات طبية',
  'مخلفات بناء', 'إطارات', 'زيوت مستعملة', 'مخلفات نسيج', 'أخرى',
];

export default function QuickWeightEntry() {
  const navigate = useNavigate();
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading: aiLoading, extractWeightData } = useAIAssistant();

  // Form state
  const [selectedPartner, setSelectedPartner] = useState<PartnerOption | null>(null);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerResults, setPartnerResults] = useState<PartnerOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [wasteType, setWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('طن');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiExtracted, setAiExtracted] = useState(false);

  const totalAmount = (Number(quantity) || 0) * (Number(pricePerUnit) || 0);

  // Search partners
  const searchPartners = useCallback(async (query: string) => {
    if (!organization?.id || query.length < 2) {
      setPartnerResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Search both organizations and external partners in parallel
      const [orgRes, extRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, phone')
          .neq('id', organization.id)
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('external_partners')
          .select('id, name, phone')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      const results: PartnerOption[] = [
        ...(orgRes.data || []).map(o => ({ id: o.id, name: o.name, type: 'organization' as const, phone: o.phone })),
        ...(extRes.data || []).map(e => ({ id: e.id, name: e.name, type: 'external' as const, phone: e.phone })),
      ];
      setPartnerResults(results);
      setShowResults(true);
    } catch {
      setPartnerResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [organization?.id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (partnerSearch.length >= 2) searchPartners(partnerSearch);
      else { setPartnerResults([]); setShowResults(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [partnerSearch, searchPartners]);

  // AI Image extraction
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);

      const data = await extractWeightData(base64);
      if (data) {
        // Auto-fill from AI
        if (data.net_weight) setQuantity(data.net_weight);
        if (data.material_type) {
          const match = wasteTypes.find(wt =>
            wt.includes(data.material_type!) || data.material_type!.includes(wt)
          );
          if (match) setWasteType(match);
        }
        if (data.unit) {
          if (data.unit.includes('طن')) setUnit('طن');
          else if (data.unit.includes('كجم') || data.unit.toLowerCase().includes('kg')) setUnit('كجم');
        }
        if (data.date) setEntryDate(data.date);
        setAiExtracted(true);
        toast.success('تم استخراج البيانات من الصورة بنجاح ✨');
      } else {
        toast.error('لم نتمكن من استخراج البيانات، يرجى الإدخال يدوياً');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('لم يتم تحديد المنظمة');
      if (!selectedPartner) throw new Error('يرجى اختيار العميل');
      if (!wasteType) throw new Error('يرجى تحديد نوع الصنف');
      if (!quantity || Number(quantity) <= 0) throw new Error('يرجى إدخال الكمية');
      if (!pricePerUnit || Number(pricePerUnit) <= 0) throw new Error('يرجى إدخال السعر');

      const description = `وزنة سريعة - ${wasteType} | ${quantity} ${unit} × ${pricePerUnit} ج.م`;

      const entry: Record<string, any> = {
        organization_id: organization.id,
        entry_type: 'credit',
        entry_category: 'weight_entry',
        amount: totalAmount,
        description,
        entry_date: entryDate,
        created_by: profile?.id,
        reference_number: `QW-${Date.now().toString(36).toUpperCase()}`,
      };

      if (selectedPartner.type === 'external') {
        entry.external_partner_id = selectedPartner.id;
      } else {
        entry.partner_organization_id = selectedPartner.id;
      }

      const { error } = await supabase
        .from('accounting_ledger')
        .insert([entry as any]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تسجيل الوزنة بنجاح ✅', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['partner-weight-entries'] });
      queryClient.invalidateQueries({ queryKey: ['partner-ledger-entries'] });
      // Reset for next entry
      setSelectedPartner(null);
      setPartnerSearch('');
      setWasteType('');
      setQuantity('');
      setPricePerUnit('');
      setNotes('');
      setImagePreview(null);
      setAiExtracted(false);
      setEntryDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const canSubmit = selectedPartner && wasteType && quantity && pricePerUnit && Number(quantity) > 0 && Number(pricePerUnit) > 0;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">وزنة سريعة</h1>
              <p className="text-sm text-muted-foreground">سجّل وزنة في ثوانٍ</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Form Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-5 space-y-5">

            {/* 1. Customer Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                العميل *
              </Label>
              {selectedPartner ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedPartner.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedPartner.type === 'external' ? 'خارجي' : 'مسجل'})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedPartner(null); setPartnerSearch(''); }}
                    className="text-xs"
                  >
                    تغيير
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث باسم العميل..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  {searchLoading && (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <AnimatePresence>
                    {showResults && partnerResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
                      >
                        {partnerResults.map(p => (
                          <button
                            key={p.id}
                            className="w-full text-right p-3 hover:bg-accent transition-colors flex items-center gap-2"
                            onClick={() => {
                              setSelectedPartner(p);
                              setPartnerSearch('');
                              setShowResults(false);
                            }}
                          >
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <span className="font-medium">{p.name}</span>
                              {p.phone && <span className="text-xs text-muted-foreground mr-2">{p.phone}</span>}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showResults && partnerResults.length === 0 && partnerSearch.length >= 2 && !searchLoading && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg p-3 text-center text-sm text-muted-foreground">
                      لا توجد نتائج
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Waste Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Package className="h-4 w-4 text-primary" />
                نوع الصنف *
              </Label>
              <Select value={wasteType} onValueChange={setWasteType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الصنف" />
                </SelectTrigger>
                <SelectContent>
                  {wasteTypes.map(wt => (
                    <SelectItem key={wt} value={wt}>{wt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. AI Image Upload (Optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Camera className="h-4 w-4 text-primary" />
                صورة الميزان (اختياري - استخراج تلقائي)
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Scale" className="max-h-32 mx-auto rounded-lg" />
                    {aiLoading && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري تحليل الصورة...
                      </div>
                    )}
                    {aiExtracted && (
                      <div className="flex items-center justify-center gap-1 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        تم استخراج البيانات
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">اضغط لرفع صورة تذكرة الميزان</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Quantity & Unit + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">الكمية (الوزن) *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="طن">طن</SelectItem>
                      <SelectItem value="كجم">كجم</SelectItem>
                      <SelectItem value="قطعة">قطعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">سعر الوحدة (ج.م) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>
            </div>

            {/* Total */}
            {totalAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center"
              >
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <p className="text-3xl font-bold text-primary mt-1">
                  {new Intl.NumberFormat('en-US').format(totalAmount)}
                  <span className="text-sm font-normal mr-1">ج.م</span>
                </p>
              </motion.div>
            )}

            {/* 5. Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-primary" />
                التاريخ
              </Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>

            {/* 6. Notes */}
            <div className="space-y-2">
              <Label className="text-sm">ملاحظات (اختياري)</Label>
              <Textarea
                placeholder="ملاحظات..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="w-full h-14 text-lg gap-3 font-bold"
              size="lg"
            >
              {mutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Scale className="h-5 w-5" />
              )}
              تسجيل الوزنة
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
