import { useAutoActions, AUTO_ACTION_KEYS, AUTO_ACTION_LABELS, AUTO_ACTION_GROUPS, AutoActionKey } from '@/hooks/useAutoActions';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap, ZapOff, FileText, Bell, Settings, Sparkles,
  Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_ICONS: Record<string, any> = {
  documents: FileText,
  notifications: Bell,
  operations: Settings,
  ai: Sparkles,
};

const AutoActionsPanel = () => {
  const { organization } = useAuth();
  const {
    settings, isLoading, toggleAction, toggleAll, toggleGroup, isUpdating
  } = useAutoActions(organization?.id);

  if (isLoading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!settings) return null;

  const allEnabled = settings.all_actions_enabled;
  const enabledCount = AUTO_ACTION_KEYS.filter(k => (settings as any)[k]).length;
  const totalCount = AUTO_ACTION_KEYS.length;

  const groupedActions = Object.entries(AUTO_ACTION_GROUPS).map(([groupKey, group]) => ({
    key: groupKey,
    ...group,
    actions: AUTO_ACTION_KEYS.filter(k => AUTO_ACTION_LABELS[k].group === groupKey),
    enabledCount: AUTO_ACTION_KEYS.filter(k => AUTO_ACTION_LABELS[k].group === groupKey && (settings as any)[k]).length,
    totalCount: AUTO_ACTION_KEYS.filter(k => AUTO_ACTION_LABELS[k].group === groupKey).length,
  }));

  return (
    <div className="space-y-4" dir="rtl">
      {/* Master Toggle */}
      <Card className={cn(
        "border-2 transition-all",
        allEnabled ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
      )}>
        <CardContent className="py-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allEnabled ? (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <ZapOff className="w-6 h-6 text-destructive" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">الإجراءات التلقائية</h2>
                <p className="text-sm text-muted-foreground">
                  {allEnabled
                    ? `مفعّلة — ${enabledCount} من ${totalCount} إجراء نشط`
                    : 'معطّلة بالكامل — لن يتم تنفيذ أي إجراء تلقائي'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={allEnabled ? 'default' : 'destructive'} className="text-xs">
                {allEnabled ? 'مفعّل' : 'معطّل'}
              </Badge>
              <Switch
                checked={allEnabled}
                onCheckedChange={(v) => toggleAll(v)}
                disabled={isUpdating}
                className="scale-125"
              />
            </div>
          </div>

          {!allEnabled && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>جميع الإجراءات التلقائية معطلة. لن يتم إصدار مستندات أو إرسال إشعارات أو تنفيذ عمليات آلية.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="border-muted">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 shrink-0 text-primary" />
            <span>الإعدادات محفوظة بشكل دائم لمنظمتك. لا تتأثر بتسجيل الخروج أو إغلاق المتصفح.</span>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      <div className="space-y-3">
        {groupedActions.map(group => {
          const GroupIcon = GROUP_ICONS[group.key] || Settings;
          const allGroupEnabled = group.enabledCount === group.totalCount;
          const someGroupEnabled = group.enabledCount > 0 && !allGroupEnabled;

          return (
            <Card key={group.key} className={cn(
              "transition-all",
              !allEnabled && "opacity-50 pointer-events-none"
            )}>
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GroupIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm font-bold">{group.ar}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {group.enabledCount}/{group.totalCount}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {allGroupEnabled ? 'الكل مفعّل' : someGroupEnabled ? 'جزئي' : 'معطّل'}
                    </span>
                    <Switch
                      checked={allGroupEnabled}
                      onCheckedChange={(v) => toggleGroup(group.key, v)}
                      disabled={isUpdating || !allEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="py-3 px-5">
                <div className="space-y-2">
                  {group.actions.map(actionKey => {
                    const label = AUTO_ACTION_LABELS[actionKey];
                    const enabled = (settings as any)[actionKey];
                    return (
                      <div key={actionKey} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          {enabled ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span className="text-sm">{label.ar}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleAction(actionKey)}
                          disabled={isUpdating || !allEnabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AutoActionsPanel;
