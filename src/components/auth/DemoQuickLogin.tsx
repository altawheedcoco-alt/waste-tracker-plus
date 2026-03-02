import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Recycle, Truck, ShieldCheck, Car, UserCog, Shield, Loader2, ChevronDown, ChevronUp, Building2, Briefcase, Award, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_PASSWORD = '57575757';
const ACCESS_PIN = '575757';

const allAccounts = [
  // مدير النظام
  { email: 'altawheedco.co@gmail.com', label: 'مدير النظام', desc: 'iRecycle Waste Management System', icon: Shield, color: 'from-yellow-500 to-amber-700' },
  // مولدات
  { email: 'generator@demo.com', label: 'شركة التوليد للنفايات', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
  { email: 'demo-generator@irecycle.test', label: 'شركة المولد التجريبية', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
  { email: 'generator2@demo.com', label: 'مصنع الصناعات البلاستيكية', desc: 'مولد', icon: Factory, color: 'from-amber-500 to-orange-600' },
  // ناقلات
  { email: 'transporter@demo.com', label: 'شركة النقل السريع', desc: 'ناقل', icon: Truck, color: 'from-primary to-emerald-600' },
  { email: 'demo-transport-office@irecycle.test', label: 'مكتب النقل التجريبي', desc: 'مكتب نقل', icon: Building2, color: 'from-sky-500 to-blue-700' },
  // معالجات
  { email: 'recycler@demo.com', label: 'شركة إعادة التدوير الخضراء', desc: 'معيد تدوير', icon: Recycle, color: 'from-cyan-500 to-blue-600' },
  { email: 'demo-recycler@irecycle.test', label: 'شركة التدوير التجريبية', desc: 'معيد تدوير', icon: Recycle, color: 'from-cyan-500 to-blue-600' },
  // تخلص آمن
  { email: 'disposal@demo.com', label: 'شركة الأمان للتخلص الآمن', desc: 'تخلص آمن', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
  { email: 'demo-disposal@irecycle.test', label: 'شركة التخلص الآمن التجريبية', desc: 'تخلص آمن', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
  // استشاريون
  { email: 'demo-consultant@irecycle.test', label: 'مكتب الاستشارات البيئية', desc: 'استشاري بيئي', icon: Briefcase, color: 'from-teal-500 to-teal-700' },
  { email: 'demo-consulting-office@irecycle.test', label: 'المكتب الاستشاري', desc: 'مكتب استشاري', icon: ClipboardCheck, color: 'from-indigo-500 to-indigo-700' },
  // أيزو
  { email: 'demo-iso-body@irecycle.test', label: 'جهة الأيزو', desc: 'جهة مانحة للأيزو', icon: Award, color: 'from-emerald-600 to-green-800' },
  // سائق وموظف
  { email: 'demo-driver@irecycle.test', label: 'سائق - التوحيد', desc: 'سائق مركبات', icon: Car, color: 'from-rose-500 to-red-600' },
  { email: 'driver@demo.com', label: 'سائق التوصيل - النقل السريع', desc: 'سائق مركبات', icon: Car, color: 'from-rose-500 to-red-600' },
  { email: 'demo-employee@irecycle.test', label: 'موظف - التوحيد', desc: 'موظف شركة', icon: UserCog, color: 'from-slate-500 to-slate-700' },
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
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleQuickLogin = async (email: string) => {
    setLoading(email);
    onLoginStart?.();
    try {
      const { error } = await signIn(email, DEMO_PASSWORD);
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast({
            title: 'بيانات الدخول غير صحيحة',
            description: 'تأكد من أن الحساب مفعل وكلمة المرور صحيحة',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        const account = allAccounts.find(a => a.email === email);
        toast({
          title: 'تم الدخول بنجاح ✅',
          description: `تم تسجيل الدخول كـ ${account?.label || email}`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'خطأ في الدخول',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
      onLoginEnd?.();
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
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (pinInput === ACCESS_PIN) {
                          setPinVerified(true);
                        } else {
                          setPinError(true);
                        }
                      }
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border ${pinError ? 'border-destructive' : 'border-border'} bg-background text-center`}
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (pinInput === ACCESS_PIN) {
                        setPinVerified(true);
                      } else {
                        setPinError(true);
                      }
                    }}
                  >
                    دخول
                  </Button>
                </div>
                {pinError && (
                  <p className="text-xs text-destructive text-center">رمز الدخول غير صحيح</p>
                )}
              </div>
            ) : (
              <div className="pt-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto">
                  {allAccounts.map((account, i) => (
                    <motion.button
                      key={account.email}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQuickLogin(account.email)}
                      disabled={loading !== null}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:border-primary/40 bg-card/50 hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center shadow-sm`}>
                        {loading === account.email ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <account.icon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-foreground/80 leading-tight text-center line-clamp-2">
                        {account.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {account.desc}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  كلمة المرور: <span dir="ltr" className="font-mono">57575757</span>
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
