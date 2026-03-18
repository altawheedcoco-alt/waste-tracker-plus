import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Camera, Edit3, MapPin, Building2, Briefcase, Phone, Mail,
  Calendar, Star, MessageCircle, Heart, ThumbsUp, Send, MoreHorizontal,
  Globe, Shield, Award, Activity, TrendingUp, Pin, Trash2, Loader2,
  Image as ImageIcon, X, UserCheck, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const REVIEW_CATEGORIES = [
  { value: 'general', label: 'عام' },
  { value: 'professionalism', label: 'احترافية' },
  { value: 'reliability', label: 'موثوقية' },
  { value: 'communication', label: 'تواصل' },
  { value: 'quality', label: 'جودة العمل' },
];

export default function MemberSocialProfile() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { profile: myProfile, organization, user } = useAuth();
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const postMediaRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !profileId || profileId === myProfile?.id;
  const targetProfileId = profileId || myProfile?.id;

  const [activeTab, setActiveTab] = useState('posts');
  const [editBioOpen, setEditBioOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewCategory, setReviewCategory] = useState('general');
  const [uploading, setUploading] = useState(false);

  // Fetch target profile
  const { data: targetProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['social-profile', targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, position, department, avatar_url, avatar_preset, organization_id, user_id, created_at, bio, cover_url, whatsapp, social_links, profile_visibility, profile_color_theme')
        .eq('id', targetProfileId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetProfileId,
  });

  // Fetch org info
  const { data: profileOrg } = useQuery({
    queryKey: ['social-profile-org', targetProfile?.organization_id],
    queryFn: async () => {
      if (!targetProfile?.organization_id) return null;
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, logo_url, city')
        .eq('id', targetProfile.organization_id)
        .single();
      return data;
    },
    enabled: !!targetProfile?.organization_id,
  });

  // Fetch position
  const { data: memberPosition } = useQuery({
    queryKey: ['social-profile-position', targetProfile?.user_id],
    queryFn: async () => {
      if (!targetProfile?.user_id) return null;
      const { data } = await supabase
        .from('organization_positions')
        .select('title, title_ar, level')
        .eq('assigned_user_id', targetProfile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!targetProfile?.user_id,
  });

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['social-profile-posts', targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) return [];
      const { data } = await (supabase.from('member_posts') as any)
        .select('*')
        .eq('author_id', targetProfileId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!targetProfileId,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['social-profile-reviews', targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) return [];
      const { data } = await (supabase.from('member_reviews') as any)
        .select('*, reviewer:profiles!member_reviews_reviewer_id_fkey(full_name, avatar_url, position), reviewer_org:organizations!member_reviews_reviewer_organization_id_fkey(name)')
        .eq('member_id', targetProfileId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!targetProfileId,
  });

  // Fetch activity stats
  const { data: activityStats } = useQuery({
    queryKey: ['social-profile-activity', targetProfile?.user_id],
    queryFn: async () => {
      if (!targetProfile?.user_id) return { total: 0, thisMonth: 0 };
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [totalRes, monthRes] = await Promise.all([
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', targetProfile.user_id),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', targetProfile.user_id).gte('created_at', monthStart),
      ]);
      return { total: totalRes.count || 0, thisMonth: monthRes.count || 0 };
    },
    enabled: !!targetProfile?.user_id,
  });

  // Avg rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const initials = (targetProfile?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  // Upload helper
  const uploadFile = async (file: File, folder: string) => {
    if (!user?.id) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('profile-media').upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('profile-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  // Update cover photo
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetProfile) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'covers');
      await supabase.from('profiles').update({ cover_url: url } as any).eq('id', targetProfile.id);
      queryClient.invalidateQueries({ queryKey: ['social-profile'] });
      toast.success('تم تحديث صورة الغلاف');
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploading(false); }
  };

  // Update avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetProfile) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'avatars');
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', targetProfile.id);
      queryClient.invalidateQueries({ queryKey: ['social-profile'] });
      toast.success('تم تحديث صورة الملف الشخصي');
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploading(false); }
  };

  // Update profile info
  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!targetProfile) throw new Error('No profile');
      // Update profile fields
      const updates: Record<string, any> = { bio: editBio, whatsapp: editWhatsapp };
      if (editName.trim()) updates.full_name = editName.trim();
      if (editPhone.trim()) updates.phone = editPhone.trim();
      
      await supabase.from('profiles').update(updates as any).eq('id', targetProfile.id);

      // If email changed, use edge function
      if (editEmail.trim() && editEmail.trim() !== targetProfile.email) {
        const res = await supabase.functions.invoke('update-member-credentials', {
          body: { mode: 'self', new_email: editEmail.trim() },
        });
        if (res.error) throw new Error(res.error.message);
        if (res.data?.error) throw new Error(res.data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile'] });
      setEditBioOpen(false);
      toast.success('تم تحديث البيانات');
    },
    onError: (err: any) => toast.error(err.message || 'فشل التحديث'),
  });

  // Create post
  const createPost = useMutation({
    mutationFn: async () => {
      if (!myProfile || !organization) throw new Error('Not auth');
      let mediaUrls: string[] = [];
      if (newPostMedia.length > 0) {
        for (const file of newPostMedia) {
          const url = await uploadFile(file, 'posts');
          mediaUrls.push(url);
        }
      }
      const { error } = await (supabase.from('member_posts') as any).insert({
        author_id: myProfile.id,
        organization_id: organization.id,
        content: newPostContent,
        media_urls: mediaUrls,
        post_type: mediaUrls.length > 0 ? 'media' : 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] });
      setNewPostContent('');
      setNewPostMedia([]);
      toast.success('تم نشر المنشور');
    },
    onError: () => toast.error('فشل نشر المنشور'),
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await (supabase.from('member_posts') as any).delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] });
      toast.success('تم حذف المنشور');
    },
  });

  // Toggle pin
  const togglePin = useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      await (supabase.from('member_posts') as any).update({ is_pinned: !pinned }).eq('id', postId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] }),
  });

  // Submit review
  const submitReview = useMutation({
    mutationFn: async () => {
      if (!myProfile || !organization || !targetProfileId) throw new Error('Missing');
      const { error } = await (supabase.from('member_reviews') as any).upsert({
        member_id: targetProfileId,
        reviewer_id: myProfile.id,
        reviewer_organization_id: organization.id,
        rating: reviewRating,
        review_text: reviewText || null,
        review_category: reviewCategory,
      }, { onConflict: 'member_id,reviewer_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile-reviews'] });
      setReviewOpen(false);
      setReviewText('');
      toast.success('تم إضافة التقييم');
    },
    onError: () => toast.error('فشل إضافة التقييم'),
  });

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!targetProfile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-lg font-semibold">الملف الشخصي غير موجود</p>
        </div>
      </DashboardLayout>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص',
    consultant: 'استشاري', consulting_office: 'مكتب استشاري', transport_office: 'مكتب نقل',
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto" dir="rtl">
        <BackButton />

        {/* Cover + Avatar Section */}
        <Card className="overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 bg-gradient-to-l from-primary/20 via-primary/10 to-background overflow-hidden">
            {(targetProfile as any).cover_url && (
              <img src={(targetProfile as any).cover_url} alt="غلاف" className="w-full h-full object-cover" />
            )}
            {isOwnProfile && (
              <>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <Button
                  size="sm" variant="secondary"
                  className="absolute bottom-3 left-3 gap-1.5 opacity-80 hover:opacity-100"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                  {(targetProfile as any).cover_url ? 'تغيير الغلاف' : 'إضافة غلاف'}
                </Button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-4 md:px-6 pb-4 -mt-16 relative">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                  <AvatarImage src={targetProfile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <Button
                      size="icon" variant="secondary"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl md:text-2xl font-bold">{targetProfile.full_name}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {memberPosition && (
                    <Badge variant="secondary" className="gap-1">
                      <Briefcase className="w-3 h-3" />
                      {memberPosition.title_ar || memberPosition.title}
                    </Badge>
                  )}
                  {targetProfile.position && !memberPosition && (
                    <Badge variant="outline" className="gap-1">
                      <Briefcase className="w-3 h-3" /> {targetProfile.position}
                    </Badge>
                  )}
                  {profileOrg && (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="w-3 h-3" /> {profileOrg.name}
                    </Badge>
                  )}
                  {profileOrg?.organization_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {orgTypeLabels[profileOrg.organization_type] || profileOrg.organization_type}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pb-1">
                {avgRating && (
                  <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200">
                    <Star className="w-3 h-3 fill-current" /> {avgRating}
                    <span className="text-[10px]">({reviews.length})</span>
                  </Badge>
                )}
                {!isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)} className="gap-1.5">
                    <Star className="w-4 h-4" /> تقييم
                  </Button>
                )}
                {!isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => {
                    // Navigate to chat with this user
                    navigate(`/dashboard/messages?to=${targetProfile.user_id}`);
                  }} className="gap-1.5">
                    <MessageCircle className="w-4 h-4" /> مراسلة
                  </Button>
                )}
                {isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditBio((targetProfile as any).bio || '');
                    setEditWhatsapp((targetProfile as any).whatsapp || '');
                    setEditName(targetProfile.full_name || '');
                    setEditEmail(targetProfile.email || '');
                    setEditPhone(targetProfile.phone || '');
                    setEditBioOpen(true);
                  }} className="gap-1.5">
                    <Edit3 className="w-4 h-4" /> تعديل
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            {(targetProfile as any).bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{(targetProfile as any).bio}</p>
            )}

            {/* Contact chips */}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              {targetProfile.email && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {targetProfile.email}</span>
              )}
              {targetProfile.phone && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {targetProfile.phone}</span>
              )}
              {(targetProfile as any).whatsapp && (
                <a href={`https://wa.me/${(targetProfile as any).whatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <MessageCircle className="w-3 h-3" /> واتساب
                </a>
              )}
              {profileOrg?.city && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profileOrg.city}</span>
              )}
              {targetProfile.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> انضم {format(new Date(targetProfile.created_at), 'MMMM yyyy', { locale: ar })}
                </span>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold">{posts.length}</p>
                <p className="text-[10px] text-muted-foreground">منشور</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-lg font-bold">{reviews.length}</p>
                <p className="text-[10px] text-muted-foreground">تقييم</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-lg font-bold">{activityStats?.total || 0}</p>
                <p className="text-[10px] text-muted-foreground">نشاط</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-lg font-bold">{activityStats?.thisMonth || 0}</p>
                <p className="text-[10px] text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="posts" className="gap-1.5"><Edit3 className="w-4 h-4" /> المنشورات</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-4 h-4" /> التقييمات</TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5"><Shield className="w-4 h-4" /> حول</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-3">
            {/* New Post */}
            {isOwnProfile && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={targetProfile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="شارك منشوراً أو تحديثاً..."
                      className="flex-1 min-h-[60px] resize-none"
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                    />
                  </div>
                  {newPostMedia.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {newPostMedia.map((f, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          <Button size="icon" variant="destructive" className="absolute top-0 right-0 w-5 h-5 rounded-full"
                            onClick={() => setNewPostMedia(prev => prev.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input ref={postMediaRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { if (e.target.files) setNewPostMedia(prev => [...prev, ...Array.from(e.target.files!)]); }} />
                      <Button size="sm" variant="ghost" onClick={() => postMediaRef.current?.click()} className="gap-1">
                        <ImageIcon className="w-4 h-4" /> صور
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => createPost.mutate()} disabled={!newPostContent.trim() || createPost.isPending} className="gap-1.5">
                      {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      نشر
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts list */}
            {postsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : posts.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Edit3 className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p>
              </CardContent></Card>
            ) : (
              posts.map((post: any) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={targetProfile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{targetProfile.full_name}</span>
                            {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                            <span className="text-xs text-muted-foreground mr-auto">
                              {format(new Date(post.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                            </span>
                            {isOwnProfile && (
                              <div className="flex items-center gap-0.5">
                                <Button size="icon" variant="ghost" className="w-6 h-6"
                                  onClick={() => togglePin.mutate({ postId: post.id, pinned: post.is_pinned })}>
                                  <Pin className={`w-3 h-3 ${post.is_pinned ? 'text-primary fill-primary' : ''}`} />
                                </Button>
                                <Button size="icon" variant="ghost" className="w-6 h-6 text-destructive"
                                  onClick={() => deletePost.mutate(post.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm mt-1.5 whitespace-pre-wrap">{post.content}</p>
                          {post.media_urls?.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {post.media_urls.map((url: string, i: number) => (
                                <img key={i} src={url} alt="" className="rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(url, '_blank')} />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {post.likes_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-3">
            {/* Rating summary */}
            <Card>
              <CardContent className="p-4 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{avgRating || '—'}</p>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating || 0)) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} تقييم</p>
                </div>
                <Separator orientation="vertical" className="h-16" />
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter((r: any) => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3">{star}</span>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Review list */}
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">{(review.reviewer?.full_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{review.reviewer?.full_name}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{review.reviewer_org?.name}</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {REVIEW_CATEGORIES.find(c => c.value === review.review_category)?.label || review.review_category}
                        </Badge>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      {review.review_text && <p className="text-sm mt-1.5">{review.review_text}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reviews.length === 0 && (
              <Card><CardContent className="py-8 text-center">
                <Star className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-3">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> معلومات عامة</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {[
                  { icon: Briefcase, label: 'المنصب', value: memberPosition?.title_ar || memberPosition?.title || targetProfile.position },
                  { icon: Building2, label: 'الجهة', value: profileOrg?.name },
                  { icon: Mail, label: 'البريد', value: targetProfile.email },
                  { icon: Phone, label: 'الهاتف', value: targetProfile.phone },
                  { icon: MessageCircle, label: 'واتساب', value: (targetProfile as any).whatsapp },
                  { icon: MapPin, label: 'المدينة', value: profileOrg?.city },
                  { icon: Calendar, label: 'تاريخ الانضمام', value: targetProfile.created_at ? format(new Date(targetProfile.created_at), 'dd MMMM yyyy', { locale: ar }) : null },
                  { icon: Activity, label: 'إجمالي النشاط', value: `${activityStats?.total || 0} إجراء` },
                  { icon: TrendingUp, label: 'نشاط هذا الشهر', value: `${activityStats?.thisMonth || 0} إجراء` },
                ].map((item, i) => item.value ? (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground w-28">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ) : null)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Bio Dialog */}
        <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Edit3 className="w-5 h-5" /> تعديل الملف الشخصي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم الكامل</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم بالعربي أو الإنجليزي" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="example@mail.com" type="email" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نبذة شخصية</label>
                <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="اكتب نبذة عنك..." className="min-h-[80px]" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم واتساب</label>
                <Input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="201xxxxxxxxx" dir="ltr" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditBioOpen(false)}>إلغاء</Button>
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="gap-1.5">
                {saveProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> تقييم {targetProfile.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Button key={s} size="icon" variant="ghost" onClick={() => setReviewRating(s)}>
                    <Star className={`w-8 h-8 ${s <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {REVIEW_CATEGORIES.map(c => (
                  <Badge key={c.value} variant={reviewCategory === c.value ? 'default' : 'outline'}
                    className="cursor-pointer" onClick={() => setReviewCategory(c.value)}>
                    {c.label}
                  </Badge>
                ))}
              </div>
              <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="اكتب تعليقاً (اختياري)..." />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReviewOpen(false)}>إلغاء</Button>
              <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending} className="gap-1.5">
                {submitReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال التقييم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
