import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Loader2,
  Package,
  FileText,
  Truck,
  Settings,
  Shield,
  Download,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const PAGE_SIZE = 50;

const ActivityLogPage = () => {
  const { roles } = useAuth();
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isAdmin = roles.includes('admin');
  const dateLocale = language === 'ar' ? arLocale : enUS;

  const actionTypeLabels: Record<string, { label: string; icon: typeof Activity; color: string }> = {
    shipment_create: { label: t('activityLog.shipmentCreate'), icon: Package, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    shipment_update: { label: t('activityLog.shipmentUpdate'), icon: Package, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    shipment_status_change: { label: t('activityLog.shipmentStatusChange'), icon: Package, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    shipment_delete: { label: t('activityLog.shipmentDelete'), icon: Package, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    shipment_view: { label: t('activityLog.shipmentView'), icon: Eye, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    shipment_print: { label: t('activityLog.shipmentPrint'), icon: FileText, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    invoice_create: { label: t('activityLog.invoiceCreate'), icon: FileText, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    invoice_update: { label: t('activityLog.invoiceUpdate'), icon: FileText, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    deposit_create: { label: t('activityLog.depositCreate'), icon: FileText, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    driver_assign: { label: t('activityLog.driverAssign'), icon: Truck, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    driver_create: { label: t('activityLog.driverCreate'), icon: Truck, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    settings_change: { label: t('activityLog.settingsChange'), icon: Settings, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    user_role_change: { label: t('activityLog.userRoleChange'), icon: Shield, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    auth_login: { label: t('activityLog.authLogin'), icon: User, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    auth_logout: { label: t('activityLog.authLogout'), icon: User, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    file_upload: { label: t('activityLog.fileUpload'), icon: Download, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
    qr_scan: { label: t('activityLog.qrScan'), icon: Eye, color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionTypeFilter, resourceTypeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*, profile:profiles(full_name, email)', { count: 'exact' });

      if (actionTypeFilter !== 'all') {
        query = query.eq('action_type', actionTypeFilter);
      }

      if (resourceTypeFilter !== 'all') {
        query = query.eq('resource_type', resourceTypeFilter);
      }

      if (searchQuery) {
        query = query.ilike('action', `%${searchQuery}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const normalizedLogs = (data || []).map(log => ({
        ...log,
        profile: Array.isArray(log.profile) ? log.profile[0] : log.profile,
      }));

      setLogs(normalizedLogs);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const getActionConfig = (actionType: string) => {
    return actionTypeLabels[actionType] || { 
      label: actionType, 
      icon: Activity, 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
    };
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              {t('activityLog.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? t('activityLog.adminSubtitle') : t('activityLog.userSubtitle')}
            </p>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            {t('activityLog.refresh')}
          </Button>
        </motion.div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('activityLog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-10"
                />
              </div>

              <Select value={actionTypeFilter} onValueChange={(v) => { setActionTypeFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('activityLog.actionType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('activityLog.allTypes')}</SelectItem>
                  <SelectItem value="shipment_create">{t('activityLog.shipmentCreate')}</SelectItem>
                  <SelectItem value="shipment_status_change">{t('activityLog.shipmentStatusChange')}</SelectItem>
                  <SelectItem value="shipment_update">{t('activityLog.shipmentUpdate')}</SelectItem>
                  <SelectItem value="invoice_create">{t('activityLog.invoiceCreate')}</SelectItem>
                  <SelectItem value="deposit_create">{t('activityLog.depositCreate')}</SelectItem>
                  <SelectItem value="driver_assign">{t('activityLog.driverAssign')}</SelectItem>
                  <SelectItem value="user_role_change">{t('activityLog.userRoleChange')}</SelectItem>
                  <SelectItem value="settings_change">{t('activityLog.settingsChange')}</SelectItem>
                  <SelectItem value="auth_login">{t('activityLog.authLogin')}</SelectItem>
                  <SelectItem value="auth_logout">{t('activityLog.authLogout')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceTypeFilter} onValueChange={(v) => { setResourceTypeFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('activityLog.resourceType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('activityLog.allResources')}</SelectItem>
                  <SelectItem value="shipments">{t('nav.shipments')}</SelectItem>
                  <SelectItem value="invoices">{t('nav.invoices')}</SelectItem>
                  <SelectItem value="deposits">{t('nav.accounting')}</SelectItem>
                  <SelectItem value="contracts">{t('nav.contracts')}</SelectItem>
                  <SelectItem value="drivers">{t('nav.drivers')}</SelectItem>
                  <SelectItem value="user">{t('nav.users')}</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="w-full">
                <Filter className="h-4 w-4 ml-2" />
                {t('activityLog.applyFilter')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary">{totalCount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
              <div className="text-sm text-muted-foreground">{t('activityLog.totalActivities')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.action_type?.includes('create')).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('activityLog.createOps')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(l => l.action_type?.includes('update') || l.action_type?.includes('change')).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('activityLog.updateOps')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.action_type?.includes('delete')).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('activityLog.deleteOps')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('activityLog.actionsLog')}</CardTitle>
            <CardDescription>
              {t('activityLog.showing')} {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalCount)} {t('activityLog.of')} {totalCount} {t('activityLog.records')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('activityLog.noActivities')}</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{t('activityLog.dateTime')}</TableHead>
                        <TableHead className="text-right">{t('activityLog.user')}</TableHead>
                        <TableHead className="text-right">{t('activityLog.actionTypeCol')}</TableHead>
                        <TableHead className="text-right">{t('activityLog.description')}</TableHead>
                        <TableHead className="text-right">{t('activityLog.resource')}</TableHead>
                        <TableHead className="text-right">{t('activityLog.source')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const config = getActionConfig(log.action_type);
                        const IconComponent = config.icon;
                        
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(log.created_at), 'yyyy/MM/dd hh:mm:ss a', { locale: dateLocale })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {log.profile?.full_name || log.profile?.email || t('activityLog.unknown')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={config.color}>
                                <IconComponent className="h-3 w-3 ml-1" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={log.action}>
                              {log.action}
                            </TableCell>
                            <TableCell>
                              {log.resource_type && (
                                <Badge variant="outline">
                                  {log.resource_type}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.user_agent === 'database_trigger' ? (
                                <Badge variant="secondary" className="text-xs">
                                  {t('activityLog.automatic')}
                                </Badge>
                              ) : (
                                t('activityLog.userInterface')
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('activityLog.page')} {page} {t('activityLog.ofPages')} {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      {t('activityLog.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      {t('activityLog.next')}
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogPage;
