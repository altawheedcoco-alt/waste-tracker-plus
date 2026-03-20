import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clipboard, FileText, Download, Eye, Check, X, Upload, 
  MoreVertical, Shield, Clock, Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollaborationBoard, type CollabFile } from '@/hooks/useCollaborationBoard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CollaborationBoardProps {
  conversationKey: string | null;
  partnerName?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText },
  pending: { label: 'قيد المراجعة', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock },
  approved: { label: 'معتمد', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: Check },
  signed: { label: 'موقّع', color: 'bg-blue-50 text-blue-700 border-blue-300', icon: Shield },
  rejected: { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-300', icon: X },
};

const CollaborationBoard = memo(({ conversationKey, partnerName }: CollaborationBoardProps) => {
  const { files, isLoading, updateStatus } = useCollaborationBoard(conversationKey);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? files : files.filter(f => f.status === filter);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">لوحة المشاركة</span>
          <Badge variant="secondary" className="text-[10px]">{files.length}</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto">
        {[{ key: 'all', label: 'الكل' }, ...Object.entries(statusConfig).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] border shrink-0 transition-colors",
              filter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-muted/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Files */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-xs">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Clipboard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">لا توجد ملفات مشتركة</p>
          </div>
        ) : (
          filtered.map((file, i) => {
            const sc = statusConfig[file.status] || statusConfig.draft;
            const Icon = sc.icon;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border border-border/50 rounded-xl p-2.5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", sc.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn("text-[9px] py-0 h-4", sc.color)}>
                        {sc.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(file.created_at), 'dd MMM', { locale: ar })}
                      </span>
                    </div>
                    {file.notes && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{file.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(file.file_url, '_blank')}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <a href={file.file_url} download={file.file_name}>
                        <Download className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1 mt-2">
                  {file.status === 'draft' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => updateStatus({ fileId: file.id, status: 'pending' })}>
                      <Clock className="w-3 h-3" /> إرسال للمراجعة
                    </Button>
                  )}
                  {file.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 text-emerald-600" onClick={() => updateStatus({ fileId: file.id, status: 'approved' })}>
                        <Check className="w-3 h-3" /> اعتماد
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 text-red-600" onClick={() => updateStatus({ fileId: file.id, status: 'rejected' })}>
                        <X className="w-3 h-3" /> رفض
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
});

CollaborationBoard.displayName = 'CollaborationBoard';
export default CollaborationBoard;
