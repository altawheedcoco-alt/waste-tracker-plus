import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, User, Users, Save, Loader2 } from 'lucide-react';

interface OrgRepresentativesProps {
  orgData: any;
  isEditable: boolean;
  onUpdate: (data: any) => void;
  onSave: () => void;
  saving: boolean;
}

const OrgRepresentatives = ({ orgData, isEditable, onUpdate, onSave, saving }: OrgRepresentativesProps) => {
  const set = (field: string, value: string) => onUpdate({ ...orgData, [field]: value });

  const SaveButton = () => isEditable ? (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
        حفظ التغييرات
      </Button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />الممثل القانوني</CardTitle>
          <CardDescription>الشخص المخول قانونياً بتمثيل الجهة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.representative_name || ''} onChange={(e) => set('representative_name', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.representative_national_id || ''} onChange={(e) => set('representative_national_id', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>المنصب</Label><Input value={orgData?.representative_position || ''} onChange={(e) => set('representative_position', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.representative_phone || ''} onChange={(e) => set('representative_phone', e.target.value)} disabled={!isEditable} dir="ltr" /></div>
            <div className="space-y-2 md:col-span-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.representative_email || ''} onChange={(e) => set('representative_email', e.target.value)} disabled={!isEditable} type="email" dir="ltr" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />المفوض</CardTitle>
          <CardDescription>الشخص المفوض من قبل الممثل القانوني</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.delegate_name || ''} onChange={(e) => set('delegate_name', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.delegate_national_id || ''} onChange={(e) => set('delegate_national_id', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.delegate_phone || ''} onChange={(e) => set('delegate_phone', e.target.value)} disabled={!isEditable} dir="ltr" /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.delegate_email || ''} onChange={(e) => set('delegate_email', e.target.value)} disabled={!isEditable} type="email" dir="ltr" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />الموكل</CardTitle>
          <CardDescription>بيانات الموكل (إن وجد)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={orgData?.agent_name || ''} onChange={(e) => set('agent_name', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهوية الوطنية</Label><Input value={orgData?.agent_national_id || ''} onChange={(e) => set('agent_national_id', e.target.value)} disabled={!isEditable} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={orgData?.agent_phone || ''} onChange={(e) => set('agent_phone', e.target.value)} disabled={!isEditable} dir="ltr" /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={orgData?.agent_email || ''} onChange={(e) => set('agent_email', e.target.value)} disabled={!isEditable} type="email" dir="ltr" /></div>
          </div>
        </CardContent>
      </Card>
      <SaveButton />
    </div>
  );
};

export default OrgRepresentatives;
