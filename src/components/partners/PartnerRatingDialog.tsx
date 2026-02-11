import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Camera, X, AlertTriangle } from 'lucide-react';
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
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLowRating = ratings.overall > 0 && ratings.overall < 3;
  const hasEvidence = comment.trim().length > 0 || evidencePhotos.length > 0;

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (evidencePhotos.length + files.length > 3) {
      toast.error('الحد الأقصى 3 صور');
      return;
    }
    const newPhotos = [...evidencePhotos, ...files];
    setEvidencePhotos(newPhotos);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setEvidencePhotos((p) => p.filter((_, i) => i !== idx));
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of evidencePhotos) {
      const ext = file.name.split('.').pop();
      const path = `${shipmentId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('rating-evidence')
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('rating-evidence').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!organization?.id || ratings.overall === 0) {
      toast.error('يرجى إضافة التقييم العام على الأقل');
      return;
    }

    if (isLowRating && !hasEvidence) {
      toast.error('التقييمات أقل من 3 نجوم تتطلب تعليقاً أو صورة توضيحية');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrls: string[] = [];
      if (evidencePhotos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      const { error } = await supabase.from('partner_ratings').insert({
        shipment_id: shipmentId,
        rater_organization_id: organization.id,
        rated_organization_id: partnerOrganizationId,
        overall_rating: ratings.overall,
        punctuality_rating: ratings.punctuality || null,
        quality_rating: ratings.quality || null,
        communication_rating: ratings.communication || null,
        comment: comment || null,
        evidence_photos: photoUrls.length > 0 ? photoUrls : [],
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('تم تقييم هذا الشريك لهذه الشحنة مسبقاً');
        } else {
          throw error;
        }
        return;
      }

      if (isLowRating) {
        toast.success('تم إرسال التقييم وسيتم مراجعته من الإدارة قبل النشر');
      } else {
        toast.success('تم إرسال التقييم بنجاح');
      }
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

          {/* Low rating warning */}
          {isLowRating && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                التقييمات أقل من 3 نجوم تتطلب تعليقاً أو صورة توضيحية، وستخضع لمراجعة الإدارة قبل النشر.
              </p>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              تعليق {isLowRating && !evidencePhotos.length ? <span className="text-destructive">*</span> : '(اختياري)'}
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف تعليقاً عن تجربتك..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Evidence photos */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              صور توضيحية {isLowRating && !comment.trim() ? <span className="text-destructive">*</span> : '(اختياري)'}
            </Label>
            <div className="flex gap-2 flex-wrap">
              {photoPreviews.map((src, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {evidencePhotos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors"
                >
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoAdd}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || ratings.overall === 0 || (isLowRating && !hasEvidence)}
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
