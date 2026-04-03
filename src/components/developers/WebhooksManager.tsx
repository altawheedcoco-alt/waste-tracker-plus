import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Webhook, Plus, Activity, CheckCircle2, XCircle, Clock,
  RotateCcw, Eye, Trash2, Copy, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at?: string;
  last_status_code?: number;
  failure_count: number;
  created_at: string;
}

const SUPPORTED_EVENTS = [
  { group: 'الشحنات', events: ['shipment.created', 'shipment.status_changed', 'shipment.confirmed'] },
  { group: 'الفواتير', events: ['invoice.created', 'invoice.paid', 'invoice.overdue'] },
  { group: 'العقود', events: ['contract.signed', 'contract.expired'] },
  { group: 'أوامر العمل', events: ['work_order.created', 'work_order.accepted', 'work_order.completed'] },
  { group: 'الحاويات', events: ['container.overflow', 'container.emptied'] },
  { group: 'السائقين', events: ['driver.assigned', 'driver.arrived', 'driver.departed'] },
  { group: 'المدفوعات', events: ['payment.received', 'payment.processed'] },
  { group: 'الأعضاء', events: ['member.joined', 'member.removed'] },
  { group: 'المستندات', events: ['document.uploaded', 'document.verified'] },
];

const DEMO_WEBHOOKS: WebhookConfig[] = [
  {
    id: '1', url: 'https://erp.example.com/api/webhook/irecycle',
    events: ['shipment.created', 'shipment.status_changed', 'invoice.created'],
    is_active: true, last_triggered_at: '2026-04-03T10:30:00Z',
    last_status_code: 200, failure_count: 0, created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: '2', url: 'https://accounting.example.com/hooks/payments',
    events: ['payment.received', 'payment.processed', 'invoice.paid'],
    is_active: true, last_triggered_at: '2026-04-02T14:20:00Z',
    last_status_code: 200, failure_count: 0, created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: '3', url: 'https://old-system.example.com/callback',
    events: ['shipment.confirmed'],
    is_active: false, last_triggered_at: '2026-03-10T08:00:00Z',
    last_status_code: 500, failure_count: 5, created_at: '2025-12-01T00:00:00Z',
  },
];

const DEMO_LOGS = [
  { id: '1', event: 'shipment.created', status: 200, time: 'منذ 3 ساعات', attempt: 1 },
  { id: '2', event: 'invoice.created', status: 200, time: 'منذ 5 ساعات', attempt: 1 },
  { id: '3', event: 'shipment.status_changed', status: 200, time: 'منذ 6 ساعات', attempt: 1 },
  { id: '4', event: 'payment.received', status: 200, time: 'منذ يوم', attempt: 1 },
  { id: '5', event: 'shipment.confirmed', status: 500, time: 'منذ 3 أيام', attempt: 3 },
];

const WebhooksManager = () => {
  const [webhooks] = useState(DEMO_WEBHOOKS);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Webhook className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{webhooks.length}</div>
            <p className="text-[10px] text-muted-foreground">Webhooks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">{webhooks.filter(w => w.is_active).length}</div>
            <p className="text-[10px] text-muted-foreground">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">22</div>
            <p className="text-[10px] text-muted-foreground">حدث مدعوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <Button size="sm" className="w-full" onClick={() => setShowCreate(!showCreate)}>
        <Plus className="h-4 w-4 ml-1" />
        إضافة Webhook جديد
      </Button>

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.map(wh => (
          <Card key={wh.id} className={!wh.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${wh.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <Badge variant={wh.last_status_code === 200 ? 'default' : 'destructive'} className="text-[9px] h-5">
                    {wh.last_status_code === 200 ? 'يعمل' : `خطأ ${wh.last_status_code}`}
                  </Badge>
                </div>
                <Switch checked={wh.is_active} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate" dir="ltr">
                  {wh.url}
                </code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                  navigator.clipboard.writeText(wh.url);
                  toast.success('تم النسخ');
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {wh.events.map(e => (
                  <Badge key={e} variant="outline" className="text-[8px] h-4 px-1.5">
                    {e}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  آخر تشغيل: {wh.last_triggered_at
                    ? new Date(wh.last_triggered_at).toLocaleDateString('ar-EG')
                    : 'لم يعمل بعد'}
                </span>
                {wh.failure_count > 0 && (
                  <span className="text-red-500">فشل: {wh.failure_count}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Logs */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            سجل التسليم الأخير
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {DEMO_LOGS.map(log => (
              <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  {log.status === 200 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <code className="text-xs">{log.event}</code>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {log.attempt > 1 && <span className="text-amber-600">محاولة {log.attempt}</span>}
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported Events */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">الأحداث المدعومة (22 حدث)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-3">
            {SUPPORTED_EVENTS.map(group => (
              <div key={group.group}>
                <p className="text-xs font-semibold mb-1">{group.group}</p>
                <div className="flex flex-wrap gap-1">
                  {group.events.map(e => (
                    <Badge key={e} variant="secondary" className="text-[9px] h-5" dir="ltr">{e}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksManager;
