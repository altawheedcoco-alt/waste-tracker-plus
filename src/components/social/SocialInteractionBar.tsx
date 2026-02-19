import { memo } from 'react';
import { cn } from '@/lib/utils';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import ReportDialog from './ReportDialog';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
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

/**
 * شريط التفاعل الاجتماعي الموحد
 * يجمع الإعجابات والتعليقات والإبلاغ في مكون واحد
 */
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
      <div className="flex items-center gap-1 flex-wrap">
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

        {showReport && (
          <ReportDialog entityType={entityType} entityId={entityId} entityLabel={entityLabel} />
        )}
      </div>

      {/* Comments Section */}
      {showComments && commentsOpen && (
        <CommentSection entityType={entityType} entityId={entityId} />
      )}
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
    <Button variant="ghost" size="sm" onClick={onToggle} className="gap-1.5 h-8 px-2">
      <MessageCircle className="h-4 w-4" />
      <span className="text-xs">تعليق</span>
      {rootComments.length > 0 && (
        <span className="text-xs text-muted-foreground">{rootComments.length}</span>
      )}
    </Button>
  );
});

CommentToggle.displayName = 'CommentToggle';

export default SocialInteractionBar;
