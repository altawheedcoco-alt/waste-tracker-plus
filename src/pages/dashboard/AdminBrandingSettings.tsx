import { useState, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Image as ImageIcon, Type, Loader2, Check, Eye, Bell, Palette } from 'lucide-react';

interface BrandingSettings {
  system_name: string;
  system_name_en: string;
  logo_url: string;
  notification_logo_url: string;
  tagline: string;
  tagline_en: string;
  primary_color: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  system_name: 'iRecycle - نظام إدارة المخلفات',
  system_name_en: 'iRecycle - Waste Management System',
  logo_url: '',
  notification_logo_url: '',
  tagline: 'نحو مستقبل أنظف',
  tagline_en: 'Towards a cleaner future',
  primary_color: '#16a34a',
};

export default function AdminBrandingSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const notifLogoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'logo' | 'notif' | null>(null);

  const { data: branding, isLoading } = useQuery({
    queryKey: ['platform-branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('id', 'branding')
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULT_BRANDING, ...(data?.value as any || {}) } as BrandingSettings;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<BrandingSettings>) => {
      const merged = { ...branding, ...updates };
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 'branding',
          value: merged as any,
          updated_by: profile?.id,
          updated_at: new Date().toISOString(),
          description: 'إعدادات الهوية البصرية والعلامة التجارية',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-branding'] });
      toast.success('تم حفظ إعدادات الهوية بنجاح ✅');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleImageUpload = async (file: File, type: 'logo' | 'notif') => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('الحد الأقصى 5 ميجابايت');
      return;
    }

    setUploading(type);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `branding/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('shipment-documents')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = await supabase.storage.from('shipment-documents').createSignedUrl(path, 365 * 24 * 3600);
      const field = type === 'logo' ? 'logo_url' : 'notification_logo_url';
      await saveMutation.mutateAsync({ [field]: urlData?.signedUrl || '' });
    } catch (err: any) {
      toast.error(`فشل رفع الصورة: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const current = branding || DEFAULT_BRANDING;

  if (isLoading) {
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
      <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              الهوية البصرية والعلامة التجارية
            </h1>
            <p className="text-sm text-muted-foreground">تخصيص لوجو النظام واسمه الذي يظهر في الإشعارات والمستندات</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                لوجو النظام الرئيسي
              </CardTitle>
              <CardDescription>يظهر في الهيدر والمستندات والتقارير</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
              
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {current.logo_url ? (
                  <div className="space-y-3">
                    <img src={current.logo_url} alt="System Logo" className="h-24 mx-auto rounded-lg object-contain" />
                    <p className="text-sm text-muted-foreground">اضغط لتغيير اللوجو</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      {uploading === 'logo' ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <Upload className="h-7 w-7 text-primary" />}
                    </div>
                    <p className="font-medium">رفع لوجو النظام</p>
                    <p className="text-xs text-muted-foreground">PNG, SVG أو JPG (حتى 5 ميجابايت)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                لوجو الإشعارات
              </CardTitle>
              <CardDescription>يظهر مع كل إشعار يُرسل للمستخدمين (داخلي + واتساب)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input ref={notifLogoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'notif')} />
              
              <div
                onClick={() => notifLogoInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {current.notification_logo_url ? (
                  <div className="space-y-3">
                    <img src={current.notification_logo_url} alt="Notification Logo" className="h-24 mx-auto rounded-lg object-contain" />
                    <p className="text-sm text-muted-foreground">اضغط لتغيير لوجو الإشعارات</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      {uploading === 'notif' ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <Upload className="h-7 w-7 text-primary" />}
                    </div>
                    <p className="font-medium">رفع لوجو الإشعارات</p>
                    <p className="text-xs text-muted-foreground">صورة مربعة مُفضّلة (حتى 5 ميجابايت)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Name & Tagline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-5 w-5 text-primary" />
              اسم النظام والشعار
            </CardTitle>
            <CardDescription>يظهر في الإشعارات والمستندات الرسمية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم النظام (عربي)</Label>
                <Input
                  value={current.system_name}
                  onChange={e => saveMutation.mutate({ system_name: e.target.value })}
                  placeholder="اسم النظام بالعربية"
                />
              </div>
              <div className="space-y-2">
                <Label>System Name (English)</Label>
                <Input
                  value={current.system_name_en}
                  onChange={e => saveMutation.mutate({ system_name_en: e.target.value })}
                  placeholder="System name in English"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الشعار (عربي)</Label>
                <Input
                  value={current.tagline}
                  onChange={e => saveMutation.mutate({ tagline: e.target.value })}
                  placeholder="شعار مختصر"
                />
              </div>
              <div className="space-y-2">
                <Label>Tagline (English)</Label>
                <Input
                  value={current.tagline_en}
                  onChange={e => saveMutation.mutate({ tagline_en: e.target.value })}
                  placeholder="Short tagline"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              معاينة شكل الإشعار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-xl p-4 bg-muted/30 max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-3">
                {current.notification_logo_url || current.logo_url ? (
                  <img
                    src={current.notification_logo_url || current.logo_url}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg object-contain border bg-background"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{current.system_name || 'اسم النظام'}</p>
                  <p className="text-xs text-muted-foreground">{current.tagline}</p>
                </div>
                <Badge variant="outline" className="mr-auto text-xs">إشعار جديد</Badge>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <p className="font-medium">📦 شحنة جديدة #SHP-001</p>
                <p className="text-muted-foreground text-xs">تم إنشاء شحنة جديدة بواسطة عبدالله الناقل - 5 طن ورق وكرتون</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
