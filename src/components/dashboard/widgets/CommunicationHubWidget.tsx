import { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Bell, FileText, CircleDot, Video, Send, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface QuickLink {
  icon: typeof MessageCircle;
  labelAr: string;
  path: string;
  badgeCount?: number;
  color: string;
}

export default function CommunicationHubWidget() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const links: QuickLink[] = [
    { icon: MessageCircle, labelAr: 'الرسائل', path: '/dashboard/chat', color: 'text-primary' },
    { icon: Bell, labelAr: 'الإشعارات', path: '/dashboard/notifications', badgeCount: unreadCount, color: 'text-destructive' },
    { icon: FileText, labelAr: 'الملاحظات', path: '/dashboard/chat?tab=notes', color: 'text-accent-foreground' },
    { icon: CircleDot, labelAr: 'الحالات', path: '/dashboard/stories', color: 'text-primary' },
    { icon: Video, labelAr: 'الاجتماعات', path: '/dashboard/meetings', color: 'text-muted-foreground' },
    { icon: Send, labelAr: 'طلباتي', path: '/dashboard/my-requests', color: 'text-primary' },
  ];

  const goTo = (path: string) => startTransition(() => navigate(path));

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            التواصل والمشاركة
          </h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {unreadCount > 99 ? '99+' : unreadCount} جديد
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {links.map((link) => (
            <motion.button
              key={link.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goTo(link.path)}
              className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-background/60 hover:bg-background border border-border/40 hover:border-primary/30 transition-colors"
            >
              <link.icon className={cn('w-5 h-5', link.color)} />
              <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
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
