import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles, Truck, Rocket, Signal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import SmartRequestDialog from '@/components/dashboard/SmartRequestDialog';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardPrintReports from '@/components/dashboard/shared/DashboardPrintReports';
import { motion } from 'framer-motion';

interface TransporterHeaderProps {
  organizationName: string;
}

const TransporterHeader = ({ organizationName }: TransporterHeaderProps) => {
  const navigate = useNavigate();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card p-3 sm:p-6"
      >
        {/* Animated mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-56 h-56 bg-primary/[0.04] rounded-full blur-[80px]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/[0.03] rounded-full blur-[60px]"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5 border border-border/50">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/40 animate-ping" />
                </div>
                <span className="text-[10px] text-muted-foreground">النظام نشط</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2 justify-end">
                  {t('transporter.dashboardTitle')}
                  <Rocket className="w-4 h-4 text-primary hidden sm:inline" />
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {t('transporter.welcomeBack')}، <span className="text-foreground font-medium">{organizationName}</span>
                </p>
              </div>
              <motion.div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 relative"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Truck className="w-6 h-6 text-primary-foreground" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-card"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:flex-wrap w-full">
            <DashboardPrintReports />
            <AutomationSettingsDialog />
            <SmartRequestDialog buttonText={t('transporter.requestReports')} buttonVariant="outline" />
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
              className="col-span-2 sm:col-span-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 shadow-lg shadow-primary/20 text-[10px] sm:text-sm"
            >
              <Plus className="ml-1 h-3 w-3 shrink-0" />
              {t('transporter.createShipment')}
            </Button>
          </div>
        </div>
      </motion.div>

      <SmartWeightUpload
        open={showSmartWeightUpload}
        onOpenChange={setShowSmartWeightUpload}
      />
    </>
  );
};

export default TransporterHeader;
