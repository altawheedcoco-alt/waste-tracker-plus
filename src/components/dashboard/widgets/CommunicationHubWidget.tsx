import { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Bell, FileText, CircleDot, Video, Send, 
  Hash, BarChart3, Bot, PenTool, Radio, 
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlatformCounts } from '@/hooks/usePlatformCounts';
import { cn } from '@/lib/utils';

interface QuickLink {
  icon: typeof MessageCircle;
  labelAr: string;
  path: string;
  badgeCount?: number;
  color: string;
  bgColor: string;
}

export default function CommunicationHubWidget() {
  const navigate = useNavigate();
  const { data: counts } = usePlatformCounts();

  const totalBadges = (counts?.unreadMessages ?? 0) + (counts?.unreadNotifications ?? 0) + (counts?.pendingSignatures ?? 0) + (counts?.pendingRequests ?? 0);

  const links: QuickLink[] = [
    { icon: MessageCircle, labelAr: 'الرسائل', path: '/dashboard/chat', badgeCount: counts?.unreadMessages, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Bell, labelAr: 'الإشعارات', path: '/dashboard/notifications', badgeCount: counts?.unreadNotifications, color: 'text-destructive', bgColor: 'bg-destructive/10' },
    { icon: FileText, labelAr: 'الملاحظات', path: '/dashboard/chat?tab=notes', badgeCount: counts?.unreadNotes, color: 'text-accent-foreground', bgColor: 'bg-accent/30' },
    { icon: CircleDot, labelAr: 'الحالات', path: '/dashboard/stories', badgeCount: counts?.activeStories, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Video, labelAr: 'الاجتماعات', path: '/dashboard/meetings', badgeCount: counts?.activeMeetings, color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { icon: Send, labelAr: 'طلباتي', path: '/dashboard/my-requests', badgeCount: counts?.pendingRequests, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: PenTool, labelAr: 'التوقيعات', path: '/dashboard/chat?tab=signing', badgeCount: counts?.pendingSignatures, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    { icon: Hash, labelAr: 'القنوات', path: '/dashboard/chat?tab=channels', color: 'text-sky-600', bgColor: 'bg-sky-500/10' },
    { icon: Radio, labelAr: 'البث', path: '/dashboard/chat?tab=broadcast', badgeCount: counts?.broadcastChannels, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { icon: BarChart3, labelAr: 'التصويت', path: '/dashboard/chat?tab=polls', badgeCount: counts?.activePolls, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
    { icon: Bot, labelAr: 'المساعد', path: '/dashboard/chat?tab=ai', color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
    { icon: TrendingUp, labelAr: 'التحليلات', path: '/dashboard/chat?tab=analytics', color: 'text-indigo-600', bgColor: 'bg-indigo-500/10' },
  ];

  const goTo = (path: string) => startTransition(() => navigate(path));

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
          {links.map((link) => (
            <motion.button
              key={link.path + link.labelAr}
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
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
