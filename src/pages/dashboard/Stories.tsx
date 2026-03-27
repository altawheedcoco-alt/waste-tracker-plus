import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import StoryCircles from '@/components/stories/StoryCircles';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Image, Clock, Users, TrendingUp, BarChart3, Trash2, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import StoryViewers from '@/components/stories/StoryViewers';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Stories = () => {
  const { stories, storyGroups, myStoryViews, isLoading, deleteStory } = useStories();
  const { user } = useAuth();
  const [viewingStoryViewers, setViewingStoryViewers] = useState<string | null>(null);

  const myStories = stories.filter((s) => s.user_id === user?.id);
  const partnerStories = stories.filter((s) => s.user_id !== user?.id);
  const totalViews = myStories.reduce((sum, s) => sum + (s.view_count || 0), 0);
  const uniqueViewers = new Set(myStoryViews.map((v) => v.viewer_user_id)).size;
  const avgViews = myStories.length > 0 ? Math.round(totalViews / myStories.length) : 0;

  const handleDeleteStory = async (storyId: string) => {
    await deleteStory.mutateAsync(storyId);
    toast.success('تم حذف الحالة');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">الحالات</h1>
          <p className="text-sm text-muted-foreground">شاهد حالات شركائك وانشر حالتك • تختفي بعد 24 ساعة</p>
        </div>

        {/* Story Circles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              حالات الجهات المرتبطة
              {partnerStories.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{storyGroups.length} جهة</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StoryCircles />
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {myStories.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Image, value: myStories.length, label: 'حالاتي', delay: 0 },
              { icon: Eye, value: totalViews, label: 'مشاهدة', delay: 0.05 },
              { icon: Users, value: uniqueViewers, label: 'مشاهد', delay: 0.1 },
              { icon: TrendingUp, value: avgViews, label: 'متوسط', delay: 0.15 },
            ].map(({ icon: Icon, value, label, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                className="bg-card border rounded-xl p-2.5 text-center"
              >
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold leading-tight">{value}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* My Stories List */}
        {myStories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                حالاتي النشطة
                <span className="text-xs text-muted-foreground font-normal">({myStories.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {myStories.map((story, idx) => {
                  const views = myStoryViews.filter((v) => v.story_id === story.id);
                  const expiresIn = formatDistanceToNow(new Date(story.expires_at), { addSuffix: true, locale: ar });
                  return (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      {story.media_type === 'text' ? (
                        <div className={`w-14 h-14 rounded-lg ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="text-white text-[8px] font-bold text-center px-1 line-clamp-2">
                            {story.text_content?.slice(0, 20)}
                          </span>
                        </div>
                      ) : (
                        <img src={story.media_url} className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-sm" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {story.caption || story.text_content?.slice(0, 40) || 'حالة بدون نص'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                          </span>
                          <button
                            onClick={() => setViewingStoryViewers(story.id)}
                            className="flex items-center gap-0.5 hover:text-primary transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            {story.view_count} مشاهدة
                          </button>
                          <span className="text-[9px] text-muted-foreground/60">تنتهي {expiresIn}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner Stories Overview */}
        {partnerStories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                حالات الشركاء
                <span className="text-xs text-muted-foreground font-normal">({partnerStories.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {storyGroups.filter(g => g.user_id !== user?.id).slice(0, 5).map((group, idx) => (
                  <motion.div
                    key={group.user_id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full p-[2px] ${group.hasUnviewed ? 'bg-gradient-to-br from-primary to-accent-foreground' : 'bg-muted'}`}>
                      <div className="w-full h-full rounded-full bg-background p-[1px]">
                        <img
                          src={group.org_logo || group.avatar_url || ''}
                          className="w-full h-full rounded-full object-cover"
                          alt=""
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{group.org_name || group.user_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {group.stories.length} حالة{group.hasUnviewed && ' • جديدة ✨'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {myStories.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">لم تنشر أي حالة بعد</p>
              <p className="text-xs text-muted-foreground/60 mt-1">اضغط على "حالتك" أعلاه لنشر أول حالة</p>
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
