import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldAlert, Clock } from 'lucide-react';

interface SharedPinGateProps {
  onSubmit: (pin: string) => void;
  error?: boolean;
  attemptsLeft?: number;
  locked?: boolean;
  remainingMinutes?: number;
}

const SharedPinGate = ({ onSubmit, error, attemptsLeft, locked, remainingMinutes }: SharedPinGateProps) => {
  const [pin, setPin] = useState('');

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-destructive">تم قفل الرابط مؤقتاً</h2>
            <p className="text-muted-foreground text-sm mt-1">
              تم تجاوز الحد الأقصى من المحاولات
            </p>
            {remainingMinutes && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>يُفتح بعد {remainingMinutes} دقيقة</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">محتوى محمي</h2>
          <p className="text-muted-foreground text-sm mt-1">أدخل الرقم السري للوصول</p>
        </div>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="الرقم السري"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className={`text-center text-lg tracking-widest ${error ? 'border-destructive' : ''}`}
            dir="ltr"
            onKeyDown={(e) => e.key === 'Enter' && pin && onSubmit(pin)}
          />
          {error && (
            <div className="space-y-1">
              <p className="text-destructive text-sm">رقم سري غير صحيح</p>
              {attemptsLeft !== undefined && attemptsLeft > 0 && (
                <p className="text-muted-foreground text-xs">
                  متبقي {attemptsLeft} محاولات
                </p>
              )}
            </div>
          )}
          <Button onClick={() => onSubmit(pin)} disabled={!pin} className="w-full">
            دخول
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedPinGate;
