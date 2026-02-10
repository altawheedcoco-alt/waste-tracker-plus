import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileCheck,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Truck,
} from 'lucide-react';
import ReceiptCard from '@/components/receipts/ReceiptCard';
import ReceiptDetailsDialog from '@/components/receipts/ReceiptDetailsDialog';

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

const GeneratorReceipts = () => {
  const { organization } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadReceipts();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(getTabChannelName('generator-receipts'))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipment_receipts',
            filter: `generator_id=eq.${organization.id}`,
          },
          () => {
            loadReceipts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const loadReceipts = async () => {
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
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data as unknown as Receipt[]);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch =
      receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.transporter?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.shipment?.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: receipts.length,
    pending: receipts.filter(r => r.status === 'pending').length,
    confirmed: receipts.filter(r => r.status === 'confirmed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              شهادات استلام الشحنات
            </h1>
            <p className="text-muted-foreground">
              عرض شهادات استلام الشحنات الصادرة من الجهات الناقلة
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Pending Confirmation Alert */}
        {stats.pending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    لديك {stats.pending} شهادة بانتظار التأكيد
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    يرجى مراجعة الشهادات وتأكيد استلام الشحنات
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشهادة أو الشحنة أو الناقل..."
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
            <CardTitle>شهادات الاستلام</CardTitle>
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
                <p className="text-muted-foreground">
                  لم يتم استلام أي شهادات من الجهات الناقلة بعد
                </p>
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
                      showTransporter={true}
                      showGenerator={false}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <ReceiptDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          receipt={selectedReceipt}
          onConfirm={loadReceipts}
          isGenerator={true}
        />
      </div>
    </DashboardLayout>
  );
};

export default GeneratorReceipts;
