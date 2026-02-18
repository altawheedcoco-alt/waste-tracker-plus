import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Copy,
  CheckCircle,
  Link2,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmployeeInvitations, CreateInvitationData } from '@/hooks/useEmployeeInvitations';
import { PERMISSION_CATEGORIES } from '@/hooks/useEmployeeManagement';

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const employeeTypes = [
  { value: 'employee', label: 'موظف' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'supervisor', label: 'مشرف' },
  { value: 'manager', label: 'مدير' },
];

const InviteEmployeeDialog = ({ open, onOpenChange }: InviteEmployeeDialogProps) => {
  const { createInvitation, isCreating } = useEmployeeInvitations();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [invitationUrl, setInvitationUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<CreateInvitationData>({
    email: '',
    employeeType: 'employee',
    permissions: [],
    accessAllPartners: true,
    accessAllWasteTypes: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.email.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    try {
      const result = await createInvitation.mutateAsync(formData);
      if (result.invitation?.url) {
        setInvitationUrl(result.invitation.url);
        setStep('success');
      }
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep('form');
      setInvitationUrl('');
      setCopied(false);
      setFormData({
        email: '',
        employeeType: 'employee',
        permissions: [],
        accessAllPartners: true,
        accessAllWasteTypes: true,
      });
    }, 200);
  };

  const togglePermission = (permission: string) => {
    const current = formData.permissions || [];
    if (current.includes(permission)) {
      setFormData({
        ...formData,
        permissions: current.filter(p => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...current, permission],
      });
    }
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">تم إنشاء الدعوة بنجاح!</DialogTitle>
            <DialogDescription className="text-center">
              شارك هذا الرابط مع الموظف للانضمام
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={invitationUrl}
                readOnly
                className="border-0 bg-transparent p-0 text-sm"
                dir="ltr"
              />
            </div>

            <Button onClick={handleCopyLink} className="w-full gap-2">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  نسخ الرابط
                </>
              )}
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                صلاحية هذا الرابط 7 أيام. يمكنك تجديده من قائمة الدعوات.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                دعوة موظف آخر
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>دعوة موظف جديد</DialogTitle>
          <DialogDescription>
            أرسل رابط دعوة للموظف لإنشاء حسابه الخاص
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pl-4 -mr-4">
            <div className="space-y-6 pr-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Employee Type */}
              <div className="space-y-2">
                <Label>نوع الموظف</Label>
                <Select
                  value={formData.employeeType}
                  onValueChange={(value) => setFormData({ ...formData, employeeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <Label>الصلاحيات</Label>
                {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                  <div key={key} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {category.label}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.permissions.map((perm) => (
                        <div
                          key={perm.value}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => togglePermission(perm.value)}
                        >
                          <Checkbox
                            checked={formData.permissions?.includes(perm.value)}
                            onCheckedChange={() => togglePermission(perm.value)}
                          />
                          <span className="text-sm">{perm.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Access Settings */}
              <div className="space-y-4">
                <Label>صلاحيات الوصول</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">الوصول لجميع الجهات المرتبطة</p>
                      <p className="text-xs text-muted-foreground">
                        يمكن للموظف الوصول لبيانات جميع الجهات المرتبطة
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.accessAllPartners}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, accessAllPartners: checked as boolean })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">الوصول لجميع أنواع النفايات</p>
                      <p className="text-xs text-muted-foreground">
                        يمكن للموظف الوصول لجميع أنواع النفايات
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.accessAllWasteTypes}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, accessAllWasteTypes: checked as boolean })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء الدعوة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteEmployeeDialog;
