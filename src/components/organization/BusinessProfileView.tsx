import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Phone, Navigation, ImageIcon, Lock, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface BusinessProfileViewProps {
  organizationId: string;
  organizationName: string;
  orgData: any;
  isAuthorized?: boolean; // e.g. driver with active shipment
}

const DAYS_AR: Record<string, string> = {
  sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
};

const BusinessProfileView = ({ organizationId, organizationName, orgData, isAuthorized = false }: BusinessProfileViewProps) => {
  const isPublic = orgData?.is_location_public !== false;
  const canView = isPublic || isAuthorized;

  const { data: photos = [] } = useQuery({
    queryKey: ['organization-photos-public', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_photos')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && canView,
  });

  const workingHours = orgData?.working_hours as Record<string, any> || {};
  const hasWorkingHours = Object.keys(workingHours).length > 0;
  const coords = orgData?.location_lat && orgData?.location_lng
    ? { lat: orgData.location_lat, lng: orgData.location_lng }
    : null;

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">العنوان متاح فقط للمصرح لهم</h3>
          <p className="text-muted-foreground">يجب أن يكون لديك تصريح نشط للوصول لبيانات الموقع</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">📸 صور من الموقع</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 6).map((photo: any) => (
                <Dialog key={photo.id}>
                  <DialogTrigger asChild>
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'صورة الموقع'}
                      className="w-full h-28 object-cover rounded-md cursor-pointer hover:opacity-90 transition"
                      loading="lazy"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-2">
                    <img src={photo.photo_url} alt={photo.caption || ''} className="w-full rounded" />
                    {photo.caption && <p className="text-center mt-2 text-sm">{photo.caption}</p>}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
            {photos.length > 6 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                +{photos.length - 6} صور أخرى
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location & Address */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold">📍 موقعنا</h4>
              {orgData?.address_details && (
                <p className="text-sm mt-1">{orgData.address_details}</p>
              )}
              {(orgData?.city || orgData?.region || orgData?.address) && (
                <p className="text-sm text-muted-foreground mt-1">
                  🏢 {[orgData?.address, orgData?.city, orgData?.region].filter(Boolean).join(' - ')}
                </p>
              )}
              {orgData?.location_description && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  💡 {orgData.location_description}
                </p>
              )}
            </div>
          </div>

          {/* Navigate Button */}
          {orgData?.location_url && (
            <Button asChild className="w-full gap-2">
              <a href={orgData.location_url} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" />
                ابدأ التحرك الآن
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}

          {/* Embedded Map */}
          {coords && (
            <div className="rounded-lg overflow-hidden border">
              <iframe
                src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع المنشأة"
              />
            </div>
          )}

          {/* Working Hours */}
          {hasWorkingHours && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">⏰ ساعات العمل</h4>
                  <div className="space-y-1">
                    {Object.entries(DAYS_AR).map(([key, label]) => {
                      const day = workingHours[key];
                      if (!day) return null;
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span>{label}</span>
                          {day.closed ? (
                            <Badge variant="secondary" className="text-xs">مغلق</Badge>
                          ) : (
                            <span dir="ltr" className="text-muted-foreground">
                              {day.open} - {day.close}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Contact */}
          {orgData?.phone && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold">📞 للتواصل</h4>
                  <a href={`tel:${orgData.phone}`} className="text-sm text-primary hover:underline" dir="ltr">
                    {orgData.phone}
                  </a>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessProfileView;
