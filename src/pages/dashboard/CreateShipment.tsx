import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';
import ShipmentCreationFrozenOverlay from '@/components/shipments/ShipmentCreationFrozenOverlay';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShipmentCreationControl } from '@/hooks/useShipmentCreationControl';

interface CreateShipmentProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const CreateShipment = ({ isModal = false, onClose, onSuccess }: CreateShipmentProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isFrozen } = useShipmentCreationControl();

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('shipments.createNewShipment')}</DialogTitle>
            <DialogDescription>{t('shipments.createNewShipmentDesc')}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            {isFrozen && <ShipmentCreationFrozenOverlay />}
            <CreateShipmentForm onSuccess={onSuccess} onClose={onClose} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{t('shipments.createNewShipment')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('shipments.createNewShipmentDesc')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 relative">
            {isFrozen && <ShipmentCreationFrozenOverlay />}
            <CreateShipmentForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
