import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Building2, 
  Factory, 
  Recycle, 
  Truck, 
  Phone, 
  MapPin,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PrintExportActions from './PrintExportActions';
import { LedgerEntry } from './AccountLedger';

interface PartnerHeaderProps {
  partner: {
    id: string;
    name: string;
    organization_type?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  isExternal?: boolean;
  ledgerEntries?: LedgerEntry[];
  shipments?: any[];
  organizationName?: string;
}

const partnerTypeConfig = {
  generator: {
    label: 'مولد',
    icon: Factory,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  recycler: {
    label: 'مدور',
    icon: Recycle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  transporter: {
    label: 'ناقل',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  guest: {
    label: 'عميل خارجي',
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

export default function PartnerHeader({ 
  partner, 
  isExternal = false,
  ledgerEntries = [],
  shipments = [],
  organizationName,
}: PartnerHeaderProps) {
  const navigate = useNavigate();
  
  const typeConfig = partnerTypeConfig[partner.organization_type as keyof typeof partnerTypeConfig] 
    || partnerTypeConfig.guest;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/dashboard/partner-accounts')}
        className="self-start"
      >
        <ArrowRight className="h-5 w-5" />
      </Button>

      {/* Partner Info */}
      <div className="flex items-start gap-4 flex-1">
        {/* Rectangular Company Name Box */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-3 rounded-xl border-2 min-w-[200px]',
          typeConfig.bgColor,
          'border-current/20'
        )}>
          <div className={cn('p-2 rounded-lg bg-background/50', typeConfig.color)}>
            <TypeIcon className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h1 className={cn('text-lg font-bold leading-tight', typeConfig.color)}>
              {partner.name}
            </h1>
            <span className={cn('text-xs font-medium opacity-80', typeConfig.color)}>
              {typeConfig.label}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isExternal && (
              <Badge variant="secondary">عميل خارجي</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {partner.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {partner.city}
              </span>
            )}
            {partner.phone && (
              <a 
                href={`tel:${partner.phone}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {partner.phone}
              </a>
            )}
            {partner.email && (
              <a 
                href={`mailto:${partner.email}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {partner.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Print/Export Actions */}
      <div className="self-start sm:self-center">
        <PrintExportActions
          partnerName={partner.name}
          partnerType={partner.organization_type || 'guest'}
          ledgerEntries={ledgerEntries}
          shipments={shipments}
          organizationName={organizationName}
        />
      </div>
    </div>
  );
}
