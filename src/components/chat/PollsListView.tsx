import { useState } from 'react';
import { BarChart3, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatPollCard from './ChatPollCard';
import CreatePollDialog from './CreatePollDialog';
import { useChatPolls } from '@/hooks/useChatPolls';
import { useAuth } from '@/contexts/AuthContext';

export default function PollsListView() {
  const { user } = useAuth();
  const { polls, isLoading, vote, createPoll, closePoll } = useChatPolls();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          التصويتات
        </h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" />
          تصويت جديد
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {polls.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد تصويتات حالياً</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-lg mx-auto">
            {polls.map(poll => (
              <ChatPollCard
                key={poll.id}
                poll={poll}
                currentUserId={user?.id || ''}
                onVote={(pollId, optionIndex) => vote({ pollId, optionIndex })}
                onClose={closePoll}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <CreatePollDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreatePoll={(data) => {
          createPoll({ question: data.question, options: data.options });
          setShowCreate(false);
        }}
      />
    </div>
  );
}
