import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';

interface CreateShipmentProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const CreateShipment = ({ isModal = false, onClose, onSuccess }: CreateShipmentProps) => {
  const navigate = useNavigate();

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
            <DialogDescription>إدخال بيانات الشحنة الجديدة</DialogDescription>
          </DialogHeader>
          <CreateShipmentForm onSuccess={onSuccess} onClose={onClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء شحنة جديدة</h1>
            <p className="text-muted-foreground">إدخال بيانات الشحنة الجديدة</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CreateShipmentForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
