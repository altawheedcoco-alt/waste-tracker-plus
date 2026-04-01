/**
 * OrgResourcesGrid — شبكة موارد المنظمة (العمليات + الموارد + المالية)
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Clock, AlertTriangle, Activity, Receipt, FileCheck,
  UserCheck, Truck, Handshake, FileText, Wallet, CreditCard, MapPin, Package
} from 'lucide-react';
import StatMicro from './StatMicro';

interface OrgResourcesGridProps {
  stats: any;
  animatedValues: Record<string, number | string>;
}

const OrgResourcesGrid = ({ stats, animatedValues: a }: OrgResourcesGridProps) => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3">
      {/* Row 1: Operations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        <StatMicro icon={DollarSign} label="إجمالي الإيرادات" value={`${a.revenue}K`} color="text-primary"
          onClick={() => navigate('/dashboard/erp/accounting')} />
        <StatMicro icon={Clock} label="بانتظار الموافقة" value={a.pending} color="text-amber-500" alert={(stats?.pendingShipments || 0) > 5}
          onClick={() => navigate('/dashboard/transporter-shipments?status=new')} />
        <StatMicro icon={AlertTriangle} label="متأخرة" value={a.overdue}
          color={(stats?.overdueCount || 0) > 0 ? 'text-destructive' : 'text-primary'} alert={(stats?.overdueCount || 0) > 0}
          onClick={() => navigate('/dashboard/transporter-shipments?status=overdue')} />
        <StatMicro icon={Activity} label="شحنات نشطة" value={a.active} color="text-primary"
          onClick={() => navigate('/dashboard/tracking-center')} />
      </div>

      {/* Row 2: Organization Resources */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
        <StatMicro icon={Receipt} label="الفواتير" value={a.invoices} color="text-primary"
          sub={stats?.unpaidInvoices ? `${stats.unpaidInvoices} معلقة` : 'مسددة'}
          onClick={() => navigate('/dashboard/erp/accounting')} />
        <StatMicro icon={FileCheck} label="الإيصالات" value={a.receipts} color="text-accent-foreground"
          sub={stats?.todayReceipts ? `${stats.todayReceipts} اليوم` : undefined}
          onClick={() => navigate('/dashboard/transporter-receipts')} />
        <StatMicro icon={UserCheck} label="فريق العمل" value={a.members} color="text-secondary-foreground"
          sub={`${stats?.activeMembers || 0} نشط`}
          onClick={() => navigate('/dashboard/org-structure')} />
        <StatMicro icon={Truck} label="المركبات" value={a.vehicles} color="text-primary"
          sub={`${stats?.activeVehicles || 0} فعّال`}
          onClick={() => navigate('/dashboard/transporter-drivers')} />
        <StatMicro icon={Handshake} label="العقود" value={a.contracts} color="text-primary"
          sub={`${stats?.activeContracts || 0} سارٍ`}
          onClick={() => navigate('/dashboard/contracts')} />
        <StatMicro icon={FileText} label="المستندات" value={a.docs} color="text-muted-foreground"
          sub={stats?.expiringDocs ? `${stats.expiringDocs} تنتهي قريباً` : 'سليمة'}
          alert={(stats?.expiringDocs || 0) > 0}
          onClick={() => navigate('/dashboard/document-center')} />
      </div>

      {/* Row 3: Financial & Compliance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatMicro icon={Wallet} label="المدفوعات المعلقة" value={`${Math.round((stats?.pendingPayments || 0) / 1000)}K`} color="text-amber-500"
          onClick={() => navigate('/dashboard/erp/accounting')} />
        <StatMicro icon={CreditCard} label="الإيداعات" value={`${Math.round((stats?.totalDeposits || 0) / 1000)}K`} color="text-primary"
          sub={stats?.pendingDeposits ? `${stats.pendingDeposits} قيد المراجعة` : undefined}
          onClick={() => navigate('/dashboard/quick-deposit-links')} />
        <StatMicro icon={Handshake} label="الشركاء" value={a.partners} color="text-primary"
          onClick={() => navigate('/dashboard/partners')} />
        <StatMicro icon={MapPin} label="بانتظار الاستلام" value={stats?.awaitingPickup || 0} color="text-primary"
          sub={`${stats?.todayQuantity?.toLocaleString('ar-SA') || 0} طن اليوم`}
          onClick={() => navigate('/dashboard/transporter-shipments?status=new')} />
      </div>
    </motion.div>
  );
};

export default OrgResourcesGrid;
