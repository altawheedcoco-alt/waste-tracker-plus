import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileCheck, FileX, Package, FileText, Receipt, Shield, Award, Scale, Building2, QrCode, ExternalLink } from 'lucide-react';
import { useQRVerification } from '@/hooks/useQRVerification';
import { DOCUMENT_TYPE_LABELS, DocumentQRType } from '@/lib/documentQR';
import { useNavigate } from 'react-router-dom';

const statusLabels: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغية',
  active: 'نشط', expired: 'منتهي', draft: 'مسودة',
  paid: 'مدفوعة', unpaid: 'غير مدفوعة',
};

const docTypeIcons: Record<string, React.ReactNode> = {
  shipment: <Package className="w-4 h-4" />,
  certificate: <FileCheck className="w-4 h-4" />,
  receipt: <Receipt className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
  invoice: <FileText className="w-4 h-4" />,
  disposal: <Shield className="w-4 h-4" />,
  award_letter: <Award className="w-4 h-4" />,
  statement: <Scale className="w-4 h-4" />,
  report: <FileText className="w-4 h-4" />,
  entity_certificate: <Building2 className="w-4 h-4" />,
};

const UnifiedDocumentSearch = () => {
  const [query, setQuery] = useState('');
  const { loading, result, verify, reset } = useQRVerification();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    reset();
    await verify(query.trim());
  };

  const typeLabel = result?.type
    ? DOCUMENT_TYPE_LABELS[result.type as DocumentQRType]?.ar || result.type
    : '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base justify-end">
          <QrCode className="w-5 h-5 text-primary" />
          بحث وتحقق شامل من المستندات
        </CardTitle>
        <CardDescription className="text-right">
          ابحث بأي رقم مستند: شحنة، شهادة، إيصال، فاتورة، عقد، خطاب ترسية، كود تحقق...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="mr-1">تحقق</span>
          </Button>
          <Input
            placeholder="أدخل رقم المستند أو كود التحقق..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (result) reset(); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-center font-mono"
            dir="ltr"
          />
        </div>

        {/* Supported types badges */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
            <Badge key={key} variant="outline" className="text-[9px] gap-0.5 py-0.5">
              {docTypeIcons[key] || <FileText className="w-3 h-3" />}
              {label.ar}
            </Badge>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.isValid
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <Badge className="bg-green-600 gap-1">
                    <FileCheck className="w-3 h-3" />
                    صحيح ✓
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <FileX className="w-3 h-3" />
                    غير موجود ✗
                  </Badge>
                )}
                {result.status && (
                  <Badge variant="secondary" className="text-[10px]">
                    {statusLabels[result.status] || result.status}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-right">
                {result.isValid && (
                  <Badge variant="outline" className="gap-1">
                    {docTypeIcons[result.type] || <FileText className="w-3 h-3" />}
                    {typeLabel}
                  </Badge>
                )}
                <span className="font-mono text-sm font-bold">{result.reference}</span>
              </div>
            </div>

            {result.isValid && result.data && (
              <div className="grid grid-cols-2 gap-2 text-sm text-right">
                {Object.entries(result.data as Record<string, any>)
                  .filter(([k, v]) => v && typeof v !== 'object' && !['id', 'generator_id', 'transporter_id', 'recycler_id', 'organization_id', 'created_by'].includes(k))
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="truncate">
                      <span className="text-muted-foreground text-xs">{key.replace(/_/g, ' ')}: </span>
                      <span className="font-medium text-xs">{String(value)}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {!result.isValid && result.message && (
              <p className="text-sm text-red-600 dark:text-red-400">{result.message}</p>
            )}

            {result.isValid && result.verifiedAt && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs"
                  onClick={() => navigate(`/qr-verify?type=${result.type}&code=${encodeURIComponent(result.reference)}`)}
                >
                  <ExternalLink className="w-3 h-3" />
                  صفحة التحقق
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  تم التحقق: {new Date(result.verifiedAt).toLocaleString('ar-EG')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedDocumentSearch;
