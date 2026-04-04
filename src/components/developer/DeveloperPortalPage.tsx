/**
 * DeveloperPortalPage — بوابة المطورين
 * SDK, API docs, Webhooks, API keys management
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Code, Key, Webhook, BookOpen, Copy, Eye, EyeOff,
  CheckCircle2, XCircle, Clock, Play, Terminal, Blocks,
  Globe, Shield, Zap, BarChart3, AlertTriangle, FileCode
} from 'lucide-react';
import { toast } from 'sonner';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  rateLimit: string;
}

interface WebhookEvent {
  id: string;
  event: string;
  description: string;
  enabled: boolean;
  lastTriggered?: string;
  failRate?: number;
}

const API_ENDPOINTS: APIEndpoint[] = [
  { method: 'GET', path: '/api/v1/shipments', description: 'جلب قائمة الشحنات', auth: true, rateLimit: '100/min' },
  { method: 'POST', path: '/api/v1/shipments', description: 'إنشاء شحنة جديدة', auth: true, rateLimit: '30/min' },
  { method: 'GET', path: '/api/v1/shipments/:id', description: 'تفاصيل شحنة', auth: true, rateLimit: '100/min' },
  { method: 'PUT', path: '/api/v1/shipments/:id/status', description: 'تحديث حالة الشحنة', auth: true, rateLimit: '30/min' },
  { method: 'GET', path: '/api/v1/organizations', description: 'جلب المنظمات', auth: true, rateLimit: '50/min' },
  { method: 'GET', path: '/api/v1/analytics/kpis', description: 'مؤشرات الأداء', auth: true, rateLimit: '20/min' },
  { method: 'GET', path: '/api/v1/environmental/passport', description: 'الجواز البيئي', auth: true, rateLimit: '20/min' },
  { method: 'POST', path: '/api/v1/waste/classify', description: 'تصنيف مخلفات (AI)', auth: true, rateLimit: '10/min' },
  { method: 'GET', path: '/api/v1/containers/fill-levels', description: 'مستويات امتلاء الحاويات', auth: true, rateLimit: '50/min' },
  { method: 'POST', path: '/api/v1/circular/match', description: 'مطابقة اقتصاد دائري', auth: true, rateLimit: '10/min' },
  { method: 'GET', path: '/api/v1/invoices', description: 'الفواتير', auth: true, rateLimit: '50/min' },
  { method: 'POST', path: '/api/v1/webhooks', description: 'تسجيل webhook', auth: true, rateLimit: '10/min' },
];

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'w1', event: 'shipment.created', description: 'عند إنشاء شحنة جديدة', enabled: true, lastTriggered: 'منذ 5 دقائق', failRate: 0 },
  { id: 'w2', event: 'shipment.status_changed', description: 'عند تغيير حالة الشحنة', enabled: true, lastTriggered: 'منذ 12 دقيقة', failRate: 2 },
  { id: 'w3', event: 'shipment.delivered', description: 'عند تسليم الشحنة', enabled: true, lastTriggered: 'منذ ساعة', failRate: 0 },
  { id: 'w4', event: 'invoice.generated', description: 'عند إنشاء فاتورة', enabled: false },
  { id: 'w5', event: 'container.fill_alert', description: 'عند امتلاء حاوية > 85%', enabled: true, lastTriggered: 'منذ 30 دقيقة', failRate: 0 },
  { id: 'w6', event: 'compliance.warning', description: 'تنبيه امتثال', enabled: false },
  { id: 'w7', event: 'waste.classified', description: 'عند تصنيف مخلفات بالـ AI', enabled: true, lastTriggered: 'منذ 2 ساعة', failRate: 5 },
  { id: 'w8', event: 'circular.match_found', description: 'عند إيجاد مطابقة دائرية', enabled: false },
  { id: 'w9', event: 'organization.license_expiry', description: 'تنبيه انتهاء ترخيص', enabled: true, lastTriggered: 'أمس', failRate: 0 },
  { id: 'w10', event: 'payment.received', description: 'عند استلام دفعة', enabled: false },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const SAMPLE_CODE = `// iRecycle SDK — JavaScript
import { IRecycleClient } from '@irecycle/sdk';

const client = new IRecycleClient({
  apiKey: 'ir_live_xxxxxxxxxxxx',
  baseUrl: 'https://api.irecycle.eg/v1',
});

// Get shipments
const shipments = await client.shipments.list({
  status: 'in_transit',
  limit: 20,
});

// Create a shipment
const newShipment = await client.shipments.create({
  waste_type: 'plastic',
  quantity: 500,
  unit: 'kg',
  pickup_address: 'القاهرة، مدينة نصر',
});

// Subscribe to webhook
await client.webhooks.create({
  url: 'https://your-server.com/webhook',
  events: ['shipment.delivered', 'invoice.generated'],
});`;

const DeveloperPortalPage = () => {
  const [showKey, setShowKey] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState(WEBHOOK_EVENTS);
  const demoKey = 'ir_live_sk_4f8a2b1c9d3e7f6a0b5c8d2e1f4a7b3c';

  const toggleWebhook = (id: string) => {
    setWebhookEvents(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            بوابة المطورين
          </h1>
          <p className="text-xs text-muted-foreground">Developer Portal • REST API v1 & SDK</p>
        </div>
        <Badge className="bg-emerald-600 text-white text-[10px]">
          <CheckCircle2 className="h-3 w-3 ml-1" />
          API v1.0 مستقر
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Blocks className="h-4 w-4" />} value={API_ENDPOINTS.length} label="نقطة اتصال API" />
        <StatBox icon={<Webhook className="h-4 w-4" />} value={`${webhookEvents.filter(w => w.enabled).length}/${webhookEvents.length}`} label="Webhooks نشطة" />
        <StatBox icon={<Zap className="h-4 w-4" />} value="99.9%" label="وقت التشغيل" />
        <StatBox icon={<BarChart3 className="h-4 w-4" />} value="1,247" label="طلب اليوم" />
      </div>

      <Tabs defaultValue="api" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="api" className="text-xs">API المرجع</TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs">Webhooks</TabsTrigger>
          <TabsTrigger value="keys" className="text-xs">مفاتيح API</TabsTrigger>
          <TabsTrigger value="sdk" className="text-xs">SDK & أمثلة</TabsTrigger>
        </TabsList>

        {/* API Reference */}
        <TabsContent value="api" className="space-y-2 mt-3">
          {API_ENDPOINTS.map((ep, i) => (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <Badge className={`text-[10px] font-mono h-5 w-14 justify-center ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </Badge>
                <code className="text-xs font-mono text-foreground flex-1 text-left" dir="ltr">{ep.path}</code>
                <span className="text-[10px] text-muted-foreground hidden md:inline">{ep.description}</span>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">{ep.rateLimit}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-3 mt-3">
          <Card className="border-primary/20">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm">Webhook URL</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex gap-2">
                <Input placeholder="https://your-server.com/webhook" className="text-xs font-mono" dir="ltr" />
                <Button size="sm" className="text-xs shrink-0">حفظ</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {webhookEvents.map(w => (
              <Card key={w.id} className={w.enabled ? 'border-emerald-200 dark:border-emerald-800/50' : 'opacity-60'}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Switch checked={w.enabled} onCheckedChange={() => toggleWebhook(w.id)} />
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono font-semibold" dir="ltr">{w.event}</code>
                    <p className="text-[10px] text-muted-foreground">{w.description}</p>
                  </div>
                  {w.lastTriggered && (
                    <div className="text-left shrink-0">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{w.lastTriggered}
                      </span>
                      {w.failRate !== undefined && w.failRate > 0 && (
                        <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />{w.failRate}% فشل
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="keys" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                مفتاح API الإنتاجي
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                <code className="text-xs font-mono flex-1" dir="ltr">
                  {showKey ? demoKey : '•'.repeat(40)}
                </code>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyToClipboard(demoKey)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> مشفر AES-256</span>
                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> بيئة الإنتاج</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> أُنشئ منذ 30 يوم</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-500" />
                مفتاح API التجريبي
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                <code className="text-xs font-mono flex-1" dir="ltr">ir_test_sk_sandbox_demo_key_12345</code>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyToClipboard('ir_test_sk_sandbox_demo_key_12345')}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline">
            <Key className="h-4 w-4 ml-2" />
            إنشاء مفتاح جديد
          </Button>
        </TabsContent>

        {/* SDK & Examples */}
        <TabsContent value="sdk" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  مثال SDK — JavaScript
                </CardTitle>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => copyToClipboard(SAMPLE_CODE)}>
                  <Copy className="h-3 w-3 ml-1" />نسخ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <pre className="text-[11px] font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto text-left leading-relaxed border border-border" dir="ltr">
                {SAMPLE_CODE}
              </pre>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { lang: 'JavaScript', icon: '🟨', pkg: 'npm i @irecycle/sdk' },
              { lang: 'Python', icon: '🐍', pkg: 'pip install irecycle-sdk' },
              { lang: 'PHP', icon: '🐘', pkg: 'composer require irecycle/sdk' },
              { lang: 'C#', icon: '💜', pkg: 'dotnet add iRecycle.SDK' },
              { lang: 'Go', icon: '🔵', pkg: 'go get irecycle/sdk-go' },
              { lang: 'cURL', icon: '🔗', pkg: 'REST API مباشر' },
            ].map(sdk => (
              <Card key={sdk.lang} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{sdk.icon}</div>
                  <p className="text-xs font-semibold">{sdk.lang}</p>
                  <code className="text-[9px] text-muted-foreground">{sdk.pkg}</code>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">التوثيق الكامل</p>
                <p className="text-xs text-muted-foreground">docs.irecycle.eg — مرجع شامل لكل endpoints وأمثلة تفاعلية</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs">
                <FileCode className="h-3.5 w-3.5 ml-1" />فتح
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatBox = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className="flex justify-center mb-1 text-primary">{icon}</div>
      <div className="text-sm font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default DeveloperPortalPage;
