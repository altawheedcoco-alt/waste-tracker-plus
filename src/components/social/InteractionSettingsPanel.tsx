import { memo, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Eye, MessageCircle, ThumbsUp, Shield } from 'lucide-react';
import { toast } from 'sonner';

const InteractionSettingsPanel = memo(() => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['interaction-settings', organization?.id],
    queryFn: async () => {
      if (!organization) return null;
      const { data, error } = await supabase
        .from('organization_interaction_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!organization) throw new Error('No org');
      const { error } = await supabase
        .from('organization_interaction_settings')
        .upsert({
          organization_id: organization.id,
          ...settings,
          ...updates,
        }, { onConflict: 'organization_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interaction-settings'] });
      toast.success('تم حفظ الإعدادات');
    },
  });

  const handleToggle = (key: string, value: boolean) => upsertSettings.mutate({ [key]: value });
  const handleSelect = (key: string, value: string) => upsertSettings.mutate({ [key]: value });

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5" />
          إعدادات التفاعل والخصوصية
        </CardTitle>
        <CardDescription>تحكم في كيفية تفاعل الآخرين مع منظمتك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Reactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            <Label>السماح بردود الفعل</Label>
          </div>
          <Switch
            checked={settings?.allow_reactions ?? true}
            onCheckedChange={(v) => handleToggle('allow_reactions', v)}
          />
        </div>

        {/* Comments */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <Label>السماح بالتعليقات</Label>
          </div>
          <Switch
            checked={settings?.allow_comments ?? true}
            onCheckedChange={(v) => handleToggle('allow_comments', v)}
          />
        </div>

        {/* Comments Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label>رؤية التعليقات</Label>
          </div>
          <Select
            value={settings?.comments_visibility ?? 'partners'}
            onValueChange={(v) => handleSelect('comments_visibility', v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">عام</SelectItem>
              <SelectItem value="partners">الشركاء فقط</SelectItem>
              <SelectItem value="private">خاص</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label>رؤية الملف التعريفي</Label>
          </div>
          <Select
            value={settings?.profile_visibility ?? 'public'}
            onValueChange={(v) => handleSelect('profile_visibility', v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">عام</SelectItem>
              <SelectItem value="partners">الشركاء فقط</SelectItem>
              <SelectItem value="private">خاص</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-hide flagged */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label>إخفاء التعليقات المبلّغ عنها تلقائياً</Label>
          </div>
          <Switch
            checked={settings?.auto_hide_flagged_comments ?? true}
            onCheckedChange={(v) => handleToggle('auto_hide_flagged_comments', v)}
          />
        </div>

        {/* Require approval */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label>موافقة مسبقة على التعليقات</Label>
          </div>
          <Switch
            checked={settings?.require_comment_approval ?? false}
            onCheckedChange={(v) => handleToggle('require_comment_approval', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
});

InteractionSettingsPanel.displayName = 'InteractionSettingsPanel';
export default InteractionSettingsPanel;
