import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PenTool, ShieldCheck, Clock, Stamp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SignatureRecord {
  id: string;
  document_type: string;
  signer_name: string;
  signer_role: string | null;
  signer_title: string | null;
  signature_image_url: string | null;
  stamp_image_url: string | null;
  stamp_applied: boolean;
  signature_method: string;
  signature_hash: string | null;
  platform_seal_number: string | null;
  status: string | null;
  timestamp_signed: string;
}

const ROLE_LABELS: Record<string, string> = {
  generator: 'المولّد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص', other: 'أخرى',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  manifest: 'المانيفست',
  shipment_tracking: 'نموذج التتبع',
};

const METHOD_LABELS: Record<string, string> = {
  digital: 'توقيع رقمي', drawn: 'توقيع مرسوم', drawn_biometric: 'بيومتري + مرسوم', biometric: 'بيومتري', uploaded: 'مرفوع',
};

interface ShipmentSignaturesCardProps {
  shipmentId: string;
}

const ShipmentSignaturesCard = ({ shipmentId }: ShipmentSignaturesCardProps) => {
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shipmentId) return;
    setLoading(true);
    supabase
      .from('document_signatures')
      .select('id, document_type, signer_name, signer_role, signer_title, signature_image_url, stamp_image_url, stamp_applied, signature_method, signature_hash, platform_seal_number, status, timestamp_signed')
      .eq('document_id', shipmentId)
      .order('timestamp_signed', { ascending: true })
      .then(({ data }) => {
        setSignatures((data as unknown as SignatureRecord[]) || []);
        setLoading(false);
      });
  }, [shipmentId]);

  if (loading) return null;
  if (signatures.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenTool className="w-4 h-4 text-muted-foreground" />
            التوقيعات الرقمية
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xs text-muted-foreground text-center py-4">لا توجد توقيعات رقمية حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          التوقيعات الرقمية
          <Badge variant="secondary" className="text-[10px] h-5">{signatures.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {signatures.map((sig, idx) => (
          <div key={sig.id}>
            {idx > 0 && <Separator className="mb-3" />}
            <div className="flex items-start gap-3">
              {/* Signature/stamp images */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {sig.signature_image_url ? (
                  <img src={sig.signature_image_url} alt="توقيع" className="h-8 max-w-[60px] object-contain border rounded p-0.5" />
                ) : (
                  <div className="h-8 w-10 border rounded flex items-center justify-center">
                    <PenTool className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                {sig.stamp_image_url && (
                  <img src={sig.stamp_image_url} alt="ختم" className="h-6 max-w-[30px] object-contain" />
                )}
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{sig.signer_name}</span>
                  {sig.signer_role && (
                    <Badge variant="outline" className="text-[10px] h-4">{ROLE_LABELS[sig.signer_role] || sig.signer_role}</Badge>
                  )}
                  {sig.status === 'signed' && (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                {sig.signer_title && (
                  <p className="text-xs text-muted-foreground">{sig.signer_title}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(sig.timestamp_signed), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                  </span>
                  <Badge variant="secondary" className="text-[9px] h-4">
                    {DOC_TYPE_LABELS[sig.document_type] || sig.document_type}
                  </Badge>
                  <span>{METHOD_LABELS[sig.signature_method] || sig.signature_method}</span>
                  {sig.stamp_applied && (
                    <span className="flex items-center gap-0.5 text-accent-foreground">
                      <Stamp className="w-3 h-3" /> مختوم
                    </span>
                  )}
                </div>
                {sig.platform_seal_number && (
                  <p className="text-[10px] text-muted-foreground font-mono">ختم: {sig.platform_seal_number}</p>
                )}
                {sig.signature_hash && (
                  <p className="text-[10px] text-muted-foreground font-mono">كود: {sig.signature_hash}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ShipmentSignaturesCard;
