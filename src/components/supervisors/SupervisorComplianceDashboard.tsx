import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronDown, ChevronUp, Eye, FileText, Scale, Leaf,
  ClipboardCheck, HardHat, Settings2, Ban, ThumbsUp
} from 'lucide-react';
import {
  runComplianceChecks,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type ComplianceResult,
  type ComplianceCategory,
  type ComplianceCheck,
  type ComplianceStatus,
} from '@/lib/supervisorComplianceEngine';
import { cn } from '@/lib/utils';

interface Props {
  shipment: any;
  supervisorName?: string;
  supervisorType?: 'human' | 'ai';
  onDecision?: (approved: boolean, notes: string) => void;
  compact?: boolean;
}

const categoryIcons: Record<ComplianceCategory, React.ReactNode> = {
  legal: <Scale className="h-4 w-4" />,
  environmental: <Leaf className="h-4 w-4" />,
  regulatory: <ClipboardCheck className="h-4 w-4" />,
  permit: <FileText className="h-4 w-4" />,
  safety: <HardHat className="h-4 w-4" />,
  operational: <Settings2 className="h-4 w-4" />,
};

const statusIcons: Record<ComplianceStatus, React.ReactNode> = {
  pass: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  fail: <XCircle className="h-4 w-4 text-red-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
};

const SupervisorComplianceDashboard = ({ shipment, supervisorName, supervisorType = 'human', onDecision, compact = false }: Props) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['legal', 'environmental', 'regulatory', 'permit']));
  const [decisionNotes, setDecisionNotes] = useState('');

  const result = useMemo(() => {
    if (!shipment) return null;
    return runComplianceChecks(shipment);
  }, [shipment]);

  if (!result) return null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map<ComplianceCategory, ComplianceCheck[]>();
    for (const check of result.checks) {
      if (!map.has(check.category)) map.set(check.category, []);
      map.get(check.category)!.push(check);
    }
    return map;
  }, [result]);

  const OverallBadge = () => {
    const { overallStatus, score } = result;
    const config = {
      pass: { icon: <ShieldCheck className="h-5 w-5" />, label: 'مطابق للمعايير', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', progressColor: 'bg-emerald-500' },
      warning: { icon: <ShieldAlert className="h-5 w-5" />, label: 'تحذيرات قائمة', bg: 'bg-amber-100 text-amber-800 border-amber-300', progressColor: 'bg-amber-500' },
      fail: { icon: <ShieldX className="h-5 w-5" />, label: 'مخالفات حرجة', bg: 'bg-red-100 text-red-800 border-red-300', progressColor: 'bg-red-500' },
      pending: { icon: <Shield className="h-5 w-5" />, label: 'قيد المراجعة', bg: 'bg-muted text-muted-foreground border-border', progressColor: 'bg-muted-foreground' },
    }[overallStatus];

    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-xl border-2', config.bg)}>
        {config.icon}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">{config.label}</span>
            <span className="font-mono font-bold text-lg">{score}%</span>
          </div>
          <Progress value={score} className="h-2 mt-1" />
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {supervisorType === 'ai' ? '🤖 AI' : '👤 بشري'}
            </Badge>
            {supervisorName && (
              <span className="text-xs text-muted-foreground">{supervisorName}</span>
            )}
          </div>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            لوحة الامتثال والمعايير
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <OverallBadge />

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            {result.checks.filter(c => c.status === 'pass').length} ناجح
          </Badge>
          {result.warnings.length > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {result.warnings.length} تحذير
            </Badge>
          )}
          {result.blockers.length > 0 && (
            <Badge variant="outline" className="gap-1 text-red-700 border-red-300">
              <XCircle className="h-3 w-3" />
              {result.blockers.length} حرج
            </Badge>
          )}
        </div>

        {/* Blockers Alert */}
        {result.blockers.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2 text-red-800 dark:text-red-400">
              <Ban className="h-4 w-4" />
              <span className="font-bold text-xs">مخالفات حرجة تمنع المتابعة</span>
            </div>
            <ul className="space-y-1">
              {result.blockers.map(b => (
                <li key={b.id} className="text-[11px] text-red-700 dark:text-red-400 flex items-start gap-1.5">
                  <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">{b.title}</span>
                    {b.legalReference && <span className="text-red-500 mr-1">({b.legalReference})</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Category-wise Checks */}
        <ScrollArea className={compact ? 'max-h-[300px]' : 'max-h-[500px]'}>
          <div className="space-y-2">
            {Array.from(grouped.entries()).map(([category, checks]) => {
              const catInfo = CATEGORY_LABELS[category];
              const isExpanded = expandedCategories.has(category);
              const passCount = checks.filter(c => c.status === 'pass').length;
              const failCount = checks.filter(c => c.status === 'fail').length;
              const warnCount = checks.filter(c => c.status === 'warning').length;

              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      <div className="flex items-center gap-1.5">
                        {failCount > 0 && <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">{failCount}</Badge>}
                        {warnCount > 0 && <Badge className="h-4 px-1.5 text-[9px] bg-amber-500">{warnCount}</Badge>}
                        <span className="text-[10px] text-muted-foreground">{passCount}/{checks.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">{catInfo.ar}</span>
                      <span style={{ color: catInfo.color }}>{categoryIcons[category]}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t divide-y">
                      {checks.map(check => (
                        <div key={check.id} className="p-2.5 flex items-start gap-2 text-right">
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-[11px] font-semibold">{check.title}</span>
                              {statusIcons[check.status]}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{check.description}</p>
                            {check.legalReference && (
                              <p className="text-[9px] text-blue-600 dark:text-blue-400 font-mono">📎 {check.legalReference}</p>
                            )}
                            {check.details && (
                              <p className="text-[10px] mt-0.5" style={{ color: STATUS_LABELS[check.status].color }}>
                                {STATUS_LABELS[check.status].icon} {check.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Decision Section */}
        {onDecision && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-bold">قرار مسئول الحركة</span>
                <Eye className="h-4 w-4 text-primary" />
              </div>

              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="ملاحظات على القرار (اختياري)..."
                className="w-full min-h-[60px] p-2 rounded-lg border text-xs resize-none text-right"
                dir="rtl"
              />

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => onDecision(false, decisionNotes)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  رفض / إيقاف
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                          disabled={!result.canProceed}
                          onClick={() => onDecision(true, decisionNotes)}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          موافقة / متابعة
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!result.canProceed && (
                      <TooltipContent side="top">
                        <p className="text-xs">لا يمكن الموافقة — توجد مخالفات حرجة</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {!result.canProceed && (
                <p className="text-[10px] text-red-600 text-center">
                  ⚠️ يجب معالجة {result.blockers.length} مخالفة حرجة قبل الموافقة
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-[9px] text-muted-foreground text-center pt-2 border-t">
          آخر فحص: {new Date(result.timestamp).toLocaleString('ar-EG')} | المعايير: قانون 202/2020 • قانون 4/1994 • WMRA • شروط الموافقة البيئية
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorComplianceDashboard;
