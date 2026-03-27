import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Sparkles, Truck, Receipt, MapPin, Users, Brain, ClipboardList, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardPrintReports from '@/components/dashboard/shared/DashboardPrintReports';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import BindingAuditPanel from '@/components/shared/BindingAuditPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransporterHeaderProps {
  organizationName: string;
}

const TransporterHeader = ({ organizationName }: TransporterHeaderProps) => {
  const navigate = useNavigate();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <DashboardPrintReports />
        <AutomationSettingsDialog />
        <BindingAuditPanel orgType="transporter" />

        {/* Quick actions dropdown for secondary actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-muted/30 border-border/50 text-foreground hover:bg-muted/50 text-[10px] sm:text-sm"
            >
              <ClipboardList className="ml-1 h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">إجراءات سريعة</span>
              <ChevronDown className="h-3 w-3 mr-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" dir="rtl">
            <DropdownMenuItem onClick={() => navigate('/dashboard/transporter-drivers')}>
              <Users className="ml-2 h-4 w-4" />
              إدارة السائقين
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/driver-tracking')}>
              <MapPin className="ml-2 h-4 w-4" />
              تتبع السائقين
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/transporter-receipts')}>
              <Receipt className="ml-2 h-4 w-4" />
              الإيصالات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/manual-shipment-drafts')}>
              <FileText className="ml-2 h-4 w-4" />
              مسودات الشحن اليدوي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/transporter-ai-tools')}>
              <Brain className="ml-2 h-4 w-4" />
              أدوات الذكاء الاصطناعي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSmartWeightUpload(true)}>
              <Sparkles className="ml-2 h-4 w-4" />
              رفع الأوزان الذكي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/waze-live-map')}>
              <Truck className="ml-2 h-4 w-4" />
              خريطة حية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/transporter-shipments')}
          className="bg-muted/30 border-border/50 text-foreground hover:bg-muted/50 text-[10px] sm:text-sm truncate"
        >
          <FileText className="ml-1 h-3 w-3 shrink-0" />
          <span className="truncate">الشحنات</span>
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/dashboard/shipments/new')}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 shadow-lg shadow-primary/20 text-[10px] sm:text-sm"
        >
          <Plus className="ml-1 h-3 w-3 shrink-0" />
          شحنة جديدة
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
