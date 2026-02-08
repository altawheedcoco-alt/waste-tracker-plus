import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Building2,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const DisposalIncomingRequests = () => {
  const navigate = useNavigate();
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseAction, setResponseAction] = useState<'approve' | 'reject'>('approve');

  // Fetch facility
  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id
  });

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['disposal-incoming-requests', facility?.id],
    queryFn: async () => {
      if (!facility?.id) return [];
      
      const { data, error } = await supabase
        .from('disposal_incoming_requests')
        .select(`
          *,
          requesting_organization:organizations!disposal_incoming_requests_requesting_organization_id_fkey(name, phone, email)
        `)
        .eq('disposal_facility_id', facility.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!facility?.id
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('disposal_incoming_requests')
        .update({
          status,
          response_notes: notes,
          responded_at: new Date().toISOString(),
          responded_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposal-incoming-requests'] });
      toast.success(responseAction === 'approve' ? 'تم قبول الطلب بنجاح' : 'تم رفض الطلب');
      setShowResponseDialog(false);
      setSelectedRequest(null);
      setResponseNotes('');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث الطلب');
    }
  });

  const handleResponse = () => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: responseAction === 'approve' ? 'approved' : 'rejected',
      notes: responseNotes
    });
  };

  const filteredRequests = requests?.filter((req: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.waste_description?.toLowerCase().includes(query) ||
      req.waste_type?.toLowerCase().includes(query) ||
      req.requesting_organization?.name?.toLowerCase().includes(query)
    );
  });

  const pendingRequests = filteredRequests?.filter((r: any) => r.status === 'pending') || [];
  const approvedRequests = filteredRequests?.filter((r: any) => r.status === 'approved') || [];
  const rejectedRequests = filteredRequests?.filter((r: any) => r.status === 'rejected') || [];
  const completedRequests = filteredRequests?.filter((r: any) => r.status === 'completed') || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">مهم</Badge>;
      case 'normal':
        return <Badge variant="secondary">عادي</Badge>;
      case 'low':
        return <Badge variant="outline">منخفض</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const RequestCard = ({ request }: { request: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              request.hazard_level === 'hazardous' ? 'bg-red-500/10' : 'bg-amber-500/10'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                request.hazard_level === 'hazardous' ? 'text-red-500' : 'text-amber-500'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{request.waste_description || request.waste_type}</h4>
                {getPriorityBadge(request.priority)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                {request.requesting_organization?.name}
              </div>
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  {request.estimated_quantity} {request.unit}
                </span>
                {request.preferred_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(request.preferred_date), 'dd MMM yyyy', { locale: ar })}
                  </span>
                )}
              </div>
              {request.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.notes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {request.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setSelectedRequest(request);
                    setResponseAction('approve');
                    setShowResponseDialog(true);
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  قبول
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-1 text-destructive"
                  onClick={() => {
                    setSelectedRequest(request);
                    setResponseAction('reject');
                    setShowResponseDialog(true);
                  }}
                >
                  <X className="w-4 h-4" />
                  رفض
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="gap-1">
              <Eye className="w-4 h-4" />
              تفاصيل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">طلبات التخلص الواردة</h1>
              <p className="text-muted-foreground text-sm">إدارة طلبات التخلص من الجهات المختلفة</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بنوع المخلف أو الجهة الطالبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-xl">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                قيد الانتظار ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                مقبولة ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <X className="w-4 h-4" />
                مرفوضة ({rejectedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <Package className="w-4 h-4" />
                مكتملة ({completedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6 space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">لا توجد طلبات معلقة</h3>
                    <p className="text-muted-foreground">جميع الطلبات تمت معالجتها</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6 space-y-4">
              {approvedRequests.length > 0 ? (
                approvedRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">لا توجد طلبات مقبولة</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6 space-y-4">
              {rejectedRequests.length > 0 ? (
                rejectedRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <X className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">لا توجد طلبات مرفوضة</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              {completedRequests.length > 0 ? (
                completedRequests.map((request: any) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">لا توجد طلبات مكتملة</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {responseAction === 'approve' ? 'قبول الطلب' : 'رفض الطلب'}
              </DialogTitle>
              <DialogDescription>
                {responseAction === 'approve' 
                  ? 'سيتم إخطار الجهة الطالبة بالموافقة على طلبها'
                  : 'سيتم إخطار الجهة الطالبة برفض طلبها'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">{selectedRequest.waste_description || selectedRequest.waste_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.requesting_organization?.name} • {selectedRequest.estimated_quantity} {selectedRequest.unit}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ملاحظات الرد (اختياري)</label>
                  <Textarea
                    placeholder={responseAction === 'approve' 
                      ? 'مثال: يرجى الحضور في التاريخ المحدد...'
                      : 'مثال: نعتذر، السعة الحالية لا تسمح...'
                    }
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                إلغاء
              </Button>
              <Button 
                variant={responseAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleResponse}
                disabled={updateRequestMutation.isPending}
              >
                {updateRequestMutation.isPending ? 'جاري...' : responseAction === 'approve' ? 'تأكيد القبول' : 'تأكيد الرفض'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DisposalIncomingRequests;
