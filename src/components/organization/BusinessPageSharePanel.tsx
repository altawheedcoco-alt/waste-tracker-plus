import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Share2, Copy, Check, ExternalLink, Link2, MessageCircle,
  Globe, Users, Loader2, Lock, Unlock, Eye,
} from 'lucide-react';
import { useShareLink } from '@/hooks/useShareLink';

interface BusinessPageSharePanelProps {
  organizationId: string;
  organizationName: string;
}

const BusinessPageSharePanel = ({ organizationId, organizationName }: BusinessPageSharePanelProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { createShareLink, loading: shareLoading } = useShareLink();
  const [copiedExternal, setCopiedExternal] = useState(false);
  const [copiedInternal, setCopiedInternal] = useState(false);
  const [internalUrl, setInternalUrl] = useState('');

  // Fetch public profile settings
  const { data: publicProfile, isLoading } = useQuery({
    queryKey: ['org-public-profile', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('org_public_profiles' as any)
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as any;
    },
    enabled: !!profile?.organization_id,
  });

  const createPublicProfile = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No org');
      const { error } = await supabase.from('org_public_profiles' as any).insert({
        organization_id: profile.organization_id,
        created_by: profile.user_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-public-profile', profile?.organization_id] });
      toast.success('تم تفعيل المشاركة الخارجية');
    },
    onError: () => toast.error('خطأ في التفعيل'),
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!publicProfile?.id) throw new Error('No profile');
      const { error } = await supabase
        .from('org_public_profiles' as any)
        .update({ is_active: isActive })
        .eq('id', publicProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-public-profile', profile?.organization_id] });
      toast.success('تم التحديث');
    },
  });

  const externalUrl = publicProfile?.share_code
    ? `${window.location.origin}/org-profile/${publicProfile.share_code}`
    : '';

  const handleCopyExternal = () => {
    navigator.clipboard.writeText(externalUrl);
    setCopiedExternal(true);
    toast.success('تم نسخ الرابط الخارجي');
    setTimeout(() => setCopiedExternal(false), 2000);
  };

  const handleCopyInternal = () => {
    navigator.clipboard.writeText(internalUrl);
    setCopiedInternal(true);
    toast.success('تم نسخ الرابط الداخلي');
    setTimeout(() => setCopiedInternal(false), 2000);
  };

  const handleCreateInternalLink = async () => {
    const result = await createShareLink({
      resourceType: 'organization',
      resourceId: organizationId,
      visibilityLevel: 'authenticated',
      title: organizationName,
    });
    if (result?.shareUrl) {
      setInternalUrl(result.shareUrl);
    }
  };

  const handleWhatsApp = (url: string) => {
    const text = encodeURIComponent(`${organizationName}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-5 h-5 text-primary" />
          مشاركة صفحة المنظمة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ═══ External Sharing (Public) ═══ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">رابط خارجي</p>
                <p className="text-xs text-muted-foreground">للجهات الخارجية - بدون تسجيل دخول</p>
              </div>
            </div>
            {publicProfile ? (
              <div className="flex items-center gap-2">
                <Badge variant={publicProfile.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {publicProfile.is_active ? 'مفعّل' : 'معطّل'}
                </Badge>
                <Switch
                  checked={publicProfile.is_active}
                  onCheckedChange={(v) => toggleActive.mutate(v)}
                />
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => createPublicProfile.mutate()}
                disabled={createPublicProfile.isPending}
                className="gap-1.5"
              >
                {createPublicProfile.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                تفعيل
              </Button>
            )}
          </div>

          {publicProfile?.is_active && externalUrl && (
            <div className="space-y-2 pr-6">
              <div className="flex gap-2">
                <Input value={externalUrl} readOnly dir="ltr" className="text-xs bg-muted/30 h-9" />
                <Button size="sm" variant="outline" onClick={handleCopyExternal} className="shrink-0 h-9 w-9 p-0">
                  {copiedExternal ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8" asChild>
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" /> معاينة
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8" onClick={() => handleWhatsApp(externalUrl)}>
                  <MessageCircle className="w-3 h-3" /> واتساب
                </Button>
                {typeof publicProfile?.view_count === 'number' && (
                  <Badge variant="outline" className="text-[10px] gap-1 mr-auto">
                    <Eye className="w-2.5 h-2.5" /> {publicProfile.view_count} مشاهدة
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ═══ Internal Sharing (Platform Users) ═══ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">رابط داخلي</p>
                <p className="text-xs text-muted-foreground">لمستخدمي المنصة - يتطلب تسجيل دخول</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateInternalLink}
              disabled={shareLoading}
              className="gap-1.5"
            >
              {shareLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              إنشاء رابط
            </Button>
          </div>

          {internalUrl && (
            <div className="space-y-2 pr-6">
              <div className="flex gap-2">
                <Input value={internalUrl} readOnly dir="ltr" className="text-xs bg-muted/30 h-9" />
                <Button size="sm" variant="outline" onClick={handleCopyInternal} className="shrink-0 h-9 w-9 p-0">
                  {copiedInternal ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8" onClick={() => handleWhatsApp(internalUrl)}>
                  <MessageCircle className="w-3 h-3" /> واتساب
                </Button>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Lock className="w-2.5 h-2.5" /> محمي بالتسجيل
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessPageSharePanel;
