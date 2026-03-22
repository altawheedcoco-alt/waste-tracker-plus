import { useMemo, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle, Bell, FileCheck, ChevronDown, ChevronUp, Activity,
  Zap, Truck, EyeOff, Eye, Pause, Play
} from 'lucide-react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const OperationalAlertsWidget = lazy(() => import('@/components/dashboard/operations/OperationalAlertsWidget'));
const TransporterDeliveryApproval = lazy(() => import('@/components/receipts/TransporterDeliveryApproval'));

interface DashboardAlertsHubProps {
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  extraSections?: Array<{
    id: string;
    label: string;
    icon: typeof Bell;
    badge?: number;
    content: React.ReactNode;
  }>;
  notificationsComponent?: React.ReactNode;
  slaComponent?: React.ReactNode;
  incomingRequestsComponent?: React.ReactNode;
}

const TabFallback = () => <Skeleton className="h-32 w-full rounded-xl" />;

const PREF_KEY_HIDDEN = 'dashboard_alerts_hub_hidden';
const PREF_KEY_COLLAPSED = 'dashboard_alerts_hub_collapsed';
const PREF_KEY_ACTIVE_TAB = 'dashboard_alerts_hub_tab';
const PREF_KEY_AUTO_ROTATE = 'dashboard_alerts_hub_auto_rotate';

const AUTO_ROTATE_INTERVAL = 8000; // 8 seconds

const DashboardAlertsHub = ({
  orgType,
  extraSections = [],
  notificationsComponent,
  slaComponent,
  incomingRequestsComponent,
}: DashboardAlertsHubProps) => {
  const { getPref, setPref, togglePref } = useUserPreferences();

  const isHidden = getPref(PREF_KEY_HIDDEN, false);
  const isOpen = !getPref(PREF_KEY_COLLAPSED, false);
  const activeTab = getPref(PREF_KEY_ACTIVE_TAB, 'alerts');
  const isAutoRotate = getPref(PREF_KEY_AUTO_ROTATE, true);

  const showDeliveryApproval = orgType === 'transporter';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedByUser = useRef(false);

  const tabs = useMemo(() => {
    const t: Array<{ value: string; label: string; icon: typeof Bell }> = [
      { value: 'alerts', label: 'التنبيهات التشغيلية', icon: AlertTriangle },
    ];
    if (showDeliveryApproval) {
      t.push({ value: 'certificates', label: 'موافقات الشهادات', icon: FileCheck });
    }
    if (notificationsComponent) {
      t.push({ value: 'notifications', label: 'الإشعارات', icon: Bell });
    }
    if (slaComponent || incomingRequestsComponent) {
      t.push({ value: 'requests', label: 'الطلبات والأداء', icon: Truck });
    }
    extraSections.forEach(section => {
      t.push({ value: section.id, label: section.label, icon: section.icon });
    });
    return t;
  }, [showDeliveryApproval, notificationsComponent, slaComponent, incomingRequestsComponent, extraSections]);

  const rotateToNext = useCallback(() => {
    const currentIndex = tabs.findIndex(t => t.value === activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setPref(PREF_KEY_ACTIVE_TAB, tabs[nextIndex].value);
  }, [tabs, activeTab, setPref]);

  // Auto-rotate timer
  useEffect(() => {
    if (isAutoRotate && isOpen && tabs.length > 1 && !isPausedByUser.current) {
      timerRef.current = setInterval(rotateToNext, AUTO_ROTATE_INTERVAL);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoRotate, isOpen, tabs.length, rotateToNext]);

  const handleTabChange = (v: string) => {
    setPref(PREF_KEY_ACTIVE_TAB, v);
    // Pause auto-rotate temporarily when user manually selects a tab
    if (timerRef.current) clearInterval(timerRef.current);
    isPausedByUser.current = true;
    setTimeout(() => {
      isPausedByUser.current = false;
    }, AUTO_ROTATE_INTERVAL * 2); // Resume after 2 cycles
  };

  const toggleAutoRotate = () => {
    const newVal = !isAutoRotate;
    setPref(PREF_KEY_AUTO_ROTATE, newVal);
    if (!newVal && timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // If hidden, show minimal restore button
  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 border-dashed border-primary/30 text-muted-foreground hover:text-primary"
        onClick={() => setPref(PREF_KEY_HIDDEN, false)}
      >
        <Eye className="w-4 h-4" />
        إظهار مركز التنبيهات
      </Button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => setPref(PREF_KEY_COLLAPSED, !open)}>
      <Card className="border-primary/15 shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePref(PREF_KEY_HIDDEN);
                  }}
                  title="إخفاء مركز التنبيهات"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${isAutoRotate ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAutoRotate();
                  }}
                  title={isAutoRotate ? 'إيقاف التبديل التلقائي' : 'تشغيل التبديل التلقائي'}
                >
                  {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  مركز المراقبة والتنبيهات
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Zap className="w-3 h-3" />
                    تحديث لحظي
                  </Badge>
                  {isAutoRotate && (
                    <Badge variant="secondary" className="text-[10px] gap-1 animate-pulse">
                      تبديل تلقائي
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
              <TabsList className="w-full grid mb-3" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = tab.value === activeTab;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className={`text-xs gap-1.5 py-2 transition-all ${isActive && isAutoRotate ? 'ring-1 ring-primary/30' : ''}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Progress bar for auto-rotate */}
              {isAutoRotate && (
                <div className="h-0.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{
                      animation: `progress-fill ${AUTO_ROTATE_INTERVAL}ms linear infinite`,
                    }}
                  />
                </div>
              )}

              <TabsContent value="alerts">
                <ErrorBoundary fallbackTitle="خطأ في التنبيهات">
                  <Suspense fallback={<TabFallback />}>
                    <OperationalAlertsWidget />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              {showDeliveryApproval && (
                <TabsContent value="certificates">
                  <ErrorBoundary fallbackTitle="خطأ في موافقات الشهادات">
                    <Suspense fallback={<TabFallback />}>
                      <TransporterDeliveryApproval />
                    </Suspense>
                  </ErrorBoundary>
                </TabsContent>
              )}

              {notificationsComponent && (
                <TabsContent value="notifications">
                  <ErrorBoundary fallbackTitle="خطأ في الإشعارات">
                    {notificationsComponent}
                  </ErrorBoundary>
                </TabsContent>
              )}

              {(slaComponent || incomingRequestsComponent) && (
                <TabsContent value="requests">
                  <div className="space-y-4">
                    {slaComponent && (
                      <ErrorBoundary fallbackTitle="خطأ في تنبيهات SLA">
                        {slaComponent}
                      </ErrorBoundary>
                    )}
                    {incomingRequestsComponent && (
                      <ErrorBoundary fallbackTitle="خطأ في الطلبات الواردة">
                        {incomingRequestsComponent}
                      </ErrorBoundary>
                    )}
                  </div>
                </TabsContent>
              )}

              {extraSections.map(section => (
                <TabsContent key={section.id} value={section.id}>
                  <ErrorBoundary fallbackTitle={`خطأ في ${section.label}`}>
                    {section.content}
                  </ErrorBoundary>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </Collapsible>
  );
};

export default DashboardAlertsHub;
