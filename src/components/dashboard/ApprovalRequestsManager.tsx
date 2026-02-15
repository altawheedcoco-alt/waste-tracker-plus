import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Truck,
  User,
  FileText,
  Package,
  PlayCircle,
  FileCheck,
  Send,
  ExternalLink,
  Loader2,
  Leaf,
  BarChart3,
  MessageSquare,
  Settings,
  CheckSquare,
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
  requester_user_id: string | null;
  requester_organization_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  request_data: Record<string, unknown>;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  organization?: {
    name: string;
    organization_type: string;
  };
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  company_registration: 'تسجيل جهة جديدة',
  driver_registration: 'تسجيل سائق',
  document_upload: 'رفع وثيقة',
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
  technical_support: <AlertTriangle className="h-4 w-4" />,
  inquiry: <Eye className="h-4 w-4" />,
  complaint: <XCircle className="h-4 w-4" />,
  suggestion: <CheckCircle className="h-4 w-4" />,
  general: <ClipboardList className="h-4 w-4" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'قيد الانتظار', icon: <Clock className="h-4 w-4" /> },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'قيد التنفيذ', icon: <PlayCircle className="h-4 w-4" /> },
  approved: { color: 'bg-green-100 text-green-800', label: 'تمت الموافقة', icon: <CheckCircle className="h-4 w-4" /> },
  completed: { color: 'bg-emerald-100 text-emerald-800', label: 'مكتمل', icon: <FileCheck className="h-4 w-4" /> },
  rejected: { color: 'bg-red-100 text-red-800', label: 'مرفوض', icon: <XCircle className="h-4 w-4" /> },
};

// Quick action types based on request type
const getQuickActions = (requestType: string) => {
  switch (requestType) {
    case 'waste_register':
      return [
        { action: 'start_preparation', label: 'بدء الإعداد', icon: PlayCircle, color: 'bg-blue-600 hover:bg-blue-700' },
        { action: 'view_shipments', label: 'عرض الشحنات', icon: Package, color: 'bg-purple-600 hover:bg-purple-700' },
      ];
    case 'shipment_create':
      return [
        { action: 'create_shipment', label: 'إنشاء الشحنة', icon: Package, color: 'bg-green-600 hover:bg-green-700' },
      ];
    case 'technical_support':
      return [
        { action: 'start_support', label: 'بدء المعالجة', icon: PlayCircle, color: 'bg-blue-600 hover:bg-blue-700' },
      ];
    case 'data_change':
    case 'profile_update':
      return [
        { action: 'apply_changes', label: 'تطبيق التغييرات', icon: FileCheck, color: 'bg-green-600 hover:bg-green-700' },
      ];
    default:
      return [];
  }
};

const ApprovalRequestsManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          organization:requester_organization_id (
            name,
            organization_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as unknown as ApprovalRequest[]) || []);
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

  const handleApprove = async (request: ApprovalRequest) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'تمت الموافقة',
        description: 'تم الموافقة على الطلب بنجاح',
      });

      setShowDetailsDialog(false);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الموافقة على الطلب',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    if (!adminNotes.trim()) {
      toast({
        title: 'تنبيه',
        description: 'يرجى إدخال سبب الرفض',
        variant: 'destructive',
      });
      return;
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'تم الرفض',
        description: 'تم رفض الطلب',
      });

      setShowDetailsDialog(false);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفض الطلب',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle quick actions for fulfilling requests
  const handleQuickAction = async (request: ApprovalRequest, action: string) => {
    setQuickActionLoading(action);
    try {
      switch (action) {
        case 'start_preparation':
          // Update status to in_progress
          await supabase
            .from('approval_requests')
            .update({
              status: 'in_progress',
              reviewed_by: user?.id,
              admin_notes: (request.admin_notes || '') + '\n[' + new Date().toLocaleString('ar-EG') + '] بدء إعداد السجل',
            })
            .eq('id', request.id);
          
          toast({
            title: 'تم بدء الإعداد',
            description: 'سيتم إعداد السجل وإرساله للجهة المطلوبة',
          });
          
          // Navigate to relevant register page based on request data
          const registerType = request.request_data?.register_type;
          if (registerType === 'hazardous') {
            navigate('/dashboard/hazardous-register');
          } else {
            navigate('/dashboard/non-hazardous-register');
          }
          break;
          
        case 'view_shipments':
          // Navigate to shipments with filter
          navigate('/dashboard/shipments');
          break;
          
        case 'create_shipment':
          navigate('/dashboard/shipments/new');
          break;
          
        case 'start_support':
          await supabase
            .from('approval_requests')
            .update({
              status: 'in_progress',
              reviewed_by: user?.id,
              admin_notes: (request.admin_notes || '') + '\n[' + new Date().toLocaleString('ar-EG') + '] بدء معالجة طلب الدعم الفني',
            })
            .eq('id', request.id);
          
          toast({
            title: 'تم بدء المعالجة',
            description: 'تم تحديث حالة الطلب إلى قيد التنفيذ',
          });
          break;
          
        case 'apply_changes':
          await supabase
            .from('approval_requests')
            .update({
              status: 'completed',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
              admin_notes: (request.admin_notes || '') + '\n[' + new Date().toLocaleString('ar-EG') + '] تم تطبيق التغييرات',
            })
            .eq('id', request.id);
          
          toast({
            title: 'تم تطبيق التغييرات',
            description: 'تم تحديث البيانات بنجاح',
          });
          break;
      }
      
      fetchRequests();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error executing quick action:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تنفيذ الإجراء',
        variant: 'destructive',
      });
    } finally {
      setQuickActionLoading(null);
    }
  };

  // Mark request as completed
  const handleMarkCompleted = async (request: ApprovalRequest) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'completed',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: (adminNotes || request.admin_notes || '') + '\n[' + new Date().toLocaleString('ar-EG') + '] تم إكمال الطلب',
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'تم الإكمال',
        description: 'تم تحديث حالة الطلب إلى مكتمل',
      });

      setShowDetailsDialog(false);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إكمال الطلب',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = activeTab === 'all' ? true : req.status === activeTab;
    const matchesType = filterType === 'all' || req.request_type === filterType;
    const matchesSearch =
      searchTerm === '' ||
      req.request_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
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
        {request.organization?.name || 'غير محدد'}
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
            setAdminNotes(request.admin_notes || '');
            setShowDetailsDialog(true);
          }}
        >
          <Eye className="h-4 w-4 ml-1" />
          عرض
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
          <p className="text-muted-foreground">مراجعة والموافقة على جميع طلبات الجهات</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-yellow-200 bg-yellow-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('pending')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('in_progress')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('approved')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">تمت الموافقة</p>
                <p className="text-xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('completed')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">مكتمل</p>
                <p className="text-xl font-bold text-emerald-600">{completedCount}</p>
              </div>
              <FileCheck className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('rejected')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">مرفوضة</p>
                <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('all')}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">الإجمالي</p>
                <p className="text-xl font-bold text-gray-600">{requests.length}</p>
              </div>
              <ClipboardList className="h-6 w-6 text-gray-500" />
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
                  placeholder="بحث بالعنوان أو اسم الجهة..."
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-4 w-4" />
                قيد الانتظار
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="mr-1 h-5 px-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-1">
                <PlayCircle className="h-4 w-4" />
                قيد التنفيذ
                {inProgressCount > 0 && (
                  <Badge variant="secondary" className="mr-1 h-5 px-1">
                    {inProgressCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1">
                <CheckCircle className="h-4 w-4" />
                موافق عليها
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1">
                <FileCheck className="h-4 w-4" />
                مكتملة
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1">
                <XCircle className="h-4 w-4" />
                مرفوضة
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1">
                <ClipboardList className="h-4 w-4" />
                الكل
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
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الجهة</TableHead>
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
              تفاصيل الطلب ومعلومات الجهة المُقدمة
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">نوع الطلب</label>
                  <p className="font-medium">
                    {REQUEST_TYPE_LABELS[selectedRequest.request_type] || selectedRequest.request_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">الجهة المُقدمة</label>
                  <p className="font-medium">{selectedRequest.organization?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">الأولوية</label>
                  <Badge className={PRIORITY_COLORS[selectedRequest.priority]}>
                    {PRIORITY_LABELS[selectedRequest.priority]}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">الحالة</label>
                  <Badge className={STATUS_CONFIG[selectedRequest.status]?.color}>
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground">تاريخ الطلب</label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                  </p>
                </div>
              </div>

              {selectedRequest.request_description && (
                <div>
                  <label className="text-sm text-muted-foreground">وصف الطلب</label>
                  <p className="bg-muted p-3 rounded-lg mt-1">{selectedRequest.request_description}</p>
                </div>
              )}

              {selectedRequest.request_data && Object.keys(selectedRequest.request_data).length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">بيانات الطلب</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 text-sm space-y-2">
                    {Object.entries(selectedRequest.request_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions for pending/in_progress requests */}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-3 block">إجراءات سريعة</label>
                  <div className="flex flex-wrap gap-2">
                    {getQuickActions(selectedRequest.request_type).map((action) => (
                      <Button
                        key={action.action}
                        onClick={() => handleQuickAction(selectedRequest, action.action)}
                        disabled={quickActionLoading !== null}
                        className={action.color}
                      >
                        {quickActionLoading === action.action ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <action.icon className="h-4 w-4 ml-2" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes input for pending requests */}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && (
                <div>
                  <label className="text-sm text-muted-foreground">ملاحظات المسؤول</label>
                  <Textarea
                    placeholder="أضف ملاحظات (مطلوبة في حالة الرفض)..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {/* Show existing admin notes */}
              {!['pending', 'in_progress'].includes(selectedRequest.status) && selectedRequest.admin_notes && (
                <div>
                  <label className="text-sm text-muted-foreground">ملاحظات المسؤول</label>
                  <p className="bg-muted p-3 rounded-lg mt-1 whitespace-pre-wrap text-sm">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {selectedRequest.reviewed_at && (
                <div>
                  <label className="text-sm text-muted-foreground">تاريخ المراجعة</label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.reviewed_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            {/* Actions for pending requests */}
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedRequest && handleReject(selectedRequest)}
                  disabled={processingAction}
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  رفض
                </Button>
                <Button
                  onClick={() => selectedRequest && handleApprove(selectedRequest)}
                  disabled={processingAction}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  موافقة
                </Button>
              </>
            )}
            
            {/* Mark as completed for in_progress requests */}
            {selectedRequest?.status === 'in_progress' && (
              <Button
                onClick={() => selectedRequest && handleMarkCompleted(selectedRequest)}
                disabled={processingAction}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4 ml-2" />
                )}
                تم الإكمال
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalRequestsManager;
