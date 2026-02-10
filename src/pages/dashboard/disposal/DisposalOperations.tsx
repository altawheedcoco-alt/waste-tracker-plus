import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MoreVertical,
  Eye,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const DisposalOperations = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);

  const { data: operations, isLoading } = useQuery({
    queryKey: ['disposal-operations', organization?.id, statusFilter, methodFilter],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from('disposal_operations')
        .select(`*, disposal_facility:disposal_facilities(name), shipment:shipments(shipment_number)`)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (methodFilter !== 'all') query = query.eq('disposal_method', methodFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id
  });

  const issueCertMutation = useMutation({
    mutationFn: async (op: any) => {
      const certNumber = `DISP-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from('disposal_operations')
        .update({ 
          certificate_number: certNumber, 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', op.id);
      if (error) throw error;
      return certNumber;
    },
    onSuccess: (certNumber) => {
      toast.success(`تم إصدار الشهادة بنجاح: ${certNumber}`);
      queryClient.invalidateQueries({ queryKey: ['disposal-operations'] });
      setShowCertDialog(false);
      setSelectedOp(null);
    },
    onError: () => toast.error('فشل إصدار الشهادة'),
  });

  const filteredOperations = operations?.filter((op: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      op.waste_description?.toLowerCase().includes(q) ||
      op.waste_type?.toLowerCase().includes(q) ||
      op.manifest_number?.toLowerCase().includes(q) ||
      op.certificate_number?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 gap-1"><CheckCircle className="w-3 h-3" /> مكتمل</Badge>;
      case 'processing': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 gap-1"><Clock className="w-3 h-3" /> قيد المعالجة</Badge>;
      case 'pending': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'landfill': return 'دفن صحي';
      case 'incineration': return 'حرق';
      case 'chemical_treatment': return 'معالجة كيميائية';
      case 'biological_treatment': return 'معالجة بيولوجية';
      default: return method;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">سجل عمليات التخلص</h1>
              <p className="text-muted-foreground text-sm">إدارة وتتبع جميع عمليات التخلص من المخلفات الخطرة</p>
            </div>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
            onClick={() => navigate('/dashboard/disposal/operations/new')}>
            <Plus className="w-4 h-4" /> تسجيل عملية جديدة
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="بحث بالوصف، رقم البيان، أو رقم الشهادة..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="طريقة التخلص" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطرق</SelectItem>
                    <SelectItem value="landfill">دفن صحي</SelectItem>
                    <SelectItem value="incineration">حرق</SelectItem>
                    <SelectItem value="chemical_treatment">معالجة كيميائية</SelectItem>
                    <SelectItem value="biological_treatment">معالجة بيولوجية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Operations Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سجل العمليات ({filteredOperations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredOperations && filteredOperations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">نوع المخلف</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">طريقة التخلص</TableHead>
                        <TableHead className="text-right">رقم البيان</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOperations.map((operation: any) => (
                        <TableRow key={operation.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(operation.disposal_date), 'dd MMM yyyy', { locale: ar })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{operation.waste_description || operation.waste_type}</p>
                              {operation.hazard_level && (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  <AlertTriangle className="w-3 h-3 mr-1" />{operation.hazard_level}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{operation.quantity}</span>
                            <span className="text-muted-foreground mr-1">{operation.unit}</span>
                          </TableCell>
                          <TableCell>{getMethodLabel(operation.disposal_method)}</TableCell>
                          <TableCell className="font-mono text-sm">{operation.manifest_number || '-'}</TableCell>
                          <TableCell>{getStatusBadge(operation.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2" onClick={() => { setSelectedOp(operation); setShowDetails(true); }}>
                                  <Eye className="w-4 h-4" /> عرض التفاصيل
                                </DropdownMenuItem>
                                {operation.certificate_number && (
                                  <DropdownMenuItem className="gap-2" onClick={() => { setSelectedOp(operation); toast.info(`رقم الشهادة: ${operation.certificate_number}`); }}>
                                    <Download className="w-4 h-4" /> عرض الشهادة
                                  </DropdownMenuItem>
                                )}
                                {!operation.certificate_number && (
                                  <DropdownMenuItem className="gap-2" onClick={() => { setSelectedOp(operation); setShowCertDialog(true); }}>
                                    <FileText className="w-4 h-4" /> إصدار شهادة
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد عمليات</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بتسجيل أول عملية تخلص</p>
                  <Button onClick={() => navigate('/dashboard/disposal/operations/new')}>
                    <Plus className="w-4 h-4 mr-2" /> تسجيل عملية جديدة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل عملية التخلص</DialogTitle>
            <DialogDescription>معلومات تفصيلية عن العملية المحددة</DialogDescription>
          </DialogHeader>
          {selectedOp && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">نوع المخلف</p><p className="font-medium">{selectedOp.waste_description || selectedOp.waste_type}</p></div>
                <div><p className="text-muted-foreground">مستوى الخطورة</p><p className="font-medium">{selectedOp.hazard_level || 'غير محدد'}</p></div>
                <div><p className="text-muted-foreground">الكمية</p><p className="font-medium">{selectedOp.quantity} {selectedOp.unit}</p></div>
                <div><p className="text-muted-foreground">طريقة التخلص</p><p className="font-medium">{getMethodLabel(selectedOp.disposal_method)}</p></div>
                <div><p className="text-muted-foreground">تاريخ التخلص</p><p className="font-medium">{format(new Date(selectedOp.disposal_date), 'dd MMMM yyyy', { locale: ar })}</p></div>
                <div><p className="text-muted-foreground">الحالة</p>{getStatusBadge(selectedOp.status)}</div>
                <div><p className="text-muted-foreground">رقم البيان</p><p className="font-mono">{selectedOp.manifest_number || '-'}</p></div>
                <div><p className="text-muted-foreground">رقم الشهادة</p><p className="font-mono">{selectedOp.certificate_number || 'لم تُصدر بعد'}</p></div>
                <div><p className="text-muted-foreground">المنشأة</p><p className="font-medium">{selectedOp.disposal_facility?.name || '-'}</p></div>
                <div><p className="text-muted-foreground">الشحنة</p><p className="font-mono">{selectedOp.shipment?.shipment_number || '-'}</p></div>
                <div><p className="text-muted-foreground">مسؤول الاستلام</p><p className="font-medium">{selectedOp.receiving_officer || '-'}</p></div>
                <div><p className="text-muted-foreground">التكلفة</p><p className="font-medium">{selectedOp.cost ? `${selectedOp.cost} ${selectedOp.currency || 'EGP'}` : '-'}</p></div>
              </div>
              {selectedOp.notes && (
                <div><p className="text-muted-foreground">ملاحظات</p><p>{selectedOp.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إصدار شهادة تخلص</DialogTitle>
            <DialogDescription>سيتم إصدار شهادة رسمية لهذه العملية وتحديث حالتها إلى "مكتمل"</DialogDescription>
          </DialogHeader>
          {selectedOp && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <p><strong>نوع المخلف:</strong> {selectedOp.waste_description || selectedOp.waste_type}</p>
                <p><strong>الكمية:</strong> {selectedOp.quantity} {selectedOp.unit}</p>
                <p><strong>طريقة التخلص:</strong> {getMethodLabel(selectedOp.disposal_method)}</p>
                <p><strong>التاريخ:</strong> {format(new Date(selectedOp.disposal_date), 'dd MMMM yyyy', { locale: ar })}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCertDialog(false)}>إلغاء</Button>
                <Button 
                  onClick={() => issueCertMutation.mutate(selectedOp)}
                  disabled={issueCertMutation.isPending}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {issueCertMutation.isPending ? 'جاري الإصدار...' : 'إصدار الشهادة'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DisposalOperations;
