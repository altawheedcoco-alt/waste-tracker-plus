import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiKeys, ApiScope } from '@/hooks/useApiKeys';
import { Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCOPES: { value: ApiScope; label: string; description: string }[] = [
  { value: 'all', label: 'صلاحيات كاملة', description: 'جميع الصلاحيات' },
  { value: 'shipments:read', label: 'قراءة الشحنات', description: 'عرض الشحنات' },
  { value: 'shipments:write', label: 'كتابة الشحنات', description: 'إنشاء وتعديل الشحنات' },
  { value: 'accounts:read', label: 'قراءة الحسابات', description: 'عرض الفواتير والمدفوعات' },
  { value: 'accounts:write', label: 'كتابة الحسابات', description: 'إنشاء وتعديل الفواتير' },
  { value: 'reports:read', label: 'قراءة التقارير', description: 'استخراج التقارير والإحصائيات' },
  { value: 'organizations:read', label: 'قراءة المنشأة', description: 'عرض بيانات المنشأة' },
];

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const { createApiKey } = useApiKeys();
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(['shipments:read']);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [rateLimit, setRateLimit] = useState(60);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScopeChange = (scope: ApiScope, checked: boolean) => {
    if (scope === 'all') {
      setSelectedScopes(checked ? ['all'] : []);
    } else {
      const newScopes = checked
        ? [...selectedScopes.filter(s => s !== 'all'), scope]
        : selectedScopes.filter(s => s !== scope);
      setSelectedScopes(newScopes);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم للمفتاح');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error('يرجى اختيار صلاحية واحدة على الأقل');
      return;
    }

    let expiresAt: string | undefined;
    if (expiresIn !== 'never') {
      const days = parseInt(expiresIn);
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const result = await createApiKey.mutateAsync({
      name: name.trim(),
      scopes: selectedScopes,
      expiresAt,
      rateLimit,
    });

    setGeneratedKey(result.fullKey);
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('تم نسخ المفتاح');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedScopes(['shipments:read']);
    setExpiresIn('never');
    setRateLimit(60);
    setGeneratedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            إنشاء مفتاح API جديد
          </DialogTitle>
          <DialogDescription>
            أنشئ مفتاح للوصول إلى API المفتوح من الأنظمة الخارجية
          </DialogDescription>
        </DialogHeader>

        {generatedKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    احفظ هذا المفتاح الآن!
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    لن تتمكن من رؤية المفتاح مرة أخرى بعد إغلاق هذه النافذة
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={generatedKey}
                  readOnly
                  className="font-mono text-sm bg-white dark:bg-gray-900"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              تم، إغلاق
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المفتاح</Label>
              <Input
                placeholder="مثال: تكامل ERP"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-center gap-2">
                    <Checkbox
                      id={scope.value}
                      checked={selectedScopes.includes(scope.value)}
                      onCheckedChange={(checked) => handleScopeChange(scope.value, !!checked)}
                      disabled={scope.value !== 'all' && selectedScopes.includes('all')}
                    />
                    <label
                      htmlFor={scope.value}
                      className="text-sm cursor-pointer"
                      title={scope.description}
                    >
                      {scope.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مدة الصلاحية</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">بدون انتهاء</SelectItem>
                    <SelectItem value="30">30 يوم</SelectItem>
                    <SelectItem value="90">90 يوم</SelectItem>
                    <SelectItem value="365">سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الحد الأقصى (طلب/دقيقة)</Label>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                إلغاء
              </Button>
              <Button 
                onClick={handleCreate} 
                className="flex-1"
                disabled={createApiKey.isPending}
              >
                {createApiKey.isPending ? 'جاري الإنشاء...' : 'إنشاء المفتاح'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
