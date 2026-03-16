import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Bot, User, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface MovementSupervisorEntry {
  supervisor_type: 'human' | 'ai';
  user_id?: string;
  supervisor_name?: string;
  supervisor_phone?: string;
  supervisor_email?: string;
  supervisor_position?: string;
  auto_sign_enabled?: boolean;
  auto_sign_method?: 'manual' | 'otp' | 'national_id' | 'digital_stamp' | 'full_auto';
}

interface OrgMember {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  role?: string;
}

interface Props {
  label: string;
  organizationId: string;
  partyRole: 'generator' | 'transporter' | 'recycler' | 'disposal';
  value: MovementSupervisorEntry[];
  onChange: (entries: MovementSupervisorEntry[]) => void;
}

const MovementSupervisorSelector = ({ label, organizationId, partyRole, value, onChange }: Props) => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [defaults, setDefaults] = useState<MovementSupervisorEntry[]>([]);
  const [loadedDefaults, setLoadedDefaults] = useState(false);

  // Fetch org members
  useEffect(() => {
    if (!organizationId || organizationId.startsWith('manual:')) return;
    supabase
      .from('profiles')
      .select('id, full_name, phone, email')
      .eq('organization_id', organizationId)
      .then(({ data }) => {
        if (data) setMembers(data as OrgMember[]);
      });
  }, [organizationId]);

  // Load org default supervisors
  useEffect(() => {
    if (!organizationId || organizationId.startsWith('manual:') || loadedDefaults) return;
    supabase
      .from('organization_movement_supervisors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data?.length && value.length === 0) {
          const entries: MovementSupervisorEntry[] = data.map(d => ({
            supervisor_type: d.supervisor_type as 'human' | 'ai',
            user_id: d.user_id || undefined,
            supervisor_name: d.supervisor_name || undefined,
            supervisor_phone: d.supervisor_phone || undefined,
            supervisor_email: d.supervisor_email || undefined,
            supervisor_position: d.supervisor_position || undefined,
          }));
          onChange(entries);
          setDefaults(entries);
        }
        setLoadedDefaults(true);
      });
  }, [organizationId, loadedDefaults]);

  const addEntry = () => {
    onChange([...value, { supervisor_type: 'human' }]);
  };

  const removeEntry = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, patch: Partial<MovementSupervisorEntry>) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], ...patch };
    // If selecting member, auto-fill name/phone
    if (patch.user_id) {
      const m = members.find(m => m.id === patch.user_id);
      if (m) {
        updated[idx].supervisor_name = m.full_name;
        updated[idx].supervisor_phone = m.phone || '';
        updated[idx].supervisor_email = m.email || '';
      }
    }
    onChange(updated);
  };

  if (!organizationId) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> إضافة
        </Button>
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> {label}
        </Label>
      </div>

      {value.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-right">
          سيتم تعيين مسئول الحركة تلقائياً من إعدادات الجهة عند الإنشاء
        </p>
      )}

      {value.map((entry, idx) => (
        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg border bg-muted/20">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-1" onClick={() => removeEntry(idx)}>
            <X className="h-3 w-3" />
          </Button>
          
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              {/* Type toggle */}
              <Select value={entry.supervisor_type} onValueChange={(v) => updateEntry(idx, { supervisor_type: v as 'human' | 'ai', user_id: undefined })}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> بشري</span>
                  </SelectItem>
                  <SelectItem value="ai">
                    <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> ذكاء اصطناعي</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Member select or manual */}
              {entry.supervisor_type === 'human' && members.length > 0 ? (
                <Select value={entry.user_id || '__manual__'} onValueChange={(v) => updateEntry(idx, { user_id: v === '__manual__' ? undefined : v })}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue placeholder="اختر عضواً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">إدخال يدوي</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {/* Manual fields */}
            {(!entry.user_id || entry.supervisor_type === 'ai') && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={entry.supervisor_name || ''}
                  onChange={(e) => updateEntry(idx, { supervisor_name: e.target.value })}
                  placeholder={entry.supervisor_type === 'ai' ? 'اسم وكيل AI' : 'الاسم'}
                  className="h-7 text-xs"
                />
                <Input
                  value={entry.supervisor_phone || ''}
                  onChange={(e) => updateEntry(idx, { supervisor_phone: e.target.value })}
                  placeholder="الهاتف"
                  className="h-7 text-xs"
                />
              </div>
            )}

            {entry.user_id && entry.supervisor_name && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] h-5">
                  {entry.supervisor_type === 'ai' ? <Bot className="h-2.5 w-2.5 ml-1" /> : <User className="h-2.5 w-2.5 ml-1" />}
                  {entry.supervisor_name}
                </Badge>
                {entry.supervisor_phone && <span>{entry.supervisor_phone}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovementSupervisorSelector;
