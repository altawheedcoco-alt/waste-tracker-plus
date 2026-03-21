import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquarePlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

const TestimonialForm = () => {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const testimonialSchema = z.object({
    author_name: z.string().trim().min(2, isAr ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters').max(100),
    comment: z.string().trim().min(10, isAr ? 'التعليق يجب أن يكون 10 أحرف على الأقل' : 'Comment must be at least 10 characters').max(500, isAr ? 'التعليق يجب ألا يتجاوز 500 حرف' : 'Comment must not exceed 500 characters'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = testimonialSchema.safeParse({ author_name: name, comment });
    if (!result.success) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: result.error.errors[0]?.message || (isAr ? 'بيانات غير صالحة' : 'Invalid data'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('testimonials').insert({ author_name: result.data.author_name, comment: result.data.comment });
      if (error) throw error;
      setSubmitted(true);
      setName('');
      setComment('');
      toast({ title: isAr ? 'تم الإرسال بنجاح ✅' : 'Submitted successfully ✅', description: isAr ? 'شكراً لمشاركتك! سيتم مراجعة تعليقك قبل نشره.' : 'Thank you! Your comment will be reviewed before publishing.' });
    } catch {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'حدث خطأ أثناء إرسال التعليق. حاول مرة أخرى.' : 'An error occurred. Please try again.', variant: 'destructive' });
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
        <h4 className="text-lg font-bold text-foreground mb-2">{isAr ? 'شكراً لمشاركتك! 🎉' : 'Thank you for sharing! 🎉'}</h4>
        <p className="text-sm text-muted-foreground mb-4">{isAr ? 'سيتم مراجعة تعليقك ونشره في أقرب وقت.' : 'Your comment will be reviewed and published soon.'}</p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>{isAr ? 'إرسال تعليق آخر' : 'Submit another comment'}</Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-3 border border-primary/20">
          <MessageSquarePlus className="w-4 h-4" />
          {isAr ? 'شاركنا تجربتك' : 'Share your experience'}
        </div>
        <h3 className="text-xl font-bold text-foreground">{isAr ? 'هل استفدت من منصة iRecycle؟' : 'Did iRecycle help your business?'}</h3>
        <p className="text-sm text-muted-foreground mt-1">{isAr ? 'أخبرنا عن تجربتك وساعد الآخرين على اتخاذ القرار' : 'Tell us about your experience and help others decide'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <div>
          <Textarea
            placeholder={isAr ? 'اكتب تجربتك مع المنصة...' : 'Write about your experience with the platform...'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className={`text-xs text-muted-foreground mt-1 ${isAr ? 'text-left' : 'text-right'}`}>{comment.length}/500</p>
        </div>
        <Button type="submit" disabled={submitting} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {submitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'إرسال التعليق' : 'Submit comment')}
        </Button>
      </form>
    </div>
  );
};

export default TestimonialForm;
