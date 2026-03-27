import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OrgPublicProfileSettings from '@/components/org-structure/OrgPublicProfileSettings';
import {
  MapPin, Clock, Phone, Globe, ShoppingBag, Info, Calendar,
  Pin, Heart, MessageCircle, Share2, ImageIcon, CheckCircle,
  ExternalLink, Navigation, Copy, Link2, Users, Eye,
  Building2, Settings, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ClickableImage from '@/components/ui/ClickableImage';
import StoryCircles from '@/components/stories/StoryCircles';
import PostInteractions from './PostInteractions';
import PostShareActions from '@/components/content-generator/PostShareActions';
import BusinessPageSharePanel from './BusinessPageSharePanel';

interface BusinessPagePreviewProps {
  organizationId: string;
  organizationName: string;
  orgData: any;
  isOwnPage?: boolean;
}

const DAYS_AR: Record<string, string> = {
  sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
};

const BusinessPagePreview = ({ organizationId, organizationName, orgData, isOwnPage = false }: BusinessPagePreviewProps) => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [showShareSettings, setShowShareSettings] = useState(false);

  // Fetch posts
  const { data: posts = [] } = useQuery({
    queryKey: ['business-page-posts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_posts')
        .select(`
          *,
          author:profiles!organization_posts_author_id_fkey(full_name, avatar_url, position)
        `)
        .eq('organization_id', organizationId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        media_urls: Array.isArray(p.media_urls) ? p.media_urls as string[] : [],
      }));
    },
    enabled: !!organizationId,
  });

  // Fetch photos
  const { data: photos = [] } = useQuery({
    queryKey: ['business-page-photos', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_photos')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch partner count
  const { data: partnerCount = 0 } = useQuery({
    queryKey: ['business-page-partners', organizationId],
    queryFn: async () => {
      const { count } = await supabase
        .from('verified_partnerships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_org_id.eq.${organizationId},partner_org_id.eq.${organizationId}`)
        .eq('status', 'active');
      return count || 0;
    },
    enabled: !!organizationId,
  });

  const pinnedPosts = posts.filter((p: any) => p.is_pinned);
  const regularPosts = posts.filter((p: any) => !p.is_pinned);
  const services = (orgData?.services as string[]) || [];
  const socialLinks = (orgData?.social_links as Record<string, string>) || {};
  const workingHours = orgData?.working_hours as Record<string, any> || {};
  const hasWorkingHours = Object.keys(workingHours).length > 0;
  const coords = orgData?.location_lat && orgData?.location_lng
    ? { lat: orgData.location_lat, lng: orgData.location_lng }
    : null;

  const handleSharePage = () => {
    const publicCode = orgData?.public_share_code;
    if (publicCode) {
      const url = `${window.location.origin}/org-profile/${publicCode}`;
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط الصفحة');
    } else {
      toast.info('يرجى تفعيل المشاركة العامة من إعدادات الملف');
    }
  };

  const getOrgTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر',
      disposal: 'تخلص نهائي', consultant: 'استشاري بيئي',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-0 max-w-3xl mx-auto" dir="rtl">
      {/* ═══ Cover + Profile Header (Facebook-style) ═══ */}
      <Card className="overflow-hidden rounded-b-none border-b-0">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-bl from-primary/30 via-primary/10 to-background">
          {orgData?.cover_url && (
            <ClickableImage
              src={orgData.cover_url}
              gallery={[orgData.cover_url, orgData.logo_url].filter(Boolean)}
              className="w-full h-full object-cover"
              protected
            />
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="relative px-4 sm:px-6 pb-4">
          {/* Avatar - overlapping cover */}
          <div className="flex items-end gap-4 -mt-12 sm:-mt-16">
            <div className="relative">
              <ClickableImage
                src={orgData?.logo_url || ''}
                gallery={[orgData?.logo_url, orgData?.cover_url].filter(Boolean)}
                protected={orgData?.is_profile_locked && !isOwnPage}
              >
                <Avatar className={`w-24 h-24 sm:w-32 sm:h-32 border-4 shadow-xl ${orgData?.is_profile_locked ? 'border-blue-500 ring-4 ring-blue-500/30' : 'border-background'}`}>
                  <AvatarImage src={orgData?.logo_url} alt={organizationName} />
                  <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary font-bold">
                    {organizationName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </ClickableImage>
              {orgData?.is_profile_locked && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded-full p-1 shadow-lg border-2 border-background z-10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{organizationName}</h1>
                {orgData?.is_verified && (
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 fill-primary/20" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {getOrgTypeLabel(orgData?.organization_type || '')}
                </Badge>
                {orgData?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {orgData.city}
                  </span>
                )}
              </div>
              {orgData?.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{orgData.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <strong className="text-foreground">{partnerCount}</strong> شريك مرتبط
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <strong className="text-foreground">{posts.length}</strong> منشور
            </span>
            {orgData?.founded_year && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                منذ {orgData.founded_year}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {orgData?.phone && (
              <Button size="sm" className="gap-1.5" asChild>
                <a href={`tel:${orgData.phone}`}>
                  <Phone className="w-4 h-4" /> اتصل
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSharePage}>
              <Share2 className="w-4 h-4" /> مشاركة الصفحة
            </Button>
            {orgData?.website_url && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href={orgData.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4" /> الموقع
                </a>
              </Button>
            )}
            {isOwnPage && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowShareSettings(true)}>
                <Settings className="w-4 h-4" /> إعدادات المشاركة
              </Button>
            )}
          </div>

          {/* Share Settings Dialog */}
          {isOwnPage && (
            <Dialog open={showShareSettings} onOpenChange={setShowShareSettings}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" /> إعدادات المشاركة العامة
                  </DialogTitle>
                </DialogHeader>
                <OrgPublicProfileSettings />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Card>

      {/* ═══ Navigation Tabs ═══ */}
      <Card className="rounded-t-none border-t-0 overflow-visible">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-2">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm">
                المنشورات
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm">
                حول
              </TabsTrigger>
              <TabsTrigger value="photos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm">
                الصور
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══ Share Panel (only for own page) ═══ */}
          {isOwnPage && (
            <div className="p-4 pb-0">
              <BusinessPageSharePanel
                organizationId={organizationId}
                organizationName={organizationName}
              />
            </div>
          )}

          {/* ═══ Posts Tab ═══ */}
          <TabsContent value="posts" className="p-0 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">
              {/* Main Feed */}
              <div className="p-4 space-y-4">
                {/* Stories Section */}
                <Card className="border">
                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-primary" />
                      الحالات
                    </h3>
                    <StoryCircles />
                  </CardContent>
                </Card>

                {/* Pinned Posts */}
                {pinnedPosts.length > 0 && (
                  <div className="space-y-3">
                    {pinnedPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} orgName={organizationName} orgLogo={orgData?.logo_url} isPinned />
                    ))}
                  </div>
                )}

                {/* Regular Posts */}
                {regularPosts.length > 0 ? (
                  <div className="space-y-3">
                    {regularPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} orgName={organizationName} orgLogo={orgData?.logo_url} />
                    ))}
                  </div>
                ) : pinnedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد منشورات بعد</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Sidebar - About Card */}
              <div className="p-4 border-r space-y-4 hidden lg:block">
                <SidebarAbout orgData={orgData} services={services} workingHours={workingHours} hasWorkingHours={hasWorkingHours} coords={coords} socialLinks={socialLinks} />
              </div>
            </div>
          </TabsContent>

          {/* ═══ About Tab ═══ */}
          <TabsContent value="about" className="p-4 mt-0">
            <div className="max-w-xl mx-auto space-y-4">
              <SidebarAbout orgData={orgData} services={services} workingHours={workingHours} hasWorkingHours={hasWorkingHours} coords={coords} socialLinks={socialLinks} showMap />
            </div>
          </TabsContent>

          {/* ═══ Photos Tab ═══ */}
          <TabsContent value="photos" className="p-4 mt-0">
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((photo: any) => (
                  <Dialog key={photo.id}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer border"
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || 'صورة'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-2">
                      <img src={photo.photo_url} alt={photo.caption || ''} className="w-full rounded" />
                      {photo.caption && <p className="text-center mt-2 text-sm">{photo.caption}</p>}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد صور</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

/* ═══ Post Card Component ═══ */
const PostCard = ({ post, orgName, orgLogo, isPinned = false }: { post: any; orgName: string; orgLogo?: string | null; isPinned?: boolean }) => {
  const mediaUrls = post.media_urls || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={isPinned ? 'border-primary/30 bg-primary/[0.02]' : ''}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author?.avatar_url || orgLogo} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(post.author?.full_name || orgName)?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {post.author?.full_name || orgName}
                </span>
                {isPinned && (
                  <Badge variant="outline" className="text-[10px] gap-0.5 h-5 px-1.5 shrink-0">
                    <Pin className="w-2.5 h-2.5" /> مثبّت
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {post.author?.position && <span>{post.author.position} •</span>}
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <p className="text-sm whitespace-pre-wrap mb-3 leading-relaxed">{post.content}</p>
          )}

          {/* Media */}
          {mediaUrls.length > 0 && (
            <div className={`rounded-lg overflow-hidden mb-3 ${
              mediaUrls.length === 1 ? '' :
              mediaUrls.length === 2 ? 'grid grid-cols-2 gap-0.5' :
              'grid grid-cols-2 gap-0.5'
            }`}>
              {mediaUrls.slice(0, 4).map((url: string, i: number) => {
                const isVideo = url.match(/\.(mp4|webm|mov)/i);
                return isVideo ? (
                  <video key={i} src={url} controls className="w-full max-h-96 object-contain bg-black" />
                ) : (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <div className="relative cursor-pointer">
                        <img src={url} alt="" className="w-full max-h-96 object-contain" loading="lazy" />
                        {i === 3 && mediaUrls.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                            +{mediaUrls.length - 4}
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-2">
                      <img src={url} alt="" className="w-full rounded" />
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}

          {/* Interactions */}
          <Separator className="mb-2" />
          <div className="flex items-center justify-between">
            <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
            <PostShareActions content={post.content || ''} postId={post.id} variant="icon" size="sm" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ═══ Sidebar About Card ═══ */
const SidebarAbout = ({ orgData, services, workingHours, hasWorkingHours, coords, socialLinks, showMap = false }: any) => (
  <div className="space-y-4">
    {/* Intro */}
    {(orgData?.description || orgData?.vision) && (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-primary" /> نبذة
          </h4>
          {orgData?.description && <p className="text-sm text-muted-foreground">{orgData.description}</p>}
          {orgData?.vision && (
            <p className="text-sm text-muted-foreground mt-2 italic">🎯 {orgData.vision}</p>
          )}
        </CardContent>
      </Card>
    )}

    {/* Services */}
    {services.length > 0 && (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-primary" /> خدماتنا
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {services.map((s: string) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Location */}
    <Card>
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" /> الموقع
        </h4>
        {(orgData?.city || orgData?.address) && (
          <p className="text-sm text-muted-foreground">
            {[orgData?.address, orgData?.city, orgData?.region].filter(Boolean).join(' - ')}
          </p>
        )}
        {orgData?.location_url && (
          <Button size="sm" variant="outline" className="w-full gap-1.5" asChild>
            <a href={orgData.location_url} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-3.5 h-3.5" /> الاتجاهات
            </a>
          </Button>
        )}
        {showMap && coords && (
          <div className="rounded-lg overflow-hidden border">
            <iframe
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
              width="100%" height="200" style={{ border: 0 }}
              allowFullScreen loading="lazy" title="الموقع"
            />
          </div>
        )}
      </CardContent>
    </Card>

    {/* Working Hours */}
    {hasWorkingHours && (
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" /> ساعات العمل
          </h4>
          <div className="space-y-1">
            {Object.entries(DAYS_AR).map(([key, label]) => {
              const day = workingHours[key];
              if (!day) return null;
              return (
                <div key={key} className="flex justify-between text-xs">
                  <span>{label}</span>
                  {day.closed ? (
                    <Badge variant="secondary" className="text-[10px] h-4">مغلق</Badge>
                  ) : (
                    <span className="text-muted-foreground" dir="ltr">{day.open} - {day.close}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Contact & Social */}
    <Card>
      <CardContent className="p-4 space-y-2">
        {orgData?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-primary" />
            <a href={`tel:${orgData.phone}`} className="text-primary hover:underline" dir="ltr">{orgData.phone}</a>
          </div>
        )}
        {orgData?.business_email && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">✉️</span>
            <a href={`mailto:${orgData.business_email}`} className="text-primary hover:underline" dir="ltr">{orgData.business_email}</a>
          </div>
        )}
        {Object.entries(socialLinks).filter(([, v]) => v).length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                return (
                  <Button key={platform} variant="ghost" size="sm" className="h-7 text-xs capitalize" asChild>
                    <a href={url as string} target="_blank" rel="noopener noreferrer">{platform}</a>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Page Transparency */}
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-primary" /> شفافية الصفحة
        </h4>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {orgData?.created_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              أُنشئت: {new Date(orgData.created_at).toLocaleDateString('ar-EG')}
            </div>
          )}
          {orgData?.founded_year && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              التأسيس: {orgData.founded_year}
            </div>
          )}
          {orgData?.activity_type && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              {orgData.activity_type}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BusinessPagePreview;
