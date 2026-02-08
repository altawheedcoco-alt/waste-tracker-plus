import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallAnalysis, CallAnalysis } from '@/hooks/useCallAnalysis';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Loader2,
  Sparkles,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
  FileText,
  ListChecks,
  MessageSquare,
} from 'lucide-react';

interface CallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const priorityConfig = {
  urgent: { label: 'عاجل', color: 'bg-red-500', icon: AlertTriangle },
  medium: { label: 'متوسط', color: 'bg-yellow-500', icon: Clock },
  low: { label: 'منخفض', color: 'bg-green-500', icon: CheckCircle2 },
};

const categoryConfig = {
  inquiry: { label: 'استفسار', color: 'bg-blue-500' },
  complaint: { label: 'شكوى', color: 'bg-red-500' },
  service_request: { label: 'طلب خدمة', color: 'bg-purple-500' },
  follow_up: { label: 'متابعة', color: 'bg-orange-500' },
  other: { label: 'أخرى', color: 'bg-gray-500' },
};

const sentimentConfig = {
  positive: { label: 'إيجابي', color: 'text-green-500' },
  neutral: { label: 'محايد', color: 'text-gray-500' },
  negative: { label: 'سلبي', color: 'text-red-500' },
};

const CallLogDialog = ({ open, onOpenChange, onSaved }: CallLogDialogProps) => {
  const { analyzeCall, saveCallLog, isAnalyzing, isSaving } = useCallAnalysis();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callDirection, setCallDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [notes, setNotes] = useState('');
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);

  const handleAnalyze = async () => {
    const result = await analyzeCall(notes, phoneNumber, callDirection, callerName);
    if (result) {
      setAnalysis(result);
    }
  };

  const handleSave = async () => {
    const saved = await saveCallLog({
      phoneNumber,
      callerName,
      callDirection,
      notes,
      analysis: analysis || undefined,
    });
    
    if (saved) {
      // Reset form
      setPhoneNumber('');
      setCallerName('');
      setNotes('');
      setAnalysis(null);
      onOpenChange(false);
      onSaved?.();
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setCallerName('');
    setNotes('');
    setAnalysis(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            تسجيل مكالمة جديدة
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">
              <FileText className="h-4 w-4 ml-2" />
              إدخال البيانات
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!analysis}>
              <Sparkles className="h-4 w-4 ml-2" />
              التحليل
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4 mt-4">
            {/* Call Direction */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={callDirection === 'inbound' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setCallDirection('inbound')}
              >
                <PhoneIncoming className="h-4 w-4 ml-2" />
                مكالمة واردة
              </Button>
              <Button
                type="button"
                variant={callDirection === 'outbound' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setCallDirection('outbound')}
              >
                <PhoneOutgoing className="h-4 w-4 ml-2" />
                مكالمة صادرة
              </Button>
            </div>

            {/* Phone & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                <Input
                  id="phoneNumber"
                  placeholder="01xxxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callerName">اسم المتصل (اختياري)</Label>
                <Input
                  id="callerName"
                  placeholder="اسم العميل"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملخص المكالمة</Label>
              <Textarea
                id="notes"
                placeholder="اكتب ملخص المكالمة هنا... ماذا طلب العميل؟ ما المشكلة؟ ما تم الاتفاق عليه؟"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAnalyze}
                disabled={!notes.trim() || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    تحليل بالذكاء الاصطناعي
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!notes.trim() || isSaving}
                variant="outline"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            {analysis && (
              <ScrollArea className="h-[400px] pr-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Summary & Badges */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${priorityConfig[analysis.priority].color} text-white`}>
                        {priorityConfig[analysis.priority].label}
                      </Badge>
                      <Badge className={`${categoryConfig[analysis.category].color} text-white`}>
                        {categoryConfig[analysis.category].label}
                      </Badge>
                      <Badge variant="outline" className={sentimentConfig[analysis.sentiment].color}>
                        {sentimentConfig[analysis.sentiment].label}
                      </Badge>
                    </div>
                    <p className="text-sm">{analysis.summary}</p>
                  </div>

                  {/* Requirements */}
                  {analysis.requirements?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        متطلبات العميل
                      </h4>
                      <ul className="space-y-1">
                        {analysis.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Issues */}
                  {analysis.issues && analysis.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        المشاكل المذكورة
                      </h4>
                      <ul className="space-y-1">
                        {analysis.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-destructive mt-1">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions Required */}
                  {analysis.actions_required && analysis.actions_required.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        الإجراءات المطلوبة
                      </h4>
                      <div className="space-y-2">
                        {analysis.actions_required.map((action, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                            <Badge variant="outline" className={`${priorityConfig[action.priority].color} text-white text-[10px]`}>
                              {priorityConfig[action.priority].label}
                            </Badge>
                            {action.action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Recommendations */}
                  {analysis.follow_up_recommendations && analysis.follow_up_recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        توصيات المتابعة
                      </h4>
                      <ul className="space-y-1">
                        {analysis.follow_up_recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keywords */}
                  {analysis.keywords && analysis.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        الكلمات المفتاحية
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ المكالمة والتحليل
                      </>
                    )}
                  </Button>
                </motion.div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CallLogDialog;
