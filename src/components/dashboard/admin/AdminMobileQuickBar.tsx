/**
 * شريط إجراءات سريعة عائم للموبايل — يظهر أهم 4 إجراءات
 */
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserCheck, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminMobileQuickBar = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const actions = [
    { icon: Plus, label: isRTL ? 'شحنة' : 'Shipment', path: '/dashboard/shipments/new', color: 'bg-primary text-primary-foreground' },
    { icon: UserCheck, label: isRTL ? 'اعتماد' : 'Approve', path: '/dashboard/company-approvals', color: 'bg-amber-500 text-white' },
    { icon: Wallet, label: isRTL ? 'إيداع' : 'Deposit', action: 'deposit', color: 'bg-emerald-500 text-white' },
    { icon: Search, label: isRTL ? 'بحث' : 'Search', path: '/dashboard/shipments', color: 'bg-muted text-foreground' },
  ];

  return (
    <div className="sm:hidden fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-2xl shadow-2xl p-2 flex justify-around gap-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => action.path && navigate(action.path)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all flex-1"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminMobileQuickBar;
