import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Building2, 
  Factory,
  Recycle,
  Truck,
  FileText,
  Phone,
  MapPin,
  Mail,
  Hash,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import CreateExternalInvoiceDialog from '@/components/invoices/CreateExternalInvoiceDialog';
import { EntityProfileArchive } from '@/components/archive';

export default function ExternalPartnerDetails() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  // Fetch external partner details
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['external-partner-details', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data, error } = await supabase
        .from('external_partners')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  const getPartnerTypeInfo = (type: string) => {
    switch (type) {
      case 'generator':
        return { label: 'مولد', icon: Factory, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
      case 'recycler':
        return { label: 'مدور', icon: Recycle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'transporter':
        return { label: 'ناقل', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { label: 'شريك', icon: Building2, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
  };

  if (partnerLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">لم يتم العثور على العميل</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const typeInfo = getPartnerTypeInfo(partner.partner_type);
  const TypeIcon = typeInfo.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/partner-accounts')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${typeInfo.bgColor} ${typeInfo.color}`}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{partner.name}</h1>
                  <Badge variant="outline" className="gap-1">
                    <ExternalLink className="h-3 w-3" />
                    عميل خارجي
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">{typeInfo.label}</Badge>
                  <span>تم الإنشاء: {formatDate(partner.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Business Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات التواصل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium" dir="ltr">{partner.phone}</p>
                  </div>
                </div>
              )}
              
              {partner.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium" dir="ltr">{partner.email}</p>
                  </div>
                </div>
              )}
              
              {partner.city && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المدينة</p>
                    <p className="font-medium">{partner.city}</p>
                  </div>
                </div>
              )}
              
              {partner.address && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-medium">{partner.address}</p>
                  </div>
                </div>
              )}

              {!partner.phone && !partner.email && !partner.city && !partner.address && (
                <p className="text-center text-muted-foreground py-4">لا توجد معلومات تواصل</p>
              )}
            </CardContent>
          </Card>

          {/* Business Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات العمل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.tax_number && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الرقم الضريبي</p>
                    <p className="font-medium" dir="ltr">{partner.tax_number}</p>
                  </div>
                </div>
              )}
              
              {partner.commercial_register && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">السجل التجاري</p>
                    <p className="font-medium" dir="ltr">{partner.commercial_register}</p>
                  </div>
                </div>
              )}

              {!partner.tax_number && !partner.commercial_register && (
                <p className="text-center text-muted-foreground py-4">لا توجد معلومات عمل</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {partner.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{partner.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Document Archive */}
        <EntityProfileArchive
          externalPartnerId={partnerId}
          partnerName={partner?.name || ''}
        />

        {/* Financial Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              الفواتير
            </CardTitle>
            <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء فاتورة
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لا توجد فواتير لهذا العميل بعد</p>
              <p className="text-sm mb-4">ستظهر الفواتير هنا بعد إنشائها</p>
              <Button onClick={() => setShowCreateInvoice(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء فاتورة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <CreateExternalInvoiceDialog
          open={showCreateInvoice}
          onOpenChange={setShowCreateInvoice}
          externalPartnerId={partnerId!}
          partnerName={partner?.name || ''}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['external-partner-invoices', partnerId] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
