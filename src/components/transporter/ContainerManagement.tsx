import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Box, Plus, MapPin, Wrench, AlertTriangle } from 'lucide-react';

interface Container {
  id: string;
  container_code: string;
  container_type: string;
  capacity_liters: number | null;
  current_location: string | null;
  status: string;
  condition: string | null;
  last_cleaned_at: string | null;
  next_maintenance_at: string | null;
}

const CONTAINER_TYPES = [
  { value: 'standard', labelAr: 'قياسي', labelEn: 'Standard' },
  { value: 'hazardous', labelAr: 'خطرة', labelEn: 'Hazardous' },
  { value: 'medical', labelAr: 'طبي', labelEn: 'Medical' },
  { value: 'compactor', labelAr: 'ضاغط', labelEn: 'Compactor' },
  { value: 'roll_off', labelAr: 'رول أوف', labelEn: 'Roll-Off' },
  { value: 'skip', labelAr: 'سكيب', labelEn: 'Skip' },
  { value: 'drum', labelAr: 'برميل', labelEn: 'Drum' },
];

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  available: { labelAr: 'متاح', labelEn: 'Available', color: 'bg-emerald-500/10 text-emerald-700' },
  deployed: { labelAr: 'منشور', labelEn: 'Deployed', color: 'bg-blue-500/10 text-blue-700' },
  in_transit: { labelAr: 'قيد النقل', labelEn: 'In Transit', color: 'bg-amber-500/10 text-amber-700' },
  maintenance: { labelAr: 'صيانة', labelEn: 'Maintenance', color: 'bg-purple-500/10 text-purple-700' },
  retired: { labelAr: 'متقاعد', labelEn: 'Retired', color: 'bg-muted text-muted-foreground' },
  lost: { labelAr: 'مفقود', labelEn: 'Lost', color: 'bg-destructive/10 text-destructive' },
};

const ContainerManagement = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState('standard');
  const [formCapacity, setFormCapacity] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const fetchContainers = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);

    let query = supabase
      .from('fleet_containers')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data } = await query.limit(100);
    setContainers((data || []) as any);
    setLoading(false);
  }, [organization?.id, filterStatus]);

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  const handleAdd = async () => {
    if (!organization?.id || !formCode) return;

    const { error } = await supabase.from('fleet_containers').insert({
      organization_id: organization.id,
      container_code: formCode,
      container_type: formType,
      capacity_liters: formCapacity ? parseFloat(formCapacity) : null,
      current_location: formLocation || null,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(isAr ? 'تم إضافة الحاوية' : 'Container added');
    setShowAddDialog(false);
    setFormCode('');
    setFormType('standard');
    setFormCapacity('');
    setFormLocation('');
    fetchContainers();
  };

  // Stats
  const statusCounts = containers.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const needsMaintenance = containers.filter(c => {
    if (!c.next_maintenance_at) return false;
    return new Date(c.next_maintenance_at) <= new Date();
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Box className="w-5 h-5 text-primary" />
          {isAr ? 'إدارة الحاويات' : 'Container Management'}
          <Badge variant="outline">{containers.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{isAr ? v.labelAr : v.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 me-1" />
            {isAr ? 'إضافة' : 'Add'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => {
            const config = STATUS_CONFIG[status];
            return (
              <Badge key={status} variant="outline" className={`${config?.color || ''} text-xs`}>
                {isAr ? config?.labelAr : config?.labelEn}: {count}
              </Badge>
            );
          })}
          {needsMaintenance.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Wrench className="w-3 h-3 me-1" />
              {needsMaintenance.length} {isAr ? 'تحتاج صيانة' : 'need maintenance'}
            </Badge>
          )}
        </div>

        {/* Container list */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : containers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد حاويات مسجلة' : 'No containers registered'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {containers.map(c => {
              const statusConfig = STATUS_CONFIG[c.status];
              const typeConfig = CONTAINER_TYPES.find(t => t.value === c.container_type);
              const overdue = c.next_maintenance_at && new Date(c.next_maintenance_at) <= new Date();
              return (
                <div key={c.id} className={`p-3 rounded-lg border hover:bg-accent/50 transition-colors ${overdue ? 'border-destructive/50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-bold text-sm">{c.container_code}</p>
                    <Badge variant="outline" className={statusConfig?.color || ''}>
                      {isAr ? statusConfig?.labelAr : statusConfig?.labelEn}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📦 {isAr ? typeConfig?.labelAr : typeConfig?.labelEn} {c.capacity_liters ? `· ${c.capacity_liters}L` : ''}</p>
                    {c.current_location && (
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.current_location}</p>
                    )}
                    {overdue && (
                      <p className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {isAr ? 'متأخرة عن الصيانة' : 'Overdue maintenance'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إضافة حاوية جديدة' : 'Add Container'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{isAr ? 'كود الحاوية' : 'Container Code'}</Label>
              <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="CNT-001" />
            </div>
            <div>
              <Label>{isAr ? 'النوع' : 'Type'}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'السعة (لتر)' : 'Capacity (L)'}</Label>
              <Input type="number" value={formCapacity} onChange={e => setFormCapacity(e.target.value)} />
            </div>
            <div>
              <Label>{isAr ? 'الموقع الحالي' : 'Current Location'}</Label>
              <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAdd} disabled={!formCode}>{isAr ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContainerManagement;
