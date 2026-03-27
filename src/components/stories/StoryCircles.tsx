import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, User } from 'lucide-react';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import StoryViewer from './StoryViewer';
import StoryUploadDialog from './StoryUploadDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const StoryCircles = () => {
  const { storyGroups, isLoading } = useStories();
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const hasMyStory = storyGroups.some((g) => g.user_id === user?.id);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 px-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 min-w-[72px]">
            <div className="w-[66px] h-[66px] rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none" dir="rtl">
        {/* Add Story Button */}
        {!hasMyStory && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUpload(true)}
            className="flex flex-col items-center gap-1.5 min-w-[72px]"
          >
            <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-dashed border-primary/40 flex items-center justify-center relative group">
              <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">حالتك</span>
          </motion.button>
        )}

        {/* Story Groups */}
        {storyGroups.map((group, idx) => (
          <motion.button
            key={group.user_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (group.user_id === user?.id && group.stories.length === 0) {
                setShowUpload(true);
              } else {
                setSelectedGroup(group);
              }
            }}
            className="flex flex-col items-center gap-1.5 min-w-[72px] relative"
          >
            <div
              className={`w-[66px] h-[66px] rounded-full p-[3px] transition-all ${
                group.hasUnviewed
                  ? 'bg-gradient-to-br from-primary via-primary/80 to-accent-foreground animate-pulse'
                  : group.user_id === user?.id
                  ? 'bg-gradient-to-br from-primary/40 to-primary/20'
                  : 'bg-muted'
              }`}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-xs">
                    {group.user_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {/* Story count badge */}
            {group.stories.length > 1 && (
              <div className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <span className="text-[9px] text-primary-foreground font-bold">{group.stories.length}</span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[72px]">
              {group.user_id === user?.id ? 'حالتي' : group.org_name || group.user_name}
            </span>
            {group.user_id === user?.id && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpload(true);
                }}
                className="absolute bottom-5 left-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm"
              >
                <Plus className="w-3 h-3 text-primary-foreground" />
              </motion.button>
            )}
          </motion.button>
        ))}
      </div>

      {/* Story Viewer - now with all groups for swipe-between */}
      {selectedGroup && (
        <StoryViewer
          group={selectedGroup}
          allGroups={storyGroups}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {/* Upload Dialog */}
      <StoryUploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
      />
    </>
  );
};

export default StoryCircles;
