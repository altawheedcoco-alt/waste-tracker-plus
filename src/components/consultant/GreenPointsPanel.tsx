import { memo, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Settings, CheckCircle2, XCircle, Loader2, TreePine,
  Zap, Droplets, Award, TrendingUp, Truck, Star, Shield,
  BarChart3, FileText, Sparkles, RefreshCw, Eye,
} from 'lucide-react';
import {
  DEFAULT_GREEN_FACTORS, calculateGreenPoints, getGreenLevel, getTransporterBadge,
} from '@/lib/greenPointsEngine';

interface GreenPointsPanelProps {
  assignments: any[];
}

const WASTE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق/كرتون', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'بناء', other: 'أخرى',
};

const GreenPointsPanel = memo(({ assignments }: GreenPointsPanelProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const orgIds = assignments.map((a: any) => a.organization_id);

  // ═══ Fetch consultant profile ═══
  const { data: consultantProfile } = useQuery({
    queryKey: ['green-consultant-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('environmental_consultants')
        .select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // ═══ Fetch green points config for all orgs ═══
  const { data: configs = [], isLoading: loadingConfig } = useQuery({
    queryKey: ['green-points-config', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await supabase.from('green_points_config')
        .select('*').in('organization_id', orgIds).eq('is_active', true);
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  // ═══ Fetch pending shipments for verification ═══
  const { data: pendingShipments = [], isLoading: loadingPending } = useQuery({
    queryKey: ['green-pending-shipments', orgIds, selectedOrg],
    queryFn: async () => {
      const targetOrgs = selectedOrg === 'all' ? orgIds : [selectedOrg];
      if (!targetOrgs.length) return [];

      // Get already-verified shipment IDs
      const { data: verified } = await supabase.from('green_points_transactions')
        .select('shipment_id').in('organization_id', targetOrgs);
      const verifiedIds = new Set((verified || []).map(v => v.shipment_id));

      const { data: shipments } = await supabase.from('shipments')
        .select('id, waste_type, quantity, unit, status, disposal_method, created_at, generator_id, recycler_id')
        .in('status', ['delivered', 'confirmed'])
        .or(targetOrgs.map(id => `generator_id.eq.${id},recycler_id.eq.${id}`).join(','))
        .order('created_at', { ascending: false })
        .limit(100);

      return (shipments || []).filter(s => !verifiedIds.has(s.id));
    },
    enabled: orgIds.length > 0,
  });

  // ═══ Fetch verified transactions ═══
  const { data: transactions = [] } = useQuery({
    queryKey: ['green-transactions', orgIds, selectedOrg],
    queryFn: async () => {
      const targetOrgs = selectedOrg === 'all' ? orgIds : [selectedOrg];
      const { data } = await supabase.from('green_points_transactions')
        .select('*').in('organization_id', targetOrgs)
        .order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  // ═══ Fetch balances ═══
  const { data: balances = [] } = useQuery({
    queryKey: ['green-balances', orgIds],
    queryFn: async () => {
      const { data } = await supabase.from('green_points_balance')
        .select('*').in('organization_id', orgIds);
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  // ═══ Verify shipment mutation ═══
  const verifyMutation = useMutation({
    mutationFn: async ({ shipment, quality, notes }: { shipment: any; quality: number; notes: string }) => {
      const qty = Number(shipment.quantity) || 0;
      const weightTons = (shipment.unit === 'كجم' || shipment.unit === 'kg' || !shipment.unit) ? qty / 1000 : qty;
      const wasteType = shipment.waste_type || 'other';

      // Check for custom config
      const orgId = shipment.generator_id || shipment.recycler_id;
      const customConfig = configs.find(c => c.organization_id === orgId && c.waste_type === wasteType);
      const customFactors = customConfig ? {
        points_per_ton: Number(customConfig.points_per_ton),
        trees_per_ton: Number(customConfig.trees_per_ton),
        energy_saved_kwh_per_ton: Number(customConfig.energy_saved_kwh_per_ton),
        water_saved_liters_per_ton: Number(customConfig.water_saved_liters_per_ton),
      } : undefined;

      const calc = calculateGreenPoints(wasteType, weightTons, quality, customFactors);

      const { error } = await supabase.from('green_points_transactions').insert({
        organization_id: orgId,
        shipment_id: shipment.id,
        consultant_id: consultantProfile?.id,
        verified_by: user!.id,
        waste_type: wasteType,
        weight_tons: weightTons,
        base_points: calc.basePoints,
        quality_multiplier: quality,
        final_points: calc.finalPoints,
        trees_saved: calc.treesSaved,
        co2_saved_tons: calc.co2SavedTons,
        energy_saved_kwh: calc.energySavedKwh,
        water_saved_liters: calc.waterSavedLiters,
        verification_status: quality > 0 ? 'approved' : 'rejected',
        verification_notes: notes || null,
        verified_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Update balance
      if (quality > 0) {
        const existing = balances.find(b => b.organization_id === orgId);
        if (existing) {
          await supabase.from('green_points_balance').update({
            total_points: Number(existing.total_points) + calc.finalPoints,
            total_trees_saved: Number(existing.total_trees_saved) + calc.treesSaved,
            total_co2_saved_tons: Number(existing.total_co2_saved_tons) + calc.co2SavedTons,
            total_energy_saved_kwh: Number(existing.total_energy_saved_kwh) + calc.energySavedKwh,
            total_water_saved_liters: Number(existing.total_water_saved_liters) + calc.waterSavedLiters,
            total_shipments_verified: existing.total_shipments_verified + 1,
            green_level: getGreenLevel(Number(existing.total_points) + calc.finalPoints).level,
            last_updated: new Date().toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('green_points_balance').insert({
            organization_id: orgId,
            total_points: calc.finalPoints,
            total_trees_saved: calc.treesSaved,
            total_co2_saved_tons: calc.co2SavedTons,
            total_energy_saved_kwh: calc.energySavedKwh,
            total_water_saved_liters: calc.waterSavedLiters,
            total_shipments_verified: 1,
            green_level: getGreenLevel(calc.finalPoints).level,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('تم اعتماد الشحنة ومنح النقاط الخضراء');
      queryClient.invalidateQueries({ queryKey: ['green-'] });
      queryClient.invalidateQueries({ queryKey: ['green-pending-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['green-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['green-balances'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ═══ Save config mutation ═══
  const saveConfigMutation = useMutation({
    mutationFn: async ({ orgId, wasteType, factors }: { orgId: string; wasteType: string; factors: any }) => {
      const { error } = await supabase.from('green_points_config').upsert({
        organization_id: orgId,
        consultant_id: consultantProfile?.id,
        waste_type: wasteType,
        points_per_ton: factors.points_per_ton,
        trees_per_ton: factors.trees_per_ton,
        energy_saved_kwh_per_ton: factors.energy_saved_kwh_per_ton,
        water_saved_liters_per_ton: factors.water_saved_liters_per_ton,
        quality_multiplier: 1.0,
        description: factors.description_ar,
      }, { onConflict: 'organization_id,waste_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حفظ المعايير');
      queryClient.invalidateQueries({ queryKey: ['green-points-config'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || orgId.slice(0, 8);
  };

  // ═══ Aggregated stats ═══
  const totalStats = useMemo(() => {
    const filteredBalances = selectedOrg === 'all' ? balances : balances.filter(b => b.organization_id === selectedOrg);
    return {
      points: filteredBalances.reduce((s, b) => s + Number(b.total_points || 0), 0),
      trees: filteredBalances.reduce((s, b) => s + Number(b.total_trees_saved || 0), 0),
      co2: filteredBalances.reduce((s, b) => s + Number(b.total_co2_saved_tons || 0), 0),
      energy: filteredBalances.reduce((s, b) => s + Number(b.total_energy_saved_kwh || 0), 0),
      water: filteredBalances.reduce((s, b) => s + Number(b.total_water_saved_liters || 0), 0),
      verified: filteredBalances.reduce((s, b) => s + (b.total_shipments_verified || 0), 0),
    };
  }, [balances, selectedOrg]);

  const greenLevel = getGreenLevel(totalStats.points);

  return (
    <div className="space-y-6">
      {/* Header + Org Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold">النقاط الخضراء (Green Points)</h2>
        </div>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="اختر الجهة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الجهات</SelectItem>
            {assignments.map((a: any) => (
              <SelectItem key={a.organization_id} value={a.organization_id}>
                {a.organization?.name || a.organization_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Sparkles} label="إجمالي النقاط" value={totalStats.points.toLocaleString()} color="text-primary" />
        <KpiCard icon={TreePine} label="أشجار تم إنقاذها" value={totalStats.trees.toLocaleString()} color="text-emerald-600" />
        <KpiCard icon={Leaf} label="CO₂ تم توفيره" value={`${totalStats.co2.toFixed(2)} طن`} color="text-green-600" />
        <KpiCard icon={Zap} label="طاقة تم توفيرها" value={`${totalStats.energy.toLocaleString()} kWh`} color="text-amber-600" />
        <KpiCard icon={Droplets} label="مياه تم توفيرها" value={`${totalStats.water.toLocaleString()} لتر`} color="text-blue-600" />
        <KpiCard icon={CheckCircle2} label="شحنات معتمدة" value={totalStats.verified.toString()} color="text-purple-600" />
      </div>

      {/* Green Level Progress */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-l from-emerald-50/50 to-transparent dark:from-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${greenLevel.color}`} />
              <span className="font-bold">{greenLevel.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalStats.points.toLocaleString()} / {greenLevel.nextThreshold.toLocaleString()} للمستوى التالي
            </span>
          </div>
          <Progress value={Math.min((totalStats.points / greenLevel.nextThreshold) * 100, 100)} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-1.5"><Eye className="w-4 h-4" />النظرة العامة</TabsTrigger>
          <TabsTrigger value="verify" className="gap-1.5"><CheckCircle2 className="w-4 h-4" />اعتماد الجودة</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />ضبط المعايير</TabsTrigger>
          <TabsTrigger value="transporters" className="gap-1.5"><Truck className="w-4 h-4" />تقييم الناقلين</TabsTrigger>
        </TabsList>

        {/* ═══ Overview Tab ═══ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Per-org breakdown */}
          {balances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedOrg === 'all' ? balances : balances.filter(b => b.organization_id === selectedOrg)).map(b => {
                const level = getGreenLevel(Number(b.total_points));
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold">{getOrgName(b.organization_id)}</p>
                            <Badge variant="outline" className={`text-[10px] ${level.color}`}>{level.label}</Badge>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-primary">{Number(b.total_points).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">نقطة خضراء</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <MiniStat icon={TreePine} value={Number(b.total_trees_saved)} label="شجرة" />
                          <MiniStat icon={Leaf} value={Number(b.total_co2_saved_tons).toFixed(1)} label="طن CO₂" />
                          <MiniStat icon={Zap} value={Number(b.total_energy_saved_kwh).toLocaleString()} label="kWh" />
                          <MiniStat icon={CheckCircle2} value={b.total_shipments_verified} label="شحنة" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Leaf className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">لا توجد نقاط خضراء بعد</p>
                <p className="text-sm">ابدأ باعتماد الشحنات من تبويب "اعتماد الجودة"</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />آخر المعاملات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{getOrgName(tx.organization_id)} — {WASTE_LABELS[tx.waste_type] || tx.waste_type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {Number(tx.weight_tons).toFixed(2)} طن • {new Date(tx.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.verification_status === 'approved' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">+{Number(tx.final_points)} نقطة</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">مرفوض</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ Verify Tab (اعتماد الجودة) ═══ */}
        <TabsContent value="verify" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                اعتماد جودة الشحنات
              </CardTitle>
              <CardDescription>
                راجع الشحنات المُسلّمة واعتمد جودتها لمنح النقاط الخضراء
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : pendingShipments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد شحنات في انتظار الاعتماد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingShipments.map(shipment => (
                    <ShipmentVerifyCard
                      key={shipment.id}
                      shipment={shipment}
                      getOrgName={getOrgName}
                      onVerify={(quality, notes) => verifyMutation.mutate({ shipment, quality, notes })}
                      isLoading={verifyMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Settings Tab (ضبط المعايير) ═══ */}
        <TabsContent value="settings" className="mt-4">
          <FactorsSettings
            assignments={assignments}
            configs={configs}
            onSave={(orgId, wasteType, factors) => saveConfigMutation.mutate({ orgId, wasteType, factors })}
            isSaving={saveConfigMutation.isPending}
          />
        </TabsContent>

        {/* ═══ Transporters Tab ═══ */}
        <TabsContent value="transporters" className="mt-4">
          <TransporterRatingPanel assignments={assignments} consultantId={consultantProfile?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
});

// ═══ Sub-Components ═══

const KpiCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const MiniStat = ({ icon: Icon, value, label }: { icon: any; value: any; label: string }) => (
  <div>
    <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-0.5" />
    <p className="text-sm font-bold">{value}</p>
    <p className="text-[9px] text-muted-foreground">{label}</p>
  </div>
);

const ShipmentVerifyCard = ({ shipment, getOrgName, onVerify, isLoading }: {
  shipment: any; getOrgName: (id: string) => string; onVerify: (q: number, n: string) => void; isLoading: boolean;
}) => {
  const [quality, setQuality] = useState(1.0);
  const [notes, setNotes] = useState('');
  const qty = Number(shipment.quantity) || 0;
  const weightTons = (shipment.unit === 'كجم' || shipment.unit === 'kg' || !shipment.unit) ? qty / 1000 : qty;
  const preview = calculateGreenPoints(shipment.waste_type || 'other', weightTons, quality);

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{getOrgName(shipment.generator_id || shipment.recycler_id)}</p>
            <p className="text-[11px] text-muted-foreground">
              {WASTE_LABELS[shipment.waste_type] || shipment.waste_type} • {weightTons.toFixed(3)} طن • {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">{shipment.status === 'confirmed' ? 'مكتمل' : 'تم التسليم'}</Badge>
        </div>

        {/* Preview Points */}
        <div className="grid grid-cols-4 gap-2 text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div><p className="text-lg font-bold text-emerald-700">{preview.finalPoints}</p><p className="text-[9px] text-emerald-600">نقطة</p></div>
          <div><p className="text-lg font-bold text-emerald-700">{preview.treesSaved}</p><p className="text-[9px] text-emerald-600">شجرة</p></div>
          <div><p className="text-lg font-bold text-emerald-700">{preview.co2SavedTons}</p><p className="text-[9px] text-emerald-600">طن CO₂</p></div>
          <div><p className="text-lg font-bold text-emerald-700">{preview.energySavedKwh}</p><p className="text-[9px] text-emerald-600">kWh</p></div>
        </div>

        {/* Quality Multiplier */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">معامل الجودة:</label>
          <Select value={quality.toString()} onValueChange={v => setQuality(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.0">ممتاز (×1.0)</SelectItem>
              <SelectItem value="0.8">جيد (×0.8)</SelectItem>
              <SelectItem value="0.5">متوسط (×0.5)</SelectItem>
              <SelectItem value="0.2">ملوث جزئياً (×0.2)</SelectItem>
              <SelectItem value="0">مرفوض (0 نقاط)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="ملاحظات التدقيق (اختياري)..."
          className="min-h-[50px] text-sm"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="destructive" size="sm" onClick={() => onVerify(0, notes)} disabled={isLoading} className="gap-1.5">
            <XCircle className="w-4 h-4" />رفض
          </Button>
          <Button size="sm" onClick={() => onVerify(quality, notes)} disabled={isLoading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            اعتماد ومنح النقاط
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══ Factors Settings ═══
const FactorsSettings = ({ assignments, configs, onSave, isSaving }: {
  assignments: any[]; configs: any[]; onSave: (orgId: string, wasteType: string, factors: any) => void; isSaving: boolean;
}) => {
  const [settingsOrg, setSettingsOrg] = useState('');
  const [editType, setEditType] = useState('');
  const [editFactors, setEditFactors] = useState<any>(null);

  const startEdit = (wasteType: string) => {
    const existing = configs.find(c => c.organization_id === settingsOrg && c.waste_type === wasteType);
    const defaults = DEFAULT_GREEN_FACTORS[wasteType] || DEFAULT_GREEN_FACTORS.other;
    setEditType(wasteType);
    setEditFactors(existing ? {
      points_per_ton: Number(existing.points_per_ton),
      trees_per_ton: Number(existing.trees_per_ton),
      energy_saved_kwh_per_ton: Number(existing.energy_saved_kwh_per_ton),
      water_saved_liters_per_ton: Number(existing.water_saved_liters_per_ton),
      description_ar: existing.description || defaults.description_ar,
    } : { ...defaults });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" />
          ضبط معايير النقاط الخضراء
        </CardTitle>
        <CardDescription>حدد كم نقطة يستحقها كل كيلوجرام من كل نوع مخلفات لكل جهة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={settingsOrg} onValueChange={v => { setSettingsOrg(v); setEditType(''); }}>
          <SelectTrigger><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
          <SelectContent>
            {assignments.map((a: any) => (
              <SelectItem key={a.organization_id} value={a.organization_id}>
                {a.organization?.name || a.organization_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {settingsOrg && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(WASTE_LABELS).map(([type, label]) => {
              const hasCustom = configs.some(c => c.organization_id === settingsOrg && c.waste_type === type);
              return (
                <button key={type} onClick={() => startEdit(type)}
                  className={`p-3 rounded-lg border text-center text-sm transition-all hover:border-primary/50 ${
                    editType === type ? 'border-primary bg-primary/5' : hasCustom ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border'
                  }`}>
                  <p className="font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {hasCustom ? '✅ مُخصص' : 'افتراضي'}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {editType && editFactors && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-primary/20 bg-card space-y-3">
            <h4 className="font-bold text-sm">تعديل معايير: {WASTE_LABELS[editType]}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground">نقاط لكل طن</label>
                <Input type="number" value={editFactors.points_per_ton}
                  onChange={e => setEditFactors({ ...editFactors, points_per_ton: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">أشجار لكل طن</label>
                <Input type="number" value={editFactors.trees_per_ton}
                  onChange={e => setEditFactors({ ...editFactors, trees_per_ton: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">طاقة (kWh) لكل طن</label>
                <Input type="number" value={editFactors.energy_saved_kwh_per_ton}
                  onChange={e => setEditFactors({ ...editFactors, energy_saved_kwh_per_ton: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">مياه (لتر) لكل طن</label>
                <Input type="number" value={editFactors.water_saved_liters_per_ton}
                  onChange={e => setEditFactors({ ...editFactors, water_saved_liters_per_ton: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={() => onSave(settingsOrg, editType, editFactors)} disabled={isSaving} className="gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              حفظ المعايير
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

// ═══ Transporter Rating Panel ═══
const TransporterRatingPanel = memo(({ assignments, consultantId }: { assignments: any[]; consultantId?: string }) => {
  const queryClient = useQueryClient();
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [scores, setScores] = useState({ punctuality: 80, handling: 80, compliance: 80 });
  const [ratingNotes, setRatingNotes] = useState('');

  const transporterAssignments = assignments.filter((a: any) => a.organization?.organization_type === 'transporter');

  const { data: ratings = [] } = useQuery({
    queryKey: ['transporter-ratings', transporterAssignments.map(a => a.organization_id)],
    queryFn: async () => {
      const ids = transporterAssignments.map(a => a.organization_id);
      if (!ids.length) return [];
      const { data } = await supabase.from('transporter_green_ratings')
        .select('*').in('transporter_org_id', ids)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: transporterAssignments.length > 0,
  });

  const submitRating = async () => {
    if (!selectedTransporter) return;
    const overall = Math.round((scores.punctuality + scores.handling + scores.compliance) / 3);
    const badge = getTransporterBadge(overall);
    const period = new Date().toISOString().slice(0, 7);

    const { error } = await supabase.from('transporter_green_ratings').upsert({
      transporter_org_id: selectedTransporter,
      consultant_id: consultantId,
      rating_period: period,
      punctuality_score: scores.punctuality,
      waste_handling_score: scores.handling,
      compliance_score: scores.compliance,
      overall_score: overall,
      green_badge: badge.badge,
      notes: ratingNotes || null,
    }, { onConflict: 'transporter_org_id,rating_period' });

    if (error) { toast.error(error.message); return; }
    toast.success(`تم تقييم الناقل — ${badge.label}`);
    queryClient.invalidateQueries({ queryKey: ['transporter-ratings'] });
    setRatingNotes('');
  };

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || orgId.slice(0, 8);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5 text-primary" />
            تقييم الناقل الأخضر
          </CardTitle>
          <CardDescription>قيّم أداء مكاتب النقل لمنح "وسام الناقل الأخضر"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transporterAssignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد مكاتب نقل مرتبطة</p>
          ) : (
            <>
              <Select value={selectedTransporter} onValueChange={setSelectedTransporter}>
                <SelectTrigger><SelectValue placeholder="اختر مكتب النقل" /></SelectTrigger>
                <SelectContent>
                  {transporterAssignments.map((a: any) => (
                    <SelectItem key={a.organization_id} value={a.organization_id}>
                      {a.organization?.name || a.organization_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTransporter && (
                <div className="space-y-3">
                  <ScoreSlider label="الالتزام بالمواعيد" value={scores.punctuality} onChange={v => setScores({ ...scores, punctuality: v })} />
                  <ScoreSlider label="جودة التعامل مع المخلفات" value={scores.handling} onChange={v => setScores({ ...scores, handling: v })} />
                  <ScoreSlider label="الامتثال القانوني" value={scores.compliance} onChange={v => setScores({ ...scores, compliance: v })} />

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">التقييم الإجمالي:</span>
                    <Badge variant="outline" className="font-bold">
                      {Math.round((scores.punctuality + scores.handling + scores.compliance) / 3)}%
                    </Badge>
                    <span className="text-sm">
                      {getTransporterBadge(Math.round((scores.punctuality + scores.handling + scores.compliance) / 3)).label}
                    </span>
                  </div>

                  <Textarea value={ratingNotes} onChange={e => setRatingNotes(e.target.value)} placeholder="ملاحظات (اختياري)..." className="min-h-[50px]" />
                  <Button onClick={submitRating} className="gap-1.5"><Star className="w-4 h-4" />حفظ التقييم</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Existing Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">تقييمات سابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratings.map(r => {
                const badge = getTransporterBadge(Number(r.overall_score));
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{getOrgName(r.transporter_org_id)}</p>
                      <p className="text-[10px] text-muted-foreground">{r.rating_period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{Number(r.overall_score)}%</Badge>
                      <span className="text-xs">{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
TransporterRatingPanel.displayName = 'TransporterRatingPanel';

const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-sm">{label}</label>
      <span className="text-sm font-bold">{value}%</span>
    </div>
    <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary" />
  </div>
);

GreenPointsPanel.displayName = 'GreenPointsPanel';
export default GreenPointsPanel;
