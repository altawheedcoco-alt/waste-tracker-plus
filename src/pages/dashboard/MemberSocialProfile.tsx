import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ImageCropDialog, { CropMode } from '@/components/ui/ImageCropDialog';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Edit3, MapPin, Building2, Briefcase, Phone, Mail,
  Calendar, Star, MessageCircle, Heart, ThumbsUp, Send, MoreVertical,
  Globe, Shield, Award, Activity, TrendingUp, Pin, PinOff, Trash2, Loader2,
  Image as ImageIcon, X, UserCheck, Clock, Images, Video, Play, Share2, Link2,
  Eye, BadgeCheck,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import ProfilePhotoGallery from '@/components/profile/ProfilePhotoGallery';
import PostInteractions from '@/components/organization/PostInteractions';
import FollowButton from '@/components/social/FollowButton';
import FollowStats from '@/components/social/FollowStats';
import SecureDigitalSeal from '@/components/endorsement/SecureDigitalSeal';
import { cn } from '@/lib/utils';

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
  const postVideoRef = useRef<HTMLInputElement>(null);

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewCategory, setReviewCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [coverGalleryOpen, setCoverGalleryOpen] = useState(false);
  const [avatarGalleryOpen, setAvatarGalleryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropMode, setCropMode] = useState<CropMode>('cover');
  const [cropOpen, setCropOpen] = useState(false);

  // Clean up preview URLs
  useEffect(() => {
    const urls = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [selectedFiles]);

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
        .select('id, name, organization_type, logo_url, city, is_verified, region, activity_type, phone, email, website_url')
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

  // Save photo to history
  const savePhotoHistory = async (photoUrl: string, photoType: 'cover' | 'avatar', storagePath?: string) => {
    if (!targetProfile || !user?.id) return;
    await supabase
      .from('profile_photos')
      .update({ is_current: false, updated_at: new Date().toISOString() } as any)
      .eq('profile_id', targetProfile.id)
      .eq('photo_type', photoType);
    await supabase.from('profile_photos').insert({
      profile_id: targetProfile.id,
      user_id: user.id,
      photo_type: photoType,
      photo_url: photoUrl,
      storage_path: storagePath || null,
      is_current: true,
    } as any);
  };

  // Update cover photo — open crop dialog
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetProfile) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }
    setCropFile(file);
    setCropMode('cover');
    setCropOpen(true);
  };

  // Update avatar — open crop dialog
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetProfile) return;
    e.target.value = '';
    setCropFile(file);
    setCropMode('avatar');
    setCropOpen(true);
  };

  // Handle cropped image save
  const handleCropSave = useCallback(async (croppedBlob: Blob) => {
    if (!targetProfile || !user?.id) return;
    const isCover = cropMode === 'cover';
    setUploading(true);

    try {
      const folder = isCover ? 'covers' : 'avatars';
      const path = `${user.id}/${folder}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('profile-media').upload(path, croppedBlob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('profile-media').getPublicUrl(path);
      const url = urlData.publicUrl;

      if (isCover) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ cover_url: url } as any)
          .eq('id', targetProfile.id);
        if (updateError) throw updateError;
      } else {
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', targetProfile.id);
      }

      await savePhotoHistory(url, isCover ? 'cover' : 'avatar');
      queryClient.invalidateQueries({ queryKey: ['social-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-photos'] });
      toast.success(isCover ? 'تم تحديث صورة الغلاف' : 'تم تحديث صورة الملف الشخصي');
    } catch (err: any) {
      console.error('Crop upload error:', err);
      toast.error(err?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  }, [cropMode, targetProfile, user?.id, queryClient]);

  // Update profile info
  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!targetProfile) throw new Error('No profile');
      const updates: Record<string, any> = { bio: editBio, whatsapp: editWhatsapp };
      if (editName.trim()) updates.full_name = editName.trim();
      if (editPhone.trim()) updates.phone = editPhone.trim();
      await supabase.from('profiles').update(updates as any).eq('id', targetProfile.id);
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

  // ── File selection for posts ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (!isImage && !isVideo) { toast.error(`${file.name}: نوع غير مدعوم`); return false; }
      if (file.size > maxSize) { toast.error(`${file.name}: حجم كبير جداً`); return false; }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const determinePostType = (): string => {
    if (selectedFiles.length === 0) return 'text';
    if (selectedFiles.length > 1) return 'gallery';
    if (selectedFiles[0].type.startsWith('video/')) return 'video';
    return 'media';
  };

  // Create post
  const createPost = useMutation({
    mutationFn: async () => {
      if (!myProfile || !organization) throw new Error('Not auth');
      let mediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const url = await uploadFile(file, 'posts');
          mediaUrls.push(url);
        }
      }
      const { error } = await (supabase.from('member_posts') as any).insert({
        author_id: myProfile.id,
        organization_id: organization.id,
        content: newPostContent.trim() || null,
        media_urls: mediaUrls,
        post_type: determinePostType(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] });
      setNewPostContent('');
      setSelectedFiles([]);
      toast.success('تم نشر المنشور');
    },
    onError: () => toast.error('فشل نشر المنشور'),
  });

  // Delete post
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      const { error } = await (supabase.from('member_posts') as any).delete().eq('id', postToDelete);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] });
      toast.success('تم حذف المنشور');
    } catch { toast.error('فشل حذف المنشور'); }
    finally { setDeleteDialogOpen(false); setPostToDelete(null); }
  };

  // Toggle pin
  const togglePin = useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      await (supabase.from('member_posts') as any).update({ is_pinned: !pinned }).eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-profile-posts'] });
      toast.success('تم تحديث التثبيت');
    },
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

  // ── Render media for posts ──
  const renderPostMedia = (post: any) => {
    const urls = post.media_urls;
    if (!urls || urls.length === 0) return null;

    // Video
    if (post.post_type === 'video' || (urls.length === 1 && (urls[0].includes('.mp4') || urls[0].includes('.webm') || urls[0].includes('.mov')))) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-black">
          <video src={urls[0]} controls playsInline preload="auto" className="w-full max-h-[500px] object-contain" />
        </div>
      );
    }

    // Gallery
    if (urls.length > 1) {
      return (
        <div className={cn(
          "mt-3 grid gap-1.5 rounded-lg overflow-hidden",
          urls.length === 2 && "grid-cols-2",
          urls.length === 3 && "grid-cols-3",
          urls.length >= 4 && "grid-cols-2",
        )}>
          {urls.slice(0, 4).map((url: string, i: number) => (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden cursor-pointer",
                urls.length === 3 && i === 0 && "col-span-3",
              )}
              onClick={() => window.open(url, '_blank')}
            >
              {url.includes('.mp4') || url.includes('.webm') ? (
                <video src={url} className="w-full h-48 object-cover" />
              ) : (
                <img src={url} alt="" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
              )}
              {i === 3 && urls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Single image
    return (
      <div className="mt-3 rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(urls[0], '_blank')}>
        <img src={urls[0]} alt="" className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-300" />
      </div>
    );
  };

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

        {/* Hidden file inputs — outside overflow-hidden to ensure they work on all browsers */}
        {isOwnProfile && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </>
        )}

        {/* Cover + Avatar Section */}
        <Card className="overflow-hidden">
          {/* Cover Photo */}
          <div className="relative aspect-[3/1] min-h-[12rem] max-h-[20rem] bg-gradient-to-l from-primary/20 via-primary/10 to-background overflow-hidden group/cover">
            {(targetProfile as any).cover_url && (
              <>
                <img
                  src={(targetProfile as any).cover_url}
                  alt="غلاف"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105"
                  aria-hidden="true"
                />
                <img
                  src={(targetProfile as any).cover_url}
                  alt="غلاف"
                  className="relative z-10 w-full h-full object-cover object-center cursor-pointer"
                  onClick={() => setCoverGalleryOpen(true)}
                />
              </>
            )}
            {/* Cover action buttons */}
            <div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
              {isOwnProfile && (
                <Button
                  size="sm" variant="secondary"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    coverInputRef.current?.click();
                  }}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {(targetProfile as any).cover_url ? 'تغيير الغلاف' : 'إضافة غلاف'}
                </Button>
              )}
              <Button
                size="sm" variant="secondary"
                className="gap-1.5"
                onClick={() => setCoverGalleryOpen(true)}
              >
                <Images className="w-4 h-4" />
                صور الغلاف
              </Button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative z-30 -mt-10 px-4 pb-4 pt-3 md:-mt-16 md:px-6 md:pt-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Avatar */}
              <div className="relative mx-auto group/avatar md:mx-0 md:shrink-0">
                <Avatar
                  className="h-28 w-28 cursor-pointer border-4 border-background shadow-lg"
                  onClick={() => setAvatarGalleryOpen(true)}
                >
                  <AvatarImage src={targetProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon" variant="secondary"
                  className="absolute -bottom-1 -left-1 h-7 w-7 rounded-full shadow opacity-0 transition-opacity group-hover/avatar:opacity-100"
                  onClick={() => setAvatarGalleryOpen(true)}
                >
                  <Images className="w-3.5 h-3.5" />
                </Button>
                {isOwnProfile && (
                  <>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <Button
                      size="icon" variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Name & Info */}
              <div className="min-w-0 flex-1 pb-1 text-center md:text-right">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <h1 className="text-xl font-bold md:text-2xl">{targetProfile.full_name}</h1>
                  {profileOrg?.is_verified && (
                    <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
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
                    <Badge
                      variant="outline"
                      className="gap-1 cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/dashboard/org/${profileOrg.id}`)}
                    >
                      <Building2 className="w-3 h-3" /> {profileOrg.name}
                    </Badge>
                  )}
                  {profileOrg?.organization_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {orgTypeLabels[profileOrg.organization_type] || profileOrg.organization_type}
                    </Badge>
                  )}
                </div>
                {/* Bio inline */}
                {(targetProfile as any).bio && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{(targetProfile as any).bio}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pb-1 md:justify-start">
                {avgRating && (
                  <Badge className="gap-1 border-amber-200 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <Star className="w-3 h-3 fill-current" /> {avgRating}
                    <span className="text-[10px]">({reviews.length})</span>
                  </Badge>
                )}
                {!isOwnProfile && (
                  <FollowButton targetProfileId={targetProfileId} />
                )}
                {!isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)} className="gap-1.5">
                    <Star className="w-4 h-4" /> تقييم
                  </Button>
                )}
                {!isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => {
                    navigate(`/dashboard/messages?to=${targetProfile.user_id}`);
                  }} className="gap-1.5">
                    <MessageCircle className="w-4 h-4" /> مراسلة
                  </Button>
                )}
                {!isOwnProfile && (
                  <Button size="sm" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('تم نسخ رابط الملف الشخصي');
                  }} className="gap-1.5">
                    <Link2 className="w-4 h-4" />
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
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="text-center">
                <p className="text-lg font-bold">{posts.length}</p>
                <p className="text-[10px] text-muted-foreground">منشور</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-lg font-bold">{reviews.length}</p>
                <p className="text-[10px] text-muted-foreground">تقييم</p>
              </div>
              <FollowStats targetProfileId={targetProfileId} />
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-lg font-bold">{activityStats?.total || 0}</p>
                <p className="text-[10px] text-muted-foreground">نشاط</p>
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

          {/* ═══ Posts Tab ═══ */}
          <TabsContent value="posts" className="space-y-4">
            {/* New Post Composer */}
            {isOwnProfile && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={targetProfile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="شارك منشوراً أو تحديثاً..."
                        className="min-h-[80px] resize-none"
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                      />

                      {/* File Previews */}
                      {previewUrls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {previewUrls.map((url, i) => (
                            <div key={i} className="relative group">
                              {selectedFiles[i]?.type.startsWith('video/') ? (
                                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                                  <Play className="h-8 w-8 text-muted-foreground" />
                                </div>
                              ) : (
                                <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                              )}
                              <button
                                onClick={() => removeFile(i)}
                                className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {/* Image upload */}
                          <label className="cursor-pointer">
                            <input ref={postMediaRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <span><ImageIcon className="w-4 h-4 ml-1" /> صورة</span>
                            </Button>
                          </label>
                          {/* Video upload */}
                          <label className="cursor-pointer">
                            <input ref={postVideoRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <span><Video className="w-4 h-4 ml-1" /> فيديو</span>
                            </Button>
                          </label>
                          {/* Gallery */}
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <span><Images className="w-4 h-4 ml-1" /> معرض</span>
                            </Button>
                          </label>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createPost.mutate()}
                          disabled={(!newPostContent.trim() && selectedFiles.length === 0) || createPost.isPending}
                          className="gap-1.5"
                        >
                          {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          نشر
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts list */}
            {postsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p>
                  {isOwnProfile && <p className="text-xs text-muted-foreground mt-1">كن أول من ينشر محتوى!</p>}
                </CardContent>
              </Card>
            ) : (
              posts.map((post: any) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={cn(post.is_pinned && "border-primary/50 bg-primary/5")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarImage src={targetProfile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          {/* Post Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{targetProfile.full_name}</span>
                                {post.is_pinned && (
                                  <Badge variant="outline" className="text-xs gap-0.5 h-5">
                                    <Pin className="w-3 h-3" /> مثبت
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {memberPosition && (
                                  <>
                                    <span>{memberPosition.title_ar || memberPosition.title}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}
                                </span>
                              </div>
                            </div>

                            {/* Post Actions Dropdown */}
                            {isOwnProfile && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => togglePin.mutate({ postId: post.id, pinned: post.is_pinned })}>
                                    {post.is_pinned ? (
                                      <><PinOff className="h-4 w-4 ml-2" /> إلغاء التثبيت</>
                                    ) : (
                                      <><Pin className="h-4 w-4 ml-2" /> تثبيت المنشور</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => { setPostToDelete(post.id); setDeleteDialogOpen(true); }}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" /> حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Post Content */}
                          {post.content && (
                            <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
                          )}

                          {/* Post Media */}
                          {renderPostMedia(post)}

                          {/* Post Interactions (reactions, comments, share) */}
                          <div className="mt-3">
                            <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ═══ Reviews Tab ═══ */}
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
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}
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

          {/* ═══ About Tab ═══ */}
          <TabsContent value="about" className="space-y-4">
            {/* Personal Info */}
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

            {/* Digital Seal */}
            {targetProfile?.id && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> الختم الرقمي المؤمّن</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <SecureDigitalSeal
                    entityId={targetProfile.id}
                    entityType="member"
                    entityName={targetProfile.full_name || 'عضو'}
                    title={memberPosition?.title_ar || memberPosition?.title || targetProfile.position || undefined}
                    orgName={profileOrg?.name || undefined}
                    size={200}
                    allowStyleChange={isOwnProfile}
                  />
                </CardContent>
              </Card>
            )}
            {(targetProfile as any).bio && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Edit3 className="w-4 h-4 text-primary" /> نبذة شخصية</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{(targetProfile as any).bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Organization Info Card */}
            {profileOrg && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> جهة العمل</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profileOrg.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{profileOrg.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{profileOrg.name}</span>
                        {profileOrg.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {profileOrg.organization_type && (
                          <Badge variant="secondary" className="text-[10px]">
                            {orgTypeLabels[profileOrg.organization_type] || profileOrg.organization_type}
                          </Badge>
                        )}
                        {profileOrg.activity_type && (
                          <Badge variant="outline" className="text-[10px]">{profileOrg.activity_type}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0"
                      onClick={() => navigate(`/dashboard/org/${profileOrg.id}`)}
                    >
                      <Eye className="w-3.5 h-3.5" /> عرض
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {profileOrg.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {profileOrg.city}{profileOrg.region ? ` - ${profileOrg.region}` : ''}
                      </div>
                    )}
                    {profileOrg.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> <span dir="ltr">{profileOrg.phone}</span>
                      </div>
                    )}
                    {profileOrg.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {profileOrg.email}
                      </div>
                    )}
                    {profileOrg.website_url && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                        <a href={profileOrg.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                          {profileOrg.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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

        {/* Delete Post Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المنشور</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Photo Galleries */}
        <ProfilePhotoGallery
          profileId={targetProfile.id}
          photoType="cover"
          isOwner={isOwnProfile}
          open={coverGalleryOpen}
          onOpenChange={setCoverGalleryOpen}
        />
        <ProfilePhotoGallery
          profileId={targetProfile.id}
          photoType="avatar"
          isOwner={isOwnProfile}
          open={avatarGalleryOpen}
          onOpenChange={setAvatarGalleryOpen}
        />
      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageFile={cropFile}
        mode={cropMode}
        onSave={handleCropSave}
      />
      </div>
    </DashboardLayout>
  );
}
