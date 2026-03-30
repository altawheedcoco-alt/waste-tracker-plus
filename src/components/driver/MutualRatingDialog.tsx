/**
 * حوار التقييم المتبادل — السائق يقيّم الناقل والعكس
 * يظهر بعد إكمال الرحلة
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MutualRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  shipmentNumber: string;
  ratedEntityName: string;
  ratedEntityId: string;
  ratingType: 'driver_rates_transporter' | 'transporter_rates_driver';
}

const RATING_LABELS = [
  '', 'سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز'
];

const QUICK_TAGS: Record<string, string[]> = {
  driver_rates_transporter: [
    'دفع سريع', 'تواصل جيد', 'شحنات منتظمة', 'أسعار عادلة',
    'تأخر في الدفع', 'معلومات غير دقيقة',
  ],
  transporter_rates_driver: [
    'التزام بالمواعيد', 'قيادة آمنة', 'تواصل ممتاز', 'محافظ على الشحنة',
    'تأخر', 'سلوك غير مهني',
  ],
};

const MutualRatingDialog = ({
  open, onOpenChange, shipmentId, shipmentNumber,
  ratedEntityName, ratedEntityId, ratingType,
}: MutualRatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const submitRating = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shipment_ratings')
        .insert({
          shipment_id: shipmentId,
          rated_by: user?.id,
          rated_entity_id: ratedEntityId,
          rating_type: ratingType,
          rating,
          comment: comment.trim() || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
        });
      if (error) throw error;

      // Update driver rating average if rating a driver
      if (ratingType === 'transporter_rates_driver') {
        const { data: allRatings } = await supabase
          .from('shipment_ratings')
          .select('rating')
          .eq('rated_entity_id', ratedEntityId)
          .eq('rating_type', 'transporter_rates_driver');

        if (allRatings && allRatings.length > 0) {
          const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
          await supabase
            .from('drivers')
            .update({ rating: Math.round(avg * 10) / 10 })
            .eq('id', ratedEntityId);
        }
      }
    },
    onSuccess: () => {
      toast.success('شكراً لتقييمك! ⭐');
      onOpenChange(false);
    },
    onError: () => toast.error('فشل في إرسال التقييم'),
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">
            كيف كانت التجربة؟
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Shipment info */}
          <p className="text-center text-sm text-muted-foreground">
            تقييم <strong className="text-foreground">{ratedEntityName}</strong>
            <br />
            <span className="text-xs">شحنة #{shipmentNumber}</span>
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    star <= displayRating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </motion.button>
            ))}
          </div>

          {/* Rating label */}
          {displayRating > 0 && (
            <motion.p
              key={displayRating}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-medium"
            >
              {RATING_LABELS[displayRating]}
            </motion.p>
          )}

          {/* Quick tags */}
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground text-center">اختر ما ينطبق:</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {QUICK_TAGS[ratingType]?.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] border transition-all',
                      selectedTags.includes(tag)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Comment */}
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="أضف تعليقاً (اختياري)..."
                className="text-sm"
                rows={2}
              />
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            لاحقاً
          </Button>
          <Button
            onClick={() => submitRating.mutate()}
            disabled={rating === 0 || submitRating.isPending}
            className="gap-1.5"
          >
            {submitRating.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MutualRatingDialog;
