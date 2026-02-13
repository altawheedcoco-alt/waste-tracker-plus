import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Hand, Settings2, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface AutomationAuditTabProps {
  organizationId?: string | null;
}

const AutomationAuditTab = ({ organizationId }: AutomationAuditTabProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? ar : enUS;

  const { data: logs = [] } = useQuery({
    queryKey: ['automation-audit', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_automation_log')
        .select('*, rule:disposal_automation_rules(rule_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const modeStats = {
    ai: logs.filter((l: any) => l.execution_mode === 'ai').length,
    auto: logs.filter((l: any) => l.execution_mode === 'auto').length,
    hybrid: logs.filter((l: any) => l.execution_mode === 'hybrid').length,
    manual: logs.filter((l: any) => l.execution_mode === 'manual').length,
  };
  const total = logs.length || 1;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ai': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'auto': return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'hybrid': return <Settings2 className="w-4 h-4 text-blue-500" />;
      case 'manual': return <Hand className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'ai': return t('missionControl.aiMode');
      case 'auto': return t('missionControl.modeAuto');
      case 'hybrid': return t('missionControl.modeHybrid');
      case 'manual': return t('missionControl.modeManual');
      default: return mode;
    }
  };

  const getModeBadgeClass = (mode: string) => {
    switch (mode) {
      case 'ai': return 'bg-purple-500/10 text-purple-600';
      case 'auto': return 'bg-emerald-500/10 text-emerald-600';
      case 'hybrid': return 'bg-blue-500/10 text-blue-600';
      case 'manual': return 'bg-gray-500/10 text-gray-600';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Distribution */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { mode: 'ai', icon: Brain, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', count: modeStats.ai },
          { mode: 'auto', icon: Zap, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', count: modeStats.auto },
          { mode: 'hybrid', icon: Settings2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', count: modeStats.hybrid },
          { mode: 'manual', icon: Hand, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', count: modeStats.manual },
        ].map((item) => (
          <Card key={item.mode} className="p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <p className="text-xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground">{getModeLabel(item.mode)}</p>
                <p className="text-xs text-muted-foreground">({((item.count / total) * 100).toFixed(0)}%)</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {t('missionControl.automationAuditTrail')}
          </CardTitle>
          <CardDescription className="text-right">
            {t('missionControl.automationAuditDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('missionControl.noAutomationLogs')}</p>
              <p className="text-xs">{t('missionControl.noAutomationLogsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {log.human_approved === true && (
                      <Badge variant="outline" className="text-xs gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {t('missionControl.approved')}</Badge>
                    )}
                    {log.human_approved === false && (
                      <Badge variant="outline" className="text-xs gap-1 text-red-500">{t('missionControl.rejected')}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { locale: dateLocale, addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Badge className={`text-xs gap-1 ${getModeBadgeClass(log.execution_mode)}`}>
                        {getModeIcon(log.execution_mode)}
                        {getModeLabel(log.execution_mode)}
                      </Badge>
                      <span className="font-medium text-sm">{log.action_taken}</span>
                    </div>
                    {log.ai_suggestion && (
                      <p className="text-xs text-purple-600 dark:text-purple-400">💡 {t('missionControl.aiSuggestion')}: {log.ai_suggestion}</p>
                    )}
                    {log.rule?.rule_name && (
                      <p className="text-xs text-muted-foreground">📋 {t('missionControl.rule')}: {log.rule.rule_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationAuditTab;
