import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversationRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, feedback?: string) => void;
}

const ConversationRatingDialog = ({ open, onOpenChange, onSubmit }: ConversationRatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit(rating, feedback.trim() || undefined);
    setIsSubmitting(false);
    setRating(0);
    setFeedback('');
  };

  const getRatingLabel = (value: number) => {
    const labels: Record<number, string> = {
      1: 'سيء جداً',
      2: 'سيء',
      3: 'مقبول',
      4: 'جيد',
      5: 'ممتاز'
    };
    return labels[value] || '';
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">كيف كانت تجربتك؟</DialogTitle>
          <DialogDescription className="text-center">
            ساعدنا في تحسين خدمتنا بتقييم محادثتك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stars Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      value <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            
            {displayRating > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-muted-foreground"
              >
                {getRatingLabel(displayRating)}
              </motion.span>
            )}
          </div>

          {/* Feedback textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              ملاحظات إضافية (اختياري)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="أخبرنا المزيد عن تجربتك..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              تخطي
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationRatingDialog;
