import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, Shield, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRScanner from '@/components/verification/QRScanner';
import VerificationResult from '@/components/verification/VerificationResult';
import { useQRVerification } from '@/hooks/useQRVerification';

const QRVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, result, verify, reset } = useQRVerification();
  const [showScanner, setShowScanner] = useState(true);

  // Auto-verify if URL has type and code params
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
    // Clear URL params
    navigate('/qr-verify', { replace: true });
    setShowScanner(true);
  };

  const handleViewDetails = () => {
    if (result?.isValid && result.reference) {
      navigate(`/verify?type=${result.type}&code=${result.reference}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-10 w-10 text-green-600" />
            <h1 className="text-3xl font-bold text-green-700">iRecycle</h1>
          </div>
          <p className="text-muted-foreground">نظام إدارة المخلفات وإعادة التدوير</p>
        </motion.div>

        {/* Verification Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary">نظام التحقق الإلكتروني</span>
          <QrCode className="h-6 w-6 text-primary" />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {showScanner && !result ? (
            <QRScanner
              onScan={handleScan}
              isScanning={loading}
              onError={(error) => console.error('Scanner error:', error)}
            />
          ) : loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">جاري التحقق من المستند...</p>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">الرئيسية</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} iRecycle - جميع الحقوق محفوظة
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default QRVerify;
