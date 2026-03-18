import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RecyclingCertificateDialog from './RecyclingCertificateDialog';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  disposal_method?: string;
  pickup_address?: string;
  delivery_address?: string;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  generator?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    client_code?: string | null;
  } | null;
  transporter?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
  } | null;
  recycler?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
  } | null;
  driver?: {
    license_number?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
    profile?: {
      full_name: string;
      phone?: string;
    } | null;
  } | null;
  has_report?: boolean;
}

interface QuickCertificateButtonProps {
  shipment: Shipment;
  onSuccess?: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

const QuickCertificateButton = ({ 
  shipment, 
  onSuccess,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: QuickCertificateButtonProps) => {
  const { organization } = useAuth();
  const [open, setOpen] = useState(false);
  const [hasReport, setHasReport] = useState(shipment.has_report || false);
  const [checkingReport, setCheckingReport] = useState(false);

  const isRecycler = organization?.organization_type === 'recycler';

  useEffect(() => {
    setHasReport(shipment.has_report || false);
  }, [shipment.has_report]);

  const checkExistingReport = async () => {
    setCheckingReport(true);
    try {
      const { data } = await supabase
        .from('recycling_reports')
        .select('id')
        .eq('shipment_id', shipment.id)
        .maybeSingle();
      
      setHasReport(!!data);
      return !!data;
    } catch (error) {
      console.error('Error checking report:', error);
      return false;
    } finally {
      setCheckingReport(false);
    }
  };

  const handleOpenDialog = async () => {
    if (!hasReport) {
      await checkExistingReport();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Refresh to check if report was created
    checkExistingReport().then((exists) => {
      if (exists) {
        onSuccess?.();
      }
    });
  };

  // For non-recyclers, show view button if report exists
  if (!isRecycler) {
    if (!hasReport) return null;
    
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleOpenDialog}
          disabled={checkingReport}
          className="gap-1"
          title="عرض شهادة التدوير"
        >
          {checkingReport ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-emerald-600" />
          )}
          {showLabel && size !== 'sm' && <span>شهادة التدوير</span>}
        </Button>

        <RecyclingCertificateDialog
          isOpen={open}
          onClose={handleClose}
          shipment={shipment}
        />
      </>
    );
  }

  // For recyclers, show issue/view button
  return (
    <>
      <Button
        variant={hasReport ? 'ghost' : variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={checkingReport}
        className="gap-1"
        title={hasReport ? 'عرض شهادة التدوير' : 'إصدار شهادة تدوير'}
      >
        {checkingReport ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : hasReport ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <FileText className="w-4 h-4 text-primary" />
        )}
        {showLabel && (
          <span className={size === 'sm' ? 'hidden sm:inline' : ''}>
            {hasReport ? 'تم إصدار الشهادة ✓' : 'إصدار شهادة تدوير'}
          </span>
        )}
      </Button>

      <RecyclingCertificateDialog
        isOpen={open}
        onClose={handleClose}
        shipment={shipment}
      />
    </>
  );
};

export default QuickCertificateButton;
