import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Copy, Eye, EyeOff, Loader2, UserPlus, Sparkles, LayoutDashboard, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Position } from '@/hooks/useOrgStructure';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';

interface Props {
  position: Position | null;
  open: boolean;
  onClose: () => void;
  onSave: (positionId: string, updates: Record<string, any>) => void;
  onRegisterMember?: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    memberRole: string;
    jobTitleAr: string;
    positionId: string;
    departmentId: string;
  }) => void;
  isSaving?: boolean;
}

const generateEmail = (titleEn: string, orgName: string): string => {
  const slug = titleEn
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
    .slice(0, 30);
  const orgSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${slug}.${orgSlug}${rand}@irecycle.app`;
};

const generatePassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

const getRoleFromLevel = (level: number): string => {
  if (level >= 4) return 'entity_head';
  if (level === 3) return 'assistant';
  if (level === 2) return 'agent';
  if (level === 1) return 'delegate';
  return 'member';
};

export default function PositionAssignDialog({ position, open, onClose, onSave, onRegisterMember, isSaving }: Props) {
  const { organization } = useAuth();
  const [operatorType, setOperatorType] = useState<'human' | 'ai'>('human');
  const [holderName, setHolderName] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [holderNationalId, setHolderNationalId] = useState('');
  const [autoEmail, setAutoEmail] = useState('');
  const [autoPassword, setAutoPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerAsMember, setRegisterAsMember] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'management' | 'workspace'>('workspace');

  useEffect(() => {
    if (position && open) {
      setOperatorType(position.operator_type || 'human');
      setHolderName(position.holder_name || '');
      setHolderPhone(position.holder_phone || '');
      setHolderNationalId(position.holder_national_id || '');
      setAutoEmail(position.auto_email || generateEmail(position.title, organization?.name || 'org'));
      setAutoPassword(generatePassword());
      setDashboardMode(position.dashboard_mode || (position.level >= 3 ? 'management' : 'workspace'));
    }
  }, [position, open, organization?.name]);

  const regenerateCredentials = () => {
    if (position) {
      setAutoEmail(generateEmail(position.title, organization?.name || 'org'));
      setAutoPassword(generatePassword());
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const handleSave = () => {
    if (!position) return;

    if (operatorType === 'human' && !holderName.trim()) {
      toast.error('يرجى إدخال اسم شاغل المنصب');
      return;
    }

    // Update position data
    onSave(position.id, {
      operator_type: operatorType,
      holder_name: operatorType === 'human' ? holderName : `🤖 AI - ${position.title_ar}`,
      holder_phone: operatorType === 'human' ? holderPhone : null,
      holder_national_id: operatorType === 'human' ? holderNationalId : null,
      auto_email: autoEmail,
      dashboard_mode: dashboardMode,
    });

    // Register as member if human + requested
    if (operatorType === 'human' && registerAsMember && onRegisterMember) {
      onRegisterMember({
        email: autoEmail,
        password: autoPassword,
        fullName: holderName,
        phone: holderPhone,
        memberRole: getRoleFromLevel(position.level),
        jobTitleAr: position.title_ar,
        positionId: position.id,
        departmentId: position.department_id,
      });
    }
  };

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {operatorType === 'ai' ? <Bot className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
            تعيين منصب: {position.title_ar}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Operator Type Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-muted/50 border">
            <button
              onClick={() => setOperatorType('human')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all flex-1 ${
                operatorType === 'human'
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-transparent hover:bg-muted'
              }`}
            >
              <User className="w-8 h-8" />
              <span className="font-semibold text-sm">شخص طبيعي</span>
              <span className="text-xs text-muted-foreground">موظف حقيقي</span>
            </button>
            <button
              onClick={() => setOperatorType('ai')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all flex-1 ${
                operatorType === 'ai'
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-transparent hover:bg-muted'
              }`}
            >
              <Bot className="w-8 h-8" />
              <span className="font-semibold text-sm">ذكاء اصطناعي</span>
              <span className="text-xs text-muted-foreground">يعمل تلقائياً</span>
            </button>
          </div>

          {operatorType === 'ai' ? (
            /* AI Section */
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">هذا المنصب سيُدار بالذكاء الاصطناعي</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم تنفيذ مهام "{position.title_ar}" تلقائياً بواسطة محرك AI المتكامل في المنصة.
                يشمل ذلك: معالجة الطلبات، الرد على الاستفسارات، وإعداد التقارير الدورية.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">⚡ استجابة فورية</Badge>
                <Badge variant="secondary">🔄 عمل 24/7</Badge>
                <Badge variant="secondary">📊 تقارير تلقائية</Badge>
              </div>
            </div>
          ) : (
            /* Human Section */
            <>
              <div className="space-y-3">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="أحمد محمد علي" />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input value={holderPhone} onChange={e => setHolderPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
                <div>
                  <Label>الرقم القومي</Label>
                  <Input value={holderNationalId} onChange={e => setHolderNationalId(e.target.value)} placeholder="xxxxxxxxxxxxxx" dir="ltr" maxLength={14} />
                </div>
              </div>

              <Separator />

              {/* Auto Credentials */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">بيانات الدخول المُقترحة</h4>
                  <Button variant="ghost" size="sm" onClick={regenerateCredentials}>
                    <Sparkles className="w-3 h-3 ml-1" /> توليد جديد
                  </Button>
                </div>

                <div>
                  <Label>البريد الإلكتروني</Label>
                  <div className="flex gap-1">
                    <Input value={autoEmail} onChange={e => setAutoEmail(e.target.value)} dir="ltr" className="text-xs font-mono" />
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(autoEmail, 'البريد')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>كلمة المرور المقترحة</Label>
                  <div className="flex gap-1">
                    <Input
                      value={autoPassword}
                      type={showPassword ? 'text' : 'password'}
                      readOnly
                      dir="ltr"
                      className="text-xs font-mono"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(autoPassword, 'كلمة المرور')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dashboard Mode Toggle */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  نوع الحساب عند الدخول
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDashboardMode('management')}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      dashboardMode === 'management'
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/50 hover:bg-muted/50'
                    }`}
                  >
                    <LayoutDashboard className="w-6 h-6" />
                    <span className="font-medium text-xs">حساب إدارة</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">يرى لوحة التحكم الكاملة للمنظمة</span>
                  </button>
                  <button
                    onClick={() => setDashboardMode('workspace')}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      dashboardMode === 'workspace'
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/50 hover:bg-muted/50'
                    }`}
                  >
                    <UserCircle className="w-6 h-6" />
                    <span className="font-medium text-xs">حساب عضو</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">يرى مساحة العمل الشخصية فقط</span>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Register as member toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">تسجيل كعضو في الجهة</p>
                    <p className="text-xs text-muted-foreground">إنشاء حساب وربطه بالمنصب تلقائياً</p>
                  </div>
                </div>
                <Switch checked={registerAsMember} onCheckedChange={setRegisterAsMember} />
              </div>

              {registerAsMember && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-1">
                  <p>• سيتم إنشاء حساب بالبريد وكلمة المرور أعلاه</p>
                  <p>• الدور: <Badge variant="outline" className="text-xs mx-1">{getRoleFromLevel(position.level)}</Badge></p>
                  <p>• الصلاحيات ستُحدد حسب المنصب والدور</p>
                </div>
              )}
            </>
          )}

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {operatorType === 'ai' ? '🤖 تعيين كمنصب AI' : '👤 تعيين الشخص وحفظ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
