import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Building2, Truck, Recycle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (data: { name: string; description?: string; memberUserIds: string[] }) => void;
  isCreating: boolean;
}

interface AvailableUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  organization_id: string;
  organization_name: string;
  organization_type: string;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreateGroup, isCreating }: CreateGroupDialogProps) => {
  const { user, organization } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && organization) {
      fetchAvailableUsers();
    }
  }, [open, organization]);

  const fetchAvailableUsers = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      // Get partner org IDs from shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      const partnerIds = new Set<string>();
      shipments?.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id].forEach(id => {
          if (id && id !== organization.id) partnerIds.add(id);
        });
      });

      if (partnerIds.size === 0) { setLoading(false); return; }

      // Get profiles from partner orgs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .in('organization_id', Array.from(partnerIds))
        .eq('is_active', true);

      // Get org names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', Array.from(partnerIds));

      const orgMap = new Map(orgs?.map(o => [o.id, o]) || []);

      setAvailableUsers(
        (profiles || []).map(p => ({
          ...p,
          organization_name: orgMap.get(p.organization_id)?.name || '',
          organization_type: orgMap.get(p.organization_id)?.organization_type || '',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreate = () => {
    onCreateGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      memberUserIds: Array.from(selectedUsers),
    });
    // Reset
    setStep(1);
    setName('');
    setDescription('');
    setSelectedUsers(new Set());
  };

  const filteredUsers = availableUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.organization_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'generator': return <Building2 className="w-3 h-3" />;
      case 'transporter': return <Truck className="w-3 h-3" />;
      case 'recycler': return <Recycle className="w-3 h-3" />;
      default: return <Building2 className="w-3 h-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {step === 1 ? 'إنشاء مجموعة جديدة' : 'إضافة أعضاء'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
              </div>
              <Input
                placeholder="اسم المجموعة *"
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-center text-lg font-semibold"
              />
              <Textarea
                placeholder="وصف المجموعة (اختياري)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
              <Button
                className="w-full"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
              >
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>

              {selectedUsers.size > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedUsers.size} عضو محدد
                </Badge>
              )}

              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              <ScrollArea className="h-[250px]">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u.user_id}
                        onClick={() => toggleUser(u.user_id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-right",
                          selectedUsers.has(u.user_id) ? "bg-primary/10" : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox checked={selectedUsers.has(u.user_id)} />
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getOrgIcon(u.organization_type)}
                            <span className="truncate">{u.organization_name}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && !loading && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        لا توجد جهات مرتبطة
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>

              <Button
                className="w-full"
                disabled={selectedUsers.size === 0 || isCreating}
                onClick={handleCreate}
              >
                {isCreating ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null}
                إنشاء المجموعة ({selectedUsers.size} عضو)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
