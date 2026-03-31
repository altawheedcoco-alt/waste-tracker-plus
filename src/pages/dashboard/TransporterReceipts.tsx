import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Building2,
  FolderOpen,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import ReceiptCard from '@/components/receipts/ReceiptCard';
import CreateReceiptDialog from '@/components/receipts/CreateReceiptDialog';
import ReceiptDetailsDialog from '@/components/receipts/ReceiptDetailsDialog';
import ReceiptConfigPanel from '@/components/receipts/ReceiptConfigPanel';
import ShipmentReceiptManager from '@/components/receipts/ShipmentReceiptManager';

interface Receipt {
  id: string;
  receipt_number: string;
  pickup_date: string;
  waste_type: string;
  actual_weight: number | null;
  declared_weight: number | null;
  unit: string;
  status: string;
  notes: string | null;
  pickup_location: string | null;
  shipment: {
    id: string;
    shipment_number: string;
  } | null;
  generator: {
    id: string;
    name: string;
  } | null;
  transporter: {
    id: string;
    name: string;
  } | null;
  driver: {
    id: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
}

const TransporterReceipts = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState('all');
  const [configOpen, setConfigOpen] = useState(false);
  const [autoReceiptEnabled, setAutoReceiptEnabled] = useState(true);
  const [autoOnDelivered, setAutoOnDelivered] = useState(true);
  const [autoOnInTransit, setAutoOnInTransit] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadReceipts();
    } else {
      setLoading(false);
    }
  }, [organization?.id]);

  const loadReceipts = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipment_receipts')
        .select(`
          id,
          receipt_number,
          pickup_date,
          waste_type,
          actual_weight,
          declared_weight,
          unit,
          status,
          notes,
          pickup_location,
          shipment:shipments(id, shipment_number),
          generator:organizations!shipment_receipts_generator_id_fkey(id, name),
          transporter:organizations!shipment_receipts_transporter_id_fkey(id, name),
          driver:drivers(id, profile:profiles(full_name))
        `)
        .eq('transporter_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Receipt query error:', error);
        throw error;
      }
      setReceipts((data || []) as unknown as Receipt[]);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group generators
  const generators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    receipts.forEach(r => {
      if (r.generator) {
        const existing = map.get(r.generator.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(r.generator.id, { id: r.generator.id, name: r.generator.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [receipts]);

  const handleView = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      setSelectedReceipt(receipt);
      setDetailsDialogOpen(true);
    }
  };

  const handlePrint = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      setSelectedReceipt(receipt);
      setDetailsDialogOpen(true);
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch =
        receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.generator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.shipment?.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
      const matchesGenerator = selectedGeneratorId === 'all' || receipt.generator?.id === selectedGeneratorId;

      return matchesSearch && matchesStatus && matchesGenerator;
    });
  }, [receipts, searchQuery, statusFilter, selectedGeneratorId]);

  // Stats for selected generator or all
  const stats = useMemo(() => {
    const target = selectedGeneratorId === 'all' ? receipts : receipts.filter(r => r.generator?.id === selectedGeneratorId);
    return {
      total: target.length,
      pending: target.filter(r => r.status === 'pending').length,
      confirmed: target.filter(r => r.status === 'confirmed').length,
      disputed: target.filter(r => r.status === 'disputed').length,
    };
  }, [receipts, selectedGeneratorId]);

  const selectedGeneratorName = selectedGeneratorId === 'all' 
    ? 'جميع الجهات المولدة' 
    : generators.find(g => g.id === selectedGeneratorId)?.name || '';

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <BackButton />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <span className="truncate">شهادات استلام الشحنات</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              إدارة شهادات استلام الشحنات مصنفة حسب الجهة المولدة
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(!configOpen)} className="gap-1">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">إعدادات</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => navigate('/dashboard/create-receipt')} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 ml-1" />
              إنشاء شهادة جديدة
            </Button>
          </div>
        </div>

        {/* Config Panel - Collapsible */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <CollapsibleContent>
            <ReceiptConfigPanel
              autoReceiptEnabled={autoReceiptEnabled}
              onAutoReceiptChange={setAutoReceiptEnabled}
              autoOnDelivered={autoOnDelivered}
              onAutoOnDeliveredChange={setAutoOnDelivered}
              autoOnInTransit={autoOnInTransit}
              onAutoOnInTransitChange={setAutoOnInTransit}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Shipment Receipt Manager */}
        <ShipmentReceiptManager onReceiptsChanged={loadReceipts} />

        {/* Generator Accounts Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              حسابات الجهات المولدة
            </CardTitle>
            <CardDescription>اختر جهة مولدة لعرض شهاداتها المستقلة</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedGeneratorId === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGeneratorId('all')}
                className="gap-1"
              >
                <Package className="h-3.5 w-3.5" />
                الكل
                <Badge variant="secondary" className="mr-1 text-xs">{receipts.length}</Badge>
              </Button>
              {generators.map(gen => (
                <Button
                  key={gen.id}
                  variant={selectedGeneratorId === gen.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGeneratorId(gen.id)}
                  className="gap-1"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {gen.name}
                  <Badge variant="secondary" className="mr-1 text-xs">{gen.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats for selected generator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي الشهادات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">بانتظار التأكيد</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">مؤكدة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.disputed}</p>
                <p className="text-sm text-muted-foreground">متنازع عليها</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected generator header */}
        {selectedGeneratorId !== 'all' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedGeneratorName}</p>
                  <p className="text-sm text-muted-foreground">حساب الشهادات المستقل</p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {stats.total} شهادة
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشهادة أو الشحنة أو الجهة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">بانتظار التأكيد</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                    <SelectItem value="disputed">متنازع عليها</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipts List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الشهادات {selectedGeneratorId !== 'all' ? `- ${selectedGeneratorName}` : ''}</CardTitle>
            <CardDescription>{filteredReceipts.length} شهادة</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد شهادات</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedGeneratorId !== 'all' 
                    ? `لم يتم إصدار شهادات لـ ${selectedGeneratorName} بعد`
                    : 'لم يتم إنشاء أي شهادات استلام بعد'}
                </p>
                <Button onClick={() => navigate('/dashboard/create-receipt')}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء شهادة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReceipts.map((receipt, index) => (
                  <motion.div
                    key={receipt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ReceiptCard
                      receipt={receipt}
                      onView={handleView}
                      onPrint={handlePrint}
                      showGenerator={selectedGeneratorId === 'all'}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateReceiptDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={loadReceipts}
        />

        <ReceiptDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          receipt={selectedReceipt}
          isGenerator={false}
        />
      </div>
    </DashboardLayout>
  );
};

export default TransporterReceipts;
