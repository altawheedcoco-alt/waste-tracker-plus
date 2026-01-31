import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Bell,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  NotificationSoundType, 
  SOUND_LABELS,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  isSoundTypeEnabled,
  setSoundTypeEnabled,
  previewNotificationSound,
  resetSoundSettings
} from '@/hooks/useNotificationSound';
import { cn } from '@/lib/utils';

interface SoundConfig {
  type: NotificationSoundType;
  icon: typeof Bell;
  color: string;
  bgColor: string;
}

const soundConfigs: SoundConfig[] = [
  { 
    type: 'shipment_created', 
    icon: Package, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10' 
  },
  { 
    type: 'shipment_status', 
    icon: Truck, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10' 
  },
  { 
    type: 'shipment_approved', 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10' 
  },
  { 
    type: 'shipment_delivered', 
    icon: CheckCircle, 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/10' 
  },
  { 
    type: 'shipment_assigned', 
    icon: Send, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-500/10' 
  },
  { 
    type: 'recycling_report', 
    icon: ClipboardCheck, 
    color: 'text-teal-500', 
    bgColor: 'bg-teal-500/10' 
  },
  { 
    type: 'document_uploaded', 
    icon: FileText, 
    color: 'text-indigo-500', 
    bgColor: 'bg-indigo-500/10' 
  },
  { 
    type: 'approval_request', 
    icon: ClipboardCheck, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500/10' 
  },
  { 
    type: 'chat_message', 
    icon: MessageSquare, 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500/10' 
  },
  { 
    type: 'warning', 
    icon: AlertCircle, 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/10' 
  },
  { 
    type: 'default', 
    icon: Bell, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-500/10' 
  },
];

const NotificationSoundSettings = () => {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [soundSettings, setSoundSettings] = useState<Record<NotificationSoundType, boolean>>({} as any);
  const [playingSound, setPlayingSound] = useState<NotificationSoundType | null>(null);

  useEffect(() => {
    setMasterEnabled(isNotificationSoundEnabled());
    const settings: Record<NotificationSoundType, boolean> = {} as any;
    soundConfigs.forEach(config => {
      settings[config.type] = isSoundTypeEnabled(config.type);
    });
    setSoundSettings(settings);
  }, []);

  const handleMasterToggle = (enabled: boolean) => {
    setMasterEnabled(enabled);
    setNotificationSoundEnabled(enabled);
  };

  const handleSoundToggle = (type: NotificationSoundType, enabled: boolean) => {
    setSoundSettings(prev => ({ ...prev, [type]: enabled }));
    setSoundTypeEnabled(type, enabled);
  };

  const handlePreview = (type: NotificationSoundType) => {
    setPlayingSound(type);
    previewNotificationSound(type);
    setTimeout(() => setPlayingSound(null), 1000);
  };

  const handleReset = () => {
    resetSoundSettings();
    setMasterEnabled(true);
    const settings: Record<NotificationSoundType, boolean> = {} as any;
    soundConfigs.forEach(config => {
      settings[config.type] = true;
    });
    setSoundSettings(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          نغمات الإشعارات
        </CardTitle>
        <CardDescription>
          تخصيص نغمات مميزة لكل نوع من الإشعارات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            {masterEnabled ? (
              <Volume2 className="h-6 w-6 text-primary" />
            ) : (
              <VolumeX className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">تفعيل الأصوات</p>
              <p className="text-sm text-muted-foreground">
                {masterEnabled ? 'الأصوات مفعّلة لجميع الإشعارات' : 'الأصوات متوقفة'}
              </p>
            </div>
          </div>
          <Switch
            checked={masterEnabled}
            onCheckedChange={handleMasterToggle}
          />
        </div>

        {/* Individual Sound Settings */}
        <div className={cn(
          'space-y-3 transition-opacity',
          !masterEnabled && 'opacity-50 pointer-events-none'
        )}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">نغمات حسب نوع الإشعار</h4>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              إعادة تعيين
            </Button>
          </div>
          
          <div className="grid gap-2">
            {soundConfigs.map((config, index) => {
              const Icon = config.icon;
              const isEnabled = soundSettings[config.type] !== false;
              const isPlaying = playingSound === config.type;
              
              return (
                <motion.div
                  key={config.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    isEnabled ? 'bg-card' : 'bg-muted/30',
                    isPlaying && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      config.bgColor
                    )}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <span className="font-medium text-sm">{SOUND_LABELS[config.type]}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(config.type)}
                      disabled={!isEnabled}
                      className="h-8 w-8 p-0"
                    >
                      <motion.div
                        animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }}
                      >
                        <Play className={cn(
                          'h-4 w-4',
                          isPlaying ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </motion.div>
                    </Button>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(enabled) => handleSoundToggle(config.type, enabled)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSoundSettings;
