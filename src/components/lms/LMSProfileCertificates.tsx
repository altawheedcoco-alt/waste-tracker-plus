import { Award, Calendar, Hash, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLMSMyCertificates } from '@/hooks/useLMS';
import { motion } from 'framer-motion';

const LMSProfileCertificates = () => {
  const { data: certificates, isLoading } = useLMSMyCertificates();

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          الشهادات والدورات المكتملة
        </CardTitle>
        <CardDescription>شهادات إتمام الدورات التدريبية من المنصة</CardDescription>
      </CardHeader>
      <CardContent>
        {!certificates?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">لا توجد شهادات بعد. أكمل الدورات التدريبية للحصول على شهادات.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map((cert, i) => {
              const course = cert.lms_courses as any;
              const catData = course?.lms_categories as any;
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-900/10 dark:to-yellow-900/5 border-amber-200 dark:border-amber-800/40">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{course?.title_ar || 'شهادة إتمام'}</h4>
                        {catData?.name_ar && (
                          <p className="text-xs text-muted-foreground">{catData.name_ar}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="outline" className="text-[10px] gap-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            نتيجة: {cert.score}%
                          </Badge>
                          {cert.is_valid && (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                              ✅ سارية
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{cert.certificate_number}</span>
                          <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(cert.issued_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LMSProfileCertificates;
