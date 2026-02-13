import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import SmartRequestDialog from '@/components/dashboard/SmartRequestDialog';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import { useLanguage } from '@/contexts/LanguageContext';

interface TransporterHeaderProps {
  organizationName: string;
}

const TransporterHeader = ({ organizationName }: TransporterHeaderProps) => {
  const navigate = useNavigate();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="text-right">
          <h1 className="text-xl sm:text-2xl font-bold">{t('transporter.dashboardTitle')}</h1>
          <p className="text-primary text-sm sm:text-base">
            {t('transporter.welcomeBack')}، {organizationName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AutomationSettingsDialog />
          <SmartRequestDialog buttonText={t('transporter.requestReports')} buttonVariant="outline" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSmartWeightUpload(true)}
            className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/30 hover:border-primary text-xs sm:text-sm"
          >
            <Sparkles className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            {t('transporter.smartWeightUpload')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/transporter-shipments')} className="text-xs sm:text-sm">
            <FileText className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            {t('transporter.viewCompanyShipments')}
          </Button>
          <Button variant="eco" size="sm" onClick={() => navigate('/dashboard/shipments/new')} className="text-xs sm:text-sm">
            <Plus className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            {t('transporter.createShipment')}
          </Button>
        </div>
      </div>

      <SmartWeightUpload
        open={showSmartWeightUpload}
        onOpenChange={setShowSmartWeightUpload}
      />
    </>
  );
};

export default TransporterHeader;
