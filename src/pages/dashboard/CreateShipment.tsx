import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
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

const TIPS_AR = [
  'يمكنك اختيار ناقل ومدوّر مختلفين لنفس الشحنة',
  'استخدم خاصية "تحميل صورة الميزان" للتسجيل التلقائي للوزن',
  'يمكنك حفظ الشحنة كمسودة والعودة لها لاحقاً',
  'أضف ملاحظات خاصة للناقل أو المدوّر في كل شحنة',
];
const TIPS_EN = [
  'You can select different transporter and recycler for the same shipment',
  'Use "Upload Scale Photo" for automatic weight detection',
  'Save as draft and come back later',
  'Add special notes for transporter or recycler',
];

const CreateShipment = ({ isModal = false, onClose, onSuccess }: CreateShipmentProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isFrozen } = useShipmentCreationControl();
  const [showTips, setShowTips] = useState(true);
  const isAr = language === 'ar';
  const tips = isAr ? TIPS_AR : TIPS_EN;
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

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

        {/* Quick Tip */}
        {showTips && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-sm">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="flex-1 text-muted-foreground text-xs">{randomTip}</p>
            <button onClick={() => setShowTips(false)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
