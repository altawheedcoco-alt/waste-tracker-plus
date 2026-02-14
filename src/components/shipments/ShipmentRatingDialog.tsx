import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

interface Props {
  shipmentId: string;
  raterOrgId: string;
  ratedOrgId: string;
  raterType: 'generator' | 'transporter' | 'recycler';
  ratedType: 'generator' | 'transporter' | 'recycler';
  ratedOrgName: string;
  existingRating?: any;
  onRated?: () => void;
}

const ratingCategories = [
  { key: 'punctuality_rating', label: 'الالتزام بالمواعيد' },
  { key: 'quality_rating', label: 'جودة الخدمة' },
  { key: 'communication_rating', label: 'التواصل' },
  { key: 'safety_rating', label: 'السلامة' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none">
          <Star className={`w-5 h-5 transition-colors ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ShipmentRatingDialog({ shipmentId, raterOrgId, ratedOrgId, raterType, ratedType, ratedOrgName, existingRating, onRated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState({
    overall_rating: existingRating?.overall_rating || 0,
    punctuality_rating: existingRating?.punctuality_rating || 0,
    quality_rating: existingRating?.quality_rating || 0,
    communication_rating: existingRating?.communication_rating || 0,
    safety_rating: existingRating?.safety_rating || 0,
  });
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (ratings.overall_rating === 0) {
      toast.error('يرجى تقييم التجربة العامة');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        shipment_id: shipmentId,
        rater_organization_id: raterOrgId,
        rated_organization_id: ratedOrgId,
        rater_type: raterType,
        rated_type: ratedType,
        ...ratings,
        comment: comment || null,
        is_anonymous: isAnonymous,
      };

      const { error } = existingRating
        ? await supabase.from('shipment_ratings').update(payload).eq('id', existingRating.id)
        : await supabase.from('shipment_ratings').insert(payload);

      if (error) throw error;
      toast.success('تم حفظ التقييم بنجاح');
      setOpen(false);
      onRated?.();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في حفظ التقييم');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<string, string> = { generator: 'المولد', transporter: 'الناقل', recycler: 'المدوّر' };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="w-4 h-4 ml-1" />
          {existingRating ? 'تعديل التقييم' : 'تقييم'} {typeLabels[ratedType]}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تقييم {ratedOrgName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Overall Rating */}
          <div className="text-center space-y-2 p-4 rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">التقييم العام</Label>
            <StarRating value={ratings.overall_rating} onChange={v => setRatings(p => ({ ...p, overall_rating: v }))} />
          </div>

          {/* Category Ratings */}
          <div className="space-y-3">
            {ratingCategories.map(cat => (
              <div key={cat.key} className="flex items-center justify-between">
                <StarRating value={(ratings as any)[cat.key]} onChange={v => setRatings(p => ({ ...p, [cat.key]: v }))} />
                <Label className="text-sm">{cat.label}</Label>
              </div>
            ))}
          </div>

          <Textarea placeholder="تعليق إضافي (اختياري)..." value={comment} onChange={e => setComment(e.target.value)} className="text-right" />

          <div className="flex items-center justify-between">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label className="text-sm">تقييم مجهول</Label>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التقييم'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
