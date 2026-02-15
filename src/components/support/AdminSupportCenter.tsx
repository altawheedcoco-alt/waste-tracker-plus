import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupportTickets, useSupportStats, SupportTicket, TicketStatus, TicketPriority } from '@/hooks/useSupportTickets';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupportAnalyticsDashboard from './SupportAnalyticsDashboard';
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
  Headphones,
  Search,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  TrendingUp,
  MessageSquare,
  Zap,
  Building2,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Bot,
  MessagesSquare,
} from 'lucide-react';
import TicketDetailDialog from './TicketDetailDialog';
import QuickReplyManager from './QuickReplyManager';
import AIConversationsPanel from './AIConversationsPanel';

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: 'مفتوحة', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'قيد المعالجة', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  waiting_response: { label: 'انتظار الرد', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  resolved: { label: 'تم الحل', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  closed: { label: 'مغلقة', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'text-gray-500' },
  medium: { label: 'متوسطة', color: 'text-blue-500' },
  high: { label: 'عالية', color: 'text-orange-500' },
  urgent: { label: 'عاجلة', color: 'text-red-500' },
};

const orgTypeLabels: Record<string, string> = {
  generator: 'مُنتج',
  transporter: 'ناقل',
  recycler: 'مُدوِّر',
};

const AdminSupportCenter = () => {
  const { tickets, isLoading, refetch } = useSupportTickets();
  const stats = useSupportStats();
  const { quickReplies } = useQuickReplies();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tickets');

  // Fetch AI conversations stats
  const { data: conversationsStats } = useQuery({
    queryKey: ['ai-conversations-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_conversations')
        .select('status', { count: 'exact' });
      
      if (error) throw error;
      
      const active = data?.filter(c => c.status === 'active').length || 0;
      const escalated = data?.filter(c => c.status === 'escalated').length || 0;
      const closed = data?.filter(c => c.status === 'closed').length || 0;
      
      return { active, escalated, closed, total: data?.length || 0 };
    }
  });

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(s) ||
        ticket.title.toLowerCase().includes(s) ||
        ticket.organization?.name?.toLowerCase().includes(s) ||
        ticket.creator?.full_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مركز الدعم الموحد</h1>
            <p className="text-sm text-muted-foreground">
              محادثات AI + تذاكر الدعم + الردود الجاهزة
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">محادثات نشطة</span>
            </div>
            <p className="text-2xl font-bold mt-1">{conversationsStats?.active || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">تذاكر مفتوحة</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.open || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">قيد المعالجة</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.inProgress || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">تصعيدات AI</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{conversationsStats?.escalated || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">تم حلها</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.resolved || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">التقييم</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.avgRating || '0'}/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">ردود جاهزة</span>
            </div>
            <p className="text-2xl font-bold mt-1">{quickReplies.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tickets Alert */}
      {urgentTickets.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-400">
                  تذاكر عاجلة تحتاج انتباهك!
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  يوجد {urgentTickets.length} تذكرة عاجلة بحاجة للمعالجة
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setPriorityFilter('urgent');
                  setStatusFilter('all');
                  setActiveTab('tickets');
                }}
              >
                عرض التذاكر العاجلة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations" className="gap-2">
            <MessagesSquare className="h-4 w-4" />
            محادثات AI ({conversationsStats?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            التذاكر ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="replies" className="gap-2">
            <Zap className="h-4 w-4" />
            الردود الجاهزة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-4">
          <AIConversationsPanel />
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-lg">جميع التذاكر</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
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
                      <SelectItem value="open">مفتوحة</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="waiting_response">انتظار الرد</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأولويات</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
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
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد تذاكر مطابقة للبحث</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <SupportAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="replies" className="mt-4">
          <QuickReplyManager />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      {selectedTicketId && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
          onUpdate={refetch}
        />
      )}
    </div>
  );
};

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const status = statusConfig[ticket.status];
  
  return (
    <button
      onClick={onClick}
      className="w-full text-right p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-xs font-mono text-muted-foreground">
              {ticket.ticket_number}
            </code>
            <Badge className={`${status.bgColor} ${status.color} text-xs`}>
              {status.label}
            </Badge>
            {ticket.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                عاجل
              </Badge>
            )}
            {ticket.priority === 'high' && (
              <Badge className="bg-orange-100 text-orange-600 text-xs">
                عالية
              </Badge>
            )}
            {ticket.title?.includes('تصعيد من المساعد') && (
              <Badge variant="outline" className="text-xs gap-1">
                <Bot className="h-3 w-3" />
                تصعيد AI
              </Badge>
            )}
          </div>
          
          <h4 className="font-medium line-clamp-1">{ticket.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {ticket.description}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {ticket.organization && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{ticket.organization.name}</span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {orgTypeLabels[ticket.organization.organization_type] || ticket.organization.organization_type}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(ticket.created_at), 'dd/MM hh:mm a', { locale: ar })}
            </div>
          </div>
        </div>
        
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
};

export default AdminSupportCenter;
