import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { lazy, Suspense } from "react";

const AdminC2BPanel = lazy(() => import("@/components/c2b/AdminC2BPanel"));

export default function C2BManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">صندوق الوارد — طلبات العملاء (C2B)</h1>
        <p className="text-muted-foreground">إدارة الطلبات والرسائل الواردة من الأفراد والجهات الخارجية</p>
      </div>
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>}>
        <AdminC2BPanel />
      </Suspense>
    </div>
  );
}
