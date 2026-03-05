/**
 * لوحة التحقق والأمان — التحقق من صحة المستندات
 */
import DocumentVerificationWidget from '@/components/dashboard/DocumentVerificationWidget';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, ScanLine, FileCheck, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerificationPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Inline verification widget */}
      <DocumentVerificationWidget />

      {/* Unified search */}
      <UnifiedDocumentSearch />

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate('/scan')}>
          <CardContent className="p-4 flex items-center gap-3">
            <ScanLine className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-sm">الماسح الضوئي</p>
              <p className="text-xs text-muted-foreground">مسح QR أو باركود</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate('/dashboard/document-verification')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-sm">التحقق المتقدم</p>
              <p className="text-xs text-muted-foreground">فحص شامل لأي مستند</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate('/verify')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-sm">التحقق العام</p>
              <p className="text-xs text-muted-foreground">رابط عام بدون تسجيل</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationPanel;
