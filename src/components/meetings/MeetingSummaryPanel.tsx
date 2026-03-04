import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, FileText, Target, CheckSquare, Clock, Users, 
  Loader2, AlertCircle, ArrowLeft, Sparkles, User,
  ChevronDown, ChevronUp, MessageSquare, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface MeetingSummaryPanelProps {
  meetingId: string;
  meetingTitle: string;
  onBack: () => void;
}

interface KeyPoint {
  point: string;
  raised_by?: string;
  time?: string;
  category: string;
}

interface ActionItem {
  task: string;
  assigned_to?: string;
  priority: string;
  deadline?: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: any }> = {
  decision: { label: 'قرار', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: CheckSquare },
  discussion: { label: 'نقاش', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: MessageSquare },
  action: { label: 'إجراء', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Target },
  info: { label: 'معلومة', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: FileText },
  concern: { label: 'ملاحظة', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertCircle },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  high: { label: 'عالية', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  medium: { label: 'متوسطة', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  low: { label: 'منخفضة', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

const MeetingSummaryPanel = ({ meetingId, meetingTitle, onBack }: MeetingSummaryPanelProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [messagesCount, setMessagesCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [expandedSummary, setExpandedSummary] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);

  // Load existing summary
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [meetingRes, messagesRes, participantsRes] = await Promise.all([
        supabase.from('video_meetings').select('*').eq('id', meetingId).single(),
        supabase.from('video_meeting_messages')
          .select('*, sender:profiles!video_meeting_messages_sender_id_fkey(full_name)')
          .eq('meeting_id', meetingId).order('created_at', { ascending: true }),
        supabase.from('video_meeting_participants')
          .select('*, user:profiles!video_meeting_participants_user_id_fkey(full_name)')
          .eq('meeting_id', meetingId),
      ]);

      if (meetingRes.data) {
        const m = meetingRes.data as any;
        setSummary(m.ai_summary);
        setKeyPoints(m.ai_key_points || []);
        setActionItems(m.ai_action_items || []);
        setGeneratedAt(m.summary_generated_at);
        setDurationMinutes(m.meeting_duration_minutes);
      }

      setChatMessages(messagesRes.data || []);
      setMessagesCount(messagesRes.data?.length || 0);
      setParticipantsCount(participantsRes.data?.length || 0);
      setLoading(false);
    };
    
    fetchData();
  }, [meetingId]);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-meeting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ meeting_id: meetingId }),
        }
      );

      if (resp.status === 429) {
        toast.error('تم تجاوز حد الطلبات، حاول لاحقاً');
        return;
      }
      if (resp.status === 402) {
        toast.error('يرجى شحن رصيد الذكاء الاصطناعي');
        return;
      }

      const result = await resp.json();
      if (result.error) throw new Error(result.error);

      setSummary(result.summary);
      setKeyPoints(result.key_points || []);
      setActionItems(result.action_items || []);
      setDurationMinutes(result.duration_minutes);
      setMessagesCount(result.messages_count);
      setParticipantsCount(result.participants_count);
      setGeneratedAt(new Date().toISOString());
      toast.success('تم توليد ملخص الاجتماع بنجاح بواسطة الذكاء الاصطناعي');
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ في تحليل الاجتماع');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> رجوع
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            ملخص الاجتماع: {meetingTitle}
          </h2>
          {generatedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              تم التحليل: {format(new Date(generatedAt), 'dd MMM yyyy - hh:mm a', { locale: ar })}
            </p>
          )}
        </div>
        <Button
          onClick={generateSummary}
          disabled={generating}
          className="gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {summary ? 'إعادة التحليل' : 'تحليل بالذكاء الاصطناعي'}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المدة</p>
              <p className="text-sm font-bold">{durationMinutes ? `${durationMinutes} دقيقة` : 'غير محدد'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المشاركون</p>
              <p className="text-sm font-bold">{participantsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الرسائل</p>
              <p className="text-sm font-bold">{messagesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!summary && !generating ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg mb-2">لم يتم تحليل هذا الاجتماع بعد</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              اضغط على "تحليل بالذكاء الاصطناعي" لتوليد ملخص شامل يتضمن النقاط الرئيسية والقرارات والمهام المطلوبة
            </p>
            <Button onClick={generateSummary} className="gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600">
              <Sparkles className="w-4 h-4" /> تحليل الآن
            </Button>
          </CardContent>
        </Card>
      ) : generating ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <h3 className="font-semibold mb-2">جارٍ تحليل الاجتماع...</h3>
            <p className="text-sm text-muted-foreground">الذكاء الاصطناعي يقرأ سجل المحادثة ويستخلص النقاط المحورية</p>
            <Loader2 className="w-5 h-5 animate-spin mt-3 text-purple-500" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Full Summary */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedSummary(!expandedSummary)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> الملخص الشامل
                </CardTitle>
                {expandedSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {expandedSummary && (
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{summary || ''}</ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" /> النقاط الرئيسية والمحورية
                  <Badge variant="secondary" className="text-[10px]">{keyPoints.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {keyPoints.map((kp, i) => {
                    const cat = CATEGORY_MAP[kp.category] || CATEGORY_MAP.info;
                    const CatIcon = cat.icon;
                    return (
                      <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", cat.color)}>
                          <CatIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{kp.point}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", cat.color)}>
                              {cat.label}
                            </Badge>
                            {kp.raised_by && (
                              <span className="flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5" /> {kp.raised_by}
                              </span>
                            )}
                            {kp.time && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {kp.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-500" /> المهام والإجراءات المطلوبة
                  <Badge variant="secondary" className="text-[10px]">{actionItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {actionItems.map((item, i) => {
                    const pri = PRIORITY_MAP[item.priority] || PRIORITY_MAP.medium;
                    return (
                      <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{item.task}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", pri.color)}>
                              أولوية {pri.label}
                            </Badge>
                            {item.assigned_to && (
                              <span className="flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5" /> {item.assigned_to}
                              </span>
                            )}
                            {item.deadline && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {item.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Transcript */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTranscript(!showTranscript)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" /> سجل المحادثة الكامل
                  <Badge variant="secondary" className="text-[10px]">{chatMessages.length} رسالة</Badge>
                </CardTitle>
                {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                <ScrollArea className="max-h-80">
                  <div className="space-y-1.5">
                    {chatMessages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-2 p-2 rounded bg-muted/30 text-xs">
                        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                          {format(new Date(msg.created_at), 'hh:mm:ss a', { locale: ar })}
                        </span>
                        <span className="font-semibold text-primary shrink-0">
                          {(msg.sender as any)?.full_name || 'مجهول'}:
                        </span>
                        <span className="text-foreground">{msg.content}</span>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-sm">لا توجد رسائل مسجلة</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default MeetingSummaryPanel;
