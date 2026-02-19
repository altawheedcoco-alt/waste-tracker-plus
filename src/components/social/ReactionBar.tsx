import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReactions } from '@/hooks/useSocialInteractions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThumbsUp, Star, AlertTriangle, Heart, PartyPopper } from 'lucide-react';

type EntityType = 'shipment' | 'auction' | 'marketplace_listing' | 'organization_profile';

const REACTIONS = [
  { type: 'like', icon: ThumbsUp, label: 'إعجاب', color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
  { type: 'excellent', icon: Star, label: 'ممتاز', color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
  { type: 'support', icon: Heart, label: 'دعم', color: 'text-rose-500', bg: 'bg-rose-500/10', ring: 'ring-rose-500/20' },
  { type: 'celebrate', icon: PartyPopper, label: 'تهنئة', color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  { type: 'warning', icon: AlertTriangle, label: 'تحذير', color: 'text-orange-500', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
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
  const timeoutRef = useRef<NodeJS.Timeout>();

  const activeReaction = REACTIONS.find(r => r.type === userReaction?.reaction_type);
  const ActiveIcon = activeReaction?.icon || ThumbsUp;

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowPicker(false), 200);
  };

  return (
    <div className={cn('relative inline-flex items-center gap-1.5', className)}>
      {/* Main Reaction Button */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={isToggling}
          onClick={() => toggleReaction(activeReaction?.type as any || 'like')}
          className={cn(
            'gap-1.5 h-9 px-3 rounded-full transition-all duration-200',
            userReaction
              ? cn(activeReaction?.bg, activeReaction?.color, 'ring-1', activeReaction?.ring, 'hover:opacity-80')
              : 'hover:bg-muted'
          )}
        >
          <motion.div
            key={activeReaction?.type || 'default'}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <ActiveIcon className="h-4 w-4" />
          </motion.div>
          {!compact && (
            <span className="text-xs font-medium">
              {activeReaction?.label || 'إعجاب'}
            </span>
          )}
          {totalReactions > 0 && (
            <motion.span
              key={totalReactions}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={cn(
                'text-xs font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full',
                userReaction ? 'text-current' : 'text-muted-foreground bg-muted/80'
              )}
            >
              {totalReactions}
            </motion.span>
          )}
        </Button>

        {/* Floating Reaction Picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute bottom-full mb-2 right-0 z-50 flex items-center gap-1 py-1.5 px-2 bg-popover border border-border rounded-2xl shadow-xl backdrop-blur-sm"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {REACTIONS.map((reaction, i) => {
                const Icon = reaction.icon;
                const isActive = userReaction?.reaction_type === reaction.type;
                const count = reactionCounts[reaction.type] || 0;
                return (
                  <Tooltip key={reaction.type}>
                    <TooltipTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.15 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReaction(reaction.type as any);
                          setShowPicker(false);
                        }}
                        disabled={isToggling}
                        className={cn(
                          'p-2 rounded-full transition-all duration-200 hover:scale-[1.35] active:scale-95',
                          isActive
                            ? cn(reaction.bg, 'ring-1', reaction.ring, 'scale-110')
                            : 'hover:bg-muted'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 transition-colors', isActive ? reaction.color : 'text-muted-foreground')} />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-medium">
                      {reaction.label} {count > 0 && <span className="opacity-70">({count})</span>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reaction Summary Bubbles */}
      {!compact && totalReactions > 0 && (
        <div className="flex items-center -space-x-1.5">
          {Object.entries(reactionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type], i) => {
              const reaction = REACTIONS.find(r => r.type === type);
              if (!reaction) return null;
              const Icon = reaction.icon;
              return (
                <motion.span
                  key={type}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 500 }}
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-background shadow-sm',
                    reaction.bg, reaction.color
                  )}
                >
                  <Icon className="h-3 w-3" />
                </motion.span>
              );
            })}
        </div>
      )}
    </div>
  );
});

ReactionBar.displayName = 'ReactionBar';
export default ReactionBar;
