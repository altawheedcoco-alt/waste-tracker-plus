import { useAuth } from '@/contexts/AuthContext';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        هذه الصفحة متاحة لمدير النظام فقط
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة WaPilot</h1>
        <p className="text-muted-foreground">التحكم في إشعارات الواتساب وحملات الرسائل لجميع المنظمات</p>
      </div>
      <WhatsAppNotificationManager />
    </div>
  );
};

export default WaPilotManagement;
