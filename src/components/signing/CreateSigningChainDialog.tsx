import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GitBranch, Plus, X, Loader2, Building2, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSigningChains } from '@/hooks/useSigningChains';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDocumentId?: string;
  defaultDocumentTitle?: string;
  defaultDocumentType?: string;
  defaultDocumentUrl?: string;
}

export default function CreateSigningChainDialog({
  open, onOpenChange,
  defaultDocumentId, defaultDocumentTitle, defaultDocumentType, defaultDocumentUrl,
}: Props) {
  const { profile } = useAuth();
  const { createChain } = useSigningChains();
  const orgId = profile?.organization_id;

  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle || '');
  const [documentType, setDocumentType] = useState(defaultDocumentType || 'general');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  // Fetch partners
  const { data: partners } = useQuery({
    queryKey: ['partner-orgs-chain', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const [vpF, vpR] = await Promise.all([
        supabase.from('verified_partnerships').select('partner_org_id').eq('requester_org_id', orgId).eq('status', 'active'),
        supabase.from('verified_partnerships').select('requester_org_id').eq('partner_org_id', orgId).eq('status', 'active'),
      ]);
      const ids = [
        ...(vpF.data || []).map((d: any) => d.partner_org_id),
        ...(vpR.data || []).map((d: any) => d.requester_org_id),
      ].filter(Boolean);
      if (!ids.length) return [];
      const { data } = await supabase.from('organizations').select('id, name, organization_type').in('id', [...new Set(ids)]).eq('is_active', true);
      return data || [];
    },
    enabled: !!orgId && open,
  });

  const handleSubmit = async () => {
    if (!documentTitle || selectedOrgs.length === 0) return;
    const signers = selectedOrgs.map(id => ({
      org_id: id,
      name: partners?.find(p => p.id === id)?.name || '',
    }));

    await createChain.mutateAsync({
      document_id: defaultDocumentId || crypto.randomUUID(),
      document_type: documentType,
      document_title: documentTitle,
      document_url: defaultDocumentUrl,
      signers,
    });

    onOpenChange(false);
    setSelectedOrgs([]);
    setDocumentTitle('');
  };

  const toggleOrg = (id: string) => {
    setSelectedOrgs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            إنشاء سلسلة توقيع متعدد الأطراف
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          اختر الأطراف المطلوب توقيعهم — لا يوجد ترتيب إجباري، أي طرف يمكنه التوقيع في أي وقت.
        </p>
        <div className="space-y-4 mt-2">
          <div>
            <Label>عنوان المستند *</Label>
            <Input value={documentTitle} onChange={e => setDocumentTitle(e.target.value)} placeholder="مثال: عقد نقل مخلفات مشترك" className="text-right" />
          </div>
          <div>
            <Label>نوع المستند</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">عام</SelectItem>
                <SelectItem value="contract">عقد</SelectItem>
                <SelectItem value="receipt">إيصال</SelectItem>
                <SelectItem value="certificate">شهادة</SelectItem>
                <SelectItem value="manifest">مانيفست</SelectItem>
                <SelectItem value="permit">تصريح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">اختر الأطراف الموقعة</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border p-2">
              {(partners || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد جهات مرتبطة</p>
              )}
              {(partners || []).map(p => (
                <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={selectedOrgs.includes(p.id)} onCheckedChange={() => toggleOrg(p.id)} />
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{p.name}</span>
                  <Badge variant="secondary" className="text-[9px]">
                    {p.organization_type === 'generator' ? 'مولد' : p.organization_type === 'transporter' ? 'ناقل' : p.organization_type === 'recycler' ? 'مدور' : p.organization_type}
                  </Badge>
                </label>
              ))}
            </div>
            {selectedOrgs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{selectedOrgs.length} جهة مختارة</p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={createChain.isPending || !documentTitle || selectedOrgs.length === 0} className="w-full gap-2">
            {createChain.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            إنشاء سلسلة التوقيع ({selectedOrgs.length} أطراف)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
