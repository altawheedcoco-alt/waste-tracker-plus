import { useState, useCallback, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Scale, Camera, Upload, Loader2, Check, Search, Plus, Trash2,
  Package, Calendar, Zap, Eye, EyeOff, FileText, TrendingUp,
  Building2, Truck, Recycle, User, DollarSign, Filter,
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomWasteTypes } from '@/hooks/useCustomWasteTypes';

interface PartnerOption {
  id: string;
  name: string;
  type: 'organization' | 'external';
  orgType?: string;
  phone?: string;
  address?: string;
  commercial_register?: string;
  environmental_license?: string;
}

interface WeightEntry {
  id: string;
  ticket_number: string;
  waste_type: string;
  waste_description: string;
  first_weight: string;
  first_weight_date: string;
  second_weight: string;
  second_weight_date: string;
  net_weight: string;
  unit: string;
  price_per_unit: string;
  tax_rate: string;
  paid_amount: string;
  notes: string;
  entry_date: string;
  imagePreview: string | null;
  aiExtracted: boolean;
  visible_to_transporter: boolean;
  visible_to_recycler: boolean;
  visible_to_driver: boolean;
  show_financial_data: boolean;
}

const wasteTypes = [
  'ورق وكرتون', 'بلاستيك', 'حديد وصلب', 'ألومنيوم', 'نحاس',
  'زجاج', 'خشب', 'مخلفات عضوية', 'مخلفات إلكترونية', 'مخلفات طبية',
  'مخلفات بناء', 'إطارات', 'زيوت مستعملة', 'مخلفات نسيج', 'أخرى',
];

const createEmptyEntry = (): WeightEntry => ({
  id: crypto.randomUUID(),
  ticket_number: '',
  waste_type: '',
  waste_description: '',
  first_weight: '',
  first_weight_date: new Date().toISOString().slice(0, 16),
  second_weight: '',
  second_weight_date: new Date().toISOString().slice(0, 16),
  net_weight: '',
  unit: 'طن',
  price_per_unit: '',
  tax_rate: '0',
  paid_amount: '0',
  notes: '',
  entry_date: new Date().toISOString().split('T')[0],
  imagePreview: null,
  aiExtracted: false,
  visible_to_transporter: true,
  visible_to_recycler: true,
  visible_to_driver: false,
  show_financial_data: false,
});

