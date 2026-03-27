import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import StoryCircles from '@/components/stories/StoryCircles';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Image, Clock, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import StoryViewers from '@/components/stories/StoryViewers';
import { motion } from 'framer-motion';

const Stories = () => {
  const { stories, storyGroups, myStoryViews, isLoading } = useStories();
  const { user } = useAuth();
  const [viewingStoryViewers, setViewingStoryViewers] = useState<string | null>(null);

  const myStories = stories.filter((s) => s.user_id === user?.id);
  const partnerStories = stories.filter((s) => s.user_id !== user?.id);
  const totalViews = myStories.reduce((sum, s) => sum + (s.view_count || 0), 0);
  const uniqueViewers = new Set(myStoryViews.map((v) => v.viewer_user_id)).size;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">الحالات</h1>
          <p className="text-muted-foreground">شاهد حالات شركائك وانشر حالتك</p>
        </div>

        {/* Story Circles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              حالات الجهات المرتبطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StoryCircles />
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {myStories.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-xl p-3 text-center"
            >
              <Image className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{myStories.length}</p>
              <p className="text-[10px] text-muted-foreground">حالاتي</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border rounded-xl p-3 text-center"
            >
              <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{totalViews}</p>
              <p className="text-[10px] text-muted-foreground">مشاهدة</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border rounded-xl p-3 text-center"
            >
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{uniqueViewers}</p>
              <p className="text-[10px] text-muted-foreground">مشاهد فريد</p>
            </motion.div>
          </div>
        )}

        {/* My Stories List */}
        {myStories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                تفاصيل حالاتي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {myStories.map((story, idx) => {
                  const views = myStoryViews.filter((v) => v.story_id === story.id);
                  return (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {story.media_type === 'text' ? (
                        <div className={`w-14 h-14 rounded-lg ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[8px] font-bold text-center px-1 line-clamp-2">
                            {story.text_content?.slice(0, 20)}
                          </span>
                        </div>
                      ) : (
                        <img src={story.media_url} className="w-14 h-14 rounded-lg object-cover shrink-0" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {story.caption || story.text_content?.slice(0, 40) || 'حالة بدون نص'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                          </span>
                          <button
                            onClick={() => setViewingStoryViewers(story.id)}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            {story.view_count} مشاهدة
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {myStories.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لم تنشر أي حالة بعد</p>
              <p className="text-xs text-muted-foreground/70 mt-1">اضغط على "حالتك" أعلاه لنشر أول حالة</p>
            </CardContent>
          </Card>
        )}

        {/* Viewers Panel */}
        {viewingStoryViewers && (
          <StoryViewers
            views={myStoryViews.filter((v) => v.story_id === viewingStoryViewers)}
            onClose={() => setViewingStoryViewers(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Stories;
