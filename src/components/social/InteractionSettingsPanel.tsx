import { memo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Eye, MessageCircle, ThumbsUp, Shield, Lock, Users, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'عام', icon: Globe, desc: 'الجميع' },
  { value: 'partners', label: 'الشركاء', icon: Users, desc: 'الشركاء فقط' },
  { value: 'private', label: 'خاص', icon: Lock, desc: 'أنت فقط' },
];

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

  const settingsGroups = [
    {
      title: 'التفاعلات',
      items: [
        {
          key: 'allow_reactions',
          icon: ThumbsUp,
          label: 'السماح بردود الفعل',
          desc: 'يمكن للآخرين التفاعل مع منشوراتك',
          type: 'toggle' as const,
          value: settings?.allow_reactions ?? true,
        },
        {
          key: 'allow_comments',
          icon: MessageCircle,
          label: 'السماح بالتعليقات',
          desc: 'يمكن للآخرين التعليق على منشوراتك',
          type: 'toggle' as const,
          value: settings?.allow_comments ?? true,
        },
      ],
    },
    {
      title: 'الخصوصية',
      items: [
        {
          key: 'comments_visibility',
          icon: Eye,
          label: 'من يرى التعليقات',
          type: 'select' as const,
          value: settings?.comments_visibility ?? 'partners',
        },
        {
          key: 'profile_visibility',
          icon: Eye,
          label: 'من يرى الملف التعريفي',
          type: 'select' as const,
          value: settings?.profile_visibility ?? 'public',
        },
      ],
    },
    {
      title: 'الحماية',
      items: [
        {
          key: 'auto_hide_flagged_comments',
          icon: Shield,
          label: 'إخفاء التعليقات المبلّغ عنها',
          desc: 'إخفاء تلقائي حتى المراجعة',
          type: 'toggle' as const,
          value: settings?.auto_hide_flagged_comments ?? true,
        },
        {
          key: 'require_comment_approval',
          icon: Shield,
          label: 'موافقة مسبقة على التعليقات',
          desc: 'مراجعة التعليقات قبل نشرها',
          type: 'toggle' as const,
          value: settings?.require_comment_approval ?? false,
        },
      ],
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 bg-muted/30">
        <CardTitle className="flex items-center gap-2.5 text-lg">
          <div className="p-2 rounded-xl bg-primary/10">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          إعدادات التفاعل والخصوصية
        </CardTitle>
        <CardDescription className="text-sm">
          تحكم في كيفية تفاعل الآخرين مع بيانات منظمتك
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {settingsGroups.map((group, gi) => (
          <div key={group.title}>
            <div className="px-6 py-2.5 bg-muted/20 border-y border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</span>
            </div>
            <div className="divide-y divide-border/50">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * group.items.length + i) * 0.04 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium cursor-pointer">{item.label}</Label>
                        {'desc' in item && item.desc && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        )}
                      </div>
                    </div>

                    {item.type === 'toggle' ? (
                      <Switch
                        checked={item.value as boolean}
                        onCheckedChange={(v) => handleToggle(item.key, v)}
                      />
                    ) : (
                      <Select
                        value={item.value as string}
                        onValueChange={(v) => handleSelect(item.key, v)}
                      >
                        <SelectTrigger className="w-36 h-9 rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITY_OPTIONS.map(opt => {
                            const OptIcon = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <OptIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

InteractionSettingsPanel.displayName = 'InteractionSettingsPanel';
export default InteractionSettingsPanel;
