import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, Plus, Trash2, Loader2, Send, Save, AlertTriangle, Building2, Truck, Recycle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WorkOrderItem {
  id: string;
  waste_type: string;
  waste_description: string;
  quantity: number;
  unit: string;
  is_hazardous: boolean;
  packaging_type: string;
  notes: string;
}

const CreateWorkOrderDialog = ({ open, onOpenChange }: CreateWorkOrderDialogProps) => {
  const { profile, organization } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [wasteType, setWasteType] = useState('');
  const [wasteDescription, setWasteDescription] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('ton');
  const [isHazardous, setIsHazardous] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('anytime');
  const [urgency, setUrgency] = useState('normal');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [requiresEquipment, setRequiresEquipment] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState('');

  // Items
  const [items, setItems] = useState<WorkOrderItem[]>([]);

  // Partners
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (open && profile?.organization_id) {
      loadPartners();
    }
  }, [open, profile?.organization_id]);

  const loadPartners = async () => {
    if (!profile?.organization_id) return;
    setLoadingPartners(true);
    try {
      const { data: links } = await supabase
        .from('partner_links')
        .select('partner_organization_id, organization_id, partner_type')
        .or(`organization_id.eq.${profile.organization_id},partner_organization_id.eq.${profile.organization_id}`)
        .eq('status', 'active');

      if (!links?.length) { setPartners([]); setLoadingPartners(false); return; }

      const partnerOrgIds = links.map(l =>
        l.organization_id === profile.organization_id ? l.partner_organization_id : l.organization_id
      ).filter(Boolean);

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', partnerOrgIds)
        .eq('is_active', true);

      setPartners(orgs || []);
    } catch { /* ignore */ }
    setLoadingPartners(false);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      waste_type: wasteType || '',
      waste_description: '',
      quantity: 0,
      unit: 'ton',
      is_hazardous: false,
      packaging_type: '',
      notes: '',
    }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const togglePartner = (id: string) => {
    setSelectedPartners(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setStep(1);
    setWasteType(''); setWasteDescription(''); setEstimatedQuantity(''); setUnit('ton');
    setIsHazardous(false); setPickupLocation(''); setPreferredDate('');
    setPreferredTimeSlot('anytime'); setUrgency('normal'); setSpecialInstructions('');
    setRequiresEquipment(false); setEquipmentDetails(''); setItems([]); setSelectedPartners([]);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!profile?.organization_id) return;
    if (!isDraft && selectedPartners.length === 0) {
      toast.error(t('workOrder.selectPartners'));
      return;
    }
    setLoading(true);
    try {
      const { data: wo, error: woErr } = await supabase
        .from('work_orders')
        .insert({
          order_number: '',
          organization_id: profile.organization_id,
          created_by: profile.user_id,
          waste_type: wasteType,
          waste_description: wasteDescription,
          estimated_quantity: parseFloat(estimatedQuantity) || 0,
          unit,
          is_hazardous: isHazardous,
          pickup_location: pickupLocation,
          preferred_date: preferredDate || null,
          preferred_time_slot: preferredTimeSlot,
          urgency,
          special_instructions: specialInstructions,
          requires_special_equipment: requiresEquipment,
          equipment_details: requiresEquipment ? equipmentDetails : null,
          status: isDraft ? 'draft' : 'sent',
          sent_at: isDraft ? null : new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (woErr) throw woErr;

      // Insert items
      if (items.length > 0) {
        await supabase.from('work_order_items').insert(
          items.map(item => ({
            work_order_id: wo.id,
            waste_type: item.waste_type,
            waste_description: item.waste_description,
            quantity: item.quantity,
            unit: item.unit,
            is_hazardous: item.is_hazardous,
            packaging_type: item.packaging_type,
            notes: item.notes,
          }))
        );
      }

      // Insert recipients
      if (!isDraft && selectedPartners.length > 0) {
        const recipientRows = selectedPartners.map(partnerId => {
          const partner = partners.find(p => p.id === partnerId);
          return {
            work_order_id: wo.id,
            recipient_organization_id: partnerId,
            recipient_type: partner?.organization_type === 'transporter' ? 'transporter'
              : partner?.organization_type === 'recycler' ? 'recycler' : 'disposal',
            status: 'pending',
          };
        });
        await supabase.from('work_order_recipients').insert(recipientRows);
      }

      // Log activity
      await supabase.from('work_order_activity').insert({
        work_order_id: wo.id,
        actor_user_id: profile.user_id,
        actor_organization_id: profile.organization_id,
        action: isDraft ? 'created_draft' : 'sent',
        details: { partners_count: selectedPartners.length },
      } as any);

      toast.success(isDraft ? t('workOrder.savedDraft') : t('workOrder.sentSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const getPartnerIcon = (type: string) => {
    if (type === 'transporter') return <Truck className="w-4 h-4" />;
    if (type === 'recycler') return <Recycle className="w-4 h-4" />;
    return <Building2 className="w-4 h-4" />;
  };

  const getPartnerTypeLabel = (type: string) => {
    if (type === 'transporter') return t('workOrder.transporter');
    if (type === 'recycler') return t('workOrder.recycler');
    return t('workOrder.disposal');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t('workOrder.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('workOrder.createDesc')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-1">
          {step === 1 && (
            <div className="space-y-4">
              {/* Main waste info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('workOrder.wasteType')} *</Label>
                  <Input value={wasteType} onChange={e => setWasteType(e.target.value)} placeholder={t('workOrder.wasteType')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('workOrder.estimatedQty')} *</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={estimatedQuantity} onChange={e => setEstimatedQuantity(e.target.value)} className="flex-1" />
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ton">{t('workOrder.ton')}</SelectItem>
                        <SelectItem value="kg">{t('workOrder.kg')}</SelectItem>
                        <SelectItem value="liter">{t('workOrder.liter')}</SelectItem>
                        <SelectItem value="piece">{t('workOrder.piece')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t('workOrder.wasteDesc')}</Label>
                <Textarea value={wasteDescription} onChange={e => setWasteDescription(e.target.value)} rows={2} />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10">
                <Switch checked={isHazardous} onCheckedChange={setIsHazardous} />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <Label className="cursor-pointer">{t('workOrder.isHazardous')}</Label>
                </div>
              </div>

              {/* Location & Scheduling */}
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('workOrder.pickupLocation')}</Label>
                  <Input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('workOrder.preferredDate')}</Label>
                  <Input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('workOrder.preferredTime')}</Label>
                  <Select value={preferredTimeSlot} onValueChange={setPreferredTimeSlot}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">{t('workOrder.anytime')}</SelectItem>
                      <SelectItem value="morning">{t('workOrder.morning')}</SelectItem>
                      <SelectItem value="afternoon">{t('workOrder.afternoon')}</SelectItem>
                      <SelectItem value="evening">{t('workOrder.evening')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('workOrder.urgency')}</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('workOrder.urgencyLow')}</SelectItem>
                      <SelectItem value="normal">{t('workOrder.urgencyNormal')}</SelectItem>
                      <SelectItem value="high">{t('workOrder.urgencyHigh')}</SelectItem>
                      <SelectItem value="urgent">{t('workOrder.urgencyUrgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t('workOrder.specialInstructions')}</Label>
                <Textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={2} />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Switch checked={requiresEquipment} onCheckedChange={setRequiresEquipment} />
                <Label className="cursor-pointer">{t('workOrder.requiresEquipment')}</Label>
              </div>
              {requiresEquipment && (
                <Input value={equipmentDetails} onChange={e => setEquipmentDetails(e.target.value)} placeholder={t('workOrder.equipmentDetails')} />
              )}

              {/* Additional Items */}
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('workOrder.items')}</Label>
                <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" /> {t('workOrder.addItem')}
                </Button>
              </div>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">{t('workOrder.noItems')}</p>
              )}
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 border rounded-lg space-y-2 relative">
                  <Button size="icon" variant="ghost" className="absolute top-1 left-1 w-6 h-6" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder={t('workOrder.wasteType')} value={item.waste_type} onChange={e => updateItem(item.id, 'waste_type', e.target.value)} />
                    <Input type="number" placeholder={t('workOrder.estimatedQty')} value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                    <Select value={item.packaging_type || ''} onValueChange={v => updateItem(item.id, 'packaging_type', v)}>
                      <SelectTrigger><SelectValue placeholder={t('workOrder.packaging')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drum">{t('workOrder.packagingDrum')}</SelectItem>
                        <SelectItem value="bag">{t('workOrder.packagingBag')}</SelectItem>
                        <SelectItem value="container">{t('workOrder.packagingContainer')}</SelectItem>
                        <SelectItem value="bulk">{t('workOrder.packagingBulk')}</SelectItem>
                        <SelectItem value="other">{t('workOrder.packagingOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('workOrder.selectPartners')}</Label>
              <p className="text-sm text-muted-foreground">{t('workOrder.selectPartnersDesc')}</p>
              {loadingPartners ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : partners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>{t('workOrder.noOrders')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {partners.map(partner => (
                    <div
                      key={partner.id}
                      onClick={() => togglePartner(partner.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPartners.includes(partner.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox checked={selectedPartners.includes(partner.id)} />
                      <div className="flex items-center gap-2 flex-1">
                        {getPartnerIcon(partner.organization_type)}
                        <div>
                          <p className="font-medium text-sm">{partner.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {getPartnerTypeLabel(partner.organization_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-3 border-t">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading || !wasteType}>
                <Save className="w-4 h-4 mr-1" /> {t('workOrder.saveDraft')}
              </Button>
              <Button onClick={() => setStep(2)} disabled={!wasteType || !estimatedQuantity}>
                {t('common.next')} →
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← {t('common.previous')}
              </Button>
              <Button onClick={() => handleSubmit(false)} disabled={loading || selectedPartners.length === 0}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                {loading ? t('workOrder.sending') : t('workOrder.sendOrder')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkOrderDialog;
