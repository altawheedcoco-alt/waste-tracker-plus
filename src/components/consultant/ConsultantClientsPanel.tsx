import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, FileText, Shield, Eye, EyeOff, Lock,
  MapPin, Search, Users, Loader2, ShieldCheck, Briefcase,
} from 'lucide-react';
import { useClientPrivacy } from '@/hooks/useClientPrivacy';
import { useConsultantAssignments, ClientAssignment } from '@/hooks/useConsultingOffice';

const ConsultantClientsPanel = memo(() => {
  const { clientAssignments, consultantProfile } = useConsultantAssignments();
  const { getOrgTypeConfig, getDocumentsForOrgType } = useClientPrivacy();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = clientAssignments.filter((c: ClientAssignment) => {
    const matchesSearch = !search || 
      c.client_organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_organization?.partner_code?.includes(search);
    const matchesType = filterType === 'all' || c.client_organization?.organization_type === filterType;
    return matchesSearch && matchesType;
  });

  const orgTypes = ['all', 'generator', 'transporter', 'recycler', 'disposal', 'transport_office'];
  const orgTypeLabels: Record<string, string> = {
    all: 'الكل',
    generator: 'مولد',
    transporter: 'ناقل',
    recycler: 'مدوّر',
    disposal: 'تخلص نهائي',
    transport_office: 'مكتب نقل',
  };

  if (!consultantProfile) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>سجل كاستشاري أولاً لعرض الجهات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-primary" />
            جهاتي المرتبطة ({clientAssignments.length})
          </CardTitle>
          <CardDescription>الجهات المعينة لك مع صلاحياتك وأنواع المستندات المتاحة حسب نوع كل جهة</CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود..." className="pr-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orgTypes.map(t => (
              <SelectItem key={t} value={t}>{orgTypeLabels[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg mb-1">لا توجد جهات مطابقة</p>
            {clientAssignments.length === 0 && (
              <p className="text-sm">يمكن لمدير المكتب أو الجهة ربطك كاستشاري</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((assignment: ClientAssignment) => {
          const org = assignment.client_organization;
          const orgType = org?.organization_type || 'generator';
          const config = getOrgTypeConfig(orgType);
          const docs = getDocumentsForOrgType(orgType);
          const accessScope = assignment.data_access_scope as any;
          const signingAuth = assignment.signing_authority as any;

          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                {/* Org header */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {org?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{org?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{assignment.service_type === 'environmental_oversight' ? 'إشراف بيئي' : assignment.service_type}</Badge>
                      {org?.city && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{org.city}
                        </span>
                      )}
                    </div>
                  </div>
                  {org?.partner_code && (
                    <Badge variant="outline" className="font-mono text-[10px]">{org.partner_code}</Badge>
                  )}
                </div>

                {/* Contract period */}
                {(assignment.contract_start || assignment.contract_end) && (
                  <div className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    فترة العقد: {assignment.contract_start ? new Date(assignment.contract_start).toLocaleDateString('ar-EG') : '—'} 
                    {' → '}
                    {assignment.contract_end ? new Date(assignment.contract_end).toLocaleDateString('ar-EG') : 'مفتوح'}
                  </div>
                )}

                {/* Documents available */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />المستندات المتاحة ({docs.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {docs.map((doc, i) => {
                      const isAllowed = !signingAuth?.allowed_document_types || 
                        signingAuth.allowed_document_types.includes(doc.type);
                      return (
                        <Badge key={i} variant={isAllowed ? 'secondary' : 'outline'}
                          className={`text-[9px] gap-0.5 ${!isAllowed ? 'opacity-50 line-through' : ''}`}>
                          {doc.consultantAction}: {doc.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Data access */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />صلاحيات الوصول
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(accessScope?.allowed || config.defaultPermissions).map((perm: string, i: number) => (
                      <Badge key={i} variant="default" className="text-[9px] gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {permissionLabels[perm] || perm}
                      </Badge>
                    ))}
                  </div>
                  {config.restrictedData.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.restrictedData.map((r, i) => (
                        <Badge key={i} variant="destructive" className="text-[9px] gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          {restrictedLabels[r] || r}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

const permissionLabels: Record<string, string> = {
  view_shipments: 'الشحنات',
  view_waste_records: 'سجلات المخلفات',
  view_documents: 'المستندات',
  view_compliance: 'الامتثال',
  view_vehicles: 'المركبات',
  view_drivers: 'السائقين',
  view_incidents: 'الحوادث',
  view_partners: 'الشركاء',
};

const restrictedLabels: Record<string, string> = {
  financials: 'البيانات المالية',
  contracts: 'العقود',
  partner_details: 'تفاصيل الشركاء',
  partner_pricing: 'تسعير الشركاء',
  trade_secrets: 'أسرار تجارية',
};

ConsultantClientsPanel.displayName = 'ConsultantClientsPanel';
export default ConsultantClientsPanel;
