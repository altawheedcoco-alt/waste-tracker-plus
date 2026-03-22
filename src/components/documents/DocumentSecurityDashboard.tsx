/**
 * DocumentSecurityDashboard — لوحة إدارة أمان المستندات المركزية
 * تعرض: جميع المستندات المحمية، سجلات الوصول، إحصائيات الأمان
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Eye, Download, Printer,
  Droplets, Bell, AlertTriangle, Clock, User, FileText, Activity,
  CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DocumentProtectionSettings from './DocumentProtectionSettings';

const ACTION_ICONS: Record<string, any> = {
  view: Eye,
  download: Download,
  print: Printer,
  pin_attempt_failed: XCircle,
  pin_verified_download: CheckCircle2,
  pin_verified_print: CheckCircle2,
  pin_verified_view: CheckCircle2,
  download_blocked: ShieldAlert,
  print_blocked: ShieldAlert,
  view_blocked: ShieldAlert,
};

const ACTION_LABELS: Record<string, string> = {
  view: 'معاينة',
  download: 'تحميل',
  print: 'طباعة',
  pin_attempt_failed: 'محاولة PIN فاشلة',
  pin_verified_download: 'تحميل بعد PIN',
  pin_verified_print: 'طباعة بعد PIN',
  pin_verified_view: 'معاينة بعد PIN',
  download_blocked: 'تحميل محظور',
  print_blocked: 'طباعة محظورة',
  view_blocked: 'معاينة محظورة',
};

const DocumentSecurityDashboard = () => {
  const { organization } = useAuth();
  const [protectedDocs, setProtectedDocs] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProtected: 0,
    totalWithPin: 0,
    totalWithWatermark: 0,
    totalBlocked: 0,
    totalAccesses: 0,
    failedAttempts: 0,
  });

  const orgId = organization?.id;

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      // Fetch protected documents
      const { data: docs } = await supabase
        .from('organization_documents')
        .select('id, file_name, document_type, protection_enabled, protection_pin, allow_view, allow_download, allow_print, watermark_enabled, notify_on_download, created_at')
        .eq('organization_id', orgId)
        .eq('protection_enabled', true)
        .order('created_at', { ascending: false });

      setProtectedDocs((docs as any[]) || []);

      // Fetch access logs
      const { data: logs } = await supabase
        .from('document_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setAccessLogs((logs as any[]) || []);

      // Calculate stats
      const allDocs = (docs as any[]) || [];
      const allLogs = (logs as any[]) || [];

      setStats({
        totalProtected: allDocs.length,
        totalWithPin: allDocs.filter((d: any) => d.protection_pin).length,
        totalWithWatermark: allDocs.filter((d: any) => d.watermark_enabled).length,
        totalBlocked: allLogs.filter((l: any) => l.action_type?.includes('blocked')).length,
        totalAccesses: allLogs.length,
        failedAttempts: allLogs.filter((l: any) => l.success === false).length,
      });
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalProtected}</p>
            <p className="text-[10px] text-muted-foreground">مستند محمي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Lock className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalWithPin}</p>
            <p className="text-[10px] text-muted-foreground">برمز PIN</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalWithWatermark}</p>
            <p className="text-[10px] text-muted-foreground">علامة مائية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalAccesses}</p>
            <p className="text-[10px] text-muted-foreground">عملية وصول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldAlert className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalBlocked}</p>
            <p className="text-[10px] text-muted-foreground">محاولة محظورة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.failedAttempts}</p>
            <p className="text-[10px] text-muted-foreground">PIN فاشل</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" dir="rtl">
        <TabsList>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="w-4 h-4" /> المستندات المحمية
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Activity className="w-4 h-4" /> سجل الوصول
          </TabsTrigger>
        </TabsList>

        {/* Protected Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                المستندات المحمية ({protectedDocs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {protectedDocs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد مستندات محمية</p>
                ) : (
                  <div className="space-y-2">
                    {protectedDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.protection_pin && <Badge variant="secondary" className="text-[9px]">🔒 PIN</Badge>}
                              {!doc.allow_download && <Badge variant="destructive" className="text-[9px]">⛔ تحميل</Badge>}
                              {!doc.allow_print && <Badge variant="destructive" className="text-[9px]">⛔ طباعة</Badge>}
                              {doc.watermark_enabled && <Badge variant="outline" className="text-[9px]">💧 مائية</Badge>}
                              {doc.notify_on_download && <Badge variant="outline" className="text-[9px]">🔔 إشعار</Badge>}
                            </div>
                          </div>
                        </div>
                        <DocumentProtectionSettings
                          documentId={doc.id}
                          initialSettings={{
                            protection_enabled: doc.protection_enabled,
                            protection_pin: doc.protection_pin,
                            allow_view: doc.allow_view,
                            allow_download: doc.allow_download,
                            allow_print: doc.allow_print,
                            watermark_enabled: doc.watermark_enabled,
                            notify_on_download: doc.notify_on_download,
                          }}
                          onSaved={fetchData}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                سجل الوصول الأخير ({accessLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {accessLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد سجلات وصول</p>
                ) : (
                  <div className="space-y-1">
                    {accessLogs.map((log: any) => {
                      const Icon = ACTION_ICONS[log.action_type] || Eye;
                      const isFailure = log.success === false;
                      return (
                        <div
                          key={log.id}
                          className={`flex items-center gap-3 p-2 rounded text-xs ${isFailure ? 'bg-destructive/5 border border-destructive/20' : 'hover:bg-muted/50'}`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isFailure ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <span className="flex-1">{ACTION_LABELS[log.action_type] || log.action_type}</span>
                          <span className="text-muted-foreground">
                            {log.created_at ? format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ar }) : ''}
                          </span>
                          {isFailure && <Badge variant="destructive" className="text-[9px]">فشل</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentSecurityDashboard;
