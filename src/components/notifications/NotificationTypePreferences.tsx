/**
 * NotificationTypePreferences — تفضيلات الإشعارات لكل نوع
 * يسمح للمستخدم بكتم/تفعيل أنواع محددة من الإشعارات
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Search, BellOff, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { NOTIFICATION_CATEGORY_LABELS, type NotificationCategory } from '@/lib/notificationTypes';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'notification_type_prefs';

interface TypePrefs {
  mutedCategories: NotificationCategory[];
  mutedTypes: string[];
}

const defaultPrefs: TypePrefs = {
  mutedCategories: [],
  mutedTypes: [],
};

function loadPrefs(userId: string): TypePrefs {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(userId: string, prefs: TypePrefs) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(prefs));
  } catch {}
}

export function useNotificationTypePrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<TypePrefs>(defaultPrefs);

  useEffect(() => {
    if (user?.id) setPrefs(loadPrefs(user.id));
  }, [user?.id]);

  const isMuted = (type: string, category?: NotificationCategory): boolean => {
    if (category && prefs.mutedCategories.includes(category)) return true;
    return prefs.mutedTypes.includes(type);
  };

  return { prefs, isMuted };
}

const CATEGORY_ICONS: Record<string, string> = {
  shipments: '🚛',
  custody: '🔗',
  fleet: '📍',
  documents: '📄',
  certificates: '📜',
  finance: '💰',
  contracts: '📋',
  chat: '💬',
  broadcast: '📡',
  meetings: '📹',
  social: '📱',
  partners: '🤝',
  members: '👥',
  hr: '🏢',
  compliance: '✅',
  drivers: '🚗',
  environment: '🌿',
  work_orders: '📦',
  security: '🔒',
  ai: '🤖',
  identity: '🪪',
  disputes: '⚖️',
  marketplace: '🏪',
  system: '⚙️',
  emergency: '🚨',
};

const NotificationTypePreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<TypePrefs>(defaultPrefs);
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) setPrefs(loadPrefs(user.id));
  }, [user?.id]);

  const toggleCategory = (cat: NotificationCategory) => {
    setPrefs(prev => {
      const muted = prev.mutedCategories.includes(cat);
      return {
        ...prev,
        mutedCategories: muted
          ? prev.mutedCategories.filter(c => c !== cat)
          : [...prev.mutedCategories, cat],
      };
    });
  };

  const handleSave = () => {
    if (!user?.id) return;
    setSaving(true);
    savePrefs(user.id, prefs);
    setTimeout(() => {
      setSaving(false);
      toast.success('تم حفظ تفضيلات أنواع الإشعارات');
    }, 300);
  };

  const categories = Object.entries(NOTIFICATION_CATEGORY_LABELS) as [NotificationCategory, string][];
  const filteredCategories = search
    ? categories.filter(([, label]) => label.includes(search))
    : categories;

  const mutedCount = prefs.mutedCategories.length;

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="w-5 h-5 text-primary" />
            تفضيلات أنواع الإشعارات
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            اختر أنواع الإشعارات التي تريد استقبالها. كتم فئة يوقف جميع إشعاراتها.
          </p>
          {mutedCount > 0 && (
            <Badge variant="outline" className="w-fit bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
              {mutedCount} فئة مكتومة
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن فئة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 text-sm h-9"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredCategories.map(([cat, label]) => {
              const isMuted = prefs.mutedCategories.includes(cat);
              const icon = CATEGORY_ICONS[cat] || '🔔';

              return (
                <div
                  key={cat}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    isMuted
                      ? "bg-destructive/5 border-destructive/20 opacity-70"
                      : "bg-muted/30 border-border/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      {isMuted && (
                        <p className="text-[10px] text-destructive flex items-center gap-1">
                          <BellOff className="w-3 h-3" />
                          مكتومة
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={!isMuted}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        حفظ التفضيلات
      </Button>
    </div>
  );
};

export default NotificationTypePreferences;
