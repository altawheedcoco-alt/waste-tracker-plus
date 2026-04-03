import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupportTickets, useSupportStats, TicketStatus, TicketPriority, TicketCategory } from '@/hooks/useSupportTickets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {
  Headphones,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  Banknote,
  MessageSquare,
  AlertCircle,
  Star,
  Users,
  Timer,
} from 'lucide-react';
import TicketDetailDialog from '@/components/support/TicketDetailDialog';
import CreateTicketDialog from '@/components/support/CreateTicketDialog';
import AdminSupportCenter from '@/components/support/AdminSupportCenter';
import BackButton from '@/components/ui/back-button';

const SupportCenter = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');

  if (isAdmin) {
    return (
      <DashboardLayout>
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton />
        <AdminSupportCenter />
      </motion.div>
    );
  }

  return <UserSupportPage />;
};

const UserSupportPage = () => {
  const { t, language } = useLanguage();
  const { tickets, isLoading, refetch } = useSupportTickets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const dateLocale = language === 'ar' ? arLocale : enUS;

  const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
    open: { label: t('support.statusOpen'), color: 'bg-blue-500', icon: AlertCircle },
    in_progress: { label: t('support.statusInProgress'), color: 'bg-yellow-500', icon: Clock },
    waiting_response: { label: t('support.statusWaiting'), color: 'bg-orange-500', icon: Timer },
    resolved: { label: t('support.statusResolved'), color: 'bg-green-500', icon: CheckCircle2 },
    closed: { label: t('support.statusClosed'), color: 'bg-gray-500', icon: CheckCircle2 },
  };

  const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
    low: { label: t('support.priorityLow'), color: 'bg-gray-500' },
    medium: { label: t('support.priorityMedium'), color: 'bg-blue-500' },
    high: { label: t('support.priorityHigh'), color: 'bg-orange-500' },
    urgent: { label: t('support.priorityUrgent'), color: 'bg-red-500' },
  };

  const categoryConfig: Record<TicketCategory, { label: string; icon: React.ElementType }> = {
    bug: { label: t('support.categoryBug'), icon: Bug },
    feature_request: { label: t('support.categoryFeature'), icon: Lightbulb },
    technical_issue: { label: t('support.categoryTechnical'), icon: AlertTriangle },
    billing: { label: t('support.categoryBilling'), icon: Banknote },
    general: { label: t('support.categoryGeneral'), icon: HelpCircle },
    complaint: { label: t('support.categoryComplaint'), icon: MessageSquare },
    suggestion: { label: t('support.categorySuggestion'), icon: Star },
  };

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
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Headphones className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('support.title')}</h1>
              <p className="text-muted-foreground">{t('support.subtitle')}</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('support.newTicket')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="text-muted-foreground">{t('support.myOpenTickets')}</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-blue-700">{openTickets}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-muted-foreground">{t('support.urgent')}</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-red-700">{urgentTickets}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('support.searchTickets')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('support.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('support.allStatuses')}</SelectItem>
                <SelectItem value="open">{t('support.statusOpen')}</SelectItem>
                <SelectItem value="in_progress">{t('support.statusInProgress')}</SelectItem>
                <SelectItem value="waiting_response">{t('support.statusWaiting')}</SelectItem>
                <SelectItem value="resolved">{t('support.statusResolved')}</SelectItem>
                <SelectItem value="closed">{t('support.statusClosed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('support.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('support.allPriorities')}</SelectItem>
                <SelectItem value="urgent">{t('support.priorityUrgent')}</SelectItem>
                <SelectItem value="high">{t('support.priorityHigh')}</SelectItem>
                <SelectItem value="medium">{t('support.priorityMedium')}</SelectItem>
                <SelectItem value="low">{t('support.priorityLow')}</SelectItem>
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
            {t('support.tickets')} ({filteredTickets.length})
          </CardTitle>
          <CardDescription>
            {t('support.ticketsSentToAdmin')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t('support.noTickets')}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                {t('support.createNewTicket')}
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
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${statusConfig[ticket.status].color} text-white flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[ticket.status].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: dateLocale })}
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

      <CreateTicketDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

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
