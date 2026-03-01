import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

interface SharedPinGateProps {
  onSubmit: (pin: string) => void;
  error?: boolean;
}

const SharedPinGate = ({ onSubmit, error }: SharedPinGateProps) => {
  const [pin, setPin] = useState('');

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
            type="text"
            placeholder="الرقم السري"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className={`text-center text-lg tracking-widest ${error ? 'border-destructive' : ''}`}
            dir="ltr"
          />
          {error && <p className="text-destructive text-sm">رقم سري غير صحيح</p>}
          <Button onClick={() => onSubmit(pin)} disabled={!pin} className="w-full">
            دخول
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedPinGate;
