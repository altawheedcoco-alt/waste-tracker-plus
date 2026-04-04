import { useState, useMemo } from 'react';
import { useQuickReplies, QuickReply } from '@/hooks/useQuickReplies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Search,
  Zap,
  Star,
  Clock,
  CheckCircle,
  HelpCircle,
  Wrench,
  CreditCard,
  Inbox,
  Loader2,
  XCircle,
  Hand,
} from 'lucide-react';

interface QuickReplySelectorProps {
  onSelect: (content: string) => void;
  trigger?: React.ReactNode;
}

const categoryIcons: Record<string, React.ElementType> = {
  'ترحيب': Hand,
  'استلام الطلب': Inbox,
  'قيد المعالجة': Loader2,
  'طلب معلومات': HelpCircle,
  'حل المشكلة': CheckCircle,
  'إغلاق التذكرة': XCircle,
  'تقني': Wrench,
  'مالي': CreditCard,
};

const categoryColors: Record<string, string> = {
  'ترحيب': 'bg-blue-500',
  'استلام الطلب': 'bg-green-500',
  'قيد المعالجة': 'bg-yellow-500',
  'طلب معلومات': 'bg-orange-500',
  'حل المشكلة': 'bg-emerald-500',
  'إغلاق التذكرة': 'bg-muted-foreground',
  'تقني': 'bg-purple-500',
  'مالي': 'bg-teal-500',
};

const QuickReplySelector = ({ onSelect, trigger }: QuickReplySelectorProps) => {
  const { quickReplies, repliesByCategory, incrementUsage, isLoading } = useQuickReplies();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredReplies = useMemo(() => {
    if (!search.trim()) return quickReplies;
    const searchLower = search.toLowerCase();
    return quickReplies.filter(
      r => r.title.toLowerCase().includes(searchLower) || 
           r.content.toLowerCase().includes(searchLower) ||
           r.shortcut?.toLowerCase().includes(searchLower)
    );
  }, [quickReplies, search]);

  const handleSelect = (reply: QuickReply) => {
    onSelect(reply.content);
    incrementUsage.mutate(reply.id);
    setOpen(false);
    setSearch('');
  };

  const categories = Object.keys(repliesByCategory);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="ردود جاهزة">
            <Zap className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold">الردود الجاهزة</span>
            <Badge variant="secondary" className="text-xs">
              {quickReplies.length} رد
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالعنوان أو الاختصار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 pt-2">
            <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent">
              <TabsTrigger value="all" className="text-xs">
                الكل
              </TabsTrigger>
              <TabsTrigger value="frequent" className="text-xs">
                <Star className="h-3 w-3 ml-1" />
                الأكثر استخداماً
              </TabsTrigger>
              {categories.slice(0, 4).map(cat => {
                const Icon = categoryIcons[cat] || MessageSquare;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    <Icon className="h-3 w-3 ml-1" />
                    {cat}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="m-0 p-2">
                  <div className="space-y-1">
                    {filteredReplies.map(reply => (
                      <ReplyItem key={reply.id} reply={reply} onSelect={handleSelect} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="frequent" className="m-0 p-2">
                  <div className="space-y-1">
                    {[...filteredReplies]
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .slice(0, 10)
                      .map(reply => (
                        <ReplyItem key={reply.id} reply={reply} onSelect={handleSelect} showCount />
                      ))}
                  </div>
                </TabsContent>

                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="m-0 p-2">
                    <div className="space-y-1">
                      {(repliesByCategory[cat] || [])
                        .filter(r => {
                          if (!search.trim()) return true;
                          const s = search.toLowerCase();
                          return r.title.toLowerCase().includes(s) || r.content.toLowerCase().includes(s);
                        })
                        .map(reply => (
                          <ReplyItem key={reply.id} reply={reply} onSelect={handleSelect} />
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </>
            )}
          </ScrollArea>
        </Tabs>

        <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <span>💡 استخدم الاختصارات مثل </span>
          <code className="bg-muted px-1 rounded">/hi</code>
          <span> في حقل الرسالة</span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ReplyItemProps {
  reply: QuickReply;
  onSelect: (reply: QuickReply) => void;
  showCount?: boolean;
}

const ReplyItem = ({ reply, onSelect, showCount }: ReplyItemProps) => {
  const Icon = categoryIcons[reply.category] || MessageSquare;
  const color = categoryColors[reply.category] || 'bg-muted-foreground';

  return (
    <button
      onClick={() => onSelect(reply)}
      className="w-full text-right p-2 rounded-lg hover:bg-muted transition-colors group"
    >
      <div className="flex items-start gap-2">
        <div className={`${color} p-1.5 rounded-md text-white mt-0.5`}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{reply.title}</span>
            {reply.shortcut && (
              <code className="text-[10px] bg-muted px-1 rounded text-muted-foreground">
                {reply.shortcut}
              </code>
            )}
            {showCount && reply.usage_count > 0 && (
              <Badge variant="outline" className="text-[10px] py-0">
                {reply.usage_count}×
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {reply.content}
          </p>
        </div>
      </div>
    </button>
  );
};

export default QuickReplySelector;
