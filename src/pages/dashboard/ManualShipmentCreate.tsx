import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';
import { useNavigate } from 'react-router-dom';
import { Truck, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ManualShipmentCreate = () => {
  const navigate = useNavigate();
  const hasLastShipment = !!localStorage.getItem('last_shipment_form');

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
        <BackButton />

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6 mt-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
            <Truck className="h-7 w-7 text-primary" />
          </div>
          <div className="text-right flex-1">
            <h1 className="text-2xl font-bold tracking-tight">إنشاء شحنة يدوية</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أدخل جميع بيانات الشحنة يدوياً — المولد، الناقل، الوجهة، نوع المخلفات، والكميات
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasLastShipment && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Trigger page reload with query param to load last shipment
                  const url = new URL(window.location.href);
                  url.searchParams.set('repeat', '1');
                  window.location.href = url.toString();
                }}
              >
                <RotateCcw className="w-4 h-4" />
                تكرار آخر شحنة
              </Button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/15">
              <Sparkles className="w-3.5 h-3.5" />
              حفظ تلقائي ذكي
            </span>
          </div>
        </div>

        {/* Form */}
        <CreateShipmentForm
          onSuccess={() => navigate('/dashboard/transporter-shipments')}
          onClose={() => navigate(-1)}
          loadLastOnMount={new URLSearchParams(window.location.search).has('repeat')}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManualShipmentCreate;
