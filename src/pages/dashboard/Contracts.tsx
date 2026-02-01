import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  CalendarIcon,
  Building2,
  Search,
  Trash2,
  Edit,
  Eye,
  FileCheck,
  Loader2,
  Wand2
} from 'lucide-react';
import ContractGeneratorDialog from '@/components/contracts/ContractGeneratorDialog';

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description: string | null;
  organization_id: string;
  partner_organization_id: string | null;
  partner_name: string | null;
  contract_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  currency: string | null;
  terms: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  partner_organization?: { name: string } | null;
}

const Contracts = () => {
  const { organization } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    partner_name: '',
    contract_type: 'service',
    status: 'draft',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    value: '',
    terms: '',
    notes: '',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchContracts();
    }
  }, [organization?.id]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          partner_organization:organizations!contracts_partner_organization_id_fkey(name)
        `)
        .or(`organization_id.eq.${organization?.id},partner_organization_id.eq.${organization?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('حدث خطأ أثناء جلب العقود');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('يرجى إدخال عنوان العقد');
      return;
    }

    setSaving(true);
    try {
      const contractData: any = {
        title: formData.title,
        description: formData.description || null,
        partner_name: formData.partner_name || null,
        contract_type: formData.contract_type,
        status: formData.status,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        value: formData.value ? parseFloat(formData.value) : null,
        terms: formData.terms || null,
        notes: formData.notes || null,
        organization_id: organization?.id,
      };

      if (isEditing && selectedContract) {
        const { error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', selectedContract.id);

        if (error) throw error;
        toast.success('تم تحديث العقد بنجاح');
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert(contractData);

        if (error) throw error;
        toast.success('تم إضافة العقد بنجاح');
      }

      setShowAddDialog(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('حدث خطأ أثناء حفظ العقد');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقد؟')) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
      toast.success('تم حذف العقد بنجاح');
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('حدث خطأ أثناء حذف العقد');
    }
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      title: contract.title,
      description: contract.description || '',
      partner_name: contract.partner_name || '',
      contract_type: contract.contract_type,
      status: contract.status,
      start_date: contract.start_date ? new Date(contract.start_date) : undefined,
      end_date: contract.end_date ? new Date(contract.end_date) : undefined,
      value: contract.value?.toString() || '',
      terms: contract.terms || '',
      notes: contract.notes || '',
    });
    setIsEditing(true);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      partner_name: '',
      contract_type: 'service',
      status: 'draft',
      start_date: undefined,
      end_date: undefined,
      value: '',
      terms: '',
      notes: '',
    });
    setSelectedContract(null);
    setIsEditing(false);
  };

  const getContractStatus = (contract: Contract) => {
    if (!contract.end_date) return contract.status;
    const endDate = new Date(contract.end_date);
    if (isPast(endDate) && !isToday(endDate)) return 'expired';
    return contract.status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      draft: { label: 'مسودة', variant: 'outline', icon: FileText },
      active: { label: 'ساري', variant: 'default', icon: CheckCircle2 },
      pending: { label: 'قيد العمل', variant: 'secondary', icon: Clock },
      expired: { label: 'منتهي', variant: 'destructive', icon: XCircle },
      cancelled: { label: 'ملغي', variant: 'destructive', icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getContractTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      service: 'عقد خدمة',
      supply: 'عقد توريد',
      partnership: 'عقد شراكة',
      maintenance: 'عقد صيانة',
      transport: 'عقد نقل',
      recycling: 'عقد تدوير',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  // Filter contracts by status
  const expiredContracts = contracts.filter(c => getContractStatus(c) === 'expired');
  const activeContracts = contracts.filter(c => getContractStatus(c) === 'active');
  const pendingContracts = contracts.filter(c => ['pending', 'draft'].includes(getContractStatus(c)));

  // Search filter
  const filterContracts = (list: Contract[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.contract_number.toLowerCase().includes(query) ||
      c.partner_name?.toLowerCase().includes(query)
    );
  };

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const daysUntilExpiry = contract.end_date 
      ? differenceInDays(new Date(contract.end_date), new Date()) 
      : null;
    const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={cn(
          "transition-all hover:shadow-md",
          isNearExpiry && "border-amber-500/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {getStatusBadge(getContractStatus(contract))}
                  <Badge variant="outline">{getContractTypeLabel(contract.contract_type)}</Badge>
                  {isNearExpiry && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1">
                      <AlertCircle className="w-3 h-3" />
                      ينتهي خلال {daysUntilExpiry} يوم
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg truncate">{contract.title}</h3>
                <p className="text-sm text-muted-foreground">{contract.contract_number}</p>
                {contract.partner_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {contract.partner_name}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {contract.start_date && (
                    <span>من: {format(new Date(contract.start_date), 'dd/MM/yyyy')}</span>
                  )}
                  {contract.end_date && (
                    <span>إلى: {format(new Date(contract.end_date), 'dd/MM/yyyy')}</span>
                  )}
                  {contract.value && (
                    <span className="font-medium text-foreground">
                      {contract.value.toLocaleString()} {contract.currency || 'EGP'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedContract(contract);
                    setShowViewDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEdit(contract)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(contract.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const ContractsList = ({ contracts, emptyMessage }: { contracts: Contract[]; emptyMessage: string }) => {
    const filtered = filterContracts(contracts);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map(contract => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="w-6 h-6" />
              إدارة العقود
            </h1>
            <p className="text-muted-foreground">إدارة العقود والاتفاقيات مع الشركاء</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGeneratorDialog(true)} className="gap-2">
              <Wand2 className="w-4 h-4" />
              إنشاء عقد أوتوماتيكي
            </Button>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة عقد يدوي
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عقود سارية</p>
                  <p className="text-2xl font-bold text-green-600">{activeContracts.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد العمل</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingContracts.length}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">منتهية</p>
                  <p className="text-2xl font-bold text-red-600">{expiredContracts.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في العقود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-1">
              <CheckCircle2 className="w-4 h-4" />
              عقود سارية ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="w-4 h-4" />
              قيد العمل ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-1">
              <XCircle className="w-4 h-4" />
              منتهية ({expiredContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={activeContracts} 
                emptyMessage="لا توجد عقود سارية حالياً" 
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={pendingContracts} 
                emptyMessage="لا توجد عقود قيد العمل" 
              />
            )}
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={expiredContracts} 
                emptyMessage="لا توجد عقود منتهية" 
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل العقد</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان العقد *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان العقد"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الطرف الآخر</Label>
                  <Input
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    placeholder="اسم الشركة أو الجهة"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع العقد</Label>
                  <Select 
                    value={formData.contract_type} 
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">عقد خدمة</SelectItem>
                      <SelectItem value="supply">عقد توريد</SelectItem>
                      <SelectItem value="partnership">عقد شراكة</SelectItem>
                      <SelectItem value="maintenance">عقد صيانة</SelectItem>
                      <SelectItem value="transport">عقد نقل</SelectItem>
                      <SelectItem value="recycling">عقد تدوير</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>حالة العقد</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="pending">قيد العمل</SelectItem>
                      <SelectItem value="active">ساري</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-right", !formData.start_date && "text-muted-foreground")}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-right", !formData.end_date && "text-muted-foreground")}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.end_date ? format(formData.end_date, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>قيمة العقد (بالجنيه)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>وصف العقد</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للعقد"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>شروط وأحكام</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="الشروط والأحكام الرئيسية"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {isEditing ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل العقد</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(getContractStatus(selectedContract))}
                  <Badge variant="outline">{getContractTypeLabel(selectedContract.contract_type)}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedContract.contract_number}</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold">{selectedContract.title}</h3>
                  {selectedContract.partner_name && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="w-4 h-4" />
                      {selectedContract.partner_name}
                    </p>
                  )}
                </div>

                {selectedContract.description && (
                  <div>
                    <Label className="text-muted-foreground">الوصف</Label>
                    <p className="mt-1">{selectedContract.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedContract.start_date && (
                    <div>
                      <Label className="text-muted-foreground">تاريخ البداية</Label>
                      <p className="mt-1">{format(new Date(selectedContract.start_date), 'PPP', { locale: ar })}</p>
                    </div>
                  )}
                  {selectedContract.end_date && (
                    <div>
                      <Label className="text-muted-foreground">تاريخ الانتهاء</Label>
                      <p className="mt-1">{format(new Date(selectedContract.end_date), 'PPP', { locale: ar })}</p>
                    </div>
                  )}
                </div>

                {selectedContract.value && (
                  <div>
                    <Label className="text-muted-foreground">قيمة العقد</Label>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedContract.value.toLocaleString()} {selectedContract.currency || 'EGP'}
                    </p>
                  </div>
                )}

                {selectedContract.terms && (
                  <div>
                    <Label className="text-muted-foreground">الشروط والأحكام</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedContract.terms}</p>
                  </div>
                )}

                {selectedContract.notes && (
                  <div>
                    <Label className="text-muted-foreground">ملاحظات</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedContract.notes}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  تم الإنشاء: {format(new Date(selectedContract.created_at), 'PPP', { locale: ar })}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>إغلاق</Button>
              <Button onClick={() => { setShowViewDialog(false); handleEdit(selectedContract!); }}>
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contract Generator Dialog */}
        <ContractGeneratorDialog
          open={showGeneratorDialog}
          onOpenChange={setShowGeneratorDialog}
          onContractGenerated={fetchContracts}
        />
      </div>
    </DashboardLayout>
  );
};

export default Contracts;
