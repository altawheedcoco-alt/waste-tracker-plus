import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Trash2, GripVertical } from 'lucide-react';
import { usePermits } from '@/hooks/usePermits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const PermitSignatoryRolesManager = () => {
  const { signatoryRoles, seedDefaultRoles, addSignatoryRole } = usePermits();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const key = newTitle.trim().replace(/\s+/g, '_').toLowerCase();
    await addSignatoryRole.mutateAsync({ roleTitle: newTitle.trim(), roleKey: key });
    setNewTitle('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('permit_signatory_roles').delete().eq('id', id);
    if (error) {
      toast.error('فشل في الحذف');
    } else {
      toast.success('تم الحذف');
      queryClient.invalidateQueries({ queryKey: ['permit-signatory-roles'] });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">أدوار الموقعين على التصاريح</CardTitle>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => seedDefaultRoles.mutate()}>
            <Download className="w-3 h-3" />
            تحميل الافتراضي
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          حدد المسميات الوظيفية التي يمكنها التوقيع على التصاريح والأذونات. يمكنك تخصيص وإضافة أو إزالة أدوار حسب طبيعة نشاط منظمتك.
        </p>

        {/* Existing roles */}
        <div className="space-y-1">
          {signatoryRoles.map(role => (
            <div key={role.id} className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1">{role.role_title}</span>
              {role.is_required && <Badge variant="destructive" className="text-[9px]">إلزامي</Badge>}
              <Badge variant="outline" className="text-[9px] font-mono">{role.role_key}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(role.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="المسمى الوظيفي الجديد..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="text-sm"
          />
          <Button size="sm" className="gap-1" onClick={handleAdd} disabled={!newTitle.trim()}>
            <Plus className="w-3 h-3" />
            إضافة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermitSignatoryRolesManager;
