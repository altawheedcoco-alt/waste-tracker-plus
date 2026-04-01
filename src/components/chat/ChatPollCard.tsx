import { useState } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '@/lib/soundEngine';
import { BarChart3, Check, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatPoll } from '@/hooks/useChatPolls';

interface ChatPollCardProps {
  poll: ChatPoll;
  currentUserId: string;
  onVote: (pollId: string, optionIndex: number) => void;
  onClose?: (pollId: string) => void;
}

export default function ChatPollCard({ poll, currentUserId, onVote, onClose }: ChatPollCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const myVoteIndex = (() => {
    if (!poll.votes) return null;
    for (const [idx, voters] of poll.votes.entries()) {
      if (voters.includes(currentUserId)) return idx;
    }
    return null;
  })();

  const hasVoted = myVoteIndex !== null;
  const totalVotes = poll.total_votes || 0;

  const handleVote = (idx: number) => {
    if (poll.is_closed || hasVoted) return;
    setSelectedOption(idx);
    soundEngine.play('poll_vote');
    onVote(poll.id, idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-xl p-4 max-w-sm w-full shadow-sm"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-medium text-primary">تصويت</span>
        {poll.is_anonymous && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> سري
          </span>
        )}
        {poll.is_closed && (
          <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">مغلق</span>
        )}
      </div>

      <p className="text-sm font-bold mb-3">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const voteCount = poll.votes?.get(idx)?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = myVoteIndex === idx;

          return (
            <motion.button
              key={idx}
              whileTap={!hasVoted && !poll.is_closed ? { scale: 0.97 } : {}}
              onClick={() => handleVote(idx)}
              disabled={hasVoted || poll.is_closed}
              className={cn(
                'w-full relative overflow-hidden rounded-lg border px-3 py-2.5 text-right transition-all',
                isMyVote
                  ? 'border-primary bg-primary/5'
                  : hasVoted
                    ? 'border-border bg-muted/30'
                    : 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
              )}
            >
              {/* Progress bar */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'absolute inset-y-0 right-0 rounded-lg',
                    isMyVote ? 'bg-primary/15' : 'bg-muted/50'
                  )}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm">{option.text}</span>
                <div className="flex items-center gap-1.5">
                  {hasVoted && (
                    <span className="text-xs font-medium text-muted-foreground">{percentage}%</span>
                  )}
                  {isMyVote && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {totalVotes} صوت
        </span>
        {poll.created_by === currentUserId && !poll.is_closed && onClose && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onClose(poll.id)}>
            إغلاق التصويت
          </Button>
        )}
      </div>
    </div>
  );
}
