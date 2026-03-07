import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const checks = useMemo(() => [
    { label: '6 أحرف على الأقل', met: password.length >= 6 },
    { label: 'حرف كبير', met: /[A-Z]/.test(password) },
    { label: 'رقم', met: /[0-9]/.test(password) },
    { label: 'رمز خاص', met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const strength = checks.filter(c => c.met).length;
  const strengthLabel = strength <= 1 ? 'ضعيفة' : strength === 2 ? 'متوسطة' : strength === 3 ? 'جيدة' : 'قوية';
  const strengthColor = strength <= 1 ? 'bg-destructive' : strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-blue-500' : 'bg-primary';

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-2 mt-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColor : 'bg-muted'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength <= 1 ? 'text-destructive' : strength === 2 ? 'text-yellow-600' : 'text-primary'}`}>
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-1 text-[11px]">
            {check.met ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground/50" />
            )}
            <span className={check.met ? 'text-foreground/70' : 'text-muted-foreground/50'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PasswordStrengthMeter;
