import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets, useSupportStats, TicketStatus, TicketPriority, TicketCategory } from '@/hooks/useSupportTickets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Headphones,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  BarChart3,
  Filter,
  Bug,
  Lightbulb,
  HelpCircle,
  Banknote,
  MessageSquare,
  AlertCircle,
  Star,
  Users,
  TrendingUp,
  Timer,
} from 'lucide-react';
import TicketDetailDialog from '@/components/support/TicketDetailDialog';
import CreateTicketDialog from '@/components/support/CreateTicketDialog';
import BackButton from '@/components/ui/back-button';

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'مفتوحة', color: 'bg-blue-500', icon: AlertCircle },
  in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-500', icon: Clock },
  waiting_response: { label: 'في انتظار الرد', color: 'bg-orange-500', icon: Timer },
  resolved: { label: 'تم الحل', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'مغلقة', color: 'bg-gray-500', icon: CheckCircle2 },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-gray-500' },
  medium: { label: 'متوسطة', color: 'bg-blue-500' },
  high: { label: 'عالية', color: 'bg-orange-500' },
  urgent: { label: 'عاجلة', color: 'bg-red-500' },
};

const categoryConfig: Record<TicketCategory, { label: string; icon: React.ElementType }> = {
  bug: { label: 'خطأ تقني', icon: Bug },
  feature_request: { label: 'طلب ميزة', icon: Lightbulb },
  technical_issue: { label: 'مشكلة تقنية', icon: AlertTriangle },
  billing: { label: 'فواتير ومدفوعات', icon: Banknote },
  general: { label: 'استفسار عام', icon: HelpCircle },
  complaint: { label: 'شكوى', icon: MessageSquare },
  suggestion: { label: 'اقتراح', icon: Star },
};

const SupportCenter = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { tickets, isLoading, refetch } = useSupportTickets();
  const stats = useSupportStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <BackButton />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white">
              <Headphones className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {isAdmin ? 'مركز الدعم الفني' : 'الدعم الفني'}
              </h1>
              <p className="text-muted-foreground">
                {isAdmin ? 'إدارة ومتابعة جميع تذاكر الدعم' : 'تواصل معنا لحل مشكلاتك'}
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            تذكرة جديدة
          </Button>
        </div>
      </div>

      {/* Stats Cards - Admin Only */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">الإجمالي</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600">مفتوحة</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-700">{stats.open}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">قيد المعالجة</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-700">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">تم الحل</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-700">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">عاجلة</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-700">{stats.urgent}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-600">التقييم</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-700">{stats.avgRating} / 5</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats for Non-Admin */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-muted-foreground">تذاكري المفتوحة</span>
              </div>
              <p className="text-3xl font-bold mt-2 text-blue-700">{openTickets}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-muted-foreground">العاجلة</span>
              </div>
              <p className="text-3xl font-bold mt-2 text-red-700">{urgentTickets}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في التذاكر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                <SelectItem value="waiting_response">في انتظار الرد</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            التذاكر ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">لا توجد تذاكر</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                إنشاء تذكرة جديدة
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const StatusIcon = statusConfig[ticket.status].icon;
                  const CategoryIcon = categoryConfig[ticket.category].icon;
                  
                  return (
                    <div
                      key={ticket.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">
                              {ticket.ticket_number}
                            </Badge>
                            <Badge className={`${priorityConfig[ticket.priority].color} text-white text-xs`}>
                              {priorityConfig[ticket.priority].label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3" />
                              {categoryConfig[ticket.category].label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold truncate">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {ticket.description}
                          </p>
                          {isAdmin && ticket.organization && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {ticket.organization.name}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${statusConfig[ticket.status].color} text-white flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[ticket.status].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: ar })}
                          </span>
                          {ticket.satisfaction_rating && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < ticket.satisfaction_rating! 
                                      ? 'text-yellow-500 fill-yellow-500' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <TicketDetailDialog
          ticketId={selectedTicket}
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          onUpdate={refetch}
        />
      )}
    </motion.div>
  );
};

export default SupportCenter;
