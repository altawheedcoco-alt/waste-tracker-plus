import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Loader2,
  Shield,
  Building2,
  Calendar,
  FileText,
  Globe,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import ProfilePostsSection from '@/components/profile/ProfilePostsSection';
import { motion } from 'framer-motion';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: string | null;
  department: string | null;
  created_at: string;
}

const DriverProfile = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    position: '',
    department: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, [profile?.id]);

  const fetchProfileData = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(data as ProfileData);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          position: data.position || '',
          department: data.department || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث بيانات الملف الشخصي',
      });

      fetchProfileData();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error.message || 'فشل في حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast({
        title: 'تم رفع الصورة',
        description: 'تم تحديث صورة الملف الشخصي بنجاح',
      });

      fetchProfileData();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'خطأ في الرفع',
        description: error.message || 'فشل في رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ResponsivePageContainer>
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">ملف السائق</h1>
              <p className="text-muted-foreground">إدارة بياناتك الشخصية وصورة الملف</p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              سائق معتمد
            </Badge>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                الصورة الشخصية
              </CardTitle>
              <CardDescription>
                قم برفع صورة واضحة لملفك الشخصي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={profileData?.avatar_url || ''} />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                      {profileData?.full_name?.charAt(0) || 'س'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 left-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-right space-y-2">
                  <h2 className="text-xl font-bold">{profileData?.full_name}</h2>
                  <p className="text-muted-foreground">{profileData?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    عضو منذ {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Profile and Posts */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="gap-2">
                <FileText className="h-4 w-4" />
                المعلومات الشخصية
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                المنشورات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    المعلومات الشخصية
                  </CardTitle>
                  <CardDescription>
                    قم بتحديث بياناتك الشخصية الأساسية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        الاسم الكامل
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        البريد الإلكتروني
                      </Label>
                      <Input
                        id="email"
                        value={profileData?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        رقم الهاتف
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="أدخل رقم هاتفك"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label htmlFor="position" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        المسمى الوظيفي
                      </Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        placeholder="مثال: سائق نقل"
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="department" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        القسم / الإدارة
                      </Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="مثال: قسم النقل والتوصيل"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    معلومات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">تاريخ الإنشاء</p>
                        <p className="text-sm text-muted-foreground">
                          {profileData?.created_at 
                            ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">معرف المستخدم</p>
                        <p className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">
                          {user?.id?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts">
              <ProfilePostsSection isOwnProfile={true} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </ResponsivePageContainer>
    </DashboardLayout>
  );
};

export default DriverProfile;
