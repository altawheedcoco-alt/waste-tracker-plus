import { CheckCircle2, Clock, PlayCircle, FileCheck, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completedAt?: string | null;
}

interface ApprovalWorkflowStepperProps {
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  className?: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'submitted', label: 'تم الإرسال', description: 'تم تقديم الطلب بنجاح', icon: FileCheck },
  { id: 'pending', label: 'قيد المراجعة', description: 'الطلب في انتظار مراجعة المسؤول', icon: Clock },
  { id: 'in_progress', label: 'قيد التنفيذ', description: 'جارٍ العمل على الطلب', icon: PlayCircle },
  { id: 'completed', label: 'مكتمل', description: 'تم تنفيذ الطلب بالكامل', icon: CheckCircle2 },
];

const getActiveStepIndex = (status: string): number => {
  switch (status) {
    case 'pending': return 1;
    case 'in_progress': return 2;
    case 'approved':
    case 'completed': return 3;
    case 'rejected': return -1; // Special case
    default: return 0;
  }
};

export default function ApprovalWorkflowStepper({
  status,
  createdAt,
  reviewedAt,
  adminNotes,
  className,
}: ApprovalWorkflowStepperProps) {
  const isRejected = status === 'rejected';
  const activeIndex = getActiveStepIndex(status);

  if (isRejected) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive text-sm">تم رفض الطلب</p>
            {adminNotes && <p className="text-xs text-muted-foreground mt-0.5">{adminNotes}</p>}
            {reviewedAt && (
              <p className="text-[10px] text-muted-foreground mt-1">
                بتاريخ: {new Date(reviewedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)} dir="rtl">
      <p className="text-xs font-medium text-muted-foreground mb-3">مسار سير الطلب</p>
      <div className="flex items-start gap-0">
        {WORKFLOW_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const isLast = index === WORKFLOW_STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted && !isCurrent && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'bg-primary/20 border-primary text-primary animate-pulse',
                    !isCompleted && 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <p className={cn(
                  'text-[10px] mt-1.5 text-center leading-tight max-w-[70px]',
                  isCurrent ? 'font-bold text-primary' : isCompleted ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div className="flex-1 mt-4 mx-1">
                  <div className={cn(
                    'h-0.5 w-full rounded-full transition-all',
                    index < activeIndex ? 'bg-primary' : 'bg-border'
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {adminNotes && (
        <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          💬 ملاحظات المسؤول: {adminNotes}
        </div>
      )}
    </div>
  );
}
