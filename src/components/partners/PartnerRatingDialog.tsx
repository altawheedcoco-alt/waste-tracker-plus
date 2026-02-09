import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PartnerRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  partnerName: string;
  partnerOrganizationId: string;
  onRated?: () => void;
}

const ratingCategories = [
  { key: 'overall', label: 'التقييم العام', required: true },
  { key: 'punctuality', label: 'الالتزام بالمواعيد', required: false },
  { key: 'quality', label: 'جودة الخدمة', required: false },
  { key: 'communication', label: 'التواصل', required: false },
] as const;

const StarRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'w-6 h-6 transition-colors',
              (hover || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
};

const PartnerRatingDialog = ({
  isOpen,
  onClose,
  shipmentId,
  partnerName,
  partnerOrganizationId,
  onRated,
}: PartnerRatingDialogProps) => {
  const { organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    punctuality: 0,
    quality: 0,
    communication: 0,
  });
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (!organization?.id || ratings.overall === 0) {
      toast.error('يرجى إضافة التقييم العام على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('partner_ratings').insert({
        shipment_id: shipmentId,
        rater_organization_id: organization.id,
        rated_organization_id: partnerOrganizationId,
        overall_rating: ratings.overall,
        punctuality_rating: ratings.punctuality || null,
        quality_rating: ratings.quality || null,
        communication_rating: ratings.communication || null,
        comment: comment || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('تم تقييم هذا الشريك لهذه الشحنة مسبقاً');
        } else {
          throw error;
        }
        return;
      }

      toast.success('تم إرسال التقييم بنجاح');
      onRated?.();
      onClose();
    } catch (err) {
      console.error('Rating error:', err);
      toast.error('حدث خطأ أثناء إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            تقييم الشريك
          </DialogTitle>
          <DialogDescription>
            قيّم أداء <span className="font-semibold">{partnerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ratingCategories.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between">
              <StarRating
                value={ratings[cat.key]}
                onChange={(v) => setRatings((r) => ({ ...r, [cat.key]: v }))}
              />
              <Label className="text-sm">
                {cat.label} {cat.required && <span className="text-destructive">*</span>}
              </Label>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-xs">تعليق (اختياري)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف تعليقاً عن تجربتك..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || ratings.overall === 0}
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerRatingDialog;
