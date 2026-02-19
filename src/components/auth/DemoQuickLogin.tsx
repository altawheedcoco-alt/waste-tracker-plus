import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Recycle, Truck, ShieldCheck, Car, UserCog, Shield, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const DEMO_PASSWORD = 'Demo@2026!';

const demoAccounts = [
  { email: 'demo-generator@irecycle.test', label: 'مولد مخلفات', desc: 'مصانع ومنشآت', icon: Factory, color: 'from-amber-500 to-orange-600' },
  { email: 'demo-recycler@irecycle.test', label: 'معيد تدوير', desc: 'مرافق إعادة التدوير', icon: Recycle, color: 'from-cyan-500 to-blue-600' },
  { email: 'demo-transporter@irecycle.test', label: 'ناقل مخلفات', desc: 'شركات نقل المخلفات', icon: Truck, color: 'from-primary to-emerald-600' },
  { email: 'demo-disposal@irecycle.test', label: 'جهة تخلص آمن', desc: 'مدافن ومحارق', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
  { email: 'demo-driver@irecycle.test', label: 'سائق', desc: 'سائقي المركبات', icon: Car, color: 'from-rose-500 to-red-600' },
  { email: 'demo-employee@irecycle.test', label: 'موظف', desc: 'موظفي الشركات', icon: UserCog, color: 'from-slate-500 to-slate-700' },
  { email: 'demo-admin@irecycle.test', label: 'مدير النظام', desc: 'إدارة كاملة', icon: Shield, color: 'from-yellow-500 to-amber-700' },
  { email: 'demo-consultant@irecycle.test', label: 'استشاري بيئي', desc: 'استشارات بيئية', icon: ShieldCheck, color: 'from-teal-500 to-teal-700' },
  { email: 'demo-consulting-office@irecycle.test', label: 'مكتب استشاري', desc: 'مكاتب استشارية', icon: Recycle, color: 'from-indigo-500 to-indigo-700' },
  { email: 'demo-iso-body@irecycle.test', label: 'جهة مانحة للأيزو', desc: 'شهادات الأيزو', icon: Shield, color: 'from-emerald-600 to-green-800' },
];

interface DemoQuickLoginProps {
  onLoginStart?: () => void;
  onLoginEnd?: () => void;
}

const DemoQuickLogin = ({ onLoginStart, onLoginEnd }: DemoQuickLoginProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [accountsReady, setAccountsReady] = useState<boolean | null>(null);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSeedAccounts = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-accounts');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'فشل إنشاء الحسابات');
      
      setAccountsReady(true);
      toast({
        title: 'تم إنشاء الحسابات التجريبية ✅',
        description: `${data.accounts?.length || 7} حسابات جاهزة للاستخدام`,
      });
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل إنشاء الحسابات التجريبية',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setLoading(email);
    onLoginStart?.();
    try {
      const { error } = await signIn(email, DEMO_PASSWORD);
      if (error) {
        // If login fails, accounts may not exist yet
        if (error.message?.includes('Invalid login credentials')) {
          toast({
            title: 'الحساب غير موجود',
            description: 'اضغط "تفعيل الحسابات التجريبية" أولاً لإنشاء الحسابات',
            variant: 'destructive',
          });
          setAccountsReady(false);
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'تم الدخول بنجاح ✅',
          description: `تم تسجيل الدخول كـ ${demoAccounts.find(a => a.email === email)?.label}`,
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
        <span>🧪 الدخول السريع التجريبي</span>
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
            <div className="pt-3 space-y-3">
              {/* Seed button */}
              {accountsReady !== true && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-dashed"
                  onClick={handleSeedAccounts}
                  disabled={seeding}
                >
                  {seeding ? (
                    <>
                      <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                      جاري إنشاء الحسابات...
                    </>
                  ) : (
                    '⚙️ تفعيل الحسابات التجريبية'
                  )}
                </Button>
              )}

              {/* Quick login grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((account, i) => (
                  <motion.button
                    key={account.email}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
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
                    <span className="text-[11px] font-medium text-foreground/80 leading-tight text-center">
                      {account.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                كلمة المرور: <span dir="ltr" className="font-mono">Demo@2026!</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemoQuickLogin;
