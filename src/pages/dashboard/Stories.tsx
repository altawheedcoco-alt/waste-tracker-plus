import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import StoryCircles from '@/components/stories/StoryCircles';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Image, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import StoryViewer from '@/components/stories/StoryViewer';
import StoryViewers from '@/components/stories/StoryViewers';
import { motion } from 'framer-motion';

const Stories = () => {
  const { stories, storyGroups, myStoryViews, isLoading } = useStories();
  const { user } = useAuth();
  const [viewingStoryViewers, setViewingStoryViewers] = useState<string | null>(null);

  const myStories = stories.filter((s) => s.user_id === user?.id);
  const partnerStories = stories.filter((s) => s.user_id !== user?.id);

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

        {/* My Stories Stats */}
        {myStories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                حالاتي ({myStories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {myStories.map((story) => {
                  const views = myStoryViews.filter((v) => v.story_id === story.id);
                  return (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {story.media_type === 'text' ? (
                        <div className={`w-14 h-14 rounded-lg ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center`}>
                          <span className="text-white text-[8px] font-bold text-center px-1 line-clamp-2">
                            {story.text_content?.slice(0, 20)}
                          </span>
                        </div>
                      ) : (
                        <img src={story.media_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                      )}
                      <div className="flex-1">
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
