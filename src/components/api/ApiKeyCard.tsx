import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Key, Trash2, Activity, Clock, Shield } from 'lucide-react';
import { ApiKey, useApiKeys } from '@/hooks/useApiKeys';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ApiKeyCardProps {
  apiKey: ApiKey;
}

const SCOPE_LABELS: Record<string, string> = {
  'all': 'كامل',
  'shipments:read': 'شحنات ➡',
  'shipments:write': 'شحنات ⬅',
  'accounts:read': 'حسابات ➡',
  'accounts:write': 'حسابات ⬅',
  'reports:read': 'تقارير',
  'organizations:read': 'منشأة',
};

export function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  const { updateApiKey, deleteApiKey } = useApiKeys();
  const [isActive, setIsActive] = useState(apiKey.is_active);

  const handleToggleActive = async () => {
    const newValue = !isActive;
    setIsActive(newValue);
    await updateApiKey.mutateAsync({ id: apiKey.id, isActive: newValue });
  };

  const handleDelete = async () => {
    await deleteApiKey.mutateAsync(apiKey.id);
  };

  const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date();

  return (
    <Card className={`transition-all ${!isActive || isExpired ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isActive && !isExpired ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{apiKey.name}</h3>
                {isExpired && (
                  <Badge variant="destructive" className="text-xs">منتهي</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono">{apiKey.key_prefix}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={updateApiKey.isPending}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف مفتاح API</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف هذا المفتاح؟ سيتوقف أي تكامل يستخدم هذا المفتاح عن العمل فوراً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <div className="flex gap-1">
              {apiKey.scopes.map((scope) => (
                <Badge key={scope} variant="secondary" className="text-xs">
                  {SCOPE_LABELS[scope] || scope}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{apiKey.rate_limit_per_minute} طلب/دقيقة</span>
          </div>

          {apiKey.last_used_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                آخر استخدام: {formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
          )}

          {apiKey.expires_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {isExpired ? 'انتهى في' : 'ينتهي في'}: {format(new Date(apiKey.expires_at), 'yyyy/MM/dd', { locale: ar })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
