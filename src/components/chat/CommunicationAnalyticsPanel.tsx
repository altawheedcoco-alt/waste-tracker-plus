import { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Clock, FileText, TrendingUp, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCommunicationAnalytics } from '@/hooks/useCommunicationAnalytics';
import { cn } from '@/lib/utils';

const CommunicationAnalyticsPanel = memo(() => {
  const { analytics, analyticsLoading, summary } = useCommunicationAnalytics();

  if (analyticsLoading) {
    return <div className="p-6 text-center text-muted-foreground text-xs">جاري تحميل التحليلات...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Summary Cards */}
      <div className="p-3 border-b border-border/50">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'المحادثات', value: summary?.total_conversations || 0, icon: MessageSquare, color: 'text-blue-500' },
            { label: 'الرسائل', value: summary?.total_messages || 0, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'غير مقروءة', value: summary?.unread_messages || 0, icon: Clock, color: 'text-amber-500' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-muted/30 rounded-xl p-2.5 border border-border/30 text-center"
            >
              <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {summary?.most_active_partner && (
          <div className="mt-2 flex items-center gap-2 bg-primary/5 rounded-lg p-2 border border-primary/20">
            <Award className="w-4 h-4 text-primary shrink-0" />
            <div className="text-[11px]">
              <span className="text-muted-foreground">الأكثر تفاعلاً: </span>
              <span className="font-medium">{summary.most_active_partner}</span>
            </div>
          </div>
        )}
      </div>

      {/* Partner Rankings */}
      <div className="p-3">
        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          ترتيب الشركاء حسب التفاعل
        </p>

        {analytics.length === 0 ? (
          <div className="text-center py-6">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات تحليلية بعد</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {analytics.slice(0, 10).map((a, i) => {
              const maxTotal = analytics[0]?.total_messages || 1;
              const pct = Math.round((a.total_messages / maxTotal) * 100);
              return (
                <motion.div
                  key={a.partner_org_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 group"
                >
                  <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-center font-mono">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-medium truncate">{a.partner_name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.total_messages} رسالة</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={cn(
                          "h-full rounded-full",
                          i === 0 ? "bg-primary" : i < 3 ? "bg-primary/70" : "bg-primary/40"
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] text-emerald-600">↑ {a.messages_sent} مرسلة</span>
                      <span className="text-[9px] text-blue-600">↓ {a.messages_received} مستلمة</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

CommunicationAnalyticsPanel.displayName = 'CommunicationAnalyticsPanel';
export default CommunicationAnalyticsPanel;
