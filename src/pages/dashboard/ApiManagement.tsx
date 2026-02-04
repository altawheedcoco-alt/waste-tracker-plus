import { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Key,
  Plus,
  BookOpen,
  Activity,
  ExternalLink,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useApiKeys, useApiRequestLogs } from '@/hooks/useApiKeys';
import { CreateApiKeyDialog } from '@/components/api/CreateApiKeyDialog';
import { ApiKeyCard } from '@/components/api/ApiKeyCard';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ApiManagement = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { apiKeys, isLoading } = useApiKeys();
  const { data: requestLogs, isLoading: logsLoading } = useApiRequestLogs();

  const apiBaseUrl = `${window.location.origin.replace('id-preview--', '')}/functions/v1/public-api`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API مفتوح</h1>
            <p className="text-muted-foreground">إدارة مفاتيح API والتكامل مع الأنظمة الخارجية</p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إنشاء مفتاح جديد
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiKeys?.length || 0}</p>
              <p className="text-sm text-muted-foreground">مفاتيح API</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiKeys?.filter(k => k.is_active).length || 0}</p>
              <p className="text-sm text-muted-foreground">مفاتيح نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{requestLogs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">طلب (آخر 24 ساعة)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {requestLogs?.length ? Math.round(requestLogs.reduce((a, b) => a + (b.response_time_ms || 0), 0) / requestLogs.length) : 0}ms
              </p>
              <p className="text-sm text-muted-foreground">متوسط الاستجابة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keys" dir="rtl">
        <TabsList>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            مفاتيح API
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            التوثيق
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            سجل الطلبات
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : apiKeys?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">لا توجد مفاتيح API</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  أنشئ مفتاح API للسماح للأنظمة الخارجية بالوصول لبياناتك
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء أول مفتاح
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys?.map((key) => (
                <ApiKeyCard key={key.id} apiKey={key} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                توثيق API
              </CardTitle>
              <CardDescription>
                دليل استخدام API المفتوح للتكامل مع الأنظمة الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Base URL */}
                <div>
                  <h3 className="font-medium mb-2">عنوان API الأساسي</h3>
                  <code className="block p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {apiBaseUrl}
                  </code>
                </div>

                {/* Authentication */}
                <div>
                  <h3 className="font-medium mb-2">المصادقة</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    أضف مفتاح API في الـ header كالتالي:
                  </p>
                  <code className="block p-3 bg-muted rounded-lg text-sm font-mono">
                    x-api-key: irec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </code>
                </div>

                {/* Endpoints */}
                <div>
                  <h3 className="font-medium mb-3">نقاط الوصول (Endpoints)</h3>
                  <div className="space-y-3">
                    <EndpointDoc
                      method="GET"
                      path="/shipments"
                      description="عرض قائمة الشحنات"
                      scope="shipments:read"
                    />
                    <EndpointDoc
                      method="GET"
                      path="/shipments/:id"
                      description="عرض تفاصيل شحنة"
                      scope="shipments:read"
                    />
                    <EndpointDoc
                      method="POST"
                      path="/shipments"
                      description="إنشاء شحنة جديدة"
                      scope="shipments:write"
                    />
                    <EndpointDoc
                      method="PUT"
                      path="/shipments/:id"
                      description="تحديث شحنة"
                      scope="shipments:write"
                    />
                    <EndpointDoc
                      method="GET"
                      path="/invoices"
                      description="عرض الفواتير"
                      scope="accounts:read"
                    />
                    <EndpointDoc
                      method="GET"
                      path="/reports/summary"
                      description="تقرير ملخص الشحنات"
                      scope="reports:read"
                    />
                    <EndpointDoc
                      method="GET"
                      path="/reports/financial"
                      description="التقرير المالي"
                      scope="reports:read"
                    />
                    <EndpointDoc
                      method="GET"
                      path="/organization"
                      description="بيانات المنشأة"
                      scope="organizations:read"
                    />
                  </div>
                </div>

                {/* Example */}
                <div>
                  <h3 className="font-medium mb-2">مثال باستخدام cURL</h3>
                  <pre className="p-3 bg-muted rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X GET "${apiBaseUrl}/shipments" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>

                {/* Rate Limiting */}
                <div>
                  <h3 className="font-medium mb-2">حدود الاستخدام</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• الحد الافتراضي: 60 طلب في الدقيقة</li>
                    <li>• يمكن تخصيص الحد لكل مفتاح</li>
                    <li>• Header للاطلاع على الحد المتبقي: X-Rate-Limit-Remaining</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Request Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                سجل الطلبات
              </CardTitle>
              <CardDescription>آخر 100 طلب على API</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : requestLogs?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد طلبات حتى الآن
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {requestLogs?.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={log.status_code < 400 ? 'default' : 'destructive'}
                            className="font-mono"
                          >
                            {log.status_code}
                          </Badge>
                          <Badge variant="outline" className="font-mono">
                            {log.method}
                          </Badge>
                          <span className="font-mono">{log.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{log.response_time_ms}ms</span>
                          <span>
                            {format(new Date(log.created_at), 'HH:mm:ss', { locale: ar })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateApiKeyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </motion.div>
  );
};

function EndpointDoc({ method, path, description, scope }: { method: string; path: string; description: string; scope: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge
          variant={method === 'GET' ? 'default' : method === 'POST' ? 'secondary' : 'outline'}
          className="font-mono w-16 justify-center"
        >
          {method}
        </Badge>
        <code className="font-mono text-sm">{path}</code>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <Badge variant="outline" className="text-xs">{scope}</Badge>
    </div>
  );
}

export default ApiManagement;
