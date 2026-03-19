import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Volume2, Bell, Webhook, Database, Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationSoundSettings from '@/components/settings/NotificationSoundSettings';
import NotificationChannelsSettings from '@/components/settings/NotificationChannelsSettings';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';
import ChatAppearanceSettings from '@/components/settings/ChatAppearanceSettings';
import { ChatAppearanceProvider } from '@/contexts/ChatAppearanceContext';
import { Badge } from '@/components/ui/badge';

interface Props {
  orgType: string;
}

const IntegrationSettings = ({ orgType }: Props) => {
  return (
    <Tabs defaultValue="notifications" className="space-y-4">
      <div className="overflow-x-auto scrollbar-thin pb-1">
        <TabsList className="inline-flex w-max gap-0.5 h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/30">
          <TabsTrigger value="notifications" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="h-3.5 w-3.5" />الإشعارات
          </TabsTrigger>
          <TabsTrigger value="sounds" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Volume2 className="h-3.5 w-3.5" />الأصوات
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="h-3.5 w-3.5" />واتساب
          </TabsTrigger>
          <TabsTrigger value="chat-appearance" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="h-3.5 w-3.5" />مظهر الدردشة
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Webhook className="h-3.5 w-3.5" />API
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="notifications">
        <NotificationChannelsSettings />
      </TabsContent>

      <TabsContent value="sounds">
        <NotificationSoundSettings />
      </TabsContent>

      <TabsContent value="whatsapp">
        <WhatsAppNotificationManager />
      </TabsContent>

      <TabsContent value="chat-appearance">
        <ChatAppearanceProvider>
          <ChatAppearanceSettings />
        </ChatAppearanceProvider>
      </TabsContent>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              واجهة برمجة التطبيقات (API)
              <Badge variant="secondary" className="text-[10px]">قريباً</Badge>
            </CardTitle>
            <CardDescription className="text-xs">ربط الأنظمة الخارجية عبر API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-xl border border-dashed border-border/60 text-center space-y-3">
              <Database className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">ربط API متقدم</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  سيتوفر قريباً إمكانية ربط أنظمة ERP وCRM ومنظومات الطرف الثالث عبر RESTful API وWebhooks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default IntegrationSettings;
