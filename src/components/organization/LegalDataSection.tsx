import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';

interface CertificationApproval {
  name: string;
  number: string;
  issue_date: string;
  expiry_date: string;
}

interface LegalDataSectionProps {
  orgData: any;
  organizationType: string;
  isEditable: boolean;
  onUpdate: (data: any) => void;
}

/** نظام إشارة المرور للتراخيص */
function getLicenseStatus(expiryDate: string | null | undefined): { color: string; label: string; icon: React.ReactNode } {
  if (!expiryDate) return { color: 'bg-muted text-muted-foreground', label: 'غير محدد', icon: <XCircle className="w-3.5 h-3.5" /> };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { color: 'bg-destructive/10 text-destructive', label: 'منتهي', icon: <XCircle className="w-3.5 h-3.5" /> };
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'bg-amber-500/10 text-amber-600', label: `ينتهي خلال ${daysUntilExpiry} يوم`, icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  }
  return { color: 'bg-emerald-500/10 text-emerald-600', label: 'ساري', icon: <CheckCircle className="w-3.5 h-3.5" /> };
}

/** حقل ترخيص مع تواريخ الإصدار والانتهاء */
function LicenseField({
  label,
  authority,
  licenseValue,
  licenseKey,
  issueDateValue,
  issueDateKey,
  expiryDateValue,
  expiryDateKey,
  isEditable,
  onUpdate,
  orgData,
}: {
  label: string;
  authority: string;
  licenseValue: string;
  licenseKey: string;
  issueDateValue: string;
  issueDateKey: string;
  expiryDateValue: string;
  expiryDateKey: string;
  isEditable: boolean;
  onUpdate: (data: any) => void;
  orgData: any;
}) {
  const status = getLicenseStatus(expiryDateValue);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold text-sm">{label}</h5>
          <p className="text-[11px] text-muted-foreground">{authority}</p>
        </div>
        <Badge className={`${status.color} gap-1 text-[10px]`} variant="outline">
          {status.icon}
          {status.label}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">رقم الترخيص</Label>
          <Input
            value={licenseValue || ''}
            onChange={(e) => onUpdate({ ...orgData, [licenseKey]: e.target.value })}
            disabled={!isEditable}
            placeholder="أدخل رقم الترخيص"
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">تاريخ الإصدار</Label>
          <Input
            type="date"
            value={issueDateValue || ''}
            onChange={(e) => onUpdate({ ...orgData, [issueDateKey]: e.target.value })}
            disabled={!isEditable}
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">تاريخ الانتهاء</Label>
          <Input
            type="date"
            value={expiryDateValue || ''}
            onChange={(e) => onUpdate({ ...orgData, [expiryDateKey]: e.target.value })}
            disabled={!isEditable}
            className="text-sm h-9"
          />
        </div>
      </div>
    </div>
  );
}

