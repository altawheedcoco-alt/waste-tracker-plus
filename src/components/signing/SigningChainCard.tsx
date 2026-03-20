import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  GitBranch, CheckCircle2, Clock, XCircle, PenTool,
  ChevronDown, ChevronUp, FileText, Building2, User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { SigningChain, SigningChainStep } from '@/hooks/useSigningChains';
import DocumentJourneyTimeline from './DocumentJourneyTimeline';

const stepStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'في الانتظار', icon: Clock, color: 'text-yellow-600' },
  signed: { label: 'تم التوقيع', icon: CheckCircle2, color: 'text-emerald-600' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'text-destructive' },
};

interface Props {
  chain: SigningChain;
  myOrgId: string;
  onSignStep?: (step: SigningChainStep, chain: SigningChain) => void;
}

export default function SigningChainCard({ chain, myOrgId, onSignStep }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

  const progress = chain.total_signers > 0
    ? Math.round((chain.completed_signers / chain.total_signers) * 100)
    : 0;

  const mySteps = (chain.steps || []).filter(s => s.signer_org_id === myOrgId);
  const canSign = mySteps.some(s => s.status === 'pending');

  return (
    <>
      <Card className={cn(
        'transition-shadow hover:shadow-md',
        chain.status === 'completed' ? 'border-emerald-200 dark:border-emerald-800' : ''
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2">
              {canSign && onSignStep && (
                <Button size="sm" onClick={() => onSignStep(mySteps.find(s => s.status === 'pending')!, chain)} className="gap-1">
                  <PenTool className="w-3 h-3" /> وقّع
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setJourneyOpen(true)} className="gap-1 text-xs">
                <GitBranch className="w-3 h-3" /> الرحلة
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="p-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 justify-end flex-wrap">
                <Badge variant={chain.status === 'completed' ? 'default' : 'secondary'}
                  className={chain.status === 'completed' ? 'bg-emerald-600' : ''}>
                  {chain.status === 'completed' ? '✅ مكتمل' : chain.status === 'active' ? '🔄 جارٍ' : chain.status}
                </Badge>
                <h3 className="font-semibold">{chain.document_title}</h3>
                <GitBranch className="w-4 h-4 text-primary" />
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mt-2 justify-end">
                <span className="text-xs text-muted-foreground">
                  {chain.completed_signers}/{chain.total_signers} توقيعات
                </span>
                <Progress value={progress} className="w-32 h-2" />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 justify-end">
                {chain.initiated_org && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> بادر: {chain.initiated_org.name}
                  </span>
                )}
                <span>{format(new Date(chain.created_at), 'dd MMM yyyy', { locale: ar })}</span>
              </div>
            </div>
          </div>

          {/* Steps (expanded) */}
          {expanded && (
            <div className="mt-4 border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">أطراف التوقيع:</p>
              {(chain.steps || []).map((step, i) => {
                const sc = stepStatusConfig[step.status] || stepStatusConfig.pending;
                const Icon = sc.icon;
                return (
                  <div key={step.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', sc.color)} />
                      <Badge variant="outline" className="text-[10px]">{sc.label}</Badge>
                      {step.signed_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(step.signed_at), 'dd/MM hh:mm a', { locale: ar })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-sm font-medium">
                        {step.signer_org?.name || step.signer_name || 'غير محدد'}
                      </span>
                      {step.signer_org_id === myOrgId && (
                        <Badge variant="secondary" className="text-[9px]">جهتك</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journey Timeline Dialog */}
      <Dialog open={journeyOpen} onOpenChange={setJourneyOpen}>
        <DialogContent dir="rtl" className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              رحلة المستند: {chain.document_title}
            </DialogTitle>
          </DialogHeader>
          <DocumentJourneyTimeline documentId={chain.id} documentType="signing_chain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
