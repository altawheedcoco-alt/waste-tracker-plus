import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Save, Loader2 } from 'lucide-react';

interface OrgContactInfoProps {
  orgData: any;
  isEditable: boolean;
  onUpdate: (data: any) => void;
  onSave: () => void;
  saving: boolean;
}

const OrgContactInfo = ({ orgData, isEditable, onUpdate, onSave, saving }: OrgContactInfoProps) => {
  const set = (field: string, value: string) => onUpdate({ ...orgData, [field]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />بيانات التواصل</CardTitle>
        <CardDescription>معلومات الاتصال بالجهة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />البريد الإلكتروني</Label>
            <Input value={orgData?.email || ''} onChange={(e) => set('email', e.target.value)} disabled={!isEditable} type="email" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />رقم الهاتف الأساسي</Label>
            <Input value={orgData?.phone || ''} onChange={(e) => set('phone', e.target.value)} disabled={!isEditable} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />رقم الهاتف الثانوي</Label>
            <Input value={orgData?.secondary_phone || ''} onChange={(e) => set('secondary_phone', e.target.value)} disabled={!isEditable} dir="ltr" />
          </div>
        </div>
        {isEditable && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrgContactInfo;
