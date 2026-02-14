import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Phone, Navigation, ImageIcon, Lock, ExternalLink, Globe, ShoppingBag, Info, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface BusinessProfileViewProps {
  organizationId: string;
  organizationName: string;
  orgData: any;
  isAuthorized?: boolean;
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
  const services = (orgData?.services as string[]) || [];
  const socialLinks = (orgData?.social_links as Record<string, string>) || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);

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
      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">🛠️ خدماتنا</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {services.map((service: string) => (
                <Badge key={service} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

          {orgData?.location_url && (
            <Button asChild className="w-full gap-2">
              <a href={orgData.location_url} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" />
                ابدأ التحرك الآن
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}

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

          {/* Website & Email */}
          {(orgData?.website_url || orgData?.business_email) && (
            <>
              <Separator />
              <div className="space-y-2">
                {orgData?.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary shrink-0" />
                    <a href={orgData.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline" dir="ltr">
                      {orgData.website_url}
                    </a>
                  </div>
                )}
                {orgData?.business_email && (
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 text-primary shrink-0 text-center">✉️</span>
                    <a href={`mailto:${orgData.business_email}`} className="text-sm text-primary hover:underline" dir="ltr">
                      {orgData.business_email}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Price Range */}
          {orgData?.price_range && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <span className="text-primary">💰</span>
                <span className="text-sm">نطاق الأسعار: <strong>{orgData.price_range}</strong></span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      {hasSocialLinks && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">🔗 تابعنا على</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                return (
                  <Button key={platform} variant="outline" size="sm" asChild>
                    <a href={url as string} target="_blank" rel="noopener noreferrer" className="capitalize">
                      {platform}
                    </a>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Transparency */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">🔍 شفافية الصفحة</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>تاريخ إنشاء الصفحة: {orgData?.created_at ? new Date(orgData.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
            </div>
            {orgData?.founded_year && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>سنة التأسيس: {orgData.founded_year}</span>
              </div>
            )}
            {orgData?.activity_type && (
              <div className="flex items-center gap-2">
                <span>🏭</span>
                <span>نوع النشاط: {orgData.activity_type}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessProfileView;
