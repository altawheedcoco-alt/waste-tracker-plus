import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Building2, Truck, User, Recycle, Users, Send, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Party {
  id?: string;
  name: string;
  type: 'generator' | 'transporter' | 'recycler' | 'driver';
}

interface ShipmentChatTabProps {
  shipment: {
    id: string;
    shipment_number?: string;
    generator?: { name: string; id?: string } | null;
    recycler?: { name: string; id?: string } | null;
    transporter?: { name: string; id?: string } | null;
    driver?: { profile?: { full_name?: string } } | null;
    driver_id?: string | null;
    generator_id?: string | null;
    transporter_id?: string | null;
    recycler_id?: string | null;
  };
  compact?: boolean;
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

const partyColors = {
  generator: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  transporter: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
  recycler: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  driver: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
};

const ShipmentChatTab = ({ shipment, compact = false }: ShipmentChatTabProps) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState(false);

  const parties: Party[] = [];
  // Only show parties that are NOT the current user's organization
  if (shipment.generator?.id && shipment.generator.id !== organization?.id) {
    parties.push({ id: shipment.generator.id, name: shipment.generator.name, type: 'generator' });
  }
  if (shipment.transporter?.id && shipment.transporter.id !== organization?.id) {
    parties.push({ id: shipment.transporter.id, name: shipment.transporter.name, type: 'transporter' });
  }
  if (shipment.recycler?.id && shipment.recycler.id !== organization?.id) {
    parties.push({ id: shipment.recycler.id, name: shipment.recycler.name, type: 'recycler' });
  }
  if (shipment.driver_id && shipment.driver?.profile?.full_name) {
    parties.push({ id: shipment.driver_id, name: shipment.driver.profile.full_name!, type: 'driver' });
  }

  const openDirectChat = useCallback((party: Party) => {
    if (party.id) {
      navigate(`/dashboard/chat?partner=${party.id}&ref=shipment&shipment=${shipment.id}`);
    }
  }, [navigate, shipment.id]);

  const togglePartySelection = useCallback((partyId: string) => {
    setSelectedParties(prev => {
      const next = new Set(prev);
      if (next.has(partyId)) next.delete(partyId);
      else next.add(partyId);
      return next;
    });
  }, []);

  const openGroupChat = useCallback(() => {
    if (selectedParties.size === 0) return;
    // For group chat, navigate with multiple partner IDs
    const partnerIds = Array.from(selectedParties).join(',');
    navigate(`/dashboard/chat?partners=${partnerIds}&ref=shipment&shipment=${shipment.id}&group=true`);
  }, [selectedParties, navigate, shipment.id]);

  const selectAll = useCallback(() => {
    const allIds = parties.filter(p => p.id).map(p => p.id!);
    setSelectedParties(new Set(allIds));
  }, [parties]);

  if (parties.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>لا توجد أطراف أخرى مرتبطة بهذه الشحنة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground text-right">
          {groupMode ? 'اختر الأطراف للمحادثة الجماعية' : 'محادثات مباشرة مع أطراف الشحنة'}
        </p>
        {parties.length > 1 && (
          <Button
            variant={groupMode ? 'default' : 'outline'}
            size="sm"
            className="text-[11px] h-7 gap-1.5 shrink-0"
            onClick={() => { setGroupMode(!groupMode); setSelectedParties(new Set()); }}
          >
            <Users className="w-3 h-3" />
            {groupMode ? 'إلغاء' : 'محادثة جماعية'}
          </Button>
        )}
      </div>

      {/* Group mode: select all button */}
      {groupMode && parties.length > 2 && (
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="sm" className="text-[11px] h-6 text-primary" onClick={selectAll}>
            تحديد الكل ({parties.length})
          </Button>
        </div>
      )}

      {/* Party list */}
      {parties.map((party) => {
        const Icon = partyIcons[party.type];
        const colorClass = partyColors[party.type];
        const isSelected = selectedParties.has(party.id!);
        
        return (
          <button
            key={`${party.type}-${party.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (groupMode) togglePartySelection(party.id!);
              else openDirectChat(party);
            }}
            className={cn(
              'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-right',
              groupMode && isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border/50 hover:bg-accent/50 hover:border-border',
            )}
          >
            {groupMode && (
              <Checkbox
                checked={isSelected}
                className="shrink-0"
                onCheckedChange={() => togglePartySelection(party.id!)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className={cn('text-xs border', colorClass)}>
                <Icon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{party.name}</p>
              <Badge variant="outline" className={cn('text-[10px] py-0 h-4 mt-0.5', colorClass)}>
                {partyLabels[party.type]}
              </Badge>
            </div>
            {!groupMode && (
              <div className="flex items-center gap-1 text-primary shrink-0">
                <MessageCircle className="w-4 h-4" />
                <span className="text-[10px]">محادثة</span>
              </div>
            )}
          </button>
        );
      })}

      {/* Group chat action */}
      {groupMode && selectedParties.size > 0 && (
        <Button 
          onClick={openGroupChat} 
          className="w-full gap-2 mt-2"
          size="sm"
        >
          <Send className="w-3.5 h-3.5" />
          بدء محادثة مع {selectedParties.size} {selectedParties.size > 1 ? 'أطراف' : 'طرف'}
        </Button>
      )}
    </div>
  );
};

export default ShipmentChatTab;
