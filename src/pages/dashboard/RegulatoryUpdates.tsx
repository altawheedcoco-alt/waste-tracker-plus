import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  RefreshCw,
  FileText,
  AlertTriangle,
  Leaf,
  BarChart3,
  Shield,
  Building2,
  ClipboardCheck,
  Info,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface RegulatoryRequest {
  id: string;
  request_type: string;
  request_title: string;
  request_description: string | null;
  status: string;
  priority: string;
  request_data: unknown;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester_organization_id: string | null;
}

// الأنواع المتعلقة بجهاز التنظيم
const REGULATORY_REQUEST_TYPES = [
  'waste_register',
  'environmental_sustainability',
  'carbon_footprint',
  'document_upload',
  'profile_update',
];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  waste_register: 'طلب سجل مخلفات',
  environmental_sustainability: 'تحليل الاستدامة البيئية',
  carbon_footprint: 'تحليل البصمة الكربونية',
  document_upload: 'رفع وثيقة رسمية',
  profile_update: 'تحديث بيانات الجهة',
  company_registration: 'تسجيل جهة جديدة',
  driver_registration: 'تسجيل سائق',
};

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  waste_register: <FileText className="h-4 w-4 text-amber-500" />,
  environmental_sustainability: <Leaf className="h-4 w-4 text-green-500" />,
  carbon_footprint: <BarChart3 className="h-4 w-4 text-blue-500" />,
  document_upload: <ClipboardCheck className="h-4 w-4 text-purple-500" />,
  profile_update: <Building2 className="h-4 w-4 text-cyan-500" />,
  company_registration: <Building2 className="h-4 w-4" />,
  driver_registration: <Shield className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
    label: 'قيد المراجعة', 
    icon: <Clock className="h-4 w-4" />,
  },
  approved: { 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
    label: 'تمت الموافقة', 
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: { 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
    label: 'مرفوض', 
    icon: <XCircle className="h-4 w-4" />,
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

const RegulatoryUpdates = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RegulatoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegulatoryRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('approval_requests')
        .select('*')
        .in('request_type', REGULATORY_REQUEST_TYPES)
        .order('created_at', { ascending: false });

      // Filter by user's requests or organization's requests
      if (organization?.id) {
        query = query.or(`requester_user_id.eq.${user?.id},requester_organization_id.eq.${organization.id}`);
      } else {
        query = query.eq('requester_user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data || []) as RegulatoryRequest[]);
    } catch (error) {
      console.error('Error fetching regulatory requests:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل طلبات جهاز التنظيم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = activeTab === 'all' ? true : req.status === activeTab;
    const matchesSearch =
      searchTerm === '' ||
      req.request_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const renderRequestRow = (request: RegulatoryRequest) => (
    <TableRow key={request.id} className="hover:bg-muted/50 group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted">
            {REQUEST_TYPE_ICONS[request.request_type] || <Scale className="h-4 w-4" />}
          </div>
          <div>
            <span className="font-medium block">{request.request_title}</span>
            <span className="text-xs text-muted-foreground">
              {REQUEST_TYPE_LABELS[request.request_type] || request.request_type}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={PRIORITY_COLORS[request.priority]}>
          {PRIORITY_LABELS[request.priority]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_CONFIG[request.status]?.color}>
          <span className="flex items-center gap-1">
            {STATUS_CONFIG[request.status]?.icon}
            {STATUS_CONFIG[request.status]?.label}
          </span>
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ar })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailsDialog(true);
          }}
          className="gap-1.5"
        >
          <Eye className="h-4 w-4" />
          تفاصيل
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Scale className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">لا توجد طلبات تنظيمية</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        لم تقم بإرسال أي طلبات لجهاز تنظيم إدارة المخلفات بعد. يمكنك طلب سجلات المخلفات أو تحليلات الاستدامة من خلال صفحات النظام المختلفة.
      </p>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">سجل جهاز تنظيم إدارة المخلفات</h1>
            </div>
            <p className="text-muted-foreground">
              متابعة طلباتك وتحديثاتك المقدمة لجهاز تنظيم إدارة المخلفات
            </p>
          </div>
          <Button onClick={fetchRequests} variant="outline" disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary">معلومات هامة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  يحتوي هذا السجل على جميع طلباتك المتعلقة بجهاز تنظيم إدارة المخلفات، بما في ذلك طلبات سجلات المخلفات الخطرة وغير الخطرة، وتحليلات الاستدامة البيئية والبصمة الكربونية.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تمت الموافقة</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مرفوضة</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-primary">{requests.length}</p>
                </div>
                <Scale className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requests Table with Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  <Scale className="h-4 w-4" />
                  الكل
                  <Badge variant="secondary" className="mr-1">
                    {requests.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  قيد المراجعة
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="mr-1 h-5 w-5 p-0 justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  تمت الموافقة
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  مرفوضة
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطلب</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredRequests.map(renderRequestRow)}</TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {REQUEST_TYPE_ICONS[selectedRequest?.request_type || ''] || <Scale className="h-5 w-5" />}
                {selectedRequest?.request_title}
              </DialogTitle>
              <DialogDescription>
                تفاصيل الطلب المقدم لجهاز تنظيم إدارة المخلفات
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg ${
                  selectedRequest.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800' :
                  selectedRequest.status === 'approved' ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' :
                  'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedRequest.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      selectedRequest.status === 'approved' ? 'bg-green-100 dark:bg-green-900' :
                      'bg-red-100 dark:bg-red-900'
                    }`}>
                      {STATUS_CONFIG[selectedRequest.status]?.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{STATUS_CONFIG[selectedRequest.status]?.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.status === 'pending' && 'طلبك قيد المراجعة من قبل جهاز تنظيم إدارة المخلفات'}
                        {selectedRequest.status === 'approved' && 'تمت الموافقة على طلبك من جهاز التنظيم'}
                        {selectedRequest.status === 'rejected' && 'تم رفض طلبك، يرجى مراجعة ملاحظات جهاز التنظيم'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">نوع الطلب</label>
                    <p className="font-medium">
                      {REQUEST_TYPE_LABELS[selectedRequest.request_type] || selectedRequest.request_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">الأولوية</label>
                    <Badge className={PRIORITY_COLORS[selectedRequest.priority]}>
                      {PRIORITY_LABELS[selectedRequest.priority]}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">تاريخ الإرسال</label>
                    <p className="font-medium">
                      {format(new Date(selectedRequest.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div>
                      <label className="text-sm text-muted-foreground">تاريخ المراجعة</label>
                      <p className="font-medium">
                        {format(new Date(selectedRequest.reviewed_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                      </p>
                    </div>
                  )}
                </div>

                {selectedRequest.request_description && (
                  <div>
                    <label className="text-sm text-muted-foreground">وصف الطلب</label>
                    <p className="bg-muted p-3 rounded-lg mt-1">{selectedRequest.request_description}</p>
                  </div>
                )}

                {selectedRequest.admin_notes && (
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      ملاحظات جهاز التنظيم
                    </label>
                    <p className={`p-3 rounded-lg mt-1 ${
                      selectedRequest.status === 'rejected' 
                        ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' 
                        : 'bg-muted'
                    }`}>
                      {selectedRequest.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RegulatoryUpdates;
