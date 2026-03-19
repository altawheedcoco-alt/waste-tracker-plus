import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Building2, Truck, User, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Party {
  id?: string;
  name: string;
  type: 'generator' | 'transporter' | 'recycler' | 'driver';
}

interface ShipmentChatTabProps {
  shipment: {
    id: string;
    shipment_number: string;
    generator?: { name: string; id?: string } | null;
    recycler?: { name: string; id?: string } | null;
    transporter?: { name: string; id?: string } | null;
    driver?: { profile?: { full_name: string } } | null;
    driver_id?: string | null;
  };
}

const partyIcons = {
  generator: Building2,
  transporter: Truck,
  recycler: Recycle,
  driver: User,
};

const partyLabels = {
  generator: 'المولّد',
  transporter: 'الناقل',
  recycler: 'المدوّر',
  driver: 'السائق',
};

const ShipmentChatTab = ({ shipment }: ShipmentChatTabProps) => {
  const navigate = useNavigate();

  const parties: Party[] = [];
  if (shipment.generator?.id) parties.push({ id: shipment.generator.id, name: shipment.generator.name, type: 'generator' });
  if (shipment.transporter?.id) parties.push({ id: shipment.transporter.id, name: shipment.transporter.name, type: 'transporter' });
  if (shipment.recycler?.id) parties.push({ id: shipment.recycler.id, name: shipment.recycler.name, type: 'recycler' });
  if (shipment.driver_id && shipment.driver?.profile?.full_name) {
    parties.push({ id: shipment.driver_id, name: shipment.driver.profile.full_name, type: 'driver' });
  }

  const openChat = (party: Party) => {
    if (party.id) {
      navigate(`/dashboard/chat?partner=${party.id}&ref=shipment&shipment=${shipment.id}`);
    }
  };

  if (parties.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>لا توجد أطراف مرتبطة بهذه الشحنة</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs text-muted-foreground text-right mb-2">محادثات مباشرة مع أطراف الشحنة</p>
      {parties.map((party) => {
        const Icon = partyIcons[party.type];
        return (
          <button
            key={`${party.type}-${party.id}`}
            onClick={(e) => { e.stopPropagation(); openChat(party); }}
            className={cn(
              'w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50',
              'hover:bg-accent/50 transition-colors text-right'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <Icon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{party.name}</p>
              <Badge variant="outline" className="text-[10px] py-0 h-4 mt-0.5">
                {partyLabels[party.type]}
              </Badge>
            </div>
            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
};

export default ShipmentChatTab;
