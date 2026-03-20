import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, X, Truck, Sparkles, Construction } from 'lucide-react';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface CreateShipmentButtonProps {
  variant?: 'default' | 'eco' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}

const CreateShipmentButton = ({ 
  variant = 'eco', 
  size = 'default',
  className = '',
  onSuccess 
}: CreateShipmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { organization } = useAuth();

  const isGenerator = organization?.organization_type === 'generator';

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Plus className="ml-2 h-4 w-4" />
        إنشاء شحنة
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0" dir="rtl">
          {/* Premium Header */}
          <div className="relative overflow-hidden bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-b">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
            <div className="relative p-6 pb-5">
              <div className="flex items-start justify-between">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full h-8 w-8 hover:bg-background/80">
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div>
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="text-xl font-bold tracking-tight">إنشاء شحنة جديدة</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        {isGenerator ? 'هذه الميزة قيد التطوير حالياً' : 'أدخل بيانات الشحنة — جميع الحقول تحفظ تلقائياً'}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border shadow-sm ${isGenerator ? 'bg-amber-500/10 border-amber-500/20' : 'bg-primary/10 border-primary/20'}`}>
                    {isGenerator ? <Construction className="h-6 w-6 text-amber-500" /> : <Truck className="h-6 w-6 text-primary" />}
                  </div>
                </div>
              </div>
              {!isGenerator && (
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/15">
                    <Sparkles className="w-3 h-3" />
                    حفظ تلقائي ذكي
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium border">
                    اكتب حرفين للاقتراحات
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 pt-4">
            {isGenerator ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Construction className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">قيد التطوير</h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  نعمل حالياً على تطوير وتحسين تجربة إنشاء الشحنات للجهات المولدة. ستكون متاحة قريباً بمزايا متقدمة.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium border border-amber-500/20">
                    <Construction className="w-3.5 h-3.5" />
                    تحت الإنشاء
                  </span>
                </div>
              </div>
            ) : (
              <CreateShipmentForm 
                onClose={() => setIsOpen(false)} 
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateShipmentButton;
