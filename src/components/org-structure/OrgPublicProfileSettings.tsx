/**
 * لوحة إعدادات مشاركة الملف العام للمنشأة
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Share2, Copy, ExternalLink, Eye, Building2, Phone, Shield,
  Users, FileText, BarChart3, Loader2, Check, Link2,
} from 'lucide-react';

interface ProfileSettings {
  id: string;
  share_code: string;
  is_active: boolean;
  show_basic_info: boolean;
  show_contact_info: boolean;
  show_licenses: boolean;
  show_team: boolean;
  show_team_details: boolean;
  show_team_documents: boolean;
  show_statistics: boolean;
  custom_message: string | null;
}

export default function OrgPublicProfileSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['org-public-profile', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('org_public_profiles' as any)
        .select('*')
        .eq('organization_id', orgId)
        .single();
      if (error && error.code === 'PGRST116') return null; // not found
      if (error) throw error;
      return data as any as ProfileSettings;
    },
    enabled: !!orgId,
  });

  const createProfile = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('org_public_profiles' as any).insert({
        organization_id: orgId,
        created_by: profile?.user_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-public-profile', orgId] });
      toast.success('تم إنشاء الملف العام');
    },
    onError: () => toast.error('خطأ في الإنشاء'),
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ProfileSettings>) => {
      if (!settings?.id) throw new Error('No profile');
      const { error } = await supabase
        .from('org_public_profiles' as any)
        .update(updates)
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-public-profile', orgId] });
      toast.success('تم التحديث');
    },
  });

  const shareUrl = settings
    ? `${window.location.origin}/org-profile/${settings.share_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Share2 className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <div>
            <h3 className="text-lg font-semibold">مشاركة ملف المنشأة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ رابط عام لمشاركة معلومات منشأتك مع الشركات والجهات الخارجية
            </p>
          </div>
          <Button onClick={() => createProfile.mutate()} disabled={createProfile.isPending}>
            {createProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Link2 className="w-4 h-4 ml-1" />}
            إنشاء ملف عام
          </Button>
        </CardContent>
      </Card>
    );
  }

  const toggleItems: { key: keyof ProfileSettings; label: string; description: string; icon: any }[] = [
    { key: 'show_basic_info', label: 'المعلومات الأساسية', description: 'الاسم، النشاط، الشعار، النبذة', icon: Building2 },
    { key: 'show_contact_info', label: 'بيانات التواصل', description: 'الهاتف، البريد، العنوان، الموقع', icon: Phone },
    { key: 'show_licenses', label: 'التراخيص والسجلات', description: 'السجل التجاري، الترخيص البيئي، الضريبية', icon: Shield },
    { key: 'show_team', label: 'فريق العمل', description: 'قائمة الموظفين النشطين', icon: Users },
    { key: 'show_team_details', label: 'تفاصيل الفريق', description: 'المنصب والقسم لكل موظف', icon: FileText },
    { key: 'show_team_documents', label: 'مستندات الفريق', description: 'الشهادات والمستندات القانونية', icon: FileText },
    { key: 'show_statistics', label: 'الإحصائيات', description: 'أرقام عامة عن العمليات', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Share Link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4" /> رابط المشاركة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="active">تفعيل الرابط</Label>
              <Switch
                id="active"
                checked={settings.is_active}
                onCheckedChange={(v) => updateProfile.mutate({ is_active: v })}
              />
            </div>
            <Badge variant={settings.is_active ? 'default' : 'secondary'}>
              {settings.is_active ? 'مفعّل' : 'معطّل'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Input value={shareUrl} readOnly dir="ltr" className="text-xs bg-muted/30" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="outline" asChild>
              <a href={shareUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4" /> صلاحيات العرض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {toggleItems.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={settings[key] as boolean}
                onCheckedChange={(v) => updateProfile.mutate({ [key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">رسالة ترحيبية</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="أضف رسالة تظهر في أعلى الملف العام..."
            defaultValue={settings.custom_message || ''}
            onBlur={(e) => updateProfile.mutate({ custom_message: e.target.value || null })}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
