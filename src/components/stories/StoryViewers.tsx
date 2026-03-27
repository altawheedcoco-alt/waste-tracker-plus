import { motion } from 'framer-motion';
import { X, Eye, Users, Clock } from 'lucide-react';
import { StoryView } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StoryViewersProps {
  views: StoryView[];
  onClose: () => void;
}

const StoryViewers = ({ views, onClose }: StoryViewersProps) => {
  const uniqueOrgs = new Set(views.map(v => (v.organization as any)?.name).filter(Boolean));

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-[110] bg-card rounded-t-2xl max-h-[65vh] overflow-hidden shadow-2xl border-t border-border"
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="font-bold">المشاهدات</h3>
          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">{views.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {uniqueOrgs.size > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {uniqueOrgs.size} جهة
            </span>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[50vh] p-2">
        {views.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">لا توجد مشاهدات بعد</p>
            <p className="text-xs text-muted-foreground/60 mt-1">ستظهر المشاهدات هنا عندما يشاهد أحد حالتك</p>
          </div>
        ) : (
          views.map((view, idx) => (
            <motion.div
              key={view.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={view.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-xs font-medium">
                  {view.profile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{view.profile?.full_name || 'مستخدم'}</p>
                {view.organization && (
                  <p className="text-[10px] text-muted-foreground truncate">{(view.organization as any)?.name}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true, locale: ar })}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default StoryViewers;