const LegalDataSection = ({ orgData, organizationType, isEditable, onUpdate }: LegalDataSectionProps) => {
  const isRecyclerOrDisposal = organizationType === 'recycler' || organizationType === 'disposal';
  const isTransporter = organizationType === 'transporter';
  
  const certifications: CertificationApproval[] = orgData?.certifications_approvals || [];
  
  const addCertification = () => {
    const updated = [...certifications, { name: '', number: '', issue_date: '', expiry_date: '' }];
    onUpdate({ ...orgData, certifications_approvals: updated });
  };

  const removeCertification = (index: number) => {
    const updated = certifications.filter((_, i) => i !== index);
    onUpdate({ ...orgData, certifications_approvals: updated });
  };

  const updateCertification = (index: number, field: keyof CertificationApproval, value: string) => {
    const updated = certifications.map((cert, i) => i === index ? { ...cert, [field]: value } : cert);
    onUpdate({ ...orgData, certifications_approvals: updated });
  };

  return (
    <div className="space-y-6">
      {/* ══════════ البيانات المشتركة ══════════ */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-primary">
          <Shield className="w-4 h-4" />
          بيانات التسجيل الأساسية
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">السجل التجاري</Label>
            <Input value={orgData?.commercial_register || ''} onChange={(e) => onUpdate({ ...orgData, commercial_register: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">البطاقة الضريبية</Label>
            <Input value={orgData?.tax_card || ''} onChange={(e) => onUpdate({ ...orgData, tax_card: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رقم تسجيل المنشأة</Label>
            <Input value={orgData?.establishment_registration || ''} onChange={(e) => onUpdate({ ...orgData, establishment_registration: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">النشاط المسجل</Label>
            <Input value={orgData?.registered_activity || ''} onChange={(e) => onUpdate({ ...orgData, registered_activity: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رقم الموافقة البيئية</Label>
            <Input value={orgData?.environmental_approval_number || ''} onChange={(e) => onUpdate({ ...orgData, environmental_approval_number: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              رقم الإقرار الرقمي
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">تلقائي</Badge>
            </Label>
            <Input value={orgData?.digital_declaration_number || 'سيتم التوليد تلقائياً'} disabled className="h-9 text-sm font-mono bg-muted/50" />
          </div>
        </div>
      </div>

      <Separator />

      {/* ══════════ التراخيص المشتركة (WMRA + EEAA) ══════════ */}
      <div className="space-y-4">
        <h4 className="font-medium text-primary">التراخيص الرسمية</h4>

        {/* ترخيص WMRA - مشترك لجميع الأنواع */}
        <LicenseField
          label="ترخيص جهاز تنظيم إدارة المخلفات"
          authority="WMRA - Waste Management Regulatory Agency"
          licenseValue={orgData?.wmra_license}
          licenseKey="wmra_license"
          issueDateValue={orgData?.wmra_license_issue_date}
          issueDateKey="wmra_license_issue_date"
          expiryDateValue={orgData?.wmra_license_expiry_date}
          expiryDateKey="wmra_license_expiry_date"
          isEditable={isEditable}
          onUpdate={onUpdate}
          orgData={orgData}
        />

        {/* ترخيص EEAA - مشترك لجميع الأنواع */}
        <LicenseField
          label="ترخيص جهاز شئون البيئة"
          authority="EEAA - Egyptian Environmental Affairs Agency"
          licenseValue={orgData?.environmental_license}
          licenseKey="environmental_license"
          issueDateValue={orgData?.eeaa_license_issue_date}
          issueDateKey="eeaa_license_issue_date"
          expiryDateValue={orgData?.eeaa_license_expiry_date}
          expiryDateKey="eeaa_license_expiry_date"
          isEditable={isEditable}
          onUpdate={onUpdate}
          orgData={orgData}
        />
      </div>

      {/* ══════════ حقول خاصة بالمدوّر/التخلص ══════════ */}
      {isRecyclerOrDisposal && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-primary">
              {organizationType === 'recycler' ? 'تراخيص جهة التدوير' : 'تراخيص جهة التخلص النهائي'}
            </h4>

            {/* ترخيص IDA */}
            <LicenseField
              label="ترخيص الهيئة العامة للتنمية الصناعية"
              authority="IDA - Industrial Development Authority"
              licenseValue={orgData?.ida_license}
              licenseKey="ida_license"
              issueDateValue={orgData?.ida_license_issue_date}
              issueDateKey="ida_license_issue_date"
              expiryDateValue={orgData?.ida_license_expiry_date}
              expiryDateKey="ida_license_expiry_date"
              isEditable={isEditable}
              onUpdate={onUpdate}
              orgData={orgData}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">السجل الصناعي</Label>
                <Input value={orgData?.industrial_registry || ''} onChange={(e) => onUpdate({ ...orgData, industrial_registry: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">رقم الترخيص العام</Label>
                <Input value={orgData?.license_number || ''} onChange={(e) => onUpdate({ ...orgData, license_number: e.target.value })} disabled={!isEditable} className="h-9 text-sm" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ حقول خاصة بالناقل ══════════ */}
      {isTransporter && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-primary">تراخيص جهة النقل</h4>

            {/* رخصة النقل البري */}
            <LicenseField
              label="رخصة النقل البري"
              authority="الهيئة العامة للنقل البري"
              licenseValue={orgData?.land_transport_license}
              licenseKey="land_transport_license"
              issueDateValue={orgData?.land_transport_license_issue_date}
              issueDateKey="land_transport_license_issue_date"
              expiryDateValue={orgData?.land_transport_license_expiry_date}
              expiryDateKey="land_transport_license_expiry_date"
              isEditable={isEditable}
              onUpdate={onUpdate}
              orgData={orgData}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={orgData?.hazardous_certified || false}
                  onChange={(e) => onUpdate({ ...orgData, hazardous_certified: e.target.checked })}
                  disabled={!isEditable}
                  className="rounded border-input"
                />
                <Label className="text-xs">حاصل على شهادة تداول مخلفات خطرة</Label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ الشهادات والموافقات ══════════ */}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2 text-primary">
            <FileText className="w-4 h-4" />
            شهادات / موافقات حاصل عليها
          </h4>
          {isEditable && (
            <Button variant="outline" size="sm" onClick={addCertification} className="gap-1 text-xs h-7">
              <Plus className="w-3 h-3" />
              إضافة
            </Button>
          )}
        </div>

        {certifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد شهادات أو موافقات مسجلة</p>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert, index) => {
              const status = getLicenseStatus(cert.expiry_date);
              return (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${status.color} gap-1 text-[10px]`} variant="outline">
                      {status.icon}
                      {status.label}
                    </Badge>
                    {isEditable && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCertification(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">اسم الشهادة/الموافقة</Label>
                      <Input value={cert.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} disabled={!isEditable} className="h-8 text-xs" placeholder="مثال: ISO 14001" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">رقم الشهادة</Label>
                      <Input value={cert.number} onChange={(e) => updateCertification(index, 'number', e.target.value)} disabled={!isEditable} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">تاريخ الإصدار</Label>
                      <Input type="date" value={cert.issue_date} onChange={(e) => updateCertification(index, 'issue_date', e.target.value)} disabled={!isEditable} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">تاريخ الانتهاء</Label>
                      <Input type="date" value={cert.expiry_date} onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)} disabled={!isEditable} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalDataSection;
