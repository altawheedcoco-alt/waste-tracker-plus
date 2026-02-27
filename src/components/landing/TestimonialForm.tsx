import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquarePlus } from 'lucide-react';
import { z } from 'zod';

const testimonialSchema = z.object({
  author_name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  comment: z.string().trim().min(10, 'التعليق يجب أن يكون 10 أحرف على الأقل').max(500, 'التعليق يجب ألا يتجاوز 500 حرف'),
});

const TestimonialForm = () => {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = testimonialSchema.safeParse({ author_name: name, comment });
    if (!result.success) {
      toast({
        title: 'خطأ',
        description: result.error.errors[0]?.message || 'بيانات غير صالحة',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('testimonials').insert({
        author_name: result.data.author_name,
        comment: result.data.comment,
      });

      if (error) throw error;

      setSubmitted(true);
      setName('');
      setComment('');
      toast({
        title: 'تم الإرسال بنجاح ✅',
        description: 'شكراً لمشاركتك! سيتم مراجعة تعليقك قبل نشره.',
      });
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال التعليق. حاول مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 px-6 bg-primary/5 rounded-2xl border border-primary/20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquarePlus className="w-8 h-8 text-primary" />
        </div>
        <h4 className="text-lg font-bold text-foreground mb-2">شكراً لمشاركتك! 🎉</h4>
        <p className="text-sm text-muted-foreground mb-4">سيتم مراجعة تعليقك ونشره في أقرب وقت.</p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>إرسال تعليق آخر</Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-3 border border-primary/20">
          <MessageSquarePlus className="w-4 h-4" />
          شاركنا تجربتك
        </div>
        <h3 className="text-xl font-bold text-foreground">هل استفدت من منصة iRecycle؟</h3>
        <p className="text-sm text-muted-foreground mt-1">أخبرنا عن تجربتك وساعد الآخرين على اتخاذ القرار</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="اسمك الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-right"
            maxLength={100}
            dir="rtl"
          />
        </div>
        <div>
          <Textarea
            placeholder="اكتب تجربتك مع المنصة..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-right min-h-[100px] resize-none"
            maxLength={500}
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-1 text-left">{comment.length}/500</p>
        </div>
        <Button type="submit" disabled={submitting} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {submitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
        </Button>
      </form>
    </div>
  );
};

export default TestimonialForm;
