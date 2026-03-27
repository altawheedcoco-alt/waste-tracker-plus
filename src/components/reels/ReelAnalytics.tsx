import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, MessageCircle, Bookmark, TrendingUp, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Reel } from '@/hooks/useReels';

interface ReelAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
}

interface ViewAnalytics {
  totalViews: number;
  uniqueViewers: number;
  avgWatchSeconds: number;
  completionRate: number;
  recentViewers: { full_name: string; avatar_url: string | null; viewed_at: string }[];
}

const ReelAnalytics = memo(({ isOpen, onClose, reel }: ReelAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ViewAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    (async () => {
      try {
        // Get view data
        const { data: views } = await supabase
          .from('reel_views')
          .select('*')
          .eq('reel_id', reel.id);

        const viewData = views || [];
        const uniqueViewerIds = [...new Set(viewData.filter(v => v.viewer_id).map(v => v.viewer_id))];

        // Get viewer profiles
        let recentViewers: ViewAnalytics['recentViewers'] = [];
        if (uniqueViewerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', uniqueViewerIds as string[])
            .limit(10);

          recentViewers = (profiles || []).map(p => ({
            full_name: p.full_name || 'مستخدم',
            avatar_url: p.avatar_url,
            viewed_at: viewData.find(v => v.viewer_id === p.id)?.created_at || '',
          }));
        }

        const avgWatch = viewData.length > 0
          ? viewData.reduce((sum, v) => sum + (v.watch_duration_seconds || 0), 0) / viewData.length
          : 0;

        const completed = viewData.filter(v => v.completed).length;

        setAnalytics({
          totalViews: reel.view_count || viewData.length,
          uniqueViewers: uniqueViewerIds.length,
          avgWatchSeconds: Math.round(avgWatch),
          completionRate: viewData.length > 0 ? Math.round((completed / viewData.length) * 100) : 0,
          recentViewers,
        });
      } catch {
        setAnalytics({
          totalViews: reel.view_count,
          uniqueViewers: 0,
          avgWatchSeconds: 0,
          completionRate: 0,
          recentViewers: [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, reel.id, reel.view_count]);

  if (!isOpen) return null;

  const stats = [
    { icon: Eye, label: 'المشاهدات', value: analytics?.totalViews || reel.view_count, color: 'text-blue-500' },
    { icon: Users, label: 'مشاهدون فريدون', value: analytics?.uniqueViewers || 0, color: 'text-purple-500' },
    { icon: Heart, label: 'إعجابات', value: reel.like_count, color: 'text-destructive' },
    { icon: MessageCircle, label: 'تعليقات', value: reel.comment_count, color: 'text-green-500' },
    { icon: Clock, label: 'متوسط المشاهدة', value: `${analytics?.avgWatchSeconds || 0}ث`, color: 'text-orange-500' },
    { icon: TrendingUp, label: 'نسبة الإكمال', value: `${analytics?.completionRate || 0}%`, color: 'text-primary' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[70vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2" />

          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <h3 className="font-bold text-foreground text-lg">📊 إحصائيات الريل</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-muted/40 rounded-2xl p-3 text-center">
                        <Icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Engagement rate */}
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">معدل التفاعل</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {reel.view_count > 0
                        ? ((reel.like_count + reel.comment_count) / reel.view_count * 100).toFixed(1)
                        : '0'}%
                    </span>
                    <span className="text-xs text-muted-foreground">(إعجابات + تعليقات) / مشاهدات</span>
                  </div>
                </div>

                {/* Recent viewers */}
                {analytics && analytics.recentViewers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3">آخر المشاهدين</h4>
                    <div className="space-y-2">
                      {analytics.recentViewers.map((v, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {v.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{v.full_name}</p>
                            {v.viewed_at && (
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true, locale: ar })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ReelAnalytics.displayName = 'ReelAnalytics';
export default ReelAnalytics;
