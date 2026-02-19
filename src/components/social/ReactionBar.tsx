import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReactions } from '@/hooks/useSocialInteractions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThumbsUp, Star, AlertTriangle, Heart, PartyPopper } from 'lucide-react';

type EntityType = 'shipment' | 'auction' | 'marketplace_listing' | 'organization_profile';

const REACTIONS = [
  { type: 'like', icon: ThumbsUp, label: 'إعجاب', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { type: 'excellent', icon: Star, label: 'ممتاز', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  { type: 'support', icon: Heart, label: 'دعم', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  { type: 'celebrate', icon: PartyPopper, label: 'تهنئة', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  { type: 'warning', icon: AlertTriangle, label: 'تحذير', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
] as const;

interface ReactionBarProps {
  entityType: EntityType;
  entityId: string;
  compact?: boolean;
  className?: string;
}

const ReactionBar = memo(({ entityType, entityId, compact = false, className }: ReactionBarProps) => {
  const { userReaction, reactionCounts, totalReactions, toggleReaction, isToggling } = useReactions(entityType, entityId);
  const [showPicker, setShowPicker] = useState(false);

  const activeReaction = REACTIONS.find(r => r.type === userReaction?.reaction_type);
  const ActiveIcon = activeReaction?.icon || ThumbsUp;

  return (
    <div className={cn('relative inline-flex items-center gap-1', className)}>
      {/* Main Button */}
      <div
        className="relative"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={isToggling}
          onClick={() => toggleReaction(activeReaction?.type as any || 'like')}
          className={cn(
            'gap-1.5 h-8 px-2 transition-all',
            userReaction && activeReaction?.color
          )}
        >
          <ActiveIcon className="h-4 w-4" />
          {!compact && (
            <span className="text-xs">
              {activeReaction?.label || 'إعجاب'}
            </span>
          )}
          {totalReactions > 0 && (
            <span className="text-xs text-muted-foreground font-medium mr-0.5">
              {totalReactions}
            </span>
          )}
        </Button>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="absolute bottom-full mb-1 right-0 z-50 flex items-center gap-0.5 p-1 bg-card border rounded-full shadow-lg"
            >
              {REACTIONS.map((reaction) => {
                const Icon = reaction.icon;
                const isActive = userReaction?.reaction_type === reaction.type;
                const count = reactionCounts[reaction.type] || 0;
                return (
                  <Tooltip key={reaction.type}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReaction(reaction.type as any);
                          setShowPicker(false);
                        }}
                        disabled={isToggling}
                        className={cn(
                          'p-1.5 rounded-full transition-all hover:scale-125',
                          isActive ? reaction.bg : 'hover:bg-muted'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', isActive ? reaction.color : 'text-muted-foreground')} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {reaction.label} {count > 0 && `(${count})`}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reaction Summary */}
      {!compact && totalReactions > 0 && (
        <div className="flex items-center -space-x-1 mr-1">
          {Object.entries(reactionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type]) => {
              const reaction = REACTIONS.find(r => r.type === type);
              if (!reaction) return null;
              const Icon = reaction.icon;
              return (
                <span key={type} className={cn('inline-flex p-0.5 rounded-full bg-card border', reaction.color)}>
                  <Icon className="h-3 w-3" />
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
});

ReactionBar.displayName = 'ReactionBar';
export default ReactionBar;
