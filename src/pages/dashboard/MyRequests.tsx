import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ApprovalWorkflowStepper from '@/components/approvals/ApprovalWorkflowStepper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  FileText,
  Package,
  Send,
  AlertCircle,
  Leaf,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ApprovalRequest {
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
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  company_registration: 'تسجيل جهة جديدة',
  driver_registration: 'تسجيل سائق',
  document_upload: 'رفع مستند',
  profile_update: 'تحديث بيانات',
  shipment_create: 'إنشاء شحنة',
  data_change: 'تغيير بيانات',
  waste_register: 'طلب سجل نفايات',
  environmental_sustainability: 'تحليل الاستدامة البيئية',
  carbon_footprint: 'تحليل البصمة الكربونية',
  technical_support: 'دعم فني',
  inquiry: 'استفسار',
  complaint: 'شكوى',
  suggestion: 'اقتراح',
  general: 'طلب عام',
};

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  company_registration: <Building2 className="h-4 w-4" />,
  driver_registration: <User className="h-4 w-4" />,
  document_upload: <FileText className="h-4 w-4" />,
  profile_update: <User className="h-4 w-4" />,
  shipment_create: <Package className="h-4 w-4" />,
  data_change: <FileText className="h-4 w-4" />,
  waste_register: <ClipboardList className="h-4 w-4" />,
  environmental_sustainability: <Leaf className="h-4 w-4 text-green-500" />,
  carbon_footprint: <BarChart3 className="h-4 w-4 text-blue-500" />,
  technical_support: <AlertCircle className="h-4 w-4" />,
  inquiry: <Eye className="h-4 w-4" />,
  complaint: <XCircle className="h-4 w-4" />,
  suggestion: <CheckCircle className="h-4 w-4" />,
  general: <ClipboardList className="h-4 w-4" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode; description: string }> = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 
    label: 'قيد المراجعة', 
    icon: <Clock className="h-4 w-4" />,
    description: 'طلبك قيد المراجعة من قبل إدارة النظام'
  },
  approved: { 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
    label: 'تمت الموافقة', 
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'تمت الموافقة على طلبك بنجاح'
  },
  rejected: { 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', 
    label: 'مرفوض', 
    icon: <XCircle className="h-4 w-4" />,
    description: 'تم رفض طلبك، يرجى مراجعة ملاحظات المسؤول'
  },
};

const MyRequests = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
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
        .order('created_at', { ascending: false });

      // Filter by user's requests or organization's requests
      if (organization?.id) {
        query = query.or(`requester_user_id.eq.${user?.id},requester_organization_id.eq.${organization.id}`);
      } else {
        query = query.eq('requester_user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data || []) as ApprovalRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = activeTab === 'all' ? true : req.status === activeTab;
    const matchesType = filterType === 'all' || req.request_type === filterType;
    const matchesSearch =
      searchTerm === '' ||
      req.request_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const renderRequestRow = (request: ApprovalRequest) => (
    <TableRow key={request.id} className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          {REQUEST_TYPE_ICONS[request.request_type] || <ClipboardList className="h-4 w-4" />}
          <span className="font-medium">{request.request_title}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {REQUEST_TYPE_LABELS[request.request_type] || request.request_type}
        </Badge>
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
        {format(new Date(request.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRequest(request);
            setShowDetailsDialog(true);
          }}
        >
          <Eye className="h-4 w-4 ml-1" />
          تفاصيل
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Send className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
      <p className="text-muted-foreground mb-4">
        لم تقم بإرسال أي طلبات بعد. يمكنك إرسال طلب من خلال صفحات النظام المختلفة.
      </p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">طلباتي</h1>
            <p className="text-muted-foreground">متابعة حالة طلباتك المقدمة للنظام</p>
          </div>
          <Button onClick={fetchRequests} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

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
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{requests.length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالعنوان..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="نوع الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table with Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex w-full overflow-x-auto justify-start gap-1 h-auto flex-nowrap">
                <TabsTrigger value="all" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
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
                      <TableHead>العنوان</TableHead>
                      <TableHead>النوع</TableHead>
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
                {REQUEST_TYPE_ICONS[selectedRequest?.request_type || ''] || <ClipboardList className="h-5 w-5" />}
                {selectedRequest?.request_title}
              </DialogTitle>
              <DialogDescription>
                تفاصيل الطلب المقدم
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {/* Workflow Stepper */}
                <ApprovalWorkflowStepper
                  status={selectedRequest.status}
                  createdAt={selectedRequest.created_at}
                  reviewedAt={selectedRequest.reviewed_at}
                  adminNotes={selectedRequest.admin_notes}
                />

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
                      <AlertCircle className="h-4 w-4" />
                      ملاحظات المسؤول
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

                {selectedRequest.request_data && Object.keys(selectedRequest.request_data).length > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">بيانات إضافية</label>
                    <pre className="bg-muted p-3 rounded-lg mt-1 text-sm overflow-auto max-h-40 text-left" dir="ltr">
                      {JSON.stringify(selectedRequest.request_data, null, 2)}
                    </pre>
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

export default MyRequests;
