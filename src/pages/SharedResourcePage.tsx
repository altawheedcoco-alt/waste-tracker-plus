import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSharedResource } from '@/hooks/useSharedResource';
import SharedResourceLayout from '@/components/sharing/SharedResourceLayout';
import SharedPinGate from '@/components/sharing/SharedPinGate';
import SharedShipmentView from '@/components/sharing/renderers/SharedShipmentView';
import SharedBlogView from '@/components/sharing/renderers/SharedBlogView';
import SharedCertificateView from '@/components/sharing/renderers/SharedCertificateView';
import SharedInvoiceView from '@/components/sharing/renderers/SharedInvoiceView';
import SharedOrganizationView from '@/components/sharing/renderers/SharedOrganizationView';
import { Loader2, AlertTriangle, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SharedResourcePage = () => {
  const { type, code } = useParams<{ type: string; code: string }>();
  const [pin, setPin] = useState<string | undefined>();
  const { data, loading, error, requiresPin } = useSharedResource(code, pin);

  // PIN gate
  if (requiresPin && error === 'pin_required') {
    return <SharedPinGate onSubmit={(p) => setPin(p)} />;
  }
  if (error === 'invalid_pin') {
    return <SharedPinGate onSubmit={(p) => setPin(p)} error />;
  }

  // Loading
  if (loading) {
    return (
      <SharedResourceLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SharedResourceLayout>
    );
  }

  // Auth required
  if (error === 'auth_required') {
    return (
      <SharedResourceLayout>
        <div className="text-center py-20 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">يتطلب تسجيل الدخول</h2>
          <p className="text-muted-foreground">هذا المحتوى متاح فقط للمستخدمين المسجلين</p>
          <Button asChild>
            <Link to="/auth">تسجيل الدخول</Link>
          </Button>
        </div>
      </SharedResourceLayout>
    );
  }

  // Not linked
  if (error === 'not_linked') {
    return (
      <SharedResourceLayout>
        <div className="text-center py-20 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">غير مصرح</h2>
          <p className="text-muted-foreground">هذا المحتوى متاح فقط للأطراف المرتبطة</p>
        </div>
      </SharedResourceLayout>
    );
  }

  // Other errors
  if (error || !data) {
    const errorMessages: Record<string, string> = {
      link_not_found: 'الرابط غير موجود أو تم تعطيله',
      link_expired: 'انتهت صلاحية هذا الرابط',
      max_views_reached: 'تم الوصول للحد الأقصى للمشاهدات',
      resource_not_found: 'المورد غير موجود',
      internal_error: 'حدث خطأ. حاول مرة أخرى',
    };

    return (
      <SharedResourceLayout>
        <div className="text-center py-20 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">{errorMessages[error || ''] || 'خطأ غير متوقع'}</h2>
        </div>
      </SharedResourceLayout>
    );
  }

  // Render based on type
  const renderResource = () => {
    switch (data.resource_type) {
      case 'shipment':
        return <SharedShipmentView data={data.data} accessLevel={data.access_level} />;
      case 'blog':
        return <SharedBlogView data={data.data} />;
      default:
        return (
          <div className="bg-card rounded-xl border p-6 text-center">
            <p className="text-muted-foreground">عارض هذا النوع قيد التطوير ({data.resource_type})</p>
          </div>
        );
    }
  };

  return (
    <SharedResourceLayout title={data.title} resourceType={data.resource_type}>
      {renderResource()}
    </SharedResourceLayout>
  );
};

export default SharedResourcePage;
