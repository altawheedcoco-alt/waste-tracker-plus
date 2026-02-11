import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RatingReviewPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: pendingRatings = [], isLoading } = useQuery({
    queryKey: ['pending-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_ratings')
        .select(`
          *,
          rater:rater_organization_id(name),
          rated:rated_organization_id(name)
        `)
        .eq('review_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('partner_ratings')
        .update({
          review_status: status,
          is_public: status === 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[id] || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'approved' ? 'تم قبول التقييم ونشره' : 'تم رفض التقييم');
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const renderStars = (count: number) => (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= count ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          مراجعة التقييمات
        </h2>
        {pendingRatings.length > 0 && (
          <Badge variant="destructive">{pendingRatings.length} بانتظار المراجعة</Badge>
        )}
      </div>

      {pendingRatings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            لا توجد تقييمات بانتظار المراجعة
          </CardContent>
        </Card>
      ) : (
        pendingRatings.map((rating: any) => (
          <Card key={rating.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>
                  تقييم من{' '}
                  <span className="font-bold">{rating.rater?.name || 'غير معروف'}</span>
                  {' '}لـ{' '}
                  <span className="font-bold">{rating.rated?.name || 'غير معروف'}</span>
                </span>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Clock className="w-3 h-3 ml-1" />
                  بانتظار المراجعة
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">التقييم العام:</span>
                {renderStars(rating.overall_rating)}
                <span className="text-sm font-bold">{rating.overall_rating}/5</span>
              </div>

              {rating.comment && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">{rating.comment}</p>
                </div>
              )}

              {/* Evidence photos */}
              {rating.evidence_photos && rating.evidence_photos.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">صور توضيحية:</span>
                  <div className="flex gap-2">
                    {rating.evidence_photos.map((url: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setPreviewImage(url)}
                        className="w-16 h-16 rounded-md overflow-hidden border hover:ring-2 ring-primary transition-all"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <Textarea
                placeholder="ملاحظات المراجعة (اختياري)..."
                value={reviewNotes[rating.id] || ''}
                onChange={(e) =>
                  setReviewNotes((n) => ({ ...n, [rating.id]: e.target.value }))
                }
                rows={2}
                className="text-sm"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => reviewMutation.mutate({ id: rating.id, status: 'approved' })}
                  disabled={reviewMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 ml-1" />
                  قبول ونشر
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reviewMutation.mutate({ id: rating.id, status: 'rejected' })}
                  disabled={reviewMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 ml-1" />
                  رفض
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              عرض الصورة
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Evidence" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RatingReviewPanel;
