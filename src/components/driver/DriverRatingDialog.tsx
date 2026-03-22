/**
 * نافذة تقييم السائق بعد إتمام شحنة
 * تدعم الاتجاهين: جهة ← سائق / سائق ← جهة
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Shield, Clock, MessageCircle, Award, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface DriverRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  shipmentId: string;
  driverName?: string;
  direction?: 'org_to_driver' | 'driver_to_org';
  ratedByOrgId?: string;
}

const CRITERIA: { key: string; label: string; icon: typeof Star; required?: boolean }[] = [
  { key: 'overall', label: 'التقييم العام', icon: Star, required: true },
  { key: 'punctuality', label: 'الالتزام بالمواعيد', icon: Clock },
  { key: 'safety', label: 'السلامة والأمان', icon: Shield },
  { key: 'communication', label: 'التواصل', icon: MessageCircle },
  { key: 'professionalism', label: 'الاحترافية', icon: Award },
];

const StarRating = ({ value, onChange, size = 'md' }: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
}) => {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={{ scale: 1.3 }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

const DriverRatingDialog = ({
  open, onOpenChange, driverId, shipmentId,
  driverName = 'السائق', direction = 'org_to_driver', ratedByOrgId,
}: DriverRatingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ratings.overall) throw new Error('التقييم العام مطلوب');

      const payload: Record<string, any> = {
        driver_id: driverId,
        shipment_id: shipmentId,
        rated_by_user_id: user?.id,
        rated_by_org_id: ratedByOrgId || null,
        rating_direction: direction,
        overall_rating: ratings.overall,
        punctuality_rating: ratings.punctuality || null,
        safety_rating: ratings.safety || null,
        communication_rating: ratings.communication || null,
        professionalism_rating: ratings.professionalism || null,
        comment: comment.trim() || null,
      };

      const { error } = await supabase
        .from('driver_ratings')
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم التقييم بنجاح ⭐', description: 'شكراً لمساهمتك في تحسين الخدمة' });
      qc.invalidateQueries({ queryKey: ['driver-ratings'] });
      qc.invalidateQueries({ queryKey: ['driver-profile-type'] });
      setRatings({});
      setComment('');
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message?.includes('unique') ? 'تم تقييم هذه الشحنة مسبقاً' : 'حدث خطأ في التقييم';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const setR = (key: string, val: number) => setRatings(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            {direction === 'org_to_driver' ? `تقييم ${driverName}` : 'تقييم جهة النقل'}
          </DialogTitle>
          <DialogDescription>
            تقييمك يساعد في تحسين جودة الخدمة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {CRITERIA.map(({ key, label, icon: Icon, required }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">
                  {label}
                  {required && <span className="text-destructive mr-1">*</span>}
                </Label>
              </div>
              <StarRating
                value={ratings[key] || 0}
                onChange={(v) => setR(key, v)}
                size={key === 'overall' ? 'md' : 'sm'}
              />
            </div>
          ))}

          <div>
            <Label className="text-sm">تعليق (اختياري)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف ملاحظاتك..."
              className="mt-1.5 text-sm"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!ratings.overall || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DriverRatingDialog;
