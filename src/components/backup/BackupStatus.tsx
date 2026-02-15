/**
 * Backup Status Component - عرض حالة النسخ الاحتياطي
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CloudUpload, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface BackupLog {
  id: string;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  file_size_bytes: number | null;
  github_commit_url: string | null;
  tables_backed_up: string[] | null;
  error_message: string | null;
}

export function BackupStatus() {
  const queryClient = useQueryClient();

  // Fetch backup logs
  const { data: backupLogs, isLoading } = useQuery({
    queryKey: ['backup-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('backup_logs') as any)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BackupLog[];
    },
  });

  // Trigger manual backup
  const triggerBackup = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('database-backup');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
        queryClient.invalidateQueries({ queryKey: ['backup-logs'] });
      } else {
        toast.error(`فشل النسخ الاحتياطي: ${data.error}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل النسخ الاحتياطي: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 ml-1" /> مكتمل</Badge>;
      case 'in_progress':
        return <Badge className="bg-secondary text-secondary-foreground"><Clock className="w-3 h-3 ml-1" /> جاري</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" /> فشل</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          النسخ الاحتياطي للبيانات
        </CardTitle>
        <Button
          onClick={() => triggerBackup.mutate()}
          disabled={triggerBackup.isPending}
          size="sm"
        >
          {triggerBackup.isPending ? (
            <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <CloudUpload className="h-4 w-4 ml-2" />
          )}
          نسخ احتياطي الآن
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : !backupLogs?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد نسخ احتياطية بعد</p>
            <p className="text-sm">اضغط على "نسخ احتياطي الآن" لإنشاء أول نسخة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backupLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusBadge(log.status)}
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(log.started_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.tables_backed_up?.length || 0} جدول • {formatBytes(log.file_size_bytes)}
                    </p>
                  </div>
                </div>
                {log.github_commit_url && (
                  <a
                    href={log.github_commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    GitHub <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">⚙️ إعداد النسخ الاحتياطي التلقائي</h4>
          <p className="text-xs text-muted-foreground">
            لتفعيل النسخ الاحتياطي اليومي التلقائي، يجب إضافة:
          </p>
          <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
            <li>GITHUB_BACKUP_TOKEN - توكن GitHub مع صلاحية repo</li>
            <li>GITHUB_BACKUP_REPO - اسم المستودع (owner/repo)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default BackupStatus;
