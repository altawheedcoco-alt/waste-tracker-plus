import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, FileSignature, Users, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';
import { useConsultantAssignments, OfficeMembership } from '@/hooks/useConsultingOffice';
import { Loader2 } from 'lucide-react';

const roleLabels: Record<string, string> = {
  director: 'مدير المكتب',
  senior_consultant: 'استشاري أول',
  consultant: 'استشاري',
  assistant: 'مساعد استشاري',
  delegate: 'مفوّض',
  trainee: 'متدرب',
};

const membershipTypeLabels: Record<string, string> = {
  linked: 'مرتبط خارجياً',
  internal: 'منشأ داخلياً',
};

const OfficeMembershipsPanel = memo(() => {
  const { officeMemberships, consultantProfile } = useConsultantAssignments();

  if (!consultantProfile) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-bold">لم يتم تسجيلك كاستشاري بعد</p>
        </CardContent>
      </Card>
    );
  }

  if (officeMemberships.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20 text-muted-foreground" />
          <p className="font-bold text-lg mb-1">لست مرتبطاً بأي مكتب استشاري</p>
          <p className="text-sm text-muted-foreground">
            يمكن لمدير المكتب الاستشاري إضافتك عبر كودك: <Badge variant="outline" className="font-mono mx-1">{(consultantProfile as any)?.consultant_code}</Badge>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            عضويات المكاتب الاستشارية ({officeMemberships.length})
          </CardTitle>
          <CardDescription>المكاتب المرتبط بها وصلاحياتك في كل منها</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {officeMemberships.map((m: OfficeMembership & { office: any }) => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              {/* Office Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-lg font-bold shadow-sm">
                  {m.office?.office_name?.charAt(0) || 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{m.office?.office_name || 'مكتب استشاري'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="text-[10px]">{roleLabels[m.role] || m.role}</Badge>
                    <Badge variant="outline" className="text-[10px]">{membershipTypeLabels[m.membership_type] || m.membership_type}</Badge>
                  </div>
                </div>
              </div>

              {/* Signing Permissions */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                  <FileSignature className="w-3.5 h-3.5" />صلاحيات التوقيع
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <PermBadge active={m.can_sign_independently} label="توقيع مستقل" />
                  <PermBadge active={m.requires_director_approval} label="يتطلب موافقة المدير" warn />
                </div>
                {m.signing_scope && m.signing_scope.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-muted-foreground mb-1">نطاق التوقيع:</p>
                    <div className="flex flex-wrap gap-1">
                      {m.signing_scope.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {m.excluded_document_types && m.excluded_document_types.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-destructive mb-1">مستثنى من:</p>
                    <div className="flex flex-wrap gap-1">
                      {m.excluded_document_types.map((d, i) => (
                        <Badge key={i} variant="destructive" className="text-[9px]">{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Client Visibility */}
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground mb-1.5">
                  <Users className="w-3.5 h-3.5" />رؤية العملاء
                </p>
                {m.can_view_all_clients ? (
                  <Badge variant="default" className="text-[10px] gap-1"><Unlock className="w-3 h-3" />جميع عملاء المكتب</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] gap-1"><Lock className="w-3 h-3" />عملاء محددون فقط ({m.assigned_client_ids?.length || 0})</Badge>
                )}
              </div>

              {/* Delegation info */}
              {m.delegation_scope && (
                <div className="border border-border bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" />تفويض نشط
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{m.delegation_scope}</p>
                  {m.delegation_expires_at && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />ينتهي: {new Date(m.delegation_expires_at).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
              )}

              {m.notes && (
                <p className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg">{m.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

const PermBadge = ({ active, label, warn }: { active: boolean; label: string; warn?: boolean }) => (
  <Badge variant={active ? (warn ? 'destructive' : 'default') : 'secondary'} className="text-[10px] gap-1">
    {active ? (warn ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />) : <Lock className="w-3 h-3" />}
    {label}
  </Badge>
);

OfficeMembershipsPanel.displayName = 'OfficeMembershipsPanel';
export default OfficeMembershipsPanel;
