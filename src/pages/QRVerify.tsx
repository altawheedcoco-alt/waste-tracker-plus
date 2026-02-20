import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, Shield, QrCode, Scan, FileSearch, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QRScanner from '@/components/verification/QRScanner';
import VerificationResult from '@/components/verification/VerificationResult';
import { useQRVerification } from '@/hooks/useQRVerification';

const SUPPORTED_TYPES = [
  { label: 'شحنات', icon: '📦' },
  { label: 'عقود', icon: '📄' },
  { label: 'فواتير', icon: '💳' },
  { label: 'شهادات', icon: '🏆' },
  { label: 'خطابات ترسية', icon: '📜' },
  { label: 'إيصالات', icon: '🧾' },
  { label: 'مفوضين', icon: '✍️' },
];

const QRVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, result, verify, reset } = useQRVerification();
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    const type = searchParams.get('type');
    const code = searchParams.get('code');
    if (type && code) {
      setShowScanner(false);
      verify(`${window.location.origin}/qr-verify?type=${type}&code=${code}`);
    }
  }, [searchParams]);

  const handleScan = async (data: string) => {
    setShowScanner(false);
    await verify(data);
  };

  const handleScanAgain = () => {
    reset();
    navigate('/qr-verify', { replace: true });
    setShowScanner(true);
  };

  const handleViewDetails = () => {
    if (result?.isValid && result.reference) {
      navigate(`/verify?type=${result.type}&code=${result.reference}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50/30 py-6 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-9 w-9 text-green-600" />
            <h1 className="text-2xl font-bold text-green-700">iRecycle</h1>
          </div>
          <p className="text-sm text-muted-foreground">نظام إدارة المخلفات وإعادة التدوير</p>
        </motion.div>

        {/* Verification Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary text-sm">نظام التحقق الإلكتروني</span>
            <Lock className="h-4 w-4 text-primary" />
          </div>
        </motion.div>

        {/* Supported types badges - only show when scanner visible */}
        {showScanner && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-1.5 mb-6"
          >
            {SUPPORTED_TYPES.map((t) => (
              <Badge key={t.label} variant="secondary" className="text-[10px] gap-1 py-0.5">
                <span>{t.icon}</span> {t.label}
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {showScanner && !result ? (
            <QRScanner
              onScan={handleScan}
              isScanning={loading}
              onError={(error) => console.error('Scanner error:', error)}
            />
          ) : loading ? (
            <div className="text-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
              />
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <FileSearch className="w-5 h-5 animate-pulse" />
                <p className="text-lg">جاري التحقق من المستند...</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">يتم البحث في قاعدة البيانات المركزية</p>
            </div>
          ) : result ? (
            <VerificationResult
              result={result}
              onScanAgain={handleScanAgain}
              onViewDetails={result.isValid ? handleViewDetails : undefined}
            />
          ) : null}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">الرئيسية</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} iRecycle - جميع الحقوق محفوظة
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default QRVerify;
