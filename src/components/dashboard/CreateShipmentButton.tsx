import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, X, Truck, Sparkles } from 'lucide-react';
import CreateShipmentForm from '@/components/shipments/CreateShipmentForm';
import { motion } from 'framer-motion';

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
                        أدخل بيانات الشحنة — جميع الحقول تحفظ تلقائياً
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/15">
                  <Sparkles className="w-3 h-3" />
                  حفظ تلقائي ذكي
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-medium border">
                  اكتب حرفين للاقتراحات
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4">
            <CreateShipmentForm 
              onClose={() => setIsOpen(false)} 
              onSuccess={handleSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateShipmentButton;
