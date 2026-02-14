import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles, Truck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import SmartRequestDialog from '@/components/dashboard/SmartRequestDialog';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import { useLanguage } from '@/contexts/LanguageContext';
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
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6"
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-xs text-slate-400 hidden sm:inline">
                إدارة الأسطول والشحنات
              </span>
            </motion.div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">{t('transporter.dashboardTitle')}</h1>
                <p className="text-cyan-400/80 text-xs sm:text-sm">
                  {t('transporter.welcomeBack')}، {organizationName}
                </p>
              </div>
              <motion.div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Truck className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <AutomationSettingsDialog />
            <SmartRequestDialog buttonText={t('transporter.requestReports')} buttonVariant="outline" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmartWeightUpload(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white text-xs sm:text-sm"
            >
              <Sparkles className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
              {t('transporter.smartWeightUpload')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/transporter-shipments')}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white text-xs sm:text-sm"
            >
              <FileText className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t('transporter.viewCompanyShipments')}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/dashboard/shipments/new')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
            >
              <Plus className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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
