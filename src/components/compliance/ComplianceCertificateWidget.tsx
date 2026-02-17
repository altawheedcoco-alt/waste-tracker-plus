import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Shield, AlertTriangle, CheckCircle2, XCircle, Download, Eye, RefreshCw } from 'lucide-react';
import { useComplianceAssessment, useComplianceCertificates, useIssueCertificate } from '@/hooks/useComplianceCertificate';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import ComplianceCertificateView from './ComplianceCertificateView';

const levelConfig = {
  gold: { label: 'ذهبي', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300', icon: '🥇', gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10' },
  silver: { label: 'فضي', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/30 dark:text-slate-300', icon: '🥈', gradient: 'from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/10' },
  bronze: { label: 'برونزي', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300', icon: '🥉', gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10' },
  not_eligible: { label: 'غير مؤهل', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300', icon: '⚠️', gradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/10' },
};

const axisColors: Record<string, string> = {
  licenses: 'text-blue-600',
  training: 'text-purple-600',
  operations: 'text-emerald-600',
  documentation: 'text-indigo-600',
  safety_environment: 'text-amber-600',
};

const ComplianceCertificateWidget = () => {
  const { data: assessment, isLoading: assessLoading } = useComplianceAssessment();
  const { data: certificates = [], isLoading: certsLoading } = useComplianceCertificates();
  const issueMutation = useIssueCertificate();
  const [viewCert, setViewCert] = useState<any>(null);

  const activeCert = certificates.find((c: any) => c.is_valid && new Date(c.expires_at) > new Date());
  const config = assessment ? levelConfig[assessment.level] : levelConfig.not_eligible;

  if (assessLoading || certsLoading) {
    return (
      <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Award className="w-5 h-5" /> شهادة امتثال iRecycle</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
    );
  }

  return (
    <>
      <Card className={`border-primary/20 bg-gradient-to-br ${config.gradient}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge className={`${config.color} gap-1 text-xs`}>
              {config.icon} {config.label}
            </Badge>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Award className="w-5 h-5 text-primary" />
              شهادة امتثال iRecycle
            </CardTitle>
          </div>
          <CardDescription className="text-right">تقييم شامل مبني على معايير ISO 14001 و ISO 45001</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Score */}
          {assessment && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-3">
              <div className={`text-4xl font-bold ${assessment.overallScore >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                {assessment.overallScore}%
              </div>
              <Progress value={assessment.overallScore} className="h-3 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {assessment.eligible ? 'مؤهل للحصول على الشهادة' : 'غير مؤهل - يجب تحقيق 70% على الأقل'}
              </p>
            </motion.div>
          )}

          {/* Axes Breakdown */}
          {assessment && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-right">محاور التقييم:</h4>
              {assessment.axes.map((axis, i) => (
                <motion.div
                  key={axis.axis}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-8 text-left font-mono font-bold">{axis.score}%</span>
                  <Progress value={axis.score} className="h-2 flex-1" />
                  <span className={`w-28 text-right font-medium ${axisColors[axis.axis]}`}>{axis.label} ({axis.weight}%)</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Gap Items */}
          {assessment && assessment.gapItems.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 text-right flex items-center gap-1 justify-end">
                <AlertTriangle className="w-3.5 h-3.5" /> فجوات يجب معالجتها:
              </p>
              <ul className="space-y-0.5">
                {assessment.gapItems.map((gap, i) => (
                  <li key={i} className="text-[10px] text-amber-600 text-right flex items-start gap-1 justify-end">
                    {gap} <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Certificate */}
          {activeCert && (
            <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setViewCert(activeCert)}>
                    <Eye className="w-3.5 h-3.5" /> عرض
                  </Button>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold">شهادة سارية</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    رقم: {activeCert.certificate_number} • صالحة حتى {format(new Date(activeCert.expires_at), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {assessment?.eligible && !activeCert && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => assessment && issueMutation.mutate(assessment)}
                disabled={issueMutation.isPending}
              >
                {issueMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                إصدار الشهادة
              </Button>
            )}
            {activeCert && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setViewCert(activeCert)}>
                <Download className="w-3.5 h-3.5" /> تحميل PDF
              </Button>
            )}
          </div>

          {/* History */}
          {certificates.length > 1 && (
            <div className="border-t pt-2 mt-2">
              <p className="text-[10px] text-muted-foreground text-right mb-1">الشهادات السابقة:</p>
              {certificates.slice(1, 4).map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between text-[10px] py-0.5">
                  <Button variant="ghost" size="sm" className="text-[10px] h-5 px-1" onClick={() => setViewCert(cert)}>عرض</Button>
                  <span className="text-muted-foreground">
                    {levelConfig[cert.certificate_level as keyof typeof levelConfig]?.icon} {cert.certificate_number} • {cert.overall_score}% • {format(new Date(cert.issued_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewCert && (
        <ComplianceCertificateView
          certificate={viewCert}
          open={!!viewCert}
          onClose={() => setViewCert(null)}
        />
      )}
    </>
  );
};

export default ComplianceCertificateWidget;
