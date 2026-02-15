import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Pen, Shield } from 'lucide-react';
import { usePermits, Permit, PermitSignatoryRole } from '@/hooks/usePermits';
import { usePermitSignatures, PermitSignature } from '@/hooks/usePermits';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit: Permit | null;
  signatoryRoles: PermitSignatoryRole[];
}

const SignPermitDialog = ({ open, onOpenChange, permit, signatoryRoles }: Props) => {
  const { profile } = useAuth();
  const { signPermit } = usePermits();
  const { data: existingSignatures } = usePermitSignatures(permit?.id || null);
  const [selectedRole, setSelectedRole] = useState('');
  const [signerName, setSignerName] = useState(profile?.full_name || '');

  if (!permit) return null;

  const handleSign = async () => {
    if (!selectedRole || !signerName) return;
    await signPermit.mutateAsync({
      permitId: permit.id,
      roleTitle: selectedRole,
      signerName,
    });
    setSelectedRole('');
    onOpenChange(false);
  };

  const signatures = existingSignatures || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            توقيع التصريح
          </DialogTitle>
          <DialogDescription>
            {permit.permit_number} — وقّع على هذا التصريح بصفتك الوظيفية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing signatures */}
          {signatures.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">التوقيعات الحالية</Label>
              <div className="space-y-1">
                {signatures.map((sig: PermitSignature) => (
                  <div key={sig.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{sig.signer_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{sig.role_title}</Badge>
                    <span className="text-[10px] text-muted-foreground mr-auto">
                      {new Date(sig.signed_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Sign form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>اسم الموقّع *</Label>
              <Input value={signerName} onChange={e => setSignerName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>الصفة الوظيفية *</Label>
              {signatoryRoles.length > 0 ? (
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="اختر الصفة" /></SelectTrigger>
                  <SelectContent>
                    {signatoryRoles.map(role => (
                      <SelectItem key={role.id} value={role.role_title}>
                        {role.role_title}
                        {role.is_required && <span className="text-destructive mr-1">*</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  placeholder="أدخل المسمى الوظيفي"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              إلغاء
            </Button>
            <Button
              onClick={handleSign}
              disabled={!selectedRole || !signerName || signPermit.isPending}
              className="flex-1 gap-2"
            >
              {signPermit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pen className="w-4 h-4" />
              )}
              توقيع واعتماد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignPermitDialog;
