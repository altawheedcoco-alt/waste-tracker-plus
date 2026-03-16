/**
 * SendToPartiesPopover — إرسال إشعار مزدوج (داخلي + واتساب) للجهات المعنية بالشحنة
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Loader2, Users, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ShipmentPrintData } from './types';

interface Party {
  key: string;
  label: string;
  role: string;
  name: string;
  phone: string;
  orgPhone?: string;
}

interface SendToPartiesPopoverProps {
  shipment: ShipmentPrintData;
  compact?: boolean;
}

function extractParties(shipment: ShipmentPrintData): Party[] {
  const parties: Party[] = [];

  if (shipment.generator) {
    const g = shipment.generator;
    if (g.representative_phone || g.phone) {
      parties.push({
        key: 'generator_rep',
        label: 'المُولّد',
        role: 'generator',
        name: g.representative_name || g.name,
        phone: g.representative_phone || g.phone,
        orgPhone: g.phone,
      });
    }
  }

  if (shipment.transporter) {
    const t = shipment.transporter;
    if (t.representative_phone || t.phone) {
      parties.push({
        key: 'transporter_rep',
        label: 'الناقل',
        role: 'transporter',
        name: t.representative_name || t.name,
        phone: t.representative_phone || t.phone,
        orgPhone: t.phone,
      });
    }
  }

  if (shipment.recycler) {
    const r = shipment.recycler;
    if (r.representative_phone || r.phone) {
      parties.push({
        key: 'recycler_rep',
        label: 'المُدوّر',
        role: 'recycler',
        name: r.representative_name || r.name,
        phone: r.representative_phone || r.phone,
        orgPhone: r.phone,
      });
    }
  }

  if (shipment.driver?.profile?.phone) {
    parties.push({
      key: 'driver',
      label: 'السائق',
      role: 'driver',
      name: shipment.driver.profile.full_name,
      phone: shipment.driver.profile.phone,
    });
  }

  return parties;
}

const SendToPartiesPopover = ({ shipment, compact }: SendToPartiesPopoverProps) => {
  const parties = useMemo(() => extractParties(shipment), [shipment]);
  const [selected, setSelected] = useState<Set<string>>(new Set(parties.map(p => p.key)));
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  const allSelected = selected.size === parties.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parties.map(p => p.key)));
    }
  };

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleSend = async () => {
    const targets = parties.filter(p => selected.has(p.key));
    if (!targets.length) {
      toast.warning('اختر جهة واحدة على الأقل');
      return;
    }

    setSending(true);
    try {
      const verifyUrl = `${window.location.origin}/track?number=${shipment.shipment_number}`;
      const messageText = [
        `📄 *نموذج تتبع نقل المخلفات*`,
        `📦 شحنة: ${shipment.shipment_number}`,
        `🏭 المُولّد: ${shipment.generator?.name || '-'}`,
        `🚛 الناقل: ${shipment.transporter?.name || '-'}`,
        `♻️ المُدوّر: ${shipment.recycler?.name || '-'}`,
        `📋 نوع المخلف: ${shipment.waste_type}`,
        `⚖️ الكمية: ${shipment.quantity} ${shipment.unit}`,
        ``,
        `🔗 رابط التتبع: ${verifyUrl}`,
      ].join('\n');

      // Send to each selected party via whatsapp-send edge function
      const promises = targets.map(async (party) => {
        // 1. WhatsApp via platform
        const waPromise = supabase.functions.invoke('whatsapp-send', {
          body: {
            action: 'send_to_phone',
            phone: party.phone,
            message_text: messageText,
            notification_type: 'shipment_document',
          },
        });

        // 2. Internal notification - find user by phone
        const notifPromise = supabase.from('notifications').insert({
          title: `📄 نموذج تتبع الشحنة ${shipment.shipment_number}`,
          message: `تم إرسال نموذج تتبع الشحنة ${shipment.shipment_number} إلى ${party.label} (${party.name})`,
          type: 'shipment_document',
          is_read: false,
          metadata: {
            shipment_id: shipment.id,
            shipment_number: shipment.shipment_number,
            party_role: party.role,
            party_name: party.name,
            party_phone: party.phone,
          } as any,
        });

        return Promise.allSettled([waPromise, notifPromise]);
      });

      await Promise.all(promises);

      toast.success(`✅ تم إرسال النموذج إلى ${targets.length} جهة`, {
        description: targets.map(t => `${t.label}: ${t.name}`).join(' • '),
      });
      setOpen(false);
    } catch (err: any) {
      console.error('Send to parties failed:', err);
      toast.error('فشل الإرسال', { description: err.message });
    } finally {
      setSending(false);
    }
  };

  if (!parties.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={compact ? 'sm' : 'default'} className={compact ? 'gap-1.5 h-8' : 'gap-2'}>
          <Send className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {compact ? 'إرسال للجهات' : 'إرسال للجهات'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" dir="rtl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              إرسال النموذج للجهات
            </h4>
            <span className="text-[10px] text-muted-foreground">
              {selected.size}/{parties.length}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            سيتم إرسال إشعار داخلي + رسالة واتساب عبر المنصة
          </p>

          {/* Select all */}
          <label className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-accent/50 transition-colors">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
            />
            <span className="text-xs font-medium">تحديد الكل</span>
            <CheckCheck className="w-3.5 h-3.5 text-muted-foreground mr-auto" />
          </label>

          <div className="border-t" />

          {/* Party list */}
          <div className="space-y-1">
            {parties.map((party) => (
              <label
                key={party.key}
                className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={selected.has(party.key)}
                  onCheckedChange={() => toggle(party.key)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">{party.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{party.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{party.phone}</p>
                </div>
              </label>
            ))}
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || selected.size === 0}
            className="w-full gap-2"
            size="sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'جاري الإرسال...' : `إرسال إلى ${selected.size} جهة`}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SendToPartiesPopover;
