import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles, Truck, Rocket, Signal } from 'lucide-react';
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
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6"
      >
        {/* Animated mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-56 h-56 bg-cyan-500/[0.06] rounded-full blur-[80px]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-500/[0.06] rounded-full blur-[60px]"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] rounded-full px-3 py-1.5 border border-white/[0.06]">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400/40 animate-ping" />
                </div>
                <span className="text-[10px] text-slate-400">النظام نشط</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 justify-end">
                  {t('transporter.dashboardTitle')}
                  <Rocket className="w-4 h-4 text-cyan-400 hidden sm:inline" />
                </h1>
                <p className="text-cyan-400/70 text-xs sm:text-sm">
                  {t('transporter.welcomeBack')}، <span className="text-white font-medium">{organizationName}</span>
                </p>
              </div>
              <motion.div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 relative"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Truck className="w-6 h-6 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
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
