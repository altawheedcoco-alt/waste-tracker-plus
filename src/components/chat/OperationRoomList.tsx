import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Truck, Recycle, User, MessageCircle, FileText, 
  MapPin, Package, Clock, Users, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOperationRooms, type OperationRoom } from '@/hooks/useOperationRooms';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OperationRoomListProps {
  onSelectRoom: (room: OperationRoom) => void;
}

const OperationRoomList = memo(({ onSelectRoom }: OperationRoomListProps) => {
  const { rooms, isLoading } = useOperationRooms();

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground text-xs">جاري تحميل غرف العمليات...</div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium mb-1">لا توجد غرف عمليات</p>
        <p className="text-[11px] text-muted-foreground">
          يتم إنشاء غرفة عمليات تلقائياً لكل شحنة جديدة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {rooms.map((room, i) => (
        <motion.button
          key={room.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelectRoom(room)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-medium truncate">{room.name}</p>
              {room.shipment_number && (
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">{room.shipment_number}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Users className="w-3 h-3" /> {room.participant_count} أطراف
              </span>
              {room.last_message_at && (
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(room.last_message_at), 'HH:mm', { locale: ar })}
                </span>
              )}
            </div>
            {room.last_message_preview && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {room.last_message_preview}
              </p>
            )}
          </div>
          <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </motion.button>
      ))}
    </div>
  );
});

OperationRoomList.displayName = 'OperationRoomList';
export default OperationRoomList;
