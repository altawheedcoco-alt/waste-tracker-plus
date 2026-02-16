import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Calendar, Download, Hash, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useLMSMyCertificates } from '@/hooks/useLMS';
import { usePDFExport } from '@/hooks/usePDFExport';
import { QRCodeSVG } from 'qrcode.react';
import { generateDocumentQRValue } from '@/lib/documentQR';

const LMSCertificatePrintable = ({ cert }: { cert: any }) => {
  const course = cert.lms_courses as any;
  const qrValue = generateDocumentQRValue('lms_certificate', cert.certificate_number);

  return (
    <div className="p-8 bg-white text-black min-h-[600px] flex flex-col items-center justify-center text-center space-y-4 border-8 border-double border-amber-400" dir="rtl">
      <div className="text-6xl">🏆</div>
      <h1 className="text-2xl font-black text-amber-700">شهادة إتمام دورة تدريبية</h1>
      <p className="text-sm text-gray-500">يشهد نظام iRecycle التعليمي بأن</p>
      <h2 className="text-xl font-bold">{course?.title_ar || 'دورة تدريبية'}</h2>
      <p className="text-lg">قد تم إتمامها بنجاح بنتيجة <strong>{cert.score}%</strong></p>
      <div className="pt-4 border-t border-gray-300 text-xs text-gray-500 space-y-1">
        <p>رقم الشهادة: {cert.certificate_number}</p>
        <p>تاريخ الإصدار: {new Date(cert.issued_at).toLocaleDateString('ar-EG')}</p>
        {cert.is_valid && <p className="text-green-700 font-semibold">✅ شهادة سارية</p>}
      </div>
      <QRCodeSVG value={qrValue} size={80} />
    </div>
  );
};

const LMSMyCertificates = () => {
  const { data: certificates, isLoading } = useLMSMyCertificates();
  const printRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { exportToPDF, printContent } = usePDFExport({ filename: 'lms-certificate' });

  const handlePrint = (certId: string) => {
    const el = printRefs.current[certId];
    if (el) printContent(el);
  };

  const handleDownload = (cert: any) => {
    const el = printRefs.current[cert.id];
    if (el) exportToPDF(el, `شهادة-${cert.certificate_number}`);
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!certificates?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">لا توجد شهادات بعد</p>
        <p className="text-sm">أكمل الدورات واجتز الاختبارات للحصول على شهادات</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {certificates.map((cert, i) => {
          const course = cert.lms_courses as any;
          return (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/10">
                <CardContent className="p-6 text-center space-y-3">
                  <Award className="w-12 h-12 mx-auto text-amber-500" />
                  <h3 className="font-bold text-lg">{course?.title_ar || 'شهادة إتمام'}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                      نتيجة: {cert.score}%
                    </Badge>
                    {cert.is_valid && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">سارية</Badge>}
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center justify-center gap-1"><Hash className="w-3 h-3" />{cert.certificate_number}</p>
                    <p className="flex items-center justify-center gap-1"><Calendar className="w-3 h-3" />{new Date(cert.issued_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(cert.id)} className="gap-1">
                      <Printer className="w-3.5 h-3.5" />
                      طباعة
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleDownload(cert)} className="gap-1">
                      <Download className="w-3.5 h-3.5" />
                      تحميل PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      {/* Hidden printable certificates */}
      <div className="fixed left-[-9999px] top-0">
        {certificates.map(cert => (
          <div key={cert.id} ref={el => { printRefs.current[cert.id] = el; }}>
            <LMSCertificatePrintable cert={cert} />
          </div>
        ))}
      </div>
    </>
  );
};

export default LMSMyCertificates;
