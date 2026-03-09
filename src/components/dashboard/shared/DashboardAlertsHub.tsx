import { useState, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle, Bell, FileCheck, ChevronDown, ChevronUp, Activity,
  Shield, Zap, Truck, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const OperationalAlertsWidget = lazy(() => import('@/components/dashboard/operations/OperationalAlertsWidget'));
const TransporterDeliveryApproval = lazy(() => import('@/components/receipts/TransporterDeliveryApproval'));

interface DashboardAlertsHubProps {
  /** Which org type: shows delivery approvals only for transporter */
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  /** Optional extra sections to render in additional tabs */
  extraSections?: Array<{
    id: string;
    label: string;
    icon: typeof Bell;
    badge?: number;
    content: React.ReactNode;
  }>;
  /** Notifications component (transporter-specific) */
  notificationsComponent?: React.ReactNode;
  /** SLA alerts (transporter-specific) */
  slaComponent?: React.ReactNode;
  /** Incoming requests component */
  incomingRequestsComponent?: React.ReactNode;
}

const TabFallback = () => <Skeleton className="h-32 w-full rounded-xl" />;

const DashboardAlertsHub = ({
  orgType,
  extraSections = [],
  notificationsComponent,
  slaComponent,
  incomingRequestsComponent,
}: DashboardAlertsHubProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  const showDeliveryApproval = orgType === 'transporter';

  // Build tabs dynamically
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/15 shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  مركز المراقبة والتنبيهات
                </CardTitle>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Zap className="w-3 h-3" />
                  تحديث لحظي
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <TabsList className={`w-full grid mb-3`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5 py-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Operational Alerts */}
              <TabsContent value="alerts">
                <ErrorBoundary fallbackTitle="خطأ في التنبيهات">
                  <Suspense fallback={<TabFallback />}>
                    <OperationalAlertsWidget />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              {/* Delivery Certificate Approvals */}
              {showDeliveryApproval && (
                <TabsContent value="certificates">
                  <ErrorBoundary fallbackTitle="خطأ في موافقات الشهادات">
                    <Suspense fallback={<TabFallback />}>
                      <TransporterDeliveryApproval />
                    </Suspense>
                  </ErrorBoundary>
                </TabsContent>
              )}

              {/* Notifications */}
              {notificationsComponent && (
                <TabsContent value="notifications">
                  <ErrorBoundary fallbackTitle="خطأ في الإشعارات">
                    {notificationsComponent}
                  </ErrorBoundary>
                </TabsContent>
              )}

              {/* Requests & SLA */}
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

              {/* Extra sections */}
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
    </Collapsible>
  );
};

export default DashboardAlertsHub;
