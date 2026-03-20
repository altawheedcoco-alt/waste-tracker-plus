import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Plus, Lock, Globe, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatChannels } from '@/hooks/useChatChannels';
import CreateChannelDialog from './CreateChannelDialog';
import { cn } from '@/lib/utils';

interface ChannelListViewProps {
  onSelectChannel?: (channelId: string) => void;
  selectedChannelId?: string | null;
}

export default function ChannelListView({ onSelectChannel, selectedChannelId }: ChannelListViewProps) {
  const { channels, isLoading, createChannel } = useChatChannels();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          القنوات
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-10">
            <Hash className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد قنوات بعد</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 ml-1" />
              إنشاء قناة
            </Button>
          </div>
        ) : (
          channels.map((channel) => (
            <motion.button
              key={channel.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectChannel?.(channel.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-right',
                selectedChannelId === channel.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                channel.channel_type === 'internal' ? 'bg-blue-500/10' : 'bg-green-500/10'
              )}>
                {channel.channel_type === 'internal' ? (
                  <Lock className="w-4 h-4 text-blue-500" />
                ) : (
                  <Globe className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">#{channel.name}</p>
                {channel.description && (
                  <p className="text-[10px] text-muted-foreground truncate">{channel.description}</p>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>

      <CreateChannelDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreateChannel={createChannel}
      />
    </div>
  );
}
