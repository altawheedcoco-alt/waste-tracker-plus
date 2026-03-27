/**
 * صفحة الملف العام للمنشأة - عرض صفحة المنظمة الكاملة
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Building2, Mail, Phone, MapPin, Shield, FileText, Users,
  Briefcase, Award, Loader2, AlertCircle, Globe, Hash,
  CheckCircle, Eye, MessageCircle, Share2, ImageIcon, Clock,
  ShoppingBag, ExternalLink, Copy, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PostInteractions from '@/components/organization/PostInteractions';

interface PublicProfile {
  id: string;
  share_code: string;
  show_basic_info: boolean;
  show_contact_info: boolean;
  show_licenses: boolean;
  show_team: boolean;
  show_team_details: boolean;
  show_team_documents: boolean;
  show_statistics: boolean;
  custom_message: string | null;
  organization_id: string;
}

const DAYS_AR: Record<string, string> = {
  sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
};

const ORG_TYPES: Record<string, string> = {
  generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر',
  disposal: 'تخلص نهائي', consultant: 'استشاري بيئي',
};

export default function PublicOrgProfile() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicProfile | null>(null);
  const [org, setOrg] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [partnerCount, setPartnerCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    loadProfile();
  }, [code]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const { data: profileData, error: profileError } = await supabase
      .from('org_public_profiles' as any)
      .select('*')
      .eq('share_code', code)
      .eq('is_active', true)
      .single();

    if (profileError || !profileData) {
      setError('هذا الرابط غير صالح أو تم تعطيله');
      setLoading(false);
      return;
    }

    // Increment view count
    supabase.rpc('increment_org_profile_views', { _share_code: code }).then(() => {});

    const p = profileData as any as PublicProfile;
    setSettings(p);

    // Fetch org data, posts, photos, partners in parallel
    const [orgRes, postsRes, photosRes, partnersRes, teamRes] = await Promise.all([
      supabase
        .from('organizations')
        .select('*')
        .eq('id', p.organization_id)
        .single(),
      supabase
        .from('organization_posts')
        .select(`*, author:profiles!organization_posts_author_id_fkey(full_name, avatar_url, position)`)
        .eq('organization_id', p.organization_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('organization_photos')
        .select('*')
        .eq('organization_id', p.organization_id)
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('verified_partnerships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_org_id.eq.${p.organization_id},partner_org_id.eq.${p.organization_id}`)
        .eq('status', 'active'),
      p.show_team
        ? supabase
            .from('organization_members' as any)
            .select('id, job_title_ar, employee_number, profile_id, position_id, department_id')
            .eq('organization_id', p.organization_id)
            .eq('status', 'active')
        : Promise.resolve({ data: null }),
    ]);

    if (orgRes.data) setOrg(orgRes.data);
    if (postsRes.data) setPosts(postsRes.data.map((post: any) => ({
      ...post,
      media_urls: Array.isArray(post.media_urls) ? post.media_urls : [],
    })));
    if (photosRes.data) setPhotos(photosRes.data);
    setPartnerCount(partnersRes.count || 0);

    // Enrich team members
    if (teamRes.data && (teamRes.data as any[]).length > 0) {
      const enriched = await Promise.all(
        (teamRes.data as any[]).map(async (m: any) => {
          const [profileRes, posRes, deptRes] = await Promise.all([
            m.profile_id
              ? supabase.from('profiles').select('full_name, avatar_url').eq('id', m.profile_id).single()
              : { data: null },
            m.position_id && p.show_team_details
              ? supabase.from('organization_positions' as any).select('title_ar').eq('id', m.position_id).single()
              : { data: null },
            m.department_id && p.show_team_details
              ? supabase.from('organization_departments' as any).select('name_ar').eq('id', m.department_id).single()
              : { data: null },
          ]);
          return { ...m, profile: profileRes.data, position: posRes.data, department: deptRes.data };
        })
      );
      setTeam(enriched);
    }

    setLoading(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${org?.name || ''}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !settings || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">رابط غير صالح</h2>
            <p className="text-muted-foreground">{error || 'لم يتم العثور على بيانات'}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/">الصفحة الرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = (org.services as string[]) || [];
  const workingHours = (org.working_hours as Record<string, any>) || {};
  const hasWorkingHours = Object.keys(workingHours).length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Top Bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <Globe className="w-5 h-5" />
            iRecycle
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleShare} className="gap-1.5">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'تم' : 'نسخ'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleWhatsApp} className="gap-1.5">
              <MessageCircle className="w-4 h-4" /> مشاركة
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* ═══ Cover + Profile Header ═══ */}
        <Card className="overflow-hidden rounded-none border-x-0 border-t-0">
          <div className="relative h-48 sm:h-56 bg-gradient-to-bl from-primary/30 via-primary/10 to-background">
            {org.cover_url && (
              <img src={org.cover_url} alt="غلاف" className="w-full h-full object-contain bg-muted" />
            )}
          </div>

          <div className="relative px-4 sm:px-6 pb-4">
            <div className="flex items-end gap-4 -mt-12 sm:-mt-16">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl">
                <AvatarImage src={org.logo_url} alt={org.name} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary font-bold">
                  {org.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{org.name}</h1>
                  {org.is_verified && (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 fill-primary/20" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    {ORG_TYPES[org.organization_type] || org.organization_type}
                  </Badge>
                  {org.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {org.city}
                    </span>
                  )}
                </div>
                {org.bio && settings.show_basic_info && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <strong className="text-foreground">{partnerCount}</strong> شريك
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <strong className="text-foreground">{posts.length}</strong> منشور
              </span>
              {org.founded_year && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> منذ {org.founded_year}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {org.phone && settings.show_contact_info && (
                <Button size="sm" className="gap-1.5" asChild>
                  <a href={`tel:${org.phone}`}>
                    <Phone className="w-4 h-4" /> اتصل
                  </a>
                </Button>
              )}
              {org.website_url && (
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" /> الموقع
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> مشاركة
              </Button>
            </div>

            {settings.custom_message && (
              <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
                {settings.custom_message}
              </p>
            )}
          </div>
        </Card>

        {/* ═══ Tabs ═══ */}
        <Card className="rounded-none border-x-0 overflow-visible">
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

            {/* Posts Tab */}
            <TabsContent value="posts" className="p-0 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-0">
                <div className="p-4 space-y-4">
                  {posts.length > 0 ? posts.map((post: any) => (
                    <PublicPostCard key={post.id} post={post} orgName={org.name} orgLogo={org.logo_url} />
                  )) : (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد منشورات بعد</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="p-4 border-r space-y-4 hidden lg:block">
                  <AboutSidebar org={org} settings={settings} services={services} workingHours={workingHours} hasWorkingHours={hasWorkingHours} />
                </div>
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="p-4 mt-0">
              <div className="max-w-xl mx-auto space-y-4">
                <AboutSidebar org={org} settings={settings} services={services} workingHours={workingHours} hasWorkingHours={hasWorkingHours} />

                {/* Contact */}
                {settings.show_contact_info && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> بيانات التواصل</h3>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {org.phone && <InfoItem icon={Phone} label="الهاتف" value={org.phone} dir="ltr" />}
                        {org.secondary_phone && <InfoItem icon={Phone} label="هاتف إضافي" value={org.secondary_phone} dir="ltr" />}
                        {org.email && <InfoItem icon={Mail} label="البريد" value={org.email} dir="ltr" />}
                        {org.address && <InfoItem icon={MapPin} label="العنوان" value={`${org.address}${org.city ? ` - ${org.city}` : ''}${org.region ? ` - ${org.region}` : ''}`} />}
                        {org.website_url && <InfoItem icon={Globe} label="الموقع" value={org.website_url} dir="ltr" />}
                        {org.representative_name && <InfoItem icon={Briefcase} label="الممثل القانوني" value={`${org.representative_name}${org.representative_position ? ` (${org.representative_position})` : ''}`} />}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Licenses */}
                {settings.show_licenses && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> التراخيص</h3>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {org.commercial_register && <InfoItem icon={FileText} label="السجل التجاري" value={org.commercial_register} />}
                        {org.tax_card && <InfoItem icon={Hash} label="البطاقة الضريبية" value={org.tax_card} />}
                        {org.environmental_license && <InfoItem icon={Award} label="الترخيص البيئي" value={org.environmental_license} />}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team */}
                {settings.show_team && team.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> فريق العمل
                        <Badge variant="outline" className="mr-auto">{team.length} عضو</Badge>
                      </h3>
                      <Separator />
                      <div className="space-y-2">
                        {team.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={m.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                <Users className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{m.profile?.full_name || 'عضو'}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {m.job_title_ar && <span>{m.job_title_ar}</span>}
                                {settings.show_team_details && m.department?.name_ar && (
                                  <Badge variant="outline" className="text-[10px]">{m.department.name_ar}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Photos Tab */}
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
                          <img src={photo.photo_url} alt={photo.caption || 'صورة'} className="w-full h-full object-cover" loading="lazy" />
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

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-8">
        <p>
          تمت المشاركة عبر منصة{' '}
          <Link to="/" className="text-primary hover:underline">iRecycle</Link>
        </p>
      </footer>
    </div>
  );
}

/* ═══ Post Card ═══ */
function PublicPostCard({ post, orgName, orgLogo }: { post: any; orgName: string; orgLogo?: string | null }) {
  const mediaUrls = post.media_urls || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={post.is_pinned ? 'border-primary/30 bg-primary/[0.02]' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author?.avatar_url || orgLogo} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(post.author?.full_name || orgName)?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm truncate">{post.author?.full_name || orgName}</span>
              <div className="text-xs text-muted-foreground">
                {post.author?.position && <span>{post.author.position} • </span>}
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}</span>
              </div>
            </div>
          </div>

          {post.content && (
            <p className="text-sm whitespace-pre-wrap mb-3 leading-relaxed">{post.content}</p>
          )}

          {mediaUrls.length > 0 && (
            <div className={`rounded-lg overflow-hidden mb-3 ${mediaUrls.length >= 2 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
              {mediaUrls.slice(0, 4).map((url: string, i: number) => {
                const isVideo = url.match(/\.(mp4|webm|mov)/i);
                return isVideo ? (
                  <video key={i} src={url} controls className="w-full max-h-96 object-contain bg-black" />
                ) : (
                  <img key={i} src={url} alt="" className="w-full max-h-96 object-contain bg-muted" loading="lazy" />
                );
              })}
            </div>
          )}

          {/* Facebook-style Interactions */}
          <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══ About Sidebar ═══ */
function AboutSidebar({ org, settings, services, workingHours, hasWorkingHours }: {
  org: any; settings: PublicProfile; services: string[]; workingHours: Record<string, any>; hasWorkingHours: boolean;
}) {
  return (
    <>
      {/* Bio */}
      {org.bio && settings.show_basic_info && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm">نبذة</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{org.bio}</p>
            {org.founded_year && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" /> تأسست عام {org.founded_year}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-primary" /> الخدمات
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Hours */}
      {hasWorkingHours && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> ساعات العمل
            </h3>
            <div className="space-y-1 text-xs">
              {Object.entries(workingHours).map(([day, val]: [string, any]) => (
                <div key={day} className="flex justify-between">
                  <span className="text-muted-foreground">{DAYS_AR[day] || day}</span>
                  <span className="font-medium">
                    {val.closed ? 'مغلق' : `${val.open || ''} - ${val.close || ''}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/* ═══ Info Item ═══ */
function InfoItem({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}
