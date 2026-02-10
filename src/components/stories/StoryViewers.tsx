import { motion } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import { StoryView } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StoryViewersProps {
  views: StoryView[];
  onClose: () => void;
}

const StoryViewers = ({ views, onClose }: StoryViewersProps) => {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed bottom-0 left-0 right-0 z-[110] bg-card rounded-t-2xl max-h-[60vh] overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="font-bold">المشاهدات ({views.length})</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[50vh] p-2">
        {views.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد مشاهدات بعد</p>
          </div>
        ) : (
          views.map((view) => (
            <div key={view.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="w-10 h-10">
                <AvatarImage src={view.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-xs">
                  {view.profile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{view.profile?.full_name || 'مستخدم'}</p>
                {view.organization && (
                  <p className="text-xs text-muted-foreground">{(view.organization as any)?.name}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default StoryViewers;
