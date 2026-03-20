import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Radio, Plus, Bell, BellOff, Send, Users, MessageSquare, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useBroadcastChannels, type BroadcastChannel } from '@/hooks/useBroadcastChannels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface BroadcastChannelViewProps {
  onBack?: () => void;
}

const BroadcastChannelView = memo(({ onBack }: BroadcastChannelViewProps) => {
  const { channels, isLoading, createChannel, subscribe, unsubscribe, post } = useBroadcastChannels();
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [postContent, setPostContent] = useState('');

  // Posts for selected channel
  const { data: posts = [] } = useQuery({
    queryKey: ['broadcast-posts', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const { data } = await (supabase as any)
        .from('broadcast_posts')
        .select('*')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!selectedChannel,
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createChannel({ name: newName, description: newDesc });
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handlePost = () => {
    if (!postContent.trim() || !selectedChannel) return;
    post({ channelId: selectedChannel.id, content: postContent });
    setPostContent('');
  };

  if (selectedChannel) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b border-border/50">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedChannel(null)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Radio className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedChannel.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedChannel.description || 'قناة بث رسمية'}</p>
          </div>
          {selectedChannel.is_mine ? (
            <Badge variant="secondary" className="text-[10px]">قناتي</Badge>
          ) : selectedChannel.is_subscribed ? (
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => unsubscribe(selectedChannel.id)}>
              <BellOff className="w-3 h-3" /> إلغاء
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => subscribe(selectedChannel.id)}>
              <Bell className="w-3 h-3" /> اشتراك
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {posts.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-muted/30 rounded-xl p-3 border border-border/30"
            >
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{p.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(p.created_at), 'dd MMM HH:mm', { locale: ar })}
                </span>
                <span className="text-[10px] text-muted-foreground">👁 {p.views_count}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedChannel.is_mine && (
          <div className="p-3 border-t border-border/50">
            <div className="flex gap-2">
              <Textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="اكتب منشوراً..."
                className="text-xs resize-none min-h-[40px] flex-1"
                dir="rtl"
              />
              <Button size="icon" className="h-10 w-10 shrink-0" onClick={handlePost} disabled={!postContent.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <Radio className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">قنوات البث</span>
          <Badge variant="secondary" className="text-[10px]">{channels.length}</Badge>
        </div>
        <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="w-3 h-3" /> إنشاء قناة
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 border-b border-border/50 space-y-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم القناة" className="text-xs h-8" dir="rtl" />
          <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="وصف (اختياري)" className="text-xs h-8" dir="rtl" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button size="sm" className="h-7 text-[10px]" onClick={handleCreate} disabled={!newName.trim()}>إنشاء</Button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-xs">جاري التحميل...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8">
            <Radio className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">لا توجد قنوات بث</p>
          </div>
        ) : (
          channels.map((ch, i) => (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedChannel(ch)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors text-right"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ch.description || 'قناة بث'}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {ch.is_mine && <Badge variant="outline" className="text-[9px] h-4">قناتي</Badge>}
                {ch.is_subscribed && <Badge className="text-[9px] h-4 bg-emerald-500">مشترك</Badge>}
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" /> {ch.subscriber_count}
                </span>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
});

BroadcastChannelView.displayName = 'BroadcastChannelView';
export default BroadcastChannelView;
