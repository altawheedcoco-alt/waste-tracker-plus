import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell, MessageSquare, Truck, Users, Package, FileSignature,
  ScrollText, Wrench, ClipboardCheck, Handshake, AlertTriangle,
  CheckCircle2, Clock, Route, Car,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface OperationalAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'notification' | 'shipment' | 'driver' | 'vehicle' | 'message' | 'partner' | 'signature' | 'contract' | 'receipt' | 'work_order' | 'system';
  icon: LucideIcon;
  timestamp?: string;
  route?: string;
}

const STATUS_AR: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
  pending: 'معلقة',
  collecting: 'جاري التحميل',
};

const WASTE_AR: Record<string, string> = {
  plastic: 'بلاستيك',
  organic: 'عضوي',
  metal: 'معادن',
  paper: 'ورق',
  glass: 'زجاج',
  electronic: 'إلكتروني',
  hazardous: 'خطرة',
  mixed: 'مختلطة',
};

export const useOperationalAlerts = () => {
  const { organization, profile } = useAuth();
  const orgId = organization?.id;
  const userId = profile?.id;

  return useQuery({
    queryKey: ['operational-alerts', orgId, userId],
    enabled: !!orgId,
    refetchInterval: 30000,
    staleTime: 15000,
    queryFn: async (): Promise<OperationalAlert[]> => {
      if (!orgId) return [];
      const alerts: OperationalAlert[] = [];

      // Parallel fetch all data sources
      const [
        notifRes,
        shipmentsRes,
        driversRes,
        vehiclesRes,
        messagesRes,
        partnersRes,
        signaturesRes,
        contractsRes,
        receiptsRes,
        workOrdersRes,
      ] = await Promise.allSettled([
        // 1. Notifications (all, no limit)
        userId ? (supabase.from('notifications') as any).select('id,title,message,type,is_read,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
        // 2. Shipments
        supabase.from('shipments').select('id,shipment_number,status,waste_type,quantity,unit,driver_id,created_at,pickup_address,delivery_address').eq('transporter_id', orgId).order('created_at', { ascending: false }).limit(50),
        // 3. Drivers with profiles
        supabase.from('drivers').select('id,is_available,profile:profiles(full_name)').eq('organization_id', orgId),
        // 4. Fleet vehicles
        supabase.from('fleet_vehicles').select('id,plate_number,status,vehicle_type').eq('organization_id', orgId),
        // 5. Unread messages
        (supabase.from('direct_messages') as any).select('id,content,sender_name,created_at,is_read').eq('receiver_organization_id', orgId).eq('is_read', false).order('created_at', { ascending: false }).limit(20),
        // 6. Partners
        (supabase.from('verified_partnerships') as any).select('id,partner_org:organizations!verified_partnerships_partner_organization_id_fkey(name)').eq('organization_id', orgId).eq('status', 'active'),
        // 7. Pending signatures
        (supabase.from('signing_chain_steps') as any).select('id,step_label,status').eq('signer_org_id', orgId).eq('status', 'pending'),
        // 8. Contracts
        supabase.from('contracts').select('id,title,status,end_date').eq('organization_id', orgId),
        // 9. Receipts pending
        supabase.from('shipment_receipts').select('id,status,created_at').eq('transporter_id', orgId).eq('status', 'pending'),
        // 10. Work orders
        (supabase.from('work_orders') as any).select('id,title,status,created_at').or(`sender_org_id.eq.${orgId},recipient_org_id.eq.${orgId}`).eq('status', 'pending'),
      ]);

      // Helper to extract data safely
      const getData = (res: PromiseSettledResult<any>) =>
        res.status === 'fulfilled' ? (res.value?.data || []) : [];

      // 1. Notifications
      const notifs = getData(notifRes);
      for (const n of notifs) {
        alerts.push({
          id: `notif-${n.id}`,
          message: `${n.title || n.message}`,
          severity: n.is_read ? 'info' : 'warning',
          type: 'notification',
          icon: Bell,
          timestamp: n.created_at,
          route: '/dashboard/notifications',
        });
      }

      // 2. Shipments
      const ships = getData(shipmentsRes);
      for (const s of ships) {
        const wasteLabel = WASTE_AR[s.waste_type] || s.waste_type;
        const statusLabel = STATUS_AR[s.status] || s.status;
        const severity = ['new', 'pending'].includes(s.status) ? 'warning' : s.status === 'in_transit' ? 'info' : 'info';
        alerts.push({
          id: `ship-${s.id}`,
          message: `شحنة ${s.shipment_number} - ${wasteLabel} ${s.quantity} ${s.unit} - ${statusLabel}`,
          severity: severity as any,
          type: 'shipment',
          icon: s.status === 'in_transit' ? Route : s.status === 'new' ? Clock : Package,
          timestamp: s.created_at,
          route: `/dashboard/transporter-shipments`,
        });
      }

      // 3. Drivers
      const drivers = getData(driversRes);
      for (const d of drivers) {
        const name = d.profile?.full_name || 'سائق';
        const statusMsg = d.is_available ? 'متاح للعمل' : 'مشغول حالياً';
        // Check if driver has active shipment
        const activeShip = ships.find((s: any) => s.driver_id === d.id && ['in_transit', 'approved', 'collecting'].includes(s.status));
        const extra = activeShip ? ` - يقود شحنة ${activeShip.shipment_number}` : '';
        alerts.push({
          id: `driver-${d.id}`,
          message: `السائق ${name} - ${statusMsg}${extra}`,
          severity: 'info',
          type: 'driver',
          icon: Users,
          route: '/dashboard/transporter-drivers',
        });
      }

      // 4. Vehicles
      const vehicles = getData(vehiclesRes);
      for (const v of vehicles) {
        const statusMsg = v.status === 'active' ? 'نشطة' : v.status === 'maintenance' ? '⚠️ في الصيانة' : v.status || 'غير محدد';
        alerts.push({
          id: `vehicle-${v.id}`,
          message: `مركبة ${v.plate_number || v.vehicle_type} - ${statusMsg}`,
          severity: v.status === 'maintenance' ? 'warning' : 'info',
          type: 'vehicle',
          icon: v.status === 'maintenance' ? Wrench : Car,
          route: '/dashboard/fleet',
        });
      }

      // 5. Messages
      const messages = getData(messagesRes);
      for (const m of messages) {
        alerts.push({
          id: `msg-${m.id}`,
          message: `💬 رسالة جديدة من ${m.sender_name || 'مجهول'}: ${(m.content || '').slice(0, 50)}`,
          severity: 'warning',
          type: 'message',
          icon: MessageSquare,
          timestamp: m.created_at,
          route: '/dashboard/messages',
        });
      }

      // 6. Partners
      const partners = getData(partnersRes);
      if (partners.length > 0) {
        const names = partners.map((p: any) => p.partner_org?.name).filter(Boolean).join('، ');
        alerts.push({
          id: 'partners-summary',
          message: `لديك ${partners.length} شريك نشط: ${names || 'غير محدد'}`,
          severity: 'info',
          type: 'partner',
          icon: Handshake,
          route: '/dashboard/partners',
        });
      }

      // 7. Signatures
      const sigs = getData(signaturesRes);
      for (const s of sigs) {
        alerts.push({
          id: `sig-${s.id}`,
          message: `✍️ توقيع معلق: ${s.step_label || 'بانتظار التوقيع'}`,
          severity: 'warning',
          type: 'signature',
          icon: FileSignature,
          route: '/dashboard/signing',
        });
      }

      // 8. Contracts
      const contracts = getData(contractsRes);
      for (const c of contracts) {
        const isExpired = c.end_date && new Date(c.end_date) < new Date();
        alerts.push({
          id: `contract-${c.id}`,
          message: `${isExpired ? '⚠️ عقد منتهي' : '📄 عقد ساري'}: ${c.title || 'بدون عنوان'}`,
          severity: isExpired ? 'critical' : 'info',
          type: 'contract',
          icon: ScrollText,
          route: '/dashboard/contracts',
        });
      }

      // 9. Pending receipts
      const pendingReceipts = getData(receiptsRes);
      if (pendingReceipts.length > 0) {
        alerts.push({
          id: 'receipts-pending',
          message: `📋 ${pendingReceipts.length} إيصال بانتظار التأكيد`,
          severity: 'warning',
          type: 'receipt',
          icon: ClipboardCheck,
          route: '/dashboard/transporter-receipts',
        });
      }

      // 10. Work orders
      const workOrders = getData(workOrdersRes);
      for (const w of workOrders) {
        alerts.push({
          id: `wo-${w.id}`,
          message: `📦 أمر عمل جديد: ${w.title || 'بدون عنوان'}`,
          severity: 'warning',
          type: 'work_order',
          icon: Truck,
          timestamp: w.created_at,
          route: '/dashboard/work-orders',
        });
      }

      // Sort: warnings/critical first, then by timestamp
      alerts.sort((a, b) => {
        const sevOrder = { critical: 0, warning: 1, info: 2 };
        const diff = sevOrder[a.severity] - sevOrder[b.severity];
        if (diff !== 0) return diff;
        if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return 0;
      });

      return alerts;
    },
  });
};
