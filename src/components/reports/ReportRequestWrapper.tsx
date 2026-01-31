import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Send,
  AlertCircle,
  Printer,
  Download
} from 'lucide-react';
import { useReportRequests, ReportRequestType } from '@/hooks/useReportRequests';

interface ReportRequestWrapperProps {
  reportType: ReportRequestType;
  reportTitle: string;
  resourceId?: string;
  resourceData?: Record<string, unknown>;
  children: React.ReactNode;
}

const ReportRequestWrapper = ({
  reportType,
  reportTitle,
  resourceId,
  resourceData,
  children,
}: ReportRequestWrapperProps) => {
  const {
    currentRequest,
    loading,
    requesting,
    isAdmin,
    createRequest,
    canPrint,
    hasPendingRequest,
    getRemainingTime,
  } = useReportRequests(reportType, resourceId);

  const [remainingTime, setRemainingTime] = useState<{ minutes: number; seconds: number } | null>(null);
  const [progress, setProgress] = useState(0);

  // Update remaining time every second
  useEffect(() => {
    if (!hasPendingRequest()) return;

    const interval = setInterval(() => {
      const time = getRemainingTime();
      if (time) {
        setRemainingTime({ minutes: time.minutes, seconds: time.seconds });
        // Calculate progress (5 minutes = 300 seconds)
        const totalSeconds = 300;
        const elapsedSeconds = totalSeconds - (time.minutes * 60 + time.seconds);
        setProgress(Math.min((elapsedSeconds / totalSeconds) * 100, 100));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPendingRequest, getRemainingTime]);

  const handleRequestDocument = async () => {
    await createRequest(reportType, reportTitle, resourceId, resourceData);
  };

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If admin, show content directly
  if (isAdmin) {
    return <>{children}</>;
  }

  // If can print (approved), show content
  if (canPrint()) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-700 dark:text-green-400 font-medium">
            المستند جاهز للطباعة والتحميل
          </span>
        </motion.div>
        {children}
      </div>
    );
  }

  // If has pending request, show waiting state
  if (hasPendingRequest()) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto"
      >
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="h-8 w-8 text-amber-600" />
              </motion.div>
            </div>
            <CardTitle className="text-xl text-amber-800 dark:text-amber-300">
              جاري تحضير المستند
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400">
              يرجى الانتظار - سيكون المستند جاهزاً قريباً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-amber-700 dark:text-amber-400">
                <span>جاري المراجعة...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-amber-200 dark:bg-amber-900/40" />
            </div>

            {/* Remaining time */}
            {remainingTime && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
                    {String(remainingTime.minutes).padStart(2, '0')}:
                    {String(remainingTime.seconds).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  الوقت المتبقي للموافقة التلقائية
                </p>
              </div>
            )}

            {/* Status badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                في انتظار مراجعة الإدارة
              </Badge>
            </div>

            {/* Document info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{reportTitle}</p>
                  <p className="text-sm text-gray-500">
                    تم الطلب: {new Date(currentRequest!.created_at).toLocaleTimeString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>

            {/* Info message */}
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                سيتم إشعارك فور جاهزية المستند. يمكنك مغادرة هذه الصفحة والعودة لاحقاً.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // No request yet - show request button
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">{reportTitle}</CardTitle>
          <CardDescription>
            يتطلب هذا المستند موافقة من إدارة النظام قبل الطباعة أو التحميل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features list */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>مراجعة سريعة خلال 5 دقائق كحد أقصى</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>إشعار فوري عند جاهزية المستند</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>طباعة وتحميل PDF بعد الموافقة</span>
            </div>
          </div>

          {/* Request button */}
          <Button 
            onClick={handleRequestDocument}
            disabled={requesting}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {requesting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 ml-2" />
                طلب المستند من الإدارة
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-center text-muted-foreground">
            بالنقر على "طلب المستند"، سيتم إرسال طلبك لمراجعة إدارة النظام
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportRequestWrapper;
