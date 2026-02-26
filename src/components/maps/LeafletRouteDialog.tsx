import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Route } from 'lucide-react';
import MapDisabledPlaceholder from './MapDisabledPlaceholder';

interface LeafletRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber?: string;
  driverId?: string;
  shipmentStatus?: string;
}

const LeafletRouteDialog = ({ isOpen, onClose }: LeafletRouteDialogProps) => (
  <Dialog open={isOpen} onOpenChange={() => onClose()}>
    <DialogContent className="max-w-4xl h-[80vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />خريطة المسار
        </DialogTitle>
      </DialogHeader>
      <div className="flex-1 flex flex-col gap-4">
        <MapDisabledPlaceholder height="100%" />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default LeafletRouteDialog;
