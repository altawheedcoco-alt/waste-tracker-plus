import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PrintExportActions from './PrintExportActions';
import { LedgerEntry } from './AccountLedger';
import TermsDocumentDialog from '@/components/terms/TermsDocumentDialog';

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
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
  // Fetch terms acceptance for partner organization (only for non-external partners)
  const { data: termsAcceptance } = useQuery({
    queryKey: ['partner-terms-acceptance', partner.id],
    queryFn: async () => {
      if (isExternal) return null;
      
      const { data, error } = await supabase
        .from('terms_acceptances')
        .select('*')
        .eq('organization_id', partner.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !isExternal,
  });
  
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

      {/* Actions */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        {/* Terms Button - only for non-external partners with accepted terms */}
        {!isExternal && termsAcceptance && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTermsDialog(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الشروط والأحكام</span>
          </Button>
        )}
        
        {/* Print/Export Actions */}
        <PrintExportActions
          partnerName={partner.name}
          partnerType={partner.organization_type || 'guest'}
          ledgerEntries={ledgerEntries}
          shipments={shipments}
          organizationName={organizationName}
        />
      </div>
      
      {/* Terms Document Dialog */}
      {termsAcceptance && (
        <TermsDocumentDialog
          open={showTermsDialog}
          onOpenChange={setShowTermsDialog}
          acceptance={{
            id: termsAcceptance.id,
            full_name: termsAcceptance.full_name,
            organization_name: partner.name,
            organization_type: partner.organization_type || 'guest',
            terms_version: termsAcceptance.terms_version,
            accepted_at: termsAcceptance.accepted_at,
            ip_address: termsAcceptance.ip_address,
          }}
        />
      )}
    </div>
  );
}
