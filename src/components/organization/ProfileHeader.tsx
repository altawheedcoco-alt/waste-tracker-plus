import { useState, useRef, useMemo } from 'react';
import ClickableImage from '@/components/ui/ClickableImage';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, Upload, Building2, Truck, Recycle, CheckCircle, XCircle, Loader2, BadgeCheck, Scale, FolderCheck, ShieldCheck, Lock, LockOpen } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';

interface ProfileHeaderProps {
  organization: {
    id: string;
    name: string;
    name_en?: string;
    organization_type: string;
    logo_url?: string;
    cover_url?: string;
    is_verified?: boolean;
    city?: string;
    region?: string;
    client_code?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string;
    representative_national_id?: string;
    representative_phone?: string;
    bio?: string;
    cta_type?: string;
    website_url?: string;
    phone?: string;
    founded_year?: number;
    activity_type?: string;
    is_profile_locked?: boolean;
  };
  isEditable?: boolean;
  onUpdate?: () => void;
}

const ProfileHeader = ({ organization, isEditable = false, onUpdate }: ProfileHeaderProps) => {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isLocked = organization.is_profile_locked === true;
  const isProtected = isLocked && !isEditable;

  // Fetch organization documents count
  const { data: documentsCount = 0 } = useQuery({
    queryKey: ['organization-documents-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('organization_documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Check if legal data is complete
  const isLegalDataComplete = useMemo(() => {
    if (!organization) return false;
    return !!(
      organization.commercial_register &&
      organization.environmental_license &&
      organization.representative_name &&
      organization.representative_national_id &&
      organization.representative_phone
    );
  }, [organization]);

  // Check if documents are complete (at least 3 required documents)
  const isDocumentsComplete = documentsCount >= 3;

  const getOrganizationIcon = () => {
    switch (organization.organization_type) {
      case 'generator':
        return Building2;
      case 'transporter':
        return Truck;
      case 'recycler':
        return Recycle;
      default:
        return Building2;
    }
  };

  const getOrganizationTypeLabel = () => {
    switch (organization.organization_type) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
      default:
        return 'جهة';
    }
  };

  const OrgIcon = getOrganizationIcon();

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة JPG أو PNG أو WebP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ cover_url: urlData.publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      toast.success('تم تحديث صورة الغلاف بنجاح');
      onUpdate?.();
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('حدث خطأ في رفع صورة الغلاف');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يرجى رفع صورة JPG أو PNG أو WebP');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      toast.success('تم تحديث صورة الشعار بنجاح');
      onUpdate?.();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ في رفع صورة الشعار');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_profile_locked: !isLocked })
        .eq('id', organization.id);
      if (error) throw error;
      toast.success(isLocked ? 'تم فتح قفل الملف الشخصي' : 'تم قفل الملف الشخصي بنجاح');
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('حدث خطأ في تغيير حالة القفل');
    } finally {
      setTogglingLock(false);
    }
  };

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="relative aspect-[3/1] min-h-[12rem] max-h-[22rem] rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        {organization.cover_url ? (
          <ClickableImage
            src={organization.cover_url}
            alt="صورة الغلاف"
            gallery={[organization.cover_url, organization.logo_url].filter(Boolean) as string[]}
            className="w-full h-full object-cover object-center"
            protected={isProtected}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center">
            <OrgIcon className="w-24 h-24 text-primary/30" />
          </div>
        )}
        
        {/* Cover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Edit Cover Button */}
        {isEditable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-4"
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="shadow-lg"
            >
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 ml-2" />
              )}
              تغيير الغلاف
            </Button>
          </motion.div>
        )}
      </div>

      {/* Profile Section */}
      <div className="relative px-4 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20">
          {/* Profile Picture */}
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <ClickableImage
                src={organization.logo_url || ''}
                gallery={[organization.logo_url, organization.cover_url].filter(Boolean) as string[]}
                protected={isProtected}
              >
                <Avatar className={`w-32 h-32 sm:w-40 sm:h-40 border-4 shadow-xl ${isLocked ? 'border-blue-500 ring-4 ring-blue-500/30' : 'border-background'}`}>
                  <AvatarImage src={organization.logo_url || ''} alt={organization.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl sm:text-4xl font-bold">
                    {organization.name?.charAt(0) || <OrgIcon className="w-12 h-12" />}
                  </AvatarFallback>
                </Avatar>
              </ClickableImage>

              {/* Profile Lock Shield Badge */}
              {isLocked && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg border-2 border-background z-10">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}

              {/* Edit Logo Button */}
              {isEditable && (
                <>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>

          {/* Organization Info */}
          <div className="flex-1 text-center sm:text-right sm:pb-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{organization.name}</h1>
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Badge variant={organization.is_verified ? 'default' : 'secondary'}>
                    {organization.is_verified ? (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        موثقة
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 ml-1" />
                        قيد المراجعة
                      </>
                    )}
                  </Badge>
                </div>
              </TooltipProvider>
            </div>
            
            {organization.name_en && (
              <p className="text-muted-foreground mt-1" dir="ltr">{organization.name_en}</p>
            )}
            
            {/* Verification Badges Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
              {organization.is_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  جهة موثقة
                </span>
              )}
              {isLegalDataComplete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Scale className="w-3.5 h-3.5" />
                  بيانات قانونية مكتملة
                </span>
              )}
              {isDocumentsComplete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FolderCheck className="w-3.5 h-3.5" />
                  وثائق مكتملة
                </span>
              )}
              {!organization.is_verified && !isLegalDataComplete && !isDocumentsComplete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  ⚠️ يرجى استكمال البيانات والوثائق
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {organization.client_code && (
                <Badge variant="secondary" className="gap-1 font-mono">
                  🆔 {organization.client_code}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <OrgIcon className="w-3 h-3" />
                {getOrganizationTypeLabel()}
              </Badge>
              {organization.activity_type && (
                <Badge variant="outline" className="gap-1">
                  🏭 {organization.activity_type}
                </Badge>
              )}
              {organization.city && (
                <Badge variant="outline" className="gap-1">
                  📍 {organization.city}
                  {organization.region && ` - ${organization.region}`}
                </Badge>
              )}
              {organization.founded_year && (
                <Badge variant="outline" className="gap-1">
                  📅 تأسست {organization.founded_year}
                </Badge>
              )}
            </div>

            {/* Bio */}
            {organization.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{organization.bio}</p>
            )}

            {/* CTA Button */}
            {organization.cta_type && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="gap-1.5">
                  {organization.cta_type === 'contact' && '📞 تواصل معنا'}
                  {organization.cta_type === 'message' && '💬 ارسل رسالة'}
                  {organization.cta_type === 'call' && '📱 اتصل الآن'}
                  {organization.cta_type === 'shop' && '🛒 تسوق الآن'}
                  {organization.cta_type === 'visit' && '🌐 زيارة الموقع'}
                  {organization.cta_type === 'quote' && '💰 اطلب عرض سعر'}
                  {organization.cta_type === 'book' && '📅 احجز موعد'}
                </Button>
                {organization.website_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={organization.website_url} target="_blank" rel="noopener noreferrer">
                      🌐 الموقع
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Profile Lock Toggle (Owner only) */}
            {isEditable && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant={isLocked ? 'default' : 'outline'}
                  className="gap-1.5"
                  onClick={handleToggleLock}
                  disabled={togglingLock}
                >
                  {togglingLock ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <LockOpen className="w-4 h-4" />
                  )}
                  {isLocked ? 'الملف مقفول' : 'قفل الملف الشخصي'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
