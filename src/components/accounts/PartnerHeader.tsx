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
  FileText,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function PartnerHeader({ partner, isExternal = false }: PartnerHeaderProps) {
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
        <div className={cn('p-4 rounded-2xl', typeConfig.bgColor, typeConfig.color)}>
          <TypeIcon className="h-8 w-8" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{partner.name}</h1>
            <Badge variant="outline" className={cn('gap-1', typeConfig.color)}>
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </Badge>
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

      {/* Actions */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة كشف
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          إنشاء فاتورة
        </Button>
      </div>
    </div>
  );
}
