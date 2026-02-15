import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Play, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, Timer, Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useLatestSecurityAudit, 
  useSecurityAudits,
  useRunSecurityAudit,
  SecurityAudit,
  SecurityFinding,
  checkNameLabels,
  statusConfig
} from '@/hooks/useSecurityAudit';
import { cn } from '@/lib/utils';

export const SecurityAuditPanel = memo(function SecurityAuditPanel() {
  const { data: latestAudit, isLoading } = useLatestSecurityAudit();
  const { data: audits } = useSecurityAudits(5);
  const runAudit = useRunSecurityAudit();
  const [expandedFindings, setExpandedFindings] = useState<string[]>([]);
  
  const toggleFinding = (check: string) => {
    setExpandedFindings(prev => 
      prev.includes(check) 
        ? prev.filter(c => c !== check)
        : [...prev, check]
    );
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getOverallIcon = (status?: string) => {
    switch (status) {
      case 'passed': return <ShieldCheck className="w-8 h-8" />;
      case 'warning': return <ShieldAlert className="w-8 h-8" />;
      case 'failed': return <ShieldX className="w-8 h-8" />;
      default: return <Shield className="w-8 h-8" />;
    }
  };
  
  const getOverallColor = (status?: string) => {
    switch (status) {
      case 'passed': return 'from-green-500 to-emerald-500';
      case 'warning': return 'from-yellow-500 to-orange-500';
      case 'failed': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }
  
  const totalChecks = latestAudit 
    ? (latestAudit.checks_passed + latestAudit.checks_failed + latestAudit.checks_warning) 
    : 0;
  const passRate = totalChecks > 0 
    ? Math.round((latestAudit!.checks_passed / totalChecks) * 100) 
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl text-white bg-gradient-to-br",
                getOverallColor(latestAudit?.status)
              )}>
                {getOverallIcon(latestAudit?.status)}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  الفحص الأمني الدوري
                  {latestAudit?.status && (
                    <Badge 
                      variant="secondary"
                      className={cn(
                        statusConfig[latestAudit.status]?.bgColor,
                        statusConfig[latestAudit.status]?.color
                      )}
                    >
                      {statusConfig[latestAudit.status]?.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {latestAudit ? (
                    <>
                      آخر فحص: {formatDistanceToNow(new Date(latestAudit.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </>
                  ) : (
                    'لم يتم إجراء أي فحص بعد'
                  )}
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => runAudit.mutate()}
              disabled={runAudit.isPending}
              className="gap-2"
            >
              {runAudit.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري الفحص...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  تشغيل الفحص
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {latestAudit && (
          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">ناجح</span>
                </div>
                <p className="text-2xl font-bold">{latestAudit.checks_passed}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">تحذيرات</span>
                </div>
                <p className="text-2xl font-bold">{latestAudit.checks_warning}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">فشل</span>
                </div>
                <p className="text-2xl font-bold">{latestAudit.checks_failed}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm">المدة</span>
                </div>
                <p className="text-2xl font-bold">{latestAudit.run_duration_ms || 0}ms</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">نسبة النجاح</span>
                <span className="text-sm font-medium">{passRate}%</span>
              </div>
              <Progress 
                value={passRate} 
                className={cn(
                  "h-2",
                  passRate >= 80 ? "[&>div]:bg-green-500" :
                  passRate >= 50 ? "[&>div]:bg-yellow-500" :
                  "[&>div]:bg-red-500"
                )}
              />
            </div>
            
            {/* Findings */}
            <div className="space-y-2">
              <h4 className="font-medium mb-3">نتائج الفحوصات</h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pl-2">
                  <AnimatePresence mode="popLayout">
                    {latestAudit.findings.map((finding, index) => (
                      <motion.div
                        key={finding.check}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-sm",
                            finding.status === 'failed' && "border-red-200 bg-red-50/50 dark:bg-red-950/20",
                            finding.status === 'warning' && "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20"
                          )}
                          onClick={() => toggleFinding(finding.check)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(finding.status)}
                                <div>
                                  <span className="font-medium text-sm">
                                    {checkNameLabels[finding.check] || finding.check}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-xs">
                                      {finding.severity}
                                    </Badge>
                                    {finding.count !== undefined && (
                                      <span className="text-xs text-muted-foreground">
                                        {finding.count} عنصر
                                      </span>
                                    )}
                                    {finding.adoption_rate !== undefined && (
                                      <span className="text-xs text-muted-foreground">
                                        {finding.adoption_rate}% معدل الاستخدام
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {expandedFindings.includes(finding.check) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            
                            <AnimatePresence>
                              {expandedFindings.includes(finding.check) && finding.details && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t">
                                    <pre 
                                      className="text-xs bg-muted/50 p-2 rounded overflow-x-auto font-mono" 
                                      dir="ltr"
                                    >
                                      {JSON.stringify(finding.details, null, 2)}
                                    </pre>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* History */}
      {audits && audits.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              سجل الفحوصات السابقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {audits.slice(1).map((audit) => (
                <div 
                  key={audit.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(audit.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(audit.created_at), 'yyyy/MM/dd hh:mm a', { locale: ar })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {audit.checks_passed} ناجح • {audit.checks_warning} تحذير • {audit.checks_failed} فشل
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      statusConfig[audit.status]?.bgColor,
                      statusConfig[audit.status]?.color
                    )}
                  >
                    {statusConfig[audit.status]?.label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
