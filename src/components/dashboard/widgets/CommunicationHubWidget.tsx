import { startTransition, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Bell, FileText, CircleDot, Video, Send, 
  Hash, BarChart3, Bot, PenTool, Radio, 
  TrendingUp, Eye, X, ArrowLeft, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePlatformCounts } from '@/hooks/usePlatformCounts';
import { useOperationalAlerts } from '@/hooks/useOperationalAlerts';
import { cn } from '@/lib/utils';

interface QuickLink {
  icon: typeof MessageCircle;
  labelAr: string;
  path: string;
  badgeCount?: number;
  color: string;
  bgColor: string;
  previewType?: string;
}

export default function CommunicationHubWidget() {
  const navigate = useNavigate();
  const { data: counts } = usePlatformCounts();
  const { data: alerts } = useOperationalAlerts();

  const totalBadges = (counts?.unreadMessages ?? 0) + (counts?.unreadNotifications ?? 0) + (counts?.pendingSignatures ?? 0) + (counts?.pendingRequests ?? 0);

  const links: QuickLink[] = [
    { icon: MessageCircle, labelAr: 'الرسائل', path: '/dashboard/chat', badgeCount: counts?.unreadMessages, color: 'text-primary', bgColor: 'bg-primary/10', previewType: 'message' },
    { icon: Bell, labelAr: 'الإشعارات', path: '/dashboard/notifications', badgeCount: counts?.unreadNotifications, color: 'text-destructive', bgColor: 'bg-destructive/10', previewType: 'notification' },
    { icon: FileText, labelAr: 'الملاحظات', path: '/dashboard/notes', badgeCount: counts?.unreadNotes, color: 'text-accent-foreground', bgColor: 'bg-accent/30', previewType: 'note' },
    { icon: CircleDot, labelAr: 'الحالات', path: '/dashboard/stories', badgeCount: counts?.activeStories, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Video, labelAr: 'الاجتماعات', path: '/dashboard/meetings', badgeCount: counts?.activeMeetings, color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { icon: Send, labelAr: 'طلباتي', path: '/dashboard/my-requests', badgeCount: counts?.pendingRequests, color: 'text-primary', bgColor: 'bg-primary/10', previewType: 'work_order' },
    { icon: PenTool, labelAr: 'التوقيعات', path: '/dashboard/signing-inbox', badgeCount: counts?.pendingSignatures, color: 'text-amber-600', bgColor: 'bg-amber-500/10', previewType: 'signature' },
    { icon: Hash, labelAr: 'القنوات', path: '/dashboard/chat', color: 'text-sky-600', bgColor: 'bg-sky-500/10' },
    { icon: Radio, labelAr: 'البث', path: '/dashboard/broadcast-channels', badgeCount: counts?.broadcastChannels, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { icon: BarChart3, labelAr: 'التصويت', path: '/dashboard/chat', badgeCount: counts?.activePolls, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
    { icon: Bot, labelAr: 'المساعد', path: '/dashboard/ai-tools', color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
    { icon: TrendingUp, labelAr: 'التحليلات', path: '/dashboard/reports', color: 'text-indigo-600', bgColor: 'bg-indigo-500/10' },
  ];

  const goTo = (path: string) => startTransition(() => navigate(path));

  // Get preview items for a specific type from operational alerts
  const getPreviewItems = (type?: string) => {
    if (!type || !alerts) return [];
    return alerts.filter(a => a.type === type).slice(0, 3);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            مركز التواصل والعمليات
          </h3>
          {totalBadges > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {totalBadges > 99 ? '99+' : totalBadges} جديد
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {links.map((link) => {
            const previewItems = getPreviewItems(link.previewType);
            const hasPreview = previewItems.length > 0;

            return (
              <Popover key={link.path + link.labelAr}>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goTo(link.path)}
                    className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl bg-background/60 hover:bg-background border border-border/40 hover:border-primary/30 transition-colors"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', link.bgColor)}>
                      <link.icon className={cn('w-4 h-4', link.color)} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                      {link.labelAr}
                    </span>
                    {link.badgeCount && link.badgeCount > 0 ? (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-0.5 flex items-center justify-center text-[9px] font-bold text-primary-foreground bg-destructive rounded-full">
                        {link.badgeCount > 9 ? '9+' : link.badgeCount}
                      </span>
                    ) : null}
                    {/* Preview indicator */}
                    {hasPreview && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </motion.button>
                </PopoverTrigger>
                {hasPreview && (
                  <PopoverContent className="w-64 p-0 rounded-xl overflow-hidden" align="center" dir="rtl" side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="p-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <link.icon className={cn('w-3.5 h-3.5', link.color)} />
                        {link.labelAr}
                      </span>
                      {link.badgeCount && link.badgeCount > 0 && (
                        <Badge variant="destructive" className="text-[9px] h-4">{link.badgeCount}</Badge>
                      )}
                    </div>
                    <div className="p-1.5 space-y-1 max-h-[180px] overflow-y-auto">
                      {previewItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => item.route && goTo(item.route)}
                          className="w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-2"
                        >
                          <item.icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', 
                            item.isRead === false ? 'text-destructive' : 'text-muted-foreground'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[11px] leading-tight truncate", 
                              item.isRead === false ? 'font-bold text-foreground' : 'text-muted-foreground'
                            )}>
                              {item.message}
                            </p>
                            {item.timestamp && (
                              <span className="text-[9px] text-muted-foreground/60 font-mono">
                                {new Date(item.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          {item.isRead === false && (
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => goTo(link.path)}
                      className="w-full text-center py-2 text-[10px] font-bold text-primary hover:bg-primary/5 border-t border-border/30 transition-colors flex items-center justify-center gap-1"
                    >
                      عرض الكل <ExternalLink className="w-3 h-3" />
                    </button>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
