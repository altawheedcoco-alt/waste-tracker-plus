import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Search,
  Bot,
  User,
  Clock,
  Building2,
  Star,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface Conversation {
  id: string;
  user_id: string;
  organization_id: string;
  status: 'active' | 'closed' | 'escalated';
  started_at: string;
  ended_at: string | null;
  rating: number | null;
  rating_feedback: string | null;
  escalated_to_ticket_id: string | null;
  organization?: { name: string; organization_type: string };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'نشطة', color: 'bg-green-500' },
  closed: { label: 'مغلقة', color: 'bg-gray-500' },
  escalated: { label: 'مُصعَّدة', color: 'bg-red-500' },
};

const AIConversationsPanel = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_conversations')
        .select(`
          *,
          organization:organizations(name, organization_type)
        `)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as Conversation[];
    }
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const { data, error } = await supabase
        .from('customer_conversation_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation
  });

  const filteredConversations = conversations.filter(conv => {
    if (statusFilter !== 'all' && conv.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return conv.organization?.name?.toLowerCase().includes(s);
    }
    return true;
  });

  const orgTypeLabels: Record<string, string> = {
    generator: 'مُنتج',
    transporter: 'ناقل',
    recycler: 'مُدوِّر',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-500" />
              محادثات المساعد الذكي
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالمنظمة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="escalated">مُصعَّدة</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد محادثات</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full text-right p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            className={`${statusConfig[conv.status]?.color || 'bg-gray-500'} text-white text-xs`}
                          >
                            {statusConfig[conv.status]?.label || conv.status}
                          </Badge>
                          {conv.status === 'escalated' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          {conv.rating && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {conv.rating}/5
                            </Badge>
                          )}
                        </div>
                        
                        {conv.organization && (
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{conv.organization.name}</span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {orgTypeLabels[conv.organization.organization_type] || conv.organization.organization_type}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(conv.started_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </div>
                          {conv.escalated_to_ticket_id && (
                            <Badge variant="secondary" className="text-xs">
                              <ExternalLink className="h-3 w-3 ml-1" />
                              تذكرة مرتبطة
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-500" />
              تفاصيل المحادثة
              {selectedConversation && (
                <Badge className={`${statusConfig[selectedConversation.status]?.color} text-white mr-2`}>
                  {statusConfig[selectedConversation.status]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              {/* Conversation Info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedConversation.organization?.name || 'غير معروف'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(selectedConversation.started_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </div>
              </div>

              {/* Rating */}
              {selectedConversation.rating && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">التقييم: {selectedConversation.rating}/5</span>
                  {selectedConversation.rating_feedback && (
                    <span className="text-sm text-muted-foreground">- {selectedConversation.rating_feedback}</span>
                  )}
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    لا توجد رسائل
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.role === 'user' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-[10px] opacity-70">
                              {msg.role === 'user' ? 'العميل' : 'المساعد'}
                            </span>
                            <span className="text-[10px] opacity-50">
                              {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Linked Ticket */}
              {selectedConversation.escalated_to_ticket_id && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/dashboard/support?ticket=${selectedConversation.escalated_to_ticket_id}`}>
                    <ExternalLink className="h-4 w-4 ml-2" />
                    عرض التذكرة المرتبطة
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIConversationsPanel;
