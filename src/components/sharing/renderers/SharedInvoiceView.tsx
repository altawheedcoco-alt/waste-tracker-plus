import { FileText, Calendar, DollarSign, Hash, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SharedInvoiceViewProps {
  data: any;
  accessLevel: string;
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  sent: 'مرسلة',
  paid: 'مدفوعة',
  overdue: 'متأخرة',
  cancelled: 'ملغاة',
  partially_paid: 'مدفوعة جزئياً',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  partially_paid: 'bg-yellow-100 text-yellow-800',
};

const SharedInvoiceView = ({ data, accessLevel }: SharedInvoiceViewProps) => {
  const isPublic = accessLevel === 'public';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Invoice Header */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم الفاتورة</p>
              <p className="font-bold text-lg" dir="ltr">{data.invoice_number}</p>
            </div>
          </div>
          <Badge className={statusColors[data.status] || 'bg-muted'}>
            {statusLabels[data.status] || data.status}
          </Badge>
        </div>

        {/* Partner */}
        {data.partner_name && (
          <div className="flex items-center gap-2 text-sm border-t pt-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">الطرف:</span>
            <span className="font-medium">{data.partner_name}</span>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 border-t pt-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">تاريخ الإصدار</p>
              <p className="font-medium">{new Date(data.issue_date).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
          {data.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">تاريخ الاستحقاق</p>
                <p className="font-medium">{new Date(data.due_date).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-primary/5 rounded-lg p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold">الإجمالي</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {data.total_amount?.toLocaleString('ar-EG')} {data.currency || 'EGP'}
            </span>
          </div>
        </div>
      </div>

      {/* Extended details for linked users */}
      {!isPublic && (
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Hash className="w-4 h-4" />
            تفاصيل مالية
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {data.subtotal != null && (
              <div className="flex justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">المبلغ الأساسي</span>
                <span className="font-medium">{data.subtotal?.toLocaleString('ar-EG')}</span>
              </div>
            )}
            {data.tax_amount != null && (
              <div className="flex justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">الضريبة ({data.tax_rate}%)</span>
                <span className="font-medium">{data.tax_amount?.toLocaleString('ar-EG')}</span>
              </div>
            )}
            {data.discount_amount != null && data.discount_amount > 0 && (
              <div className="flex justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">الخصم</span>
                <span className="font-medium text-green-600">-{data.discount_amount?.toLocaleString('ar-EG')}</span>
              </div>
            )}
            {data.paid_amount != null && (
              <div className="flex justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">المدفوع</span>
                <span className="font-medium text-green-600">{data.paid_amount?.toLocaleString('ar-EG')}</span>
              </div>
            )}
            {data.remaining_amount != null && data.remaining_amount > 0 && (
              <div className="flex justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded col-span-2">
                <span className="text-muted-foreground">المتبقي</span>
                <span className="font-bold text-red-600">{data.remaining_amount?.toLocaleString('ar-EG')}</span>
              </div>
            )}
          </div>

          {data.notes && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedInvoiceView;
