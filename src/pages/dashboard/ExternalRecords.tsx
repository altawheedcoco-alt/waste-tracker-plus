import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BackButton from '@/components/ui/back-button';
import { useAuth } from "@/contexts/AuthContext";
import ExternalWeightRecords from "@/components/records/ExternalWeightRecords";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ExternalRecords() {
  const { organization } = useAuth();
  
  const orgType = organization?.organization_type;
  const isAllowed = orgType === 'recycler' || orgType === 'transporter';

  if (!isAllowed) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-10">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة فقط للجهات المدورة والناقلة
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">سجل الكميات الخارجية</h1>
          <p className="text-muted-foreground">
            تسجيل الكميات والأوزان من مصادر خارجية مع إمكانية ربطها بحسابات النظام
          </p>
        </div>
        
        <ExternalWeightRecords 
          organizationType={orgType as 'recycler' | 'transporter'} 
        />
      </div>
    </DashboardLayout>
  );
}
