import { memo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import ReportDialog from './ReportDialog';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComments } from '@/hooks/useSocialInteractions';

type EntityType = 'shipment' | 'auction' | 'marketplace_listing' | 'organization_profile';

interface SocialInteractionBarProps {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  showComments?: boolean;
  showReactions?: boolean;
  showReport?: boolean;
  compact?: boolean;
  className?: string;
}

const SocialInteractionBar = memo(({
  entityType,
  entityId,
  entityLabel,
  showComments = true,
  showReactions = true,
  showReport = true,
  compact = false,
  className,
}: SocialInteractionBarProps) => {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Action Bar */}
      <div className="flex items-center gap-1 flex-wrap border-t border-border/50 pt-2.5">
        {showReactions && (
          <ReactionBar entityType={entityType} entityId={entityId} compact={compact} />
        )}

        {showComments && (
          <CommentToggle
            entityType={entityType}
            entityId={entityId}
            isOpen={commentsOpen}
            onToggle={() => setCommentsOpen(!commentsOpen)}
          />
        )}

        <div className="flex-1" />

        {showReport && (
          <ReportDialog entityType={entityType} entityId={entityId} entityLabel={entityLabel} />
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && commentsOpen && (
          <CommentSection entityType={entityType} entityId={entityId} />
        )}
      </AnimatePresence>
    </div>
  );
});

SocialInteractionBar.displayName = 'SocialInteractionBar';

const CommentToggle = memo(({ entityType, entityId, isOpen, onToggle }: {
  entityType: EntityType;
  entityId: string;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const { rootComments } = useComments(entityType, entityId);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn(
        'gap-1.5 h-9 px-3 rounded-full transition-colors',
        isOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <MessageCircle className={cn('h-4 w-4', isOpen && 'fill-current')} />
      <span className="text-xs font-medium">تعليق</span>
      {rootComments.length > 0 && (
        <span className={cn(
          'text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full',
          isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {rootComments.length}
        </span>
      )}
    </Button>
  );
});

CommentToggle.displayName = 'CommentToggle';

export default SocialInteractionBar;
