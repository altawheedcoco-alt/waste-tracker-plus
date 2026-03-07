import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardPrintReports from '@/components/dashboard/shared/DashboardPrintReports';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import BindingAuditPanel from '@/components/shared/BindingAuditPanel';

interface TransporterHeaderProps {
  organizationName: string;
}

const TransporterHeader = ({ organizationName }: TransporterHeaderProps) => {
  const navigate = useNavigate();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <DashboardPrintReports />
        <AutomationSettingsDialog />
        <BindingAuditPanel orgType="transporter" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSmartWeightUpload(true)}
          className="bg-muted/30 border-border/50 text-foreground hover:bg-muted/50 text-[10px] sm:text-sm truncate"
        >
          <Sparkles className="ml-1 h-3 w-3 text-primary shrink-0" />
          <span className="truncate">{t('transporter.smartWeightUpload')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/transporter-shipments')}
          className="bg-muted/30 border-border/50 text-foreground hover:bg-muted/50 text-[10px] sm:text-sm truncate"
        >
          <FileText className="ml-1 h-3 w-3 shrink-0" />
          <span className="truncate">{t('transporter.viewCompanyShipments')}</span>
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/dashboard/shipments/new')}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 shadow-lg shadow-primary/20 text-[10px] sm:text-sm"
        >
          <Plus className="ml-1 h-3 w-3 shrink-0" />
          {t('transporter.createShipment')}
        </Button>
      </div>

      <SmartWeightUpload
        open={showSmartWeightUpload}
        onOpenChange={setShowSmartWeightUpload}
      />
    </>
  );
};

export default TransporterHeader;
