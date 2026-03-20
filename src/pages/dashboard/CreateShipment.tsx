import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Construction } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface CreateShipmentProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const UnderDevelopment = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
      <Construction className="w-10 h-10 text-amber-500" />
    </div>
    <h3 className="text-lg font-bold text-foreground">قيد التطوير</h3>
    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
      نعمل حالياً على تطوير وتحسين تجربة إنشاء الشحنات للجهات المولدة. ستكون متاحة قريباً بمزايا متقدمة.
    </p>
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium border border-amber-500/20">
      <Construction className="w-3.5 h-3.5" />
      تحت الإنشاء
    </span>
  </div>
);

const CreateShipment = ({ isModal = false, onClose, onSuccess }: CreateShipmentProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { organization } = useAuth();

  const isGenerator = organization?.organization_type === 'generator';

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('shipments.createNewShipment')}</DialogTitle>
            <DialogDescription>{isGenerator ? 'هذه الميزة قيد التطوير حالياً' : t('shipments.createNewShipmentDesc')}</DialogDescription>
          </DialogHeader>
          {isGenerator ? <UnderDevelopment /> : <CreateShipmentForm onSuccess={onSuccess} onClose={onClose} />}
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
            <p className="text-xs sm:text-sm text-muted-foreground">{isGenerator ? 'هذه الميزة قيد التطوير حالياً' : t('shipments.createNewShipmentDesc')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isGenerator ? <UnderDevelopment /> : <CreateShipmentForm />}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
