import { motion } from 'framer-motion';
import { Award, Calendar, Download, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLMSMyCertificates } from '@/hooks/useLMS';

const LMSMyCertificates = () => {
  const { data: certificates, isLoading } = useLMSMyCertificates();

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
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LMSMyCertificates;
