import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell, MessageSquare, Truck, Users, Package, FileSignature,
  ScrollText, Wrench, ClipboardCheck, Handshake, AlertTriangle,
  CheckCircle2, Clock, Route, Car, Activity, FileCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AlertDetail {
  label: string;
  value: string;
}

export interface OperationalAlert {
  id: string;
  message: string;
  subtitle?: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'notification' | 'shipment' | 'driver' | 'vehicle' | 'message' | 'partner' | 'signature' | 'contract' | 'receipt' | 'work_order' | 'system' | 'activity' | 'log' | 'approval';
  icon: LucideIcon;
  timestamp?: string;
  route?: string;
  isRead?: boolean;
  details?: AlertDetail[];
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
  registered: 'مسجلة',
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

const ACTION_AR: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  reject: 'رفض',
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  view: 'عرض',
  export: 'تصدير',
  import: 'استيراد',
  sign: 'توقيع',
  send: 'إرسال',
  receive: 'استلام',
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
        activityLogsRes,
        shipmentLogsRes,
        approvalRequestsRes,
      ] = await Promise.allSettled([
        // 1. Notifications (raised to 500)
        userId
          ? (supabase.from('notifications') as any)
              .select('id,title,message,type,is_read,created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(500)
          : Promise.resolve({ data: [] }),
        // 2. Shipments (raised to 200)
        supabase
          .from('shipments')
          .select('id,shipment_number,status,waste_type,quantity,unit,driver_id,created_at,pickup_address,delivery_address')
          .eq('transporter_id', orgId)
          .order('created_at', { ascending: false })
          .limit(200),
        // 3. Drivers with profiles
        supabase
          .from('drivers')
          .select('id,is_available,profile:profiles(full_name)')
          .eq('organization_id', orgId),
        // 4. Fleet vehicles
        supabase
          .from('fleet_vehicles')
          .select('id,plate_number,status,vehicle_type')
          .eq('organization_id', orgId),
        // 5. Unread messages
        (supabase.from('direct_messages') as any)
          .select('id,content,created_at,is_read,sender_organization_id,sender_org:organizations!direct_messages_sender_organization_id_fkey(name)')
          .eq('receiver_organization_id', orgId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(50),
        // 6. Partners
        (async () => {
          const { data } = await supabase
            .from('verified_partnerships')
            .select('requester_org_id,partner_org_id')
            .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
            .eq('status', 'active');
          const partnerOrgIds = (data || []).map((p: any) =>
            p.requester_org_id === orgId ? p.partner_org_id : p.requester_org_id
          );
          if (partnerOrgIds.length === 0) return { data: [] };
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id,name')
            .in('id', partnerOrgIds);
          return { data: orgs || [] };
        })(),
        // 7. Pending signatures
        supabase
          .from('signing_chain_steps')
          .select('id,signer_name,status,chain_id')
          .eq('signer_org_id', orgId)
          .eq('status', 'pending'),
        // 8. Contracts
        supabase
          .from('contracts')
          .select('id,title,status,end_date')
          .eq('organization_id', orgId),
        // 9. Receipts pending
        supabase
          .from('shipment_receipts')
          .select('id,status,created_at')
          .eq('transporter_id', orgId)
          .eq('status', 'pending'),
        // 10. Work orders
        supabase
          .from('work_orders')
          .select('id,order_number,waste_description,status,created_at')
          .eq('organization_id', orgId)
          .eq('status', 'pending'),
        // 11. Activity Logs (NEW)
        supabase
          .from('activity_logs')
          .select('id,action,action_type,resource_type,resource_id,details,created_at,user_id')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(200),
        // 12. Shipment Logs (NEW)
        supabase
          .from('shipment_logs')
          .select('id,shipment_id,action,old_status,new_status,details,created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        // 13. Approval Requests (NEW)
        supabase
          .from('approval_requests')
          .select('id,request_type,request_title,status,priority,created_at')
          .eq('requester_organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

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
          isRead: n.is_read,
        });
      }

      // 2. Shipments
      const ships = getData(shipmentsRes);
      for (const s of ships) {
        const wasteLabel = WASTE_AR[s.waste_type] || s.waste_type;
        const statusLabel = STATUS_AR[s.status] || s.status;
        const severity = ['new', 'pending'].includes(s.status) ? 'warning' : 'info';
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
          route: '/dashboard/transporter-drivers',
        });
      }

      // 5. Messages
      const messages = getData(messagesRes);
      for (const m of messages) {
        const senderName = m.sender_org?.name || 'مجهول';
        alerts.push({
          id: `msg-${m.id}`,
          message: `💬 رسالة جديدة من ${senderName}: ${(m.content || '').slice(0, 50)}`,
          severity: 'warning',
          type: 'message',
          icon: MessageSquare,
          timestamp: m.created_at,
          route: '/dashboard/chat',
          isRead: m.is_read,
        });
      }

      // 6. Partners
      const partners = getData(partnersRes);
      if (partners.length > 0) {
        const names = partners.map((p: any) => p.name).filter(Boolean).join('، ');
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
          message: `✍️ توقيع معلق: ${s.signer_name || 'بانتظار التوقيع'}`,
          severity: 'warning',
          type: 'signature',
          icon: FileSignature,
          route: '/dashboard/signing-inbox',
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
          message: `📦 أمر عمل ${w.order_number}: ${w.waste_description || 'بدون وصف'}`,
          severity: 'warning',
          type: 'work_order',
          icon: Truck,
          timestamp: w.created_at,
          route: '/dashboard/my-requests',
        });
      }

      // 11. Activity Logs (NEW)
      const activityLogs = getData(activityLogsRes);
      for (const log of activityLogs) {
        const actionLabel = ACTION_AR[log.action_type] || log.action_type;
        const resourceLabel = log.resource_type || '';
        alerts.push({
          id: `activity-${log.id}`,
          message: `📝 ${actionLabel} ${resourceLabel}: ${log.action}`,
          severity: 'info',
          type: 'activity',
          icon: Activity,
          timestamp: log.created_at,
        });
      }

      // 12. Shipment Logs (NEW)
      const shipLogs = getData(shipmentLogsRes);
      for (const log of shipLogs) {
        const oldStatus = STATUS_AR[log.old_status] || log.old_status || '—';
        const newStatus = STATUS_AR[log.new_status] || log.new_status || '—';
        alerts.push({
          id: `shiplog-${log.id}`,
          message: `🔄 شحنة تحولت من "${oldStatus}" إلى "${newStatus}": ${log.action || ''}`,
          severity: 'info',
          type: 'log',
          icon: Route,
          timestamp: log.created_at,
          route: '/dashboard/transporter-shipments',
        });
      }

      // 13. Approval Requests (NEW)
      const approvalReqs = getData(approvalRequestsRes);
      for (const req of approvalReqs) {
        const isPending = req.status === 'pending';
        alerts.push({
          id: `approval-${req.id}`,
          message: `${isPending ? '🔔' : '✅'} طلب ${req.request_title || req.request_type}${isPending ? ' - بانتظار الموافقة' : ''}`,
          severity: isPending ? 'warning' : 'info',
          type: 'approval',
          icon: FileCheck,
          timestamp: req.created_at,
        });
      }

      // Sort: critical first, then warnings, then by timestamp
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
