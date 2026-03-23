import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, Recycle, Truck, ShieldCheck, Car, UserCog, Shield,
  Loader2, ChevronDown, ChevronUp, Building2, Briefcase, Award,
  ClipboardCheck, Users, Landmark, Leaf, HardHat, User, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEMO_PASSWORD = 'Demo@575757';
const ACCESS_PIN_HASH = '575757';
const SESSION_WAIT_MS = 5000;
const SESSION_POLL_MS = 250;

interface DemoAccount {
  email: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
}

const accountGroups: { id: string; label: string; icon: any; hint?: string; accounts: DemoAccount[] }[] = [
  {
    id: 'abdullah',
    label: 'عبدالله',
    icon: Users,
    accounts: [
      { email: 'abdullah-generator@irecycle.test', label: 'عبدالله المولد', desc: 'جهة توليد', icon: Factory, color: 'from-orange-500 to-amber-700' },
      { email: 'abdullah-transporter@irecycle.test', label: 'عبدالله الناقل', desc: 'جهة نقل', icon: Truck, color: 'from-blue-500 to-indigo-700' },
      { email: 'abdullah-recycler@irecycle.test', label: 'عبدالله المدور', desc: 'جهة تدوير', icon: Recycle, color: 'from-green-500 to-emerald-700' },
      { email: 'abdullah-driver@irecycle.test', label: 'عبدالله السائق', desc: 'سائق ⚡ كيان مستقل', icon: Car, color: 'from-pink-500 to-rose-700' },
      { email: 'abdullah.abdelnasser@irecycle.test', label: 'عبدالله عبدالناصر', desc: 'إدارة → جهة عبدالله الناقل', icon: Shield, color: 'from-indigo-500 to-violet-700' },
    ],
  },
  {
    id: 'operators',
    label: 'الجهات',
    icon: Building2,
    hint: 'المنظمات التشغيلية',
    accounts: [
      { email: 'generator@demo.com', label: 'شركة التوليد', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
      { email: 'demo-generator@irecycle.test', label: 'المولد التجريبية', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
      { email: 'generator2@demo.com', label: 'الصناعات البلاستيكية', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
      { email: 'transporter@demo.com', label: 'النقل السريع', desc: 'ناقل', icon: Truck, color: 'from-primary to-emerald-600' },
      { email: 'demo-transporter@irecycle.test', label: 'النقل التجريبية', desc: 'ناقل', icon: Truck, color: 'from-primary to-emerald-600' },
      { email: 'demo-transport-office@irecycle.test', label: 'مكتب النقل', desc: 'مكتب نقل', icon: Building2, color: 'from-sky-500 to-blue-700' },
      { email: 'recycler@demo.com', label: 'التدوير الخضراء', desc: 'مدور', icon: Recycle, color: 'from-cyan-500 to-blue-600' },
      { email: 'demo-recycler@irecycle.test', label: 'التدوير التجريبية', desc: 'مدور', icon: Recycle, color: 'from-cyan-500 to-blue-600' },
      { email: 'disposal@demo.com', label: 'الأمان للتخلص', desc: 'تخلص آمن', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
      { email: 'demo-disposal@irecycle.test', label: 'التخلص التجريبية', desc: 'تخلص آمن', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
      { email: 'municipal@irecycle.test', label: 'النظافة المتحدة', desc: 'مقاول بلدي 🏗️', icon: HardHat, color: 'from-lime-600 to-green-800' },
    ],
  },
  {
    id: 'transporter-leadership',
    label: 'إدارة الناقل',
    icon: Shield,
    hint: 'الهيكل الإداري لجهة النقل',
    accounts: [
      { email: 'ceo@transporter.demo', label: 'أحمد محمد السيد', desc: 'الرئيس التنفيذي 👑', icon: Shield, color: 'from-amber-500 to-yellow-700' },
      { email: 'deputy@transporter.demo', label: 'محمود عبدالرحمن', desc: 'نائب المدير العام ⭐', icon: Shield, color: 'from-amber-400 to-orange-600' },
      { email: 'strategy@transporter.demo', label: 'خالد إبراهيم', desc: 'التخطيط الاستراتيجي', icon: Briefcase, color: 'from-indigo-500 to-purple-700' },
      { email: 'operations@transporter.demo', label: 'عمرو حسين', desc: 'مدير العمليات 🔧', icon: UserCog, color: 'from-blue-600 to-indigo-800' },
      { email: 'fleet@transporter.demo', label: 'مصطفى عادل', desc: 'مدير الأسطول 🚛', icon: Truck, color: 'from-sky-500 to-blue-700' },
      { email: 'finance@transporter.demo', label: 'ماجد فؤاد', desc: 'مدير المالية 💰', icon: Landmark, color: 'from-emerald-500 to-green-700' },
      { email: 'sales@transporter.demo', label: 'سامح وليد', desc: 'مدير المبيعات 📈', icon: Building2, color: 'from-orange-500 to-red-600' },
      { email: 'hr@transporter.demo', label: 'شريف كمال', desc: 'مدير الموارد البشرية 👥', icon: Users, color: 'from-violet-500 to-purple-700' },
      { email: 'it@transporter.demo', label: 'أحمد هشام', desc: 'مدير IT 💻', icon: UserCog, color: 'from-cyan-500 to-teal-700' },
      { email: 'compliance@transporter.demo', label: 'هاني وجيه', desc: 'مدير الامتثال 🛡️', icon: ShieldCheck, color: 'from-red-500 to-rose-700' },
      { email: 'cs@transporter.demo', label: 'منى إبراهيم', desc: 'مدير خدمة العملاء 📞', icon: Users, color: 'from-teal-400 to-cyan-600' },
    ],
  },
  {
    id: 'transporter-members',
    label: 'أعضاء الناقل',
    icon: User,
    hint: 'يُوجَّهون لمساحة العمل الشخصية',
    accounts: [
      { email: 'assistant@transporter.demo', label: 'سارة أحمد', desc: 'مساعد تنفيذي → مساحة العمل', icon: ClipboardCheck, color: 'from-pink-400 to-rose-600' },
      { email: 'fleet.supervisor@transporter.demo', label: 'حسام فاروق', desc: 'مشرف الحركة → مساحة العمل', icon: Truck, color: 'from-blue-400 to-sky-600' },
      { email: 'dispatch@transporter.demo', label: 'ياسر محمد', desc: 'مسؤول الجدولة → مساحة العمل', icon: ClipboardCheck, color: 'from-blue-400 to-indigo-600' },
      { email: 'accountant@transporter.demo', label: 'رشا عبدالناصر', desc: 'المحاسب → مساحة العمل', icon: Landmark, color: 'from-green-400 to-emerald-600' },
      { email: 'driver.head@transporter.demo', label: 'عبدالله سامي', desc: 'رئيس السائقين → مساحة العمل', icon: Car, color: 'from-rose-400 to-pink-600' },
      { email: 'safety@transporter.demo', label: 'كريم طاهر', desc: 'أخصائي السلامة → مساحة العمل', icon: ShieldCheck, color: 'from-red-400 to-orange-600' },
      { email: 'callcenter@transporter.demo', label: 'هبة سعيد', desc: 'قائد مركز الاتصال → مساحة العمل', icon: Users, color: 'from-teal-400 to-green-600' },
      { email: 'analyst@transporter.demo', label: 'نورهان محمد', desc: 'محلل البيانات → مساحة العمل', icon: ClipboardCheck, color: 'from-purple-400 to-indigo-600' },
      { email: 'maintenance@transporter.demo', label: 'محمد جمال', desc: 'مشرف الصيانة → مساحة العمل', icon: HardHat, color: 'from-amber-400 to-yellow-600' },
    ],
  },
  {
    id: 'drivers',
    label: 'السائقون',
    icon: Car,
    hint: 'كيان مستقل — المؤجر يعمل برابط مؤقت فقط بدون حساب',
    accounts: [
      { email: 'company-driver@irecycle.test', label: 'سائق تابع', desc: 'موظف دائم بحساب كامل — صلاحيات تشغيلية 🏢', icon: Truck, color: 'from-blue-500 to-indigo-700' },
      { email: 'independent-driver@irecycle.test', label: 'سائق مستقل', desc: 'نموذج Uber — سوق شحنات + محفظة + تحليلات 🟢', icon: Zap, color: 'from-emerald-500 to-green-700' },
      { email: 'demo-driver@irecycle.test', label: 'سائق التوحيد', desc: 'سائق تابع لجهة التوحيد 🏢', icon: Car, color: 'from-rose-500 to-red-600' },
      { email: 'driver@demo.com', label: 'سائق النقل السريع', desc: 'سائق تابع لجهة النقل السريع 🏢', icon: Car, color: 'from-rose-500 to-red-600' },
      { email: 'abdullah-driver@irecycle.test', label: 'عبدالله السائق', desc: 'سائق تابع لجهة عبدالله 🏢', icon: Car, color: 'from-pink-500 to-rose-700' },
    ],
  },
  {
    id: 'consultants',
    label: 'استشاريون',
    icon: Briefcase,
    accounts: [
      { email: 'demo-consultant@irecycle.test', label: 'الاستشارات البيئية', desc: 'استشاري بيئي', icon: Briefcase, color: 'from-teal-500 to-teal-700' },
      { email: 'demo-consulting-office@irecycle.test', label: 'المكتب الاستشاري', desc: 'مكتب استشاري', icon: ClipboardCheck, color: 'from-indigo-500 to-indigo-700' },
      { email: 'demo-iso-body@irecycle.test', label: 'جهة الأيزو', desc: 'جهة مانحة', icon: Award, color: 'from-emerald-600 to-green-800' },
    ],
  },
  {
    id: 'regulators',
    label: 'رقابة',
    icon: Landmark,
    hint: 'الجهات الحكومية الرقابية',
    accounts: [
      { email: 'wmra@irecycle.demo', label: 'WMRA', desc: 'تنظيم المخلفات', icon: Shield, color: 'from-red-600 to-red-800' },
      { email: 'eeaa@irecycle.demo', label: 'EEAA', desc: 'شؤون البيئة', icon: Leaf, color: 'from-green-600 to-green-800' },
      { email: 'ltra@irecycle.demo', label: 'LTRA', desc: 'تنظيم النقل', icon: Truck, color: 'from-blue-600 to-blue-800' },
      { email: 'ida@irecycle.demo', label: 'IDA', desc: 'التنمية الصناعية', icon: HardHat, color: 'from-amber-600 to-amber-800' },
    ],
  },
  {
    id: 'staff',
    label: 'النظام',
    icon: UserCog,
    accounts: [
      { email: 'altawheedco.co@gmail.com', label: 'مدير النظام', desc: 'Admin سيادي', icon: Shield, color: 'from-yellow-500 to-amber-700' },
      { email: 'demo-employee@irecycle.test', label: 'موظف - التوحيد', desc: 'موظف → مساحة العمل', icon: UserCog, color: 'from-slate-500 to-slate-700' },
    ],
  },
];

interface DemoQuickLoginProps {
  onLoginStart?: () => void;
  onLoginEnd?: () => void;
}

const DemoQuickLogin = ({ onLoginStart, onLoginEnd }: DemoQuickLoginProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const waitForSession = async (email: string) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < SESSION_WAIT_MS) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email?.toLowerCase() === email.toLowerCase()) return true;
      await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_MS));
    }
    return false;
  };

  const handleQuickLogin = async (email: string, label: string) => {
    setLoading(email);
    onLoginStart?.();
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      const { error } = await signIn(email, DEMO_PASSWORD);
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast({ title: 'بيانات الدخول غير صحيحة', description: 'تأكد من أن الحساب مفعل', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }
      const sessionReady = await waitForSession(email);
      if (!sessionReady) throw new Error('تم تسجيل الدخول لكن الجلسة لم تكتمل بعد، حاول مرة أخرى خلال ثوانٍ.');
      toast({ title: 'تم الدخول ✅', description: `تم الدخول كـ ${label}` });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
      onLoginEnd?.();
    }
  };

  const verifyPin = () => {
    if (pinInput === ACCESS_PIN_HASH) {
      setPinVerified(true);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2"
      >
        <span>🔑 الدخول السريع</span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">v5.1</Badge>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {!pinVerified ? (
              <div className="pt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="أدخل رمز الدخول"
                    value={pinInput}
                    onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') verifyPin(); }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border ${pinError ? 'border-destructive' : 'border-border'} bg-background text-center`}
                    dir="ltr"
                  />
                  <Button type="button" size="sm" onClick={verifyPin}>دخول</Button>
                </div>
                {pinError && <p className="text-xs text-destructive text-center">رمز الدخول غير صحيح</p>}
              </div>
            ) : (
              <div className="pt-3 space-y-2">
                <Tabs defaultValue="abdullah" dir="rtl">
                  <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
                    {accountGroups.map(g => (
                      <TabsTrigger key={g.id} value={g.id} className="text-[11px] gap-1 px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                        <g.icon className="w-3 h-3" />
                        {g.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {accountGroups.map(group => (
                    <TabsContent key={group.id} value={group.id} className="mt-2">
                      {group.hint && (
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                            {group.id === 'drivers' ? <Zap className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                            {group.hint}
                          </Badge>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                        {group.accounts.map((account, i) => (
                          <motion.button
                            key={account.email}
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleQuickLogin(account.email, account.label)}
                            disabled={loading !== null}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 hover:border-primary/40 bg-card/50 hover:bg-primary/5 transition-all disabled:opacity-50 text-right"
                          >
                            <div className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center shadow-sm`}>
                              {loading === account.email ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                <account.icon className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-foreground/90 truncate">{account.label}</p>
                              <p className="text-[9px] text-muted-foreground">{account.desc}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  كلمة المرور: <span dir="ltr" className="font-mono">Demo@575757</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemoQuickLogin;
