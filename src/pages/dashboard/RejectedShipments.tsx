import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  XCircle,
  Search,
  ArrowRight,
  AlertCircle,
  Archive,
  Eye,
  Package,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const RejectedShipments = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showSidelined, setShowSidelined] = useState(false);

  const { data: rejections = [], isLoading } = useQuery({
    queryKey: ['rejected-shipments', organization?.id, showSidelined],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('shipment_rejection_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showSidelined) {
        query = query.eq('is_sidelined', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching rejections:', error);
        return [];
      }

      // Enrich with shipment data
      const enriched = await Promise.all(
        (data || []).map(async (rejection: any) => {
          const { data: shipment } = await supabase
            .from('shipments')
            .select('shipment_number, waste_type, quantity, unit, generator_id, transporter_id')
            .eq('id', rejection.shipment_id)
            .maybeSingle();

          let orgName = '';
          if (rejection.rejected_by_organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', rejection.rejected_by_organization_id)
              .maybeSingle();
            orgName = org?.name || '';
          }

          return { ...rejection, shipment, rejector_name: orgName };
        })
      );

      return enriched;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  const handleSideline = async (rejectionId: string) => {
    try {
      const { error } = await supabase
        .from('shipment_rejection_log')
        .update({
          is_sidelined: true,
          sidelined_at: new Date().toISOString(),
        } as any)
        .eq('id', rejectionId);

      if (error) throw error;
      toast.success('تم تجنيب الشحنة من السجل الفعال');
      queryClient.invalidateQueries({ queryKey: ['rejected-shipments'] });
    } catch (error) {
      console.error('Error sidelining:', error);
      toast.error('حدث خطأ');
    }
  };

  const filtered = rejections.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.shipment?.shipment_number?.toLowerCase().includes(s) ||
      r.rejection_reason?.toLowerCase().includes(s) ||
      r.rejector_name?.toLowerCase().includes(s)
    );
  });

  const activeCount = rejections.filter((r: any) => !r.is_sidelined).length;
  const sidelinedCount = rejections.filter((r: any) => r.is_sidelined).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <div className="text-right flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            <XCircle className="w-7 h-7 text-destructive" />
            سجل الشحنات المرفوضة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            الشحنات التي تم رفضها من قبل الناقل مع أسباب الرفض
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer" onClick={() => setShowSidelined(false)}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">مرفوضات فعالة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setShowSidelined(true)}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Archive className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{sidelinedCount}</p>
              <p className="text-xs text-muted-foreground">تم تجنيبها</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث برقم الشحنة أو سبب الرفض..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
          dir="rtl"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={!showSidelined ? 'default' : 'outline'}
          onClick={() => setShowSidelined(false)}
        >
          المرفوضات الفعالة ({activeCount})
        </Button>
        <Button
          size="sm"
          variant={showSidelined ? 'default' : 'outline'}
          onClick={() => setShowSidelined(true)}
        >
          الكل بما فيها المجنّبة ({rejections.length})
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد شحنات مرفوضة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((rejection: any) => (
            <Card
              key={rejection.id}
              className={`transition-shadow hover:shadow-md ${
                rejection.is_sidelined ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!rejection.is_sidelined && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Archive className="w-4 h-4" />
                            تجنيب
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تجنيب الشحنة المرفوضة</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم نقل هذه الشحنة من السجل الفعال إلى الأرشيف. يمكنك الاطلاع عليها لاحقاً.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSideline(rejection.id)}>
                              تأكيد التجنيب
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {rejection.is_sidelined && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Archive className="w-3 h-3 ml-1" />
                        مُجنّبة
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-right space-y-2">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        {rejection.shipment?.shipment_number || 'غير محدد'}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 ml-1" />
                        مرفوضة
                      </Badge>
                      <span className="font-semibold text-sm">
                        {rejection.rejector_name || 'جهة غير محددة'}
                      </span>
                    </div>

                    {/* Rejection reason */}
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 text-sm text-right">
                      <span className="font-medium text-destructive">سبب الرفض: </span>
                      {rejection.rejection_reason}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-end">
                      {rejection.shipment?.waste_type && (
                        <span>النوع: {rejection.shipment.waste_type}</span>
                      )}
                      {rejection.shipment?.quantity && (
                        <span>الكمية: {rejection.shipment.quantity} {rejection.shipment?.unit || 'كجم'}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(rejection.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
      </DashboardLayout>
  );
};

export default RejectedShipments;
