import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import CreateShipment from '@/pages/dashboard/CreateShipment';

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
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-xl">إنشاء شحنة جديدة</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-6 pt-4">
            <CreateShipment 
              isModal={true} 
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