export default function BulkWeightEntries() {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const { isLoading: aiLoading, extractWeightData } = useAIAssistant();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { customWasteTypes, addCustomWasteType } = useCustomWasteTypes();
  const [newCustomType, setNewCustomType] = useState('');

  // Selected partners
  const [selectedTransporter, setSelectedTransporter] = useState<PartnerOption | null>(null);
  const [selectedRecycler, setSelectedRecycler] = useState<PartnerOption | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<{ id: string; name: string } | null>(null);

  // Partner search
  const [transporterSearch, setTransporterSearch] = useState('');
  const [recyclerSearch, setRecyclerSearch] = useState('');
  const [transporterResults, setTransporterResults] = useState<PartnerOption[]>([]);
  const [recyclerResults, setRecyclerResults] = useState<PartnerOption[]>([]);
  const [showTransporterResults, setShowTransporterResults] = useState(false);
  const [showRecyclerResults, setShowRecyclerResults] = useState(false);

  // Weight entries
  const [entries, setEntries] = useState<WeightEntry[]>([createEmptyEntry()]);
  const [activeEntryId, setActiveEntryId] = useState(entries[0].id);
  const [activeTab, setActiveTab] = useState('entries');

  // Accounts filter
  const [accountDateFrom, setAccountDateFrom] = useState('');
  const [accountDateTo, setAccountDateTo] = useState('');
  const [accountPartnerId, setAccountPartnerId] = useState<string>('all');

  const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;

  // Search partners
  const searchPartners = useCallback(async (query: string, role: 'transporter' | 'recycler') => {
    if (!organization?.id || query.length < 2) return;
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, phone, address, commercial_register, environmental_license, organization_type')
        .neq('id', organization.id)
        .ilike('name', `%${query}%`)
        .limit(8);

      const results: PartnerOption[] = (data || []).map(o => ({
        id: o.id,
        name: o.name,
        type: 'organization' as const,
        orgType: o.organization_type || undefined,
        phone: o.phone || undefined,
        address: o.address || undefined,
        commercial_register: o.commercial_register || undefined,
        environmental_license: o.environmental_license || undefined,
      }));

      if (role === 'transporter') {
        setTransporterResults(results);
        setShowTransporterResults(true);
      } else {
        setRecyclerResults(results);
        setShowRecyclerResults(true);
      }
    } catch { /* ignore */ }
  }, [organization?.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (transporterSearch.length >= 2) searchPartners(transporterSearch, 'transporter');
      else { setTransporterResults([]); setShowTransporterResults(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [transporterSearch, searchPartners]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (recyclerSearch.length >= 2) searchPartners(recyclerSearch, 'recycler');
      else { setRecyclerResults([]); setShowRecyclerResults(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [recyclerSearch, searchPartners]);

  // Fetch existing entries for accounts tab
  const { data: savedEntries = [] } = useQuery({
    queryKey: ['bulk-weight-entries', organization?.id, accountDateFrom, accountDateTo],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase
        .from('bulk_weight_entries')
        .select('*')
        .eq('organization_id', organization.id)
        .order('entry_date', { ascending: false });

      if (accountDateFrom) q = q.gte('entry_date', accountDateFrom);
      if (accountDateTo) q = q.lte('entry_date', accountDateTo);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Update entry helper
  const updateEntry = (id: string, updates: Partial<WeightEntry>) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...updates };
      // Auto-calc net weight
      if (updates.first_weight !== undefined || updates.second_weight !== undefined) {
        const fw = Number(updated.first_weight) || 0;
        const sw = Number(updated.second_weight) || 0;
        if (fw > 0 && sw > 0) {
          updated.net_weight = String(Math.abs(fw - sw));
        }
      }
      return updated;
    }));
  };

  // Upload image to storage and return public URL
  const uploadWeighbridgeImage = async (file: File, entryId: string): Promise<string | null> => {
    if (!organization?.id) return null;
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${organization.id}/weighbridge/${Date.now()}-${entryId.slice(0, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('shipment-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) { console.error('Image upload error:', error); return null; }
      const { data } = await supabase.storage.from('shipment-documents').createSignedUrl(path, 365 * 24 * 3600);
      return data?.signedUrl || null;
    } catch (err) { console.error('Upload failed:', err); return null; }
  };

  // Auto-save a single entry to DB
  const autoSaveEntry = async (entry: WeightEntry, imageUrl: string | null, aiData: any) => {
    if (!organization?.id || !entry.net_weight) return;
    try {
      const row: Record<string, any> = {
        organization_id: organization.id,
        batch_number: batchNumber,
        transporter_id: selectedTransporter?.type === 'organization' ? selectedTransporter.id : null,
        recycler_id: selectedRecycler?.type === 'organization' ? selectedRecycler.id : null,
        driver_id: selectedDriver?.id || null,
        ticket_number: entry.ticket_number || null,
        waste_type: entry.waste_type || 'غير محدد',
        waste_description: entry.waste_description || null,
        first_weight: Number(entry.first_weight) || null,
        first_weight_date: entry.first_weight_date || null,
        second_weight: Number(entry.second_weight) || null,
        second_weight_date: entry.second_weight_date || null,
        net_weight: Number(entry.net_weight),
        unit: entry.unit,
        price_per_unit: Number(entry.price_per_unit) || 0,
        tax_rate: Number(entry.tax_rate) || 0,
        paid_amount: Number(entry.paid_amount) || 0,
        visible_to_transporter: entry.visible_to_transporter,
        visible_to_recycler: entry.visible_to_recycler,
        visible_to_driver: entry.visible_to_driver,
        show_financial_data: entry.show_financial_data,
        ai_extracted: true,
        entry_date: entry.entry_date,
        notes: entry.notes || null,
        created_by: profile?.id,
        weighbridge_image_url: imageUrl,
        ai_extraction_data: aiData ? JSON.parse(JSON.stringify(aiData)) : null,
        status: 'draft',
      };
      const { error } = await supabase.from('bulk_weight_entries').insert([row as any]);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['bulk-weight-entries'] });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // AI extraction
  const handleImageUpload = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      updateEntry(entryId, { imagePreview: base64 });

      // Upload image to storage in parallel with AI extraction
      const [imageUrl, data] = await Promise.all([
        uploadWeighbridgeImage(file, entryId),
        extractWeightData(base64),
      ]);

      if (data) {
        const updates: Partial<WeightEntry> = { aiExtracted: true };
        if (data.net_weight) updates.net_weight = data.net_weight;
        if (data.first_weight) updates.first_weight = data.first_weight;
        if (data.second_weight) updates.second_weight = data.second_weight;
        if (data.first_date) updates.first_weight_date = data.first_date + 'T' + (data.first_time || '00:00');
        if (data.second_date) updates.second_weight_date = data.second_date + 'T' + (data.second_time || '00:00');
        if (data.ticket_number) updates.ticket_number = data.ticket_number;
        if (data.material_type) {
          const match = wasteTypes.find(wt => wt.includes(data.material_type!) || data.material_type!.includes(wt));
          if (match) updates.waste_type = match;
        }
        if (data.unit) {
          if (data.unit.includes('طن')) updates.unit = 'طن';
          else if (data.unit.includes('كجم') || data.unit.toLowerCase().includes('kg')) updates.unit = 'كجم';
        }
        if (data.date) updates.entry_date = data.date;
        updateEntry(entryId, updates);

        // Auto-save to DB with image URL and AI data
        const currentEntry = entries.find(en => en.id === entryId);
        if (currentEntry) {
          const merged = { ...currentEntry, ...updates };
          await autoSaveEntry(merged, imageUrl, data);
          toast.success('تم استخراج البيانات وحفظ الوزنة تلقائياً ✅✨');
        } else {
          toast.success('تم استخراج البيانات من صورة الميزان بنجاح ✨');
        }
      } else {
        // Even if AI fails, save the image reference
        if (imageUrl) {
          const currentEntry = entries.find(en => en.id === entryId);
          if (currentEntry && currentEntry.net_weight) {
            await autoSaveEntry(currentEntry, imageUrl, null);
            toast.info('تم حفظ الصورة. يرجى إكمال البيانات يدوياً');
          } else {
            toast.error('لم نتمكن من استخراج البيانات، يرجى الإدخال يدوياً');
          }
        } else {
          toast.error('لم نتمكن من استخراج البيانات، يرجى الإدخال يدوياً');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Financial calculations
  const calcEntryFinancials = (entry: WeightEntry) => {
    const subtotal = (Number(entry.net_weight) || 0) * (Number(entry.price_per_unit) || 0);
    const taxAmount = subtotal * (Number(entry.tax_rate) || 0) / 100;
    const total = subtotal + taxAmount;
    const paid = Number(entry.paid_amount) || 0;
    const remaining = total - paid;
    return { subtotal, taxAmount, total, paid, remaining };
  };

  const totalFinancials = entries.reduce((acc, entry) => {
    const f = calcEntryFinancials(entry);
    return {
      subtotal: acc.subtotal + f.subtotal,
      tax: acc.tax + f.taxAmount,
      total: acc.total + f.total,
      paid: acc.paid + f.paid,
      remaining: acc.remaining + f.remaining,
      totalWeight: acc.totalWeight + (Number(entry.net_weight) || 0),
    };
  }, { subtotal: 0, tax: 0, total: 0, paid: 0, remaining: 0, totalWeight: 0 });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('لم يتم تحديد المنظمة');
      if (entries.some(e => !e.waste_type || !e.net_weight)) {
        throw new Error('يرجى ملء نوع المخلف والوزن الصافي لجميع الوزنات');
      }

      const rows = entries.map(entry => {
        const f = calcEntryFinancials(entry);
        return {
          organization_id: organization.id,
          batch_number: batchNumber,
          transporter_id: selectedTransporter?.type === 'organization' ? selectedTransporter.id : null,
          recycler_id: selectedRecycler?.type === 'organization' ? selectedRecycler.id : null,
          driver_id: selectedDriver?.id || null,
          ticket_number: entry.ticket_number || null,
          waste_type: entry.waste_type,
          waste_description: entry.waste_description || null,
          first_weight: Number(entry.first_weight) || null,
          first_weight_date: entry.first_weight_date || null,
          second_weight: Number(entry.second_weight) || null,
          second_weight_date: entry.second_weight_date || null,
          net_weight: Number(entry.net_weight),
          unit: entry.unit,
          price_per_unit: Number(entry.price_per_unit) || 0,
          tax_rate: Number(entry.tax_rate) || 0,
          paid_amount: Number(entry.paid_amount) || 0,
          visible_to_transporter: entry.visible_to_transporter,
          visible_to_recycler: entry.visible_to_recycler,
          visible_to_driver: entry.visible_to_driver,
          show_financial_data: entry.show_financial_data,
          ai_extracted: entry.aiExtracted,
          entry_date: entry.entry_date,
          notes: entry.notes || null,
          created_by: profile?.id,
        };
      });

      const { error } = await supabase
        .from('bulk_weight_entries')
        .insert(rows as any);

      if (error) throw error;

      // Also create ledger entries for each
      for (const entry of entries) {
        const f = calcEntryFinancials(entry);
        const ledgerEntry: Record<string, any> = {
          organization_id: organization.id,
          entry_type: 'credit',
          entry_category: 'weight_entry',
          amount: f.total,
          description: `وزنة جماعية - ${entry.waste_type} | ${entry.net_weight} ${entry.unit} × ${entry.price_per_unit} ج.م`,
          entry_date: entry.entry_date,
          created_by: profile?.id,
          reference_number: `BWE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
        };

        if (selectedTransporter?.type === 'organization') {
          ledgerEntry.partner_organization_id = selectedTransporter.id;
        }
        if (selectedRecycler?.type === 'organization') {
          ledgerEntry.partner_organization_id = ledgerEntry.partner_organization_id || selectedRecycler.id;
        }

        await supabase.from('accounting_ledger').insert([ledgerEntry as any]);
      }
    },
    onSuccess: () => {
      toast.success(`تم حفظ ${entries.length} وزنة بنجاح ✅`);
      queryClient.invalidateQueries({ queryKey: ['bulk-weight-entries'] });
      queryClient.invalidateQueries({ queryKey: ['partner-ledger-entries'] });
      setEntries([createEmptyEntry()]);
      setActiveEntryId(entries[0]?.id || '');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeEntry = entries.find(e => e.id === activeEntryId) || entries[0];

  // Accounts summary
  const accountsSummary = savedEntries.reduce((acc: Record<string, any>, entry: any) => {
    const partnerId = entry.transporter_id || entry.recycler_id || 'none';
    if (!acc[partnerId]) {
      acc[partnerId] = { totalWeight: 0, totalAmount: 0, paidAmount: 0, remaining: 0, count: 0 };
    }
    acc[partnerId].totalWeight += Number(entry.net_weight) || 0;
    acc[partnerId].totalAmount += Number(entry.total_amount) || 0;
    acc[partnerId].paidAmount += Number(entry.paid_amount) || 0;
    acc[partnerId].remaining += Number(entry.remaining_amount) || 0;
    acc[partnerId].count += 1;
    return acc;
  }, {} as Record<string, any>);

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                الوزنات الجماعية
              </h1>
              <p className="text-sm text-muted-foreground">إنشاء وزنات متعددة على جهات مختلفة من صفحة واحدة</p>
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || entries.length === 0}
            size="lg"
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            حفظ الكل ({entries.length} وزنة)
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entries" className="gap-2">
              <Scale className="h-4 w-4" /> الوزنات
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <DollarSign className="h-4 w-4" /> الحسابات
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" /> المستندات والتوقيع
            </TabsTrigger>
          </TabsList>

          {/* === ENTRIES TAB === */}
          <TabsContent value="entries" className="space-y-4">
            {/* Partners Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">الجهات المشاركة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transporter */}
                  <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> الناقل</Label>
                    {selectedTransporter ? (
                      <div className="p-3 rounded-lg border bg-muted/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedTransporter.name}</span>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedTransporter(null)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {selectedTransporter.commercial_register && (
                          <p className="text-xs text-muted-foreground">سجل تجاري: {selectedTransporter.commercial_register}</p>
                        )}
                        {selectedTransporter.environmental_license && (
                          <p className="text-xs text-muted-foreground">ترخيص بيئي: {selectedTransporter.environmental_license}</p>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pr-9"
                          placeholder="ابحث عن الناقل..."
                          value={transporterSearch}
                          onChange={e => setTransporterSearch(e.target.value)}
                          onFocus={() => transporterResults.length > 0 && setShowTransporterResults(true)}
                          onBlur={() => setTimeout(() => setShowTransporterResults(false), 200)}
                        />
                        {showTransporterResults && transporterResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {transporterResults.map(p => (
                              <button key={p.id} className="w-full text-right p-3 hover:bg-muted transition-colors border-b last:border-0"
                                onMouseDown={() => { setSelectedTransporter(p); setTransporterSearch(''); setShowTransporterResults(false); }}>
                                <div className="font-medium">{p.name}</div>
                                {p.orgType && <span className="text-xs text-muted-foreground">{p.orgType}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recycler */}
                  <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1"><Recycle className="h-3.5 w-3.5" /> المدوّر / الوجهة</Label>
                    {selectedRecycler ? (
                      <div className="p-3 rounded-lg border bg-muted/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedRecycler.name}</span>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRecycler(null)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {selectedRecycler.commercial_register && (
                          <p className="text-xs text-muted-foreground">سجل تجاري: {selectedRecycler.commercial_register}</p>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pr-9"
                          placeholder="ابحث عن المدوّر..."
                          value={recyclerSearch}
                          onChange={e => setRecyclerSearch(e.target.value)}
                          onFocus={() => recyclerResults.length > 0 && setShowRecyclerResults(true)}
                          onBlur={() => setTimeout(() => setShowRecyclerResults(false), 200)}
                        />
                        {showRecyclerResults && recyclerResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {recyclerResults.map(p => (
                              <button key={p.id} className="w-full text-right p-3 hover:bg-muted transition-colors border-b last:border-0"
                                onMouseDown={() => { setSelectedRecycler(p); setRecyclerSearch(''); setShowRecyclerResults(false); }}>
                                <div className="font-medium">{p.name}</div>
                                {p.orgType && <span className="text-xs text-muted-foreground">{p.orgType}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Driver placeholder */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> السائق</Label>
                    <Input placeholder="اسم السائق (اختياري)" value={selectedDriver?.name || ''} onChange={e => setSelectedDriver(e.target.value ? { id: '', name: e.target.value } : null)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entries list + active entry */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Sidebar: entries list */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">الوزنات ({entries.length})</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => {
                      const newEntry = createEmptyEntry();
                      setEntries(prev => [...prev, newEntry]);
                      setActiveEntryId(newEntry.id);
                    }}>
                      <Plus className="h-3 w-3 ml-1" /> إضافة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                  {entries.map((entry, idx) => {
                    const f = calcEntryFinancials(entry);
                    return (
                      <motion.button
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`w-full text-right p-3 rounded-lg transition-colors border ${
                          entry.id === activeEntryId ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted border-transparent'
                        }`}
                        onClick={() => setActiveEntryId(entry.id)}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                          {entry.aiExtracted && <Zap className="h-3 w-3 text-yellow-500" />}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(ev) => {
                            ev.stopPropagation();
                            if (entries.length <= 1) return;
                            setEntries(prev => prev.filter(e => e.id !== entry.id));
                            if (activeEntryId === entry.id) setActiveEntryId(entries[0]?.id || '');
                          }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{entry.waste_type || 'بدون تصنيف'}</p>
                        <p className="text-xs text-muted-foreground">{entry.net_weight ? `${entry.net_weight} ${entry.unit}` : '--'}</p>
                        {f.total > 0 && <p className="text-xs font-bold text-primary">{f.total.toLocaleString()} ج.م</p>}
                      </motion.button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Main: active entry form */}
              <Card className="lg:col-span-3">
                <CardContent className="pt-6 space-y-5">
                  {activeEntry && (
                    <>
                      {/* AI Upload */}
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          ref={el => { fileInputRefs.current[activeEntry.id] = el; }}
                          className="hidden"
                          onChange={e => handleImageUpload(activeEntry.id, e)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRefs.current[activeEntry.id]?.click()}
                          disabled={aiLoading}
                          className="gap-2"
                        >
                          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          📷 رفع صورة الميزان (AI)
                        </Button>
                        {activeEntry.imagePreview && (
                          <img src={activeEntry.imagePreview} alt="ميزان" className="h-12 w-12 rounded-lg object-cover border" />
                        )}
                        {activeEntry.aiExtracted && <Badge className="bg-yellow-500/20 text-yellow-700"><Zap className="h-3 w-3 ml-1" />بيانات AI</Badge>}
                      </div>

                      {/* Row 1: Ticket & Waste type */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>رقم تذكرة الوزن</Label>
                          <Input placeholder="يُملأ من AI أو يدوياً" value={activeEntry.ticket_number}
                            onChange={e => updateEntry(activeEntry.id, { ticket_number: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>نوع المخلف *</Label>
                          <Select value={activeEntry.waste_type} onValueChange={v => updateEntry(activeEntry.id, { waste_type: v })}>
                            <SelectTrigger><SelectValue placeholder="اختر من أصنافك أو العامة" /></SelectTrigger>
                            <SelectContent>
                              {customWasteTypes.length > 0 && (
                                <>
                                  <div className="px-2 py-1 text-xs font-semibold text-primary">أصنافي المخصصة</div>
                                  {customWasteTypes.map(cwt => (
                                    <SelectItem key={cwt.id} value={cwt.name}>
                                      <span className="flex items-center gap-1">⭐ {cwt.name}</span>
                                    </SelectItem>
                                  ))}
                                  <Separator className="my-1" />
                                </>
                              )}
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">الأصناف العامة</div>
                              {wasteTypes.map(wt => <SelectItem key={wt} value={wt}>{wt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {/* Add custom type inline */}
                          <div className="flex gap-1">
                            <Input
                              placeholder="أضف صنف جديد خاص بك..."
                              value={newCustomType}
                              onChange={e => setNewCustomType(e.target.value)}
                              className="text-xs h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              disabled={!newCustomType.trim()}
                              onClick={async () => {
                                if (!newCustomType.trim()) return;
                                try {
                                  await addCustomWasteType({
                                    name: newCustomType.trim(),
                                    code: `CW-${Date.now().toString(36)}`,
                                    category: 'non-hazardous',
                                    parent_category: 'أخرى',
                                  });
                                  updateEntry(activeEntry.id, { waste_type: newCustomType.trim() });
                                  setNewCustomType('');
                                  toast.success('تم إضافة الصنف لقائمتك ⭐');
                                } catch { toast.error('فشل إضافة الصنف'); }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>التاريخ</Label>
                          <Input type="date" value={activeEntry.entry_date}
                            onChange={e => updateEntry(activeEntry.id, { entry_date: e.target.value })} />
                        </div>
                      </div>

                      {/* Row 2: Weights */}
                      <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Scale className="h-4 w-4" /> بيانات الوزن</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">الوزنة الأولى</Label>
                            <Input type="number" step="0.001" placeholder="0.000" value={activeEntry.first_weight}
                              onChange={e => updateEntry(activeEntry.id, { first_weight: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">وقت الأولى</Label>
                            <Input type="datetime-local" value={activeEntry.first_weight_date}
                              onChange={e => updateEntry(activeEntry.id, { first_weight_date: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">الوزنة الثانية</Label>
                            <Input type="number" step="0.001" placeholder="0.000" value={activeEntry.second_weight}
                              onChange={e => updateEntry(activeEntry.id, { second_weight: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">وقت الثانية</Label>
                            <Input type="datetime-local" value={activeEntry.second_weight_date}
                              onChange={e => updateEntry(activeEntry.id, { second_weight_date: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">الوزن الصافي *</Label>
                            <div className="flex gap-1">
                              <Input type="number" step="0.001" placeholder="0.000" value={activeEntry.net_weight}
                                onChange={e => updateEntry(activeEntry.id, { net_weight: e.target.value })} className="font-bold" />
                              <Select value={activeEntry.unit} onValueChange={v => updateEntry(activeEntry.id, { unit: v })}>
                                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="طن">طن</SelectItem>
                                  <SelectItem value="كجم">كجم</SelectItem>
                                  <SelectItem value="قطعة">قطعة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Financial */}
                      <div className="p-4 rounded-xl border bg-primary/5 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> البيانات المالية</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">سعر الوحدة (ج.م)</Label>
                            <Input type="number" step="0.01" placeholder="0.00" value={activeEntry.price_per_unit}
                              onChange={e => updateEntry(activeEntry.id, { price_per_unit: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">نسبة الضريبة %</Label>
                            <Input type="number" step="0.1" value={activeEntry.tax_rate}
                              onChange={e => updateEntry(activeEntry.id, { tax_rate: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">الإجمالي</Label>
                            <div className="p-2 rounded bg-background border text-center font-bold">
                              {calcEntryFinancials(activeEntry).total.toLocaleString()} ج.م
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">المدفوع</Label>
                            <Input type="number" step="0.01" value={activeEntry.paid_amount}
                              onChange={e => updateEntry(activeEntry.id, { paid_amount: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">المتبقي</Label>
                            <div className={`p-2 rounded border text-center font-bold ${calcEntryFinancials(activeEntry).remaining > 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-700'}`}>
                              {calcEntryFinancials(activeEntry).remaining.toLocaleString()} ج.م
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visibility controls */}
                      <div className="p-4 rounded-xl border space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> التحكم في الرؤية</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">ظاهر للناقل</Label>
                            <Switch checked={activeEntry.visible_to_transporter}
                              onCheckedChange={v => updateEntry(activeEntry.id, { visible_to_transporter: v })} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">ظاهر للمدوّر</Label>
                            <Switch checked={activeEntry.visible_to_recycler}
                              onCheckedChange={v => updateEntry(activeEntry.id, { visible_to_recycler: v })} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">ظاهر للسائق</Label>
                            <Switch checked={activeEntry.visible_to_driver}
                              onCheckedChange={v => updateEntry(activeEntry.id, { visible_to_driver: v })} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs">إظهار المالية</Label>
                            <Switch checked={activeEntry.show_financial_data}
                              onCheckedChange={v => updateEntry(activeEntry.id, { show_financial_data: v })} />
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Textarea placeholder="ملاحظات إضافية..." rows={2} value={activeEntry.notes}
                          onChange={e => updateEntry(activeEntry.id, { notes: e.target.value })} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Total Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">عدد الوزنات</p>
                    <p className="text-xl font-bold">{entries.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي الوزن</p>
                    <p className="text-xl font-bold">{totalFinancials.totalWeight.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الإجمالي قبل الضريبة</p>
                    <p className="text-xl font-bold">{totalFinancials.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الضريبة</p>
                    <p className="text-xl font-bold">{totalFinancials.tax.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الإجمالي النهائي</p>
                    <p className="text-2xl font-bold text-primary">{totalFinancials.total.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المتبقي</p>
                    <p className={`text-xl font-bold ${totalFinancials.remaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {totalFinancials.remaining.toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ACCOUNTS TAB === */}
          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> كشف حساب الجهات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date filter */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">من تاريخ</Label>
                    <Input type="date" value={accountDateFrom} onChange={e => setAccountDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">إلى تاريخ</Label>
                    <Input type="date" value={accountDateTo} onChange={e => setAccountDateTo(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={() => { setAccountDateFrom(''); setAccountDateTo(''); }}>
                    <Filter className="h-4 w-4 ml-1" /> مسح الفلتر
                  </Button>
                </div>

                <Separator />

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 dark:bg-blue-950/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">إجمالي الوزنات</p>
                      <p className="text-3xl font-bold">{savedEntries.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 dark:bg-green-950/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">إجمالي المبالغ</p>
                      <p className="text-3xl font-bold text-primary">
                        {savedEntries.reduce((s: number, e: any) => s + (Number(e.total_amount) || 0), 0).toLocaleString()} ج.م
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 dark:bg-orange-950/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">المتبقي</p>
                      <p className="text-3xl font-bold text-destructive">
                        {savedEntries.reduce((s: number, e: any) => s + (Number(e.remaining_amount) || 0), 0).toLocaleString()} ج.م
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Entries table */}
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-right">التاريخ</th>
                        <th className="p-3 text-right">رقم الشحنة</th>
                        <th className="p-3 text-right">نوع المخلف</th>
                        <th className="p-3 text-right">الوزن الصافي</th>
                        <th className="p-3 text-right">الإجمالي</th>
                        <th className="p-3 text-right">المدفوع</th>
                        <th className="p-3 text-right">المتبقي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedEntries.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد وزنات مسجلة بعد</td></tr>
                      ) : (
                        savedEntries.map((entry: any) => (
                          <tr key={entry.id} className="border-t hover:bg-muted/30">
                            <td className="p-3">{entry.entry_date}</td>
                            <td className="p-3 font-mono text-xs">{entry.shipment_number}</td>
                            <td className="p-3">{entry.waste_type}</td>
                            <td className="p-3">{Number(entry.net_weight).toLocaleString()} {entry.unit}</td>
                            <td className="p-3 font-bold">{Number(entry.total_amount).toLocaleString()} ج.م</td>
                            <td className="p-3 text-green-600">{Number(entry.paid_amount).toLocaleString()}</td>
                            <td className="p-3 text-destructive font-bold">{Number(entry.remaining_amount).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === DOCUMENTS TAB === */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> المستندات والتحقق</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-xl border-2 border-dashed text-center space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold">التحقق والتوقيع</h3>
                  <p className="text-sm text-muted-foreground">
                    بعد حفظ الوزنات، يمكنك مشاركة المستند مع الأطراف المعنية للتحقق والتوقيع الإلكتروني
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" disabled>
                      <Eye className="h-4 w-4 ml-2" /> معاينة المستند
                    </Button>
                    <Button variant="outline" disabled>
                      <FileText className="h-4 w-4 ml-2" /> إرسال للتوقيع
                    </Button>
                  </div>
                </div>

                {/* Parties info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTransporter && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Truck className="h-4 w-4" /> بيانات الناقل</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>الاسم:</strong> {selectedTransporter.name}</p>
                          {selectedTransporter.commercial_register && <p><strong>السجل التجاري:</strong> {selectedTransporter.commercial_register}</p>}
                          {selectedTransporter.environmental_license && <p><strong>الترخيص البيئي:</strong> {selectedTransporter.environmental_license}</p>}
                          {selectedTransporter.address && <p><strong>العنوان:</strong> {selectedTransporter.address}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedRecycler && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Recycle className="h-4 w-4" /> بيانات المدوّر</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>الاسم:</strong> {selectedRecycler.name}</p>
                          {selectedRecycler.commercial_register && <p><strong>السجل التجاري:</strong> {selectedRecycler.commercial_register}</p>}
                          {selectedRecycler.environmental_license && <p><strong>الترخيص البيئي:</strong> {selectedRecycler.environmental_license}</p>}
                          {selectedRecycler.address && <p><strong>العنوان:</strong> {selectedRecycler.address}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
